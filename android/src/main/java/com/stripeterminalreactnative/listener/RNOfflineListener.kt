package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.OfflineMode
import com.stripe.stripeterminal.external.callable.OfflineListener
import com.stripe.stripeterminal.external.models.OfflineStatus
import com.stripe.stripeterminal.external.models.PaymentIntent
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants
import com.stripeterminalreactnative.createError
import com.stripeterminalreactnative.mapFromOfflineStatus
import com.stripeterminalreactnative.mapFromPaymentIntent
import com.stripeterminalreactnative.putError

@OptIn(OfflineMode::class)
class RNOfflineListener(
    private val context: ReactApplicationContext
) : OfflineListener {
    override fun onOfflineStatusChange(offlineStatus: OfflineStatus) {
        context.sendEvent(ReactNativeConstants.CHANGE_OFFLINE_STATUS.listenerName) {
            putMap("result", mapFromOfflineStatus(offlineStatus))
        }
    }

    override fun onPaymentIntentForwarded(paymentIntent: PaymentIntent, e: TerminalException?) {
        context.sendEvent(ReactNativeConstants.FORWARD_PAYMENT_INTENT.listenerName) {
            putMap("result", mapFromPaymentIntent(paymentIntent, ""))
            e?.let { putError(it) }
        }
    }

    override fun onForwardingFailure(e: TerminalException) {
        context.sendEvent(ReactNativeConstants.REPORT_FORWARDING_ERROR.listenerName) {
            putMap("result", createError(e))
        }
    }
}
