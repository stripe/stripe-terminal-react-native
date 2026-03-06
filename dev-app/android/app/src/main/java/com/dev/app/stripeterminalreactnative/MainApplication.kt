package com.dev.app.stripeterminalreactnative

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.PackageList
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.stripeterminalreactnative.StripeTerminalReactNativePackage
import com.stripeterminalreactnative.TapToPay
import com.stripeterminalreactnative.TerminalApplicationDelegate
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative

class MainApplication : Application(), ReactApplication {

    override val reactHost: ReactHost by lazy {
        getDefaultReactHost(
            context = applicationContext,
            packageList =
                PackageList(this).packages.apply {
                    // Packages that cannot be autolinked yet can be added manually here, for example:
                    add(StripeTerminalReactNativePackage())
                },
        )
    }

    override fun onCreate() {
        super.onCreate()
        // Skip initialization if running in the TTPA process.
        if (TapToPay.isInTapToPayProcess()) { return }

        TerminalApplicationDelegate.onCreate(this)
        loadReactNative(this)
    }
}
