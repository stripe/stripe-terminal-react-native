package com.stripeterminalreactnative.callback

import com.facebook.react.bridge.Promise
import com.stripe.stripeterminal.external.callable.CollectInputsResultCallback
import com.stripe.stripeterminal.external.models.CollectInputsResult
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripeterminalreactnative.createError
import com.stripeterminalreactnative.mapFromCollectInputsResults
import com.stripeterminalreactnative.nativeMapOf

class RNCollectInputResultCallback(
    private val promise: Promise
) : CollectInputsResultCallback {
    override fun onFailure(e: TerminalException) {
        promise.resolve(createError(e))
    }

    override fun onSuccess(results: List<CollectInputsResult>) {
        promise.resolve(
            nativeMapOf {
                putArray("collectInputResults", mapFromCollectInputsResults(results))
            }
        )
    }
}
