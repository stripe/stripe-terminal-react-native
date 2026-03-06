package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.Cancelable
import com.stripe.stripeterminal.external.callable.MobileReaderListener
import com.stripe.stripeterminal.external.callable.ReaderDisconnectListener
import com.stripe.stripeterminal.external.callable.ReaderReconnectionListener
import com.stripe.stripeterminal.external.models.BatteryStatus
import com.stripe.stripeterminal.external.models.PaymentIntent
import com.stripe.stripeterminal.external.models.PaymentOption
import com.stripe.stripeterminal.external.models.QrCodeDisplayData
import com.stripe.stripeterminal.external.models.ReaderDisplayMessage
import com.stripe.stripeterminal.external.models.ReaderEvent
import com.stripe.stripeterminal.external.models.ReaderInputOptions
import com.stripe.stripeterminal.external.models.ReaderSoftwareUpdate
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripe.stripeterminal.external.models.TerminalErrorCode
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants
import com.stripeterminalreactnative.mapFromBatteryStatus
import com.stripeterminalreactnative.mapFromPaymentIntent
import com.stripeterminalreactnative.mapFromPaymentOptions
import com.stripeterminalreactnative.mapFromQrCodeDisplayData
import com.stripeterminalreactnative.mapFromReaderDisplayMessage
import com.stripeterminalreactnative.mapFromReaderEvent
import com.stripeterminalreactnative.mapFromReaderInputOptions
import com.stripeterminalreactnative.mapFromReaderSoftwareUpdate
import com.stripeterminalreactnative.nativeMapOf
import com.stripeterminalreactnative.putDoubleOrNull
import com.stripeterminalreactnative.putError
import com.stripe.stripeterminal.external.callable.PaymentMethodSelectionCallback
import com.stripe.stripeterminal.external.callable.QrCodeDisplayCallback
import java.util.concurrent.atomic.AtomicReference

class RNMobileReaderListener(
    private val context: ReactApplicationContext,
    private val readerReconnectionListener: ReaderReconnectionListener,
    private val readerDisconnectListener: ReaderDisconnectListener,
    private val paymentMethodSelectionCallback: AtomicReference<PaymentMethodSelectionCallback?>,
    private val qrCodeDisplayCallback: AtomicReference<QrCodeDisplayCallback?>,
    private val isPaymentMethodSelectionHandlerRegistered: () -> Boolean,
    private val isQrCodeDisplayHandlerRegistered: () -> Boolean,
    private val onStartInstallingUpdate: (cancelable: Cancelable?) -> Unit
) : MobileReaderListener, ReaderDisconnectListener by readerDisconnectListener,
    ReaderReconnectionListener by readerReconnectionListener {

    override fun onReportAvailableUpdate(update: ReaderSoftwareUpdate) {
        context.sendEvent(ReactNativeConstants.REPORT_AVAILABLE_UPDATE.listenerName) {
            putMap("result", mapFromReaderSoftwareUpdate(update))
        }
    }

    override fun onStartInstallingUpdate(
        update: ReaderSoftwareUpdate,
        cancelable: Cancelable?
    ) {
        onStartInstallingUpdate(cancelable)
        context.sendEvent(ReactNativeConstants.START_INSTALLING_UPDATE.listenerName) {
            putMap("result", mapFromReaderSoftwareUpdate(update))
        }
    }

    override fun onReportReaderSoftwareUpdateProgress(progress: Float) {
        context.sendEvent(ReactNativeConstants.REPORT_UPDATE_PROGRESS.listenerName) {
            putMap(
                "result",
                nativeMapOf {
                    putString("progress", progress.toString())
                }
            )
        }
    }

    override fun onFinishInstallingUpdate(
        update: ReaderSoftwareUpdate?,
        e: TerminalException?
    ) {
        context.sendEvent(ReactNativeConstants.FINISH_INSTALLING_UPDATE.listenerName) {
            val result = update?.let { mapFromReaderSoftwareUpdate(update) } ?: nativeMapOf()
            e?.let {
                result.putError(e)
            }
            putMap("result", result)
        }
    }

    override fun onRequestReaderInput(options: ReaderInputOptions) {
        context.sendEvent(ReactNativeConstants.REQUEST_READER_INPUT.listenerName) {
            putArray("result", mapFromReaderInputOptions(options))
        }
    }

    override fun onRequestReaderDisplayMessage(message: ReaderDisplayMessage) {
        context.sendEvent(ReactNativeConstants.REQUEST_READER_DISPLAY_MESSAGE.listenerName) {
            putString("result", mapFromReaderDisplayMessage(message))
        }
    }

    override fun onBatteryLevelUpdate(
        batteryLevel: Float,
        batteryStatus: BatteryStatus,
        isCharging: Boolean
    ) {
        context.sendEvent(ReactNativeConstants.UPDATE_BATTERY_LEVEL.listenerName) {
            putMap(
                "result",
                nativeMapOf {
                    putDoubleOrNull(this, "batteryLevel", batteryLevel.toDouble())
                    putString("batteryStatus", mapFromBatteryStatus(batteryStatus))
                    putBoolean("isCharging", isCharging)
                }
            )
        }
    }

    override fun onReportLowBatteryWarning() {
        context.sendEvent(ReactNativeConstants.REPORT_LOW_BATTERY_WARNING.listenerName) {
            putString("result", "LOW BATTERY")
        }
    }

    override fun onReportReaderEvent(event: ReaderEvent) {
        context.sendEvent(ReactNativeConstants.REPORT_READER_EVENT.listenerName) {
            putString("result", mapFromReaderEvent(event))
        }
    }

    /**
     * Called when payment method selection is required (e.g., card vs qr based payment).
     * If JS has registered a handler, emit event and wait. Otherwise, default to card immediately.
     */
    override fun onPaymentMethodSelectionRequired(
        paymentIntent: PaymentIntent,
        availablePaymentOptions: List<PaymentOption>,
        callback: PaymentMethodSelectionCallback
    ) {
        if (isPaymentMethodSelectionHandlerRegistered()) {
            paymentMethodSelectionCallback.set(callback)
            context.sendEvent(ReactNativeConstants.PAYMENT_METHOD_SELECTION_REQUIRED.listenerName) {
                putMap("paymentIntent", mapFromPaymentIntent(paymentIntent, ""))
                putArray("availablePaymentOptions", mapFromPaymentOptions(availablePaymentOptions))
            }
        } else {
            callback.onSuccess(PaymentOption.CardPayment)
        }
    }

    /**
     * Called when a QR code needs to be displayed to the customer.
     * If JS has registered a handler, emit event and wait. Otherwise, fail immediately.
     */
    override fun onQrCodeDisplayRequired(
        paymentIntent: PaymentIntent,
        qrData: QrCodeDisplayData,
        callback: QrCodeDisplayCallback
    ) {
        if (isQrCodeDisplayHandlerRegistered()) {
            qrCodeDisplayCallback.set(callback)
            context.sendEvent(ReactNativeConstants.QR_CODE_DISPLAY_REQUIRED.listenerName) {
                putMap("paymentIntent", mapFromPaymentIntent(paymentIntent, ""))
                putMap("qrData", mapFromQrCodeDisplayData(qrData))
            }
        } else {
            callback.onFailure(TerminalException(
                TerminalErrorCode.CANCELED,
                "QR code display requires implementing onQrCodeDisplayRequired callback"
            ))
        }
    }
}
