package com.trustwalletfork

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.margelo.nitro.walletmgr.WalletManagerModuleOnLoad

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    // Load the wallet-manager-module .so + register Nitro HybridObjects.
    // Must run BEFORE React Native starts so JS calls to
    // `NitroModules.createHybridObject('WalletCore')` find the registration.
    WalletManagerModuleOnLoad.initializeNative()
    loadReactNative(this)
  }
}
