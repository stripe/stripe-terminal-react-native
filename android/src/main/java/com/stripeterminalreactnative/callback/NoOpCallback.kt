package com.stripeterminalreactnative.callback

import com.facebook.react.bridge.Promise
import com.stripe.stripeterminal.external.callable.Callback
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripeterminalreactnative.NativeTypeFactory
import com.stripeterminalreactnative.createError

internal class NoOpCallback(private val promise: Promise) : Callback {
    override fun onSuccess() {
        promise.resolve(NativeTypeFactory.writableNativeMap())
    }

    override fun onFailure(e: TerminalException) {
        promise.resolve(createError(e))
    }
}
