package com.stripeterminalreactnative.callback

import com.facebook.react.bridge.Promise
import com.stripe.stripeterminal.external.callable.SetupIntentCallback
import com.stripe.stripeterminal.external.models.SetupIntent
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripeterminalreactnative.createError
import com.stripeterminalreactnative.mapFromSetupIntent
import com.stripeterminalreactnative.nativeMapOf

class RNSetupIntentCallback(
    private val promise: Promise,
    private val uuid: String,
    private val onSetupIntentSuccess: (SetupIntent) -> Unit = {}
) : SetupIntentCallback {

    override fun onSuccess(setupIntent: SetupIntent) {
        onSetupIntentSuccess(setupIntent)
        promise.resolve(
            nativeMapOf {
                putMap("setupIntent", mapFromSetupIntent(setupIntent, uuid))
            }
        )
    }

    override fun onFailure(e: TerminalException) {
        promise.resolve(createError(e, uuid))
    }
}
