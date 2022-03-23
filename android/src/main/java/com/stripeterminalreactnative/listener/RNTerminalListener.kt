package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.TerminalListener
import com.stripe.stripeterminal.external.models.ConnectionStatus
import com.stripe.stripeterminal.external.models.PaymentStatus
import com.stripe.stripeterminal.external.models.Reader
import com.stripe.stripeterminal.external.models.TerminalException.TerminalErrorCode
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants
import com.stripeterminalreactnative.mapFromConnectionStatus
import com.stripeterminalreactnative.mapFromPaymentStatus
import com.stripeterminalreactnative.nativeMapOf

class RNTerminalListener(private val context: ReactApplicationContext) : TerminalListener {
    override fun onUnexpectedReaderDisconnect(reader: Reader) {
        context.sendEvent(ReactNativeConstants.REPORT_UNEXPECTED_READER_DISCONNECT.listenerName) {
            putMap("error", nativeMapOf {
                putString("code", TerminalErrorCode.UNEXPECTED_SDK_ERROR.toString())
                putString("message", "Reader has been disconnected unexpectedly")
            })
        }
    }

    override fun onConnectionStatusChange(status: ConnectionStatus) {
        context.sendEvent(ReactNativeConstants.CHANGE_CONNECTION_STATUS.listenerName) {
            putString("result", mapFromConnectionStatus(status))
        }
    }

    override fun onPaymentStatusChange(status: PaymentStatus) {
        context.sendEvent(ReactNativeConstants.CHANGE_PAYMENT_STATUS.listenerName) {
            putString("result", mapFromPaymentStatus(status))
        }
    }
}
