package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.MobileReaderListener
import com.stripe.stripeterminal.external.callable.TerminalListener
import com.stripe.stripeterminal.external.models.*
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants.CHANGE_CONNECTION_STATUS
import com.stripeterminalreactnative.ReactNativeConstants.CHANGE_PAYMENT_STATUS
import com.stripeterminalreactnative.mapFromConnectionStatus
import com.stripeterminalreactnative.mapFromPaymentStatus

class RNTerminalListener(private val context: ReactApplicationContext) : TerminalListener {
//    override fun onDisconnect(reason: DisconnectReason) {// TODO should do in individual listener
//        context.sendEvent(REPORT_UNEXPECTED_READER_DISCONNECT.listenerName) {
//            putMap(
//                "error",
//                nativeMapOf {
//                    putString("code", TerminalErrorCode.UNEXPECTED_SDK_ERROR.toString())
//                    putString("message", "Reader has been disconnected unexpectedly")
//                }
//            )
//        }
//    }

    override fun onConnectionStatusChange(status: ConnectionStatus) {
        context.sendEvent(CHANGE_CONNECTION_STATUS.listenerName) {
            putString("result", mapFromConnectionStatus(status))
        }
    }

    override fun onPaymentStatusChange(status: PaymentStatus) {
        context.sendEvent(CHANGE_PAYMENT_STATUS.listenerName) {
            putString("result", mapFromPaymentStatus(status))
        }
    }
}
