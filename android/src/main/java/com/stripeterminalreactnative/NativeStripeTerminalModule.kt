package com.stripeterminalreactnative

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.BuildConfig

class NativeStripeTerminalModule(reactContext: ReactApplicationContext) :
    NativeStripeTerminalSpec(reactContext) {
    override fun getNativeSdkVersion(promise: Promise) {

        promise.resolve(BuildConfig.SDK_VERSION_NAME)
    }

}