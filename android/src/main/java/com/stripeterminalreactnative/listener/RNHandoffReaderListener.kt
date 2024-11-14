package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.HandoffReaderListener
import com.stripe.stripeterminal.external.callable.ReaderDisconnectListener
import com.stripe.stripeterminal.external.models.ReaderEvent
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants.REQUEST_READER_INPUT
import com.stripeterminalreactnative.mapFromReaderEvent

class RNHandoffReaderListener(
    private val context: ReactApplicationContext,
    private val readerDisconnectListener: ReaderDisconnectListener
) : HandoffReaderListener, ReaderDisconnectListener by readerDisconnectListener {
    override fun onReportReaderEvent(event: ReaderEvent) {
        context.sendEvent(REQUEST_READER_INPUT.listenerName) {
            putString("event", mapFromReaderEvent(event))
        }
    }
}
