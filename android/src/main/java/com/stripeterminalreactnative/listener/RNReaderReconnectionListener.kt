package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.Cancelable
import com.stripe.stripeterminal.external.callable.ReaderReconnectionListener
import com.stripe.stripeterminal.external.models.Reader
import com.stripe.stripeterminal.external.models.TerminalException.TerminalErrorCode
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants.*
import com.stripeterminalreactnative.mapFromReader
import com.stripeterminalreactnative.nativeMapOf

class RNReaderReconnectionListener(
    private val context: ReactApplicationContext,
    private val onReaderReconnectStarted: (cancelable: Cancelable?) -> Unit,
) : ReaderReconnectionListener {

    override fun onReaderReconnectFailed(reader: Reader) {
        context.sendEvent(READER_RECONNECT_FAIL.listenerName) {
            putMap("error", nativeMapOf {
                putString("code", TerminalErrorCode.UNEXPECTED_SDK_ERROR.toString())
                putString("message", "Reader reconnect fail")
            })
        }
    }

    override fun onReaderReconnectStarted(reader: Reader, cancelReconnect: Cancelable) {
        onReaderReconnectStarted(cancelReconnect)
        context.sendEvent(START_READER_RECONNECT.listenerName) {
            putMap("reader", mapFromReader(reader))
        }
    }

    override fun onReaderReconnectSucceeded(reader: Reader) {
        context.sendEvent(READER_RECONNECT_SUCCEED.listenerName) {
            putMap("reader", mapFromReader(reader))
        }
    }
}
