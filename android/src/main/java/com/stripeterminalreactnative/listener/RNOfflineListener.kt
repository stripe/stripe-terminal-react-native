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
import com.stripeterminalreactnative.mapFromForwardedPaymentIntent
import com.stripeterminalreactnative.mapFromOfflineStatus


@OptIn(OfflineMode::class)
class RNOfflineListener(
    private val context: ReactApplicationContext,
): OfflineListener {
    override fun onOfflineStatusChange(offlineStatus: OfflineStatus) {
        context.sendEvent(ReactNativeConstants.OFFLINE_STATUS_CHANGE.listenerName) {
            putMap("offlineStatus" ,mapFromOfflineStatus(offlineStatus))
        }
    }

    override fun onPaymentIntentForwarded(paymentIntent: PaymentIntent, e: TerminalException?) {
        context.sendEvent(ReactNativeConstants.PAYMENT_INTENT_FORWARDED.listenerName) {
            putMap("result", mapFromForwardedPaymentIntent(paymentIntent))
        }
    }

    override fun onForwardingFailure(e: TerminalException) {
        context.sendEvent(ReactNativeConstants.FORWARDING_FAILURE.listenerName) {
            putMap("result", createError(e))
        }
    }
}
