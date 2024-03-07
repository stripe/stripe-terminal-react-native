package com.stripeterminalreactnative.callback

import com.facebook.react.bridge.Promise
import com.stripe.stripeterminal.external.callable.ReaderSettingsCallback
import com.stripe.stripeterminal.external.models.ReaderSettings
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripeterminalreactnative.createError
import com.stripeterminalreactnative.mapFromReaderSettings

internal class RNReadSettingsCallback(private val promise: Promise) : ReaderSettingsCallback {
    override fun onFailure(e: TerminalException) {
        promise.resolve(createError(e))
    }

    override fun onSuccess(readerSettings: ReaderSettings) {
        promise.resolve(
            mapFromReaderSettings(readerSettings)
        )
    }
}
