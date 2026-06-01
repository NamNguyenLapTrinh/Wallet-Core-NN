// =============================================================================
// JNI_OnLoad.cpp — Android only
// -----------------------------------------------------------------------------
// Hook the JNI runtime to initialize fbjni + register all Nitro HybridObjects.
// Nitrogen emits `registerAllNatives()` (in WalletManagerModuleOnLoad.cpp) but
// not `JNI_OnLoad` itself — by design, so apps that need a custom JNI entry
// can fan-in additional setup. This file is the minimal hook.
//
// Called by the Android runtime when `System.loadLibrary("WalletManagerModule")`
// runs from `WalletManagerModuleOnLoad.initializeNative()` in Kotlin.
// =============================================================================

#if defined(__ANDROID__)

#include <jni.h>
#include <fbjni/fbjni.h>

#include "WalletManagerModuleOnLoad.hpp"

extern "C" JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void* /*reserved*/) {
  return facebook::jni::initialize(vm, []() {
    margelo::nitro::walletmgr::registerAllNatives();
  });
}

#endif  // __ANDROID__
