package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.TerminalListener
import com.stripe.stripeterminal.external.models.ConnectionStatus
import com.stripe.stripeterminal.external.models.PaymentStatus
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants.CHANGE_CONNECTION_STATUS
import com.stripeterminalreactnative.ReactNativeConstants.CHANGE_PAYMENT_STATUS
import com.stripeterminalreactnative.mapFromConnectionStatus
import com.stripeterminalreactnative.mapFromPaymentStatus

class RNTerminalListener(private val context: ReactApplicationContext) : TerminalListener {

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
