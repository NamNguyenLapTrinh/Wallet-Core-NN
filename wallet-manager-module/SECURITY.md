# Supply chain & security model

## What this module depends on at runtime

```
Your RN app binary
├── React Native runtime          (you control: pin version)
├── NitroModules                  (you control: pin version)
├── react-native-keychain         (you control: pin version)
├── zustand                       (small JS lib)
└── TrustWalletCore               ← VENDORED prebuilt from source
    ├── iOS:  ios/vendor/WalletCoreCommon.xcframework
    └── Android: android/vendor/<abi>/libTrustWalletCore.so
```

There is **no runtime call** to Trust Wallet Inc., to any blockchain
explorer, or to any third-party server from this module. The wallet-core
library is just cryptography code that runs locally inside your app
binary.

## Threat model: "What if Trust Wallet gets hacked?"

- **Trust Wallet** (the company / app / brand) being compromised has **zero
  impact** on your app at runtime. The wallet-core code is already compiled
  into your binary; it does not phone home.
- The **only** vector where their compromise could affect you is **supply
  chain at build time**: if `pod install` or `gradle build` pulled a
  poisoned upstream artifact. This module eliminates that vector by:
  - Building wallet-core **from source** at a commit hash **you pin and
    audit** (recorded in [VENDOR_PIN](VENDOR_PIN)).
  - Storing the resulting binaries (`.xcframework`, `.so`) inside
    `ios/vendor/` and `android/vendor/` **in your own git repo**.
  - No `pod 'TrustWalletCore'` line, no Maven dependency on
    `com.trustwallet:wallet-core-kotlin`.

## How to vendor / refresh

1. Audit the commit you trust in your wallet-core checkout. By default the
   script uses the wallet-core repo one level up from this module
   (`$WC_REPO`).
   ```
   cd $WC_REPO
   git log --oneline -20      # review recent commits
   git diff <pinned>..HEAD    # if upgrading
   ```
2. Run:
   ```
   ./scripts/build-wallet-core.sh
   ```
   This invokes wallet-core's official `tools/ios-build` and
   `tools/android-build`, then copies the resulting xcframework and the
   per-ABI `.so` files into `ios/vendor/` and `android/vendor/`.
3. Commit:
   ```
   git add ios/vendor android/vendor VENDOR_PIN
   git commit -m "vendor: wallet-core @ <commit>"
   ```
4. CI now builds your RN app using only committed binaries. No fetch.

## Verifying the binary in your app

After release, inspect the binary to confirm only the pinned wallet-core
code is bundled:

```bash
# iOS
nm ios/vendor/WalletCoreCommon.xcframework/ios-arm64/WalletCoreCommon.framework/WalletCoreCommon \
  | grep ' T _TW' | head
# Should match exports declared in include/TrustWalletCore/.

# Android
nm android/vendor/arm64-v8a/libTrustWalletCore.so | grep ' T TW' | head
```

## Secret material flow

```
Mnemonic / private key created
   └─► encrypted by OS (iOS Keychain / Android Keystore, biometric ACL)
       └─► stored at rest
       └─► read at sign-time ONLY (biometric prompt EVERY time — no cache)
           └─► passed to vendored TrustWalletCore in-process
               └─► signature returned to JS
               └─► JS buffer wiped (wipeString), no Zustand retention
```

Never leaves the device. Never enters Zustand. Never hits AsyncStorage.
Module2's `HDKeyring` and `ImportedKeyring` deliberately do NOT cache
secrets across calls; biometric is prompted on every derive and every
sign.

## Audit checklist before shipping

- [ ] [VENDOR_PIN](VENDOR_PIN) committed and reviewed
- [ ] `ios/vendor/` and `android/vendor/` committed to git (no fetch at
      build time)
- [ ] `react-native-keychain` uses `WHEN_UNLOCKED_THIS_DEVICE_ONLY`
- [ ] `BIOMETRY_CURRENT_SET` (invalidates on biometric change)
- [ ] No `console.log` of vars named `mnemonic|privateKey|seed` (add
      ESLint rule)
- [ ] `useAutoLockOnBackground()` wired at app root
- [ ] Security checks (`cpp/security/RootDetection`, `FridaDetection`,
      `DebugDetection`) called at app start and signing time
