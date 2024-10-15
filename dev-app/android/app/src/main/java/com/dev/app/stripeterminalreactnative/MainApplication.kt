package com.dev.app.stripeterminalreactnative

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
import com.stripeterminalreactnative.StripeTerminalReactNativePackage
import com.stripeterminalreactnative.TerminalApplicationDelegate.onCreate

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost = object : DefaultReactNativeHost(this) {
    override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

    override fun getPackages(): List<ReactPackage> {
      val packages = PackageList(this).getPackages()
      // Packages that cannot be autolinked yet can be added manually here, for example:
      // packages.add(new MyReactNativePackage());
      packages.add(StripeTerminalReactNativePackage())
      return packages
    }

    override fun getJSMainModuleName(): String = "index"

    override val isNewArchEnabled: Boolean
      get() = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED

    override val isHermesEnabled: Boolean
      get() = BuildConfig.IS_HERMES_ENABLED
  }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    onCreate(this)
    SoLoader.init(this,  /* native exopackage */false)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      DefaultNewArchitectureEntryPoint.load()
    }
  }
}
