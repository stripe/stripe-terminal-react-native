package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.AppsOnDevicesListener
import com.stripe.stripeterminal.external.callable.ReaderDisconnectListener
import com.stripe.stripeterminal.external.models.ReaderEvent
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants
import com.stripeterminalreactnative.mapFromReaderEvent

class RNAppsOnDevicesListener(
    private val context: ReactApplicationContext,
    private val readerDisconnectListener: ReaderDisconnectListener
) : AppsOnDevicesListener, ReaderDisconnectListener by readerDisconnectListener {
    override fun onReportReaderEvent(event: ReaderEvent) {
        context.sendEvent(ReactNativeConstants.REPORT_READER_EVENT.listenerName) {
            putString("result", mapFromReaderEvent(event))
        }
    }
}
