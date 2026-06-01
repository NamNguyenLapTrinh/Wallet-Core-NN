cmake_minimum_required(VERSION 3.18)
project(WalletManagerModule CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# Default symbol visibility hidden — reduces dlsym surface.
set(CMAKE_CXX_VISIBILITY_PRESET hidden)
set(CMAKE_C_VISIBILITY_PRESET   hidden)
set(CMAKE_VISIBILITY_INLINES_HIDDEN ON)

set(CPP_DIR ${CMAKE_SOURCE_DIR}/../cpp)

# ── Hand-written sources only ───────────────────────────────────────────────
# nitrogen-generated sources (HybridWalletCoreSpec, OnLoad, etc.) are added
# by the autolinking.cmake include below.
add_library(WalletManagerModule SHARED
  ${CPP_DIR}/core/HybridWalletCore.cpp
  ${CPP_DIR}/android/JNI_OnLoad.cpp
  ${CPP_DIR}/crypto/Base64.cpp
  ${CPP_DIR}/chains/SupportedChain.cpp
  ${CPP_DIR}/address/AddressBuilder.cpp
  ${CPP_DIR}/signers/EthereumSigner.cpp
  ${CPP_DIR}/signers/BitcoinSigner.cpp
  ${CPP_DIR}/signers/SolanaSigner.cpp
  ${CPP_DIR}/signers/SignerRegistry.cpp
  ${CPP_DIR}/security/RootDetection.cpp
  ${CPP_DIR}/security/FridaDetection.cpp
  ${CPP_DIR}/security/DebugDetection.cpp
  ${CPP_DIR}/security/SecurityCheck.cpp
)

target_include_directories(WalletManagerModule PRIVATE
  ${CPP_DIR}
  # Vendored crypto headers — committed under android/vendor/include/WalletCore/
  # (rebranded from upstream's TrustWalletCore/ directory).
  # Built once via scripts/build-wallet-core.sh; no env var, no runtime fetch.
  ${CMAKE_SOURCE_DIR}/vendor/include
)

# ── Nitrogen autolinking ────────────────────────────────────────────────────
# This appends nitrogen-generated .cpp files (including OnLoad.cpp),
# adds the `BUILDING_WALLETMANAGERMODULE_WITH_GENERATED_CMAKE_PROJECT`
# define that OnLoad.cpp requires, sets include directories, and links
# fbjni / ReactAndroid / NitroModules.
include(${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/WalletManagerModule+autolinking.cmake)

# Manual fallback registration becomes redundant once autolinking is in place.
target_compile_definitions(WalletManagerModule PRIVATE WALLETMGR_NITROGEN_AUTOLINKING=1)

# ── Release hardening ───────────────────────────────────────────────────────
target_compile_options(WalletManagerModule PRIVATE
  -fno-rtti
  -fdata-sections
  -ffunction-sections
  -fstack-protector-strong
  -D_FORTIFY_SOURCE=2
  -Wall
  -Wextra
  -Werror=format-security
  -Wformat
  $<$<NOT:$<CONFIG:Debug>>:-fvisibility=hidden>
  $<$<NOT:$<CONFIG:Debug>>:-fvisibility-inlines-hidden>
  $<$<NOT:$<CONFIG:Debug>>:-O2>
  $<$<NOT:$<CONFIG:Debug>>:-DNDEBUG>
)

target_link_options(WalletManagerModule PRIVATE
  $<$<NOT:$<CONFIG:Debug>>:-Wl,--gc-sections>
  $<$<NOT:$<CONFIG:Debug>>:-Wl,--exclude-libs,ALL>
  $<$<NOT:$<CONFIG:Debug>>:-Wl,-z,relro>
  $<$<NOT:$<CONFIG:Debug>>:-Wl,-z,now>
  $<$<NOT:$<CONFIG:Debug>>:-Wl,-z,noexecstack>
)

# ── Vendored TrustWalletCore ────────────────────────────────────────────────
# Shared library extracted from wallet-core's official AAR (built via the
# wallet-core repo's `tools/android-build`) by scripts/build-wallet-core.sh.
# Per-ABI libTrustWalletCore.so files are committed under
# android/vendor/<abi>/. No Maven dependency, no Gradle fetch — app is
# self-contained.

set(TW_VENDOR_DIR ${CMAKE_SOURCE_DIR}/vendor/${ANDROID_ABI})
set(TW_SO ${TW_VENDOR_DIR}/libTrustWalletCore.so)

if(NOT EXISTS ${TW_SO})
  message(FATAL_ERROR
    "Vendored libTrustWalletCore.so not found at ${TW_SO}. "
    "Run scripts/build-wallet-core.sh to produce vendor binaries.")
endif()

add_library(TrustWalletCore SHARED IMPORTED)
set_target_properties(TrustWalletCore PROPERTIES IMPORTED_LOCATION ${TW_SO})

target_link_libraries(WalletManagerModule
  PRIVATE
    TrustWalletCore
    log
    android
)
