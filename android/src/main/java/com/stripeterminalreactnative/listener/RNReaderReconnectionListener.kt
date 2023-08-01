package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.Cancelable
import com.stripe.stripeterminal.external.callable.ReaderReconnectionListener
import com.stripe.stripeterminal.external.models.Reader
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants.*
import com.stripeterminalreactnative.mapFromReader

class RNReaderReconnectionListener(
    private val context: ReactApplicationContext
) : ReaderReconnectionListener {

    override fun onReaderReconnectFailed(reader: Reader) {
        context.sendEvent(TERMINAL_FAIL_READER_RECONNECT.listenerName) {
            putMap("reader", mapFromReader(reader))
        }
    }

    override fun onReaderReconnectStarted(reader: Reader, cancelReconnect: Cancelable) {
        context.sendEvent(START_READER_RECONNECT.listenerName) {
            putMap("reader", mapFromReader(reader))
        }
    }

    override fun onReaderReconnectSucceeded(reader: Reader) {
        context.sendEvent(TERMINAL_SUCCEED_READER_RECONNECT.listenerName) {
            putMap("reader", mapFromReader(reader))
        }
    }
}
