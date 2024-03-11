package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.Callback
import com.stripe.stripeterminal.external.callable.DiscoveryListener
import com.stripe.stripeterminal.external.models.Reader
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants
import com.stripeterminalreactnative.callback.NoOpCallback
import com.stripeterminalreactnative.createError
import com.stripeterminalreactnative.mapFromReaders
import com.stripeterminalreactnative.nativeMapOf

internal class RNDiscoveryListener(
    private val context: ReactApplicationContext,
    promise: Promise,
    private val onDiscoveredReaders: (readers: List<Reader>) -> Unit,
    private val onComplete: () -> Unit
) : DiscoveryListener, Callback {

    // Our no-op callback handles resolving the promise.
    private val noOpCallback = NoOpCallback(promise)

    override fun onUpdateDiscoveredReaders(readers: List<Reader>) {
        onDiscoveredReaders(readers)
        context.sendEvent(ReactNativeConstants.UPDATE_DISCOVERED_READERS.listenerName) {
            putArray("readers", mapFromReaders(readers))
        }
    }

    override fun onSuccess() {
        noOpCallback.onSuccess()
        context.sendEvent(ReactNativeConstants.FINISH_DISCOVERING_READERS.listenerName) {
            putMap("result", nativeMapOf())
        }
        onComplete()
    }

    override fun onFailure(e: TerminalException) {
        noOpCallback.onFailure(e)
        context.sendEvent(ReactNativeConstants.FINISH_DISCOVERING_READERS.listenerName) {
            putMap("result", createError(e))
        }
        onComplete()
    }
}
