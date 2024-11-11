package com.stripeterminalreactnative.callback

import com.facebook.react.bridge.Promise
import com.stripe.stripeterminal.external.CollectData
import com.stripe.stripeterminal.external.callable.CollectedDataCallback
import com.stripe.stripeterminal.external.models.CollectedData
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripeterminalreactnative.createError
import com.stripeterminalreactnative.mapFromCollectedData
import com.stripeterminalreactnative.nativeMapOf

@OptIn(CollectData::class)
class RNCollectedDataCallback(
    private val promise: Promise
) : CollectedDataCallback {
    override fun onSuccess(collectedData: CollectedData) {
        promise.resolve(
            nativeMapOf {
                putMap("collectedData", mapFromCollectedData(collectedData))
            }
        )
    }

    override fun onFailure(e: TerminalException) {
        promise.resolve(createError(e))
    }
}
