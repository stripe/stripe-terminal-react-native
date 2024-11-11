package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.Cancelable
import com.stripe.stripeterminal.external.callable.MobileReaderListener
import com.stripe.stripeterminal.external.callable.ReaderDisconnectListener
import com.stripe.stripeterminal.external.models.*
import com.stripeterminalreactnative.*
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants.*

class RNUsbReaderListener(
    private val context: ReactApplicationContext,
    private val onStartInstallingUpdate: (cancelable: Cancelable?) -> Unit
) : MobileReaderListener, ReaderDisconnectListener by readerDisconnectDelete(context) {

    override fun onReportAvailableUpdate(update: ReaderSoftwareUpdate) {
        context.sendEvent(REPORT_AVAILABLE_UPDATE.listenerName) {
            putMap("result", mapFromReaderSoftwareUpdate(update))
        }
    }

    override fun onStartInstallingUpdate(
        update: ReaderSoftwareUpdate,
        cancelable: Cancelable?
    ) {
        onStartInstallingUpdate(cancelable)
        context.sendEvent(START_INSTALLING_UPDATE.listenerName) {
            putMap("result", mapFromReaderSoftwareUpdate(update))
        }
    }

    override fun onReportReaderSoftwareUpdateProgress(progress: Float) {
        context.sendEvent(REPORT_UPDATE_PROGRESS.listenerName) {
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
        context.sendEvent(FINISH_INSTALLING_UPDATE.listenerName) {
            val result = update?.let { mapFromReaderSoftwareUpdate(update) } ?: nativeMapOf()
            e?.let {
                result.putError(e)
            }
            putMap("result", result)
        }
    }

    override fun onRequestReaderInput(options: ReaderInputOptions) {
        context.sendEvent(REQUEST_READER_INPUT.listenerName) {
            putArray("result", mapFromReaderInputOptions(options))
        }
    }

    override fun onRequestReaderDisplayMessage(message: ReaderDisplayMessage) {
        context.sendEvent(REQUEST_READER_DISPLAY_MESSAGE.listenerName) {
            putString("result", mapFromReaderDisplayMessage(message))
        }
    }

    override fun onBatteryLevelUpdate(
        batteryLevel: Float,
        batteryStatus: BatteryStatus,
        isCharging: Boolean
    ) {
        context.sendEvent(UPDATE_BATTERY_LEVEL.listenerName) {
            putMap(
                "result",
                nativeMapOf {
                    putDoubleOrNull(this,"batteryLevel", batteryLevel.toDouble())
                    putString("batteryStatus", mapFromBatteryStatus(batteryStatus))
                    putBoolean("isCharging", isCharging)
                }
            )
        }
    }

    override fun onReportLowBatteryWarning() {
        context.sendEvent(REPORT_LOW_BATTERY_WARNING.listenerName) {
            putString("result", "LOW BATTERY")
        }
    }

    override fun onReportReaderEvent(event: ReaderEvent) {
        context.sendEvent(REPORT_READER_EVENT.listenerName) {
            putString("result", mapFromReaderEvent(event))
        }
    }
}
