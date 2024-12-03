package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.Cancelable
import com.stripe.stripeterminal.external.callable.ReaderReconnectionListener
import com.stripe.stripeterminal.external.models.DisconnectReason
import com.stripe.stripeterminal.external.models.Reader
import com.stripe.stripeterminal.external.models.TerminalErrorCode
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants
import com.stripeterminalreactnative.mapFromReader
import com.stripeterminalreactnative.mapFromReaderDisconnectReason
import com.stripeterminalreactnative.nativeMapOf

class RNReaderReconnectionListener(
    private val context: ReactApplicationContext,
    private val onReaderReconnectStarted: (cancelable: Cancelable?) -> Unit
) : ReaderReconnectionListener {

    override fun onReaderReconnectFailed(reader: Reader) {
        context.sendEvent(ReactNativeConstants.READER_RECONNECT_FAIL.listenerName) {
            putMap(
                "error",
                nativeMapOf {
                    putString("code", TerminalErrorCode.UNEXPECTED_SDK_ERROR.toString())
                    putString("message", "Reader reconnect fail")
                }
            )
        }
    }

    override fun onReaderReconnectStarted(
        reader: Reader,
        cancelReconnect: Cancelable,
        reason: DisconnectReason
    ) {
        onReaderReconnectStarted(cancelReconnect)
        context.sendEvent(ReactNativeConstants.START_READER_RECONNECT.listenerName) {
            putString("reason", mapFromReaderDisconnectReason(reason))
        }
    }

    override fun onReaderReconnectSucceeded(reader: Reader) {
        context.sendEvent(ReactNativeConstants.READER_RECONNECT_SUCCEED.listenerName) {
            putMap("reader", mapFromReader(reader))
        }
    }
}
