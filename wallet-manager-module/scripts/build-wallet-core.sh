#!/usr/bin/env bash
#
# Build TrustWalletCore from source (in the parent wallet-core/ checkout) and
# vendor the artifacts into this module:
#
#   ios/vendor/WalletCoreCommon.xcframework  ← consumed by the podspec
#   ios/vendor/include/TrustWalletCore/       ← C ABI headers
#   android/vendor/<abi>/libTrustWalletCore.so ← packaged via jniLibs
#   android/vendor/include/TrustWalletCore/    ← C ABI headers (used by CMake)
#
# After running, commit ios/vendor and android/vendor to git. From that point
# on, no network fetch of wallet-core ever happens at install / build time.

set -euo pipefail

# Resolve module dir robustly whether invoked as `bash scripts/...`,
# `./scripts/...`, or via `npm run vendor:wallet-core` (which sets
# INIT_CWD to the package root).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="${npm_package_json:+$(dirname "${npm_package_json}")}"
MODULE_DIR="${MODULE_DIR:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
WC_REPO="${WC_REPO:-$(cd "${MODULE_DIR}/.." && pwd)}"

IOS_VENDOR="${MODULE_DIR}/ios/vendor"
ANDROID_VENDOR="${MODULE_DIR}/android/vendor"
ABIS=(arm64-v8a armeabi-v7a x86_64)

if [[ ! -f "${WC_REPO}/registry.json" ]]; then
  echo "ERROR: WC_REPO=${WC_REPO} doesn't look like a wallet-core checkout."
  echo "  Set WC_REPO=/path/to/trustwallet/wallet-core"
  exit 1
fi

PINNED_COMMIT="$(git -C "${WC_REPO}" rev-parse HEAD)"
echo "==> Building from wallet-core commit: ${PINNED_COMMIT}"

# Generated files (TWHRP.h, *.pb.h, ...) are produced from registry.json and
# proto definitions. bootstrap.sh runs this once, but local edits or git clean
# can wipe them — re-run unconditionally so vendor builds are reproducible.
echo "==> Regenerating wallet-core derived sources"
pushd "${WC_REPO}" >/dev/null
tools/generate-files native
popd >/dev/null

mkdir -p "${IOS_VENDOR}/include" "${ANDROID_VENDOR}/include"

# ── Headers (C ABI is the whole surface our cpp/ depends on) ───────────────
# Headers are rebranded into a "WalletCore" directory in the vendor tree —
# our cpp/ files include via `<WalletCore/...>`, not `<TrustWalletCore/...>`.
# This is purely a folder rename; the file contents are byte-identical to
# upstream. Symbol names exported by the binary (TWHDWalletCreate, ...)
# are unchanged because they're embedded in the .so / .xcframework.
echo "==> Vendoring C ABI headers as 'WalletCore/'"
rm -rf "${IOS_VENDOR}/include/WalletCore" "${ANDROID_VENDOR}/include/WalletCore"
cp -R "${WC_REPO}/include/TrustWalletCore" "${IOS_VENDOR}/include/WalletCore"
cp -R "${WC_REPO}/include/TrustWalletCore" "${ANDROID_VENDOR}/include/WalletCore"

# ── iOS: build XCFramework ─────────────────────────────────────────────────
if [[ "$(uname -s)" == "Darwin" ]]; then
  # Rust crates compiled into WalletCoreRs.xcframework. tools/ios-build expects
  # this artifact to exist but does not produce it itself, so run rust-bindgen
  # first. This step is idempotent — if the xcframework already exists and is
  # up to date, cargo skips rebuilding.
  echo "==> Building Rust XCFramework via wallet-core/tools/rust-bindgen ios"
  pushd "${WC_REPO}" >/dev/null
  # 'ios' target only — skip native/wasm/android sub-targets (we only need
  # the iOS xcframework here; Android Rust .so is produced separately by
  # tools/android-build).
  tools/rust-bindgen ios
  popd >/dev/null

  echo "==> Building iOS XCFramework via wallet-core/tools/ios-build"
  pushd "${WC_REPO}" >/dev/null
  tools/ios-build
  popd >/dev/null

  XCF_SRC="${WC_REPO}/build/ios-frameworks/WalletCoreCommon.xcframework"
  if [[ ! -d "${XCF_SRC}" ]]; then
    echo "ERROR: expected XCFramework at ${XCF_SRC}"
    exit 1
  fi
  rm -rf "${IOS_VENDOR}/WalletCoreCommon.xcframework"
  cp -R "${XCF_SRC}" "${IOS_VENDOR}/"
  echo "    -> ${IOS_VENDOR}/WalletCoreCommon.xcframework"
else
  echo "==> Skipping iOS build (not macOS)"
fi

# ── Android: build AAR, extract .so per ABI ────────────────────────────────
# tools/android-build's CMake invokes ninja against pre-built per-ABI Rust
# static libs at rust/target/<triple>/release/libwallet_core_rs.a. Same gap
# as iOS — rust-bindgen produces these, but android-build does not call it.
# wallet-core's Android build pins sourceCompatibility/targetCompatibility to
# Java 17. If the shell default is a newer/older JDK, Kotlin and Java targets
# end up mismatched ("Inconsistent JVM-target compatibility"). Auto-pick JDK 17
# if present; otherwise tell the user how to install it.
if [[ "$(uname -s)" == "Darwin" ]]; then
  if JAVA_HOME_17="$(/usr/libexec/java_home -v 17 2>/dev/null)"; then
    export JAVA_HOME="${JAVA_HOME_17}"
    export PATH="${JAVA_HOME}/bin:${PATH}"
    echo "==> Using JDK 17 at ${JAVA_HOME}"
  else
    cat >&2 <<'EOF'
ERROR: JDK 17 not found. wallet-core Android build requires it.
Install one of:
  brew install --cask temurin@17
  brew install --cask zulu@17
Then re-run this script.
EOF
    exit 1
  fi
fi

echo "==> Building Rust static libs for Android via tools/rust-bindgen android"
pushd "${WC_REPO}" >/dev/null
tools/rust-bindgen android
popd >/dev/null

echo "==> Building Android AAR via wallet-core/tools/android-build"
pushd "${WC_REPO}" >/dev/null
tools/android-build
popd >/dev/null

AAR="${WC_REPO}/build/wallet-core.aar"
if [[ ! -f "${AAR}" ]]; then
  echo "ERROR: expected AAR at ${AAR}"
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT
unzip -q "${AAR}" -d "${TMP}"

for abi in "${ABIS[@]}"; do
  src="${TMP}/jni/${abi}/libTrustWalletCore.so"
  if [[ ! -f "${src}" ]]; then
    echo "WARN: AAR missing ${src} — skipping ${abi}"
    continue
  fi
  mkdir -p "${ANDROID_VENDOR}/${abi}"
  cp "${src}" "${ANDROID_VENDOR}/${abi}/libTrustWalletCore.so"
  size=$(stat -f%z "${ANDROID_VENDOR}/${abi}/libTrustWalletCore.so" 2>/dev/null \
       || stat -c%s "${ANDROID_VENDOR}/${abi}/libTrustWalletCore.so")
  echo "    -> ${ANDROID_VENDOR}/${abi}/libTrustWalletCore.so (${size} bytes)"
done

# ── Pin record ─────────────────────────────────────────────────────────────
cat > "${MODULE_DIR}/VENDOR_PIN" <<EOF
wallet-core commit: ${PINNED_COMMIT}
built:              $(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF

echo ""
echo "==> Done. Pinned commit recorded in ${MODULE_DIR}/VENDOR_PIN"
echo "==> Commit the vendor tree:"
echo "    git add ios/vendor android/vendor VENDOR_PIN"
echo "    git commit -m \"vendor: wallet-core @ ${PINNED_COMMIT:0:12}\""
