package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.HandoffReaderListener
import com.stripe.stripeterminal.external.models.ReaderEvent
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.mapFromReaderEvent

class RNHandoffReaderListener(private val context: ReactApplicationContext) :
    HandoffReaderListener {
    override fun onReportReaderEvent(event: ReaderEvent) {
        context.sendEvent("didRequestReaderInput") {
            putString("event", mapFromReaderEvent(event))
        }
    }
}
