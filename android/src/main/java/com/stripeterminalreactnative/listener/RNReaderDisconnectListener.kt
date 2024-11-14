package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.ReaderDisconnectListener
import com.stripe.stripeterminal.external.models.DisconnectReason
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants.DISCONNECT
import com.stripeterminalreactnative.mapFromReaderDisconnectReason

class RNReaderDisconnectListener(private val context: ReactApplicationContext) : ReaderDisconnectListener {
    override fun onDisconnect(reason: DisconnectReason) {
        super.onDisconnect(reason)
        context.sendEvent(DISCONNECT.listenerName) {
            putString("reason", mapFromReaderDisconnectReason(reason))
        }
    }
}