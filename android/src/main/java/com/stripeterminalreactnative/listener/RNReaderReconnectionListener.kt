package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.Cancelable
import com.stripe.stripeterminal.external.callable.ReaderReconnectionListener
import com.stripe.stripeterminal.external.models.DisconnectReason
import com.stripe.stripeterminal.external.models.Reader
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants
import com.stripeterminalreactnative.mapFromReader
import com.stripeterminalreactnative.mapFromReaderDisconnectReason

class RNReaderReconnectionListener(
    private val context: ReactApplicationContext,
    private val onReaderReconnectStarted: (cancelable: Cancelable?) -> Unit
) : ReaderReconnectionListener {

    override fun onReaderReconnectFailed(reader: Reader) {
        context.sendEvent(ReactNativeConstants.READER_RECONNECT_FAIL.listenerName) {
            putMap("reader", mapFromReader(reader))
        }
    }

    override fun onReaderReconnectStarted(
        reader: Reader,
        cancelReconnect: Cancelable,
        reason: DisconnectReason
    ) {
        onReaderReconnectStarted(cancelReconnect)
        context.sendEvent(ReactNativeConstants.START_READER_RECONNECT.listenerName) {
            putMap("reader", mapFromReader(reader))
            putString("reason", mapFromReaderDisconnectReason(reason))
        }
    }

    override fun onReaderReconnectSucceeded(reader: Reader) {
        context.sendEvent(ReactNativeConstants.READER_RECONNECT_SUCCEED.listenerName) {
            putMap("reader", mapFromReader(reader))
        }
    }
}
