package com.stripeterminalreactnative

import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.BuildConfig

class NativeStripeTerminalModule(reactContext: ReactApplicationContext) : NativeStripeTerminalSpec(reactContext) {
    override fun getNativeSdkVersion2(promise: Promise) {
        Log.e("jintin","eeeeeee")
        promise.resolve(BuildConfig.SDK_VERSION_NAME)
    }

    override fun getConstants(): MutableMap<String, Any> =
        ReactNativeConstants.values().associate { it.name to it.listenerName }.toMutableMap()

    companion object {
        val NAME = "NativeStripeTerminal"
    }
}