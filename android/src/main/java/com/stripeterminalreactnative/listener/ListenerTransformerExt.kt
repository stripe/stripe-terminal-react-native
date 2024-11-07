package com.stripeterminalreactnative.listener

import com.stripe.stripeterminal.external.callable.Cancelable
import com.stripe.stripeterminal.external.callable.MobileReaderListener
import com.stripe.stripeterminal.external.callable.ReaderReconnectionListener
import com.stripe.stripeterminal.external.callable.TapToPayReaderListener
import com.stripe.stripeterminal.external.models.DisconnectReason
import com.stripe.stripeterminal.external.models.Reader

fun MobileReaderListener?.bindReconnectionListener(reconnectionListener: ReaderReconnectionListener): MobileReaderListener {
    if (this@bindReconnectionListener == null) {
        return reconnectionListener.toMobileReaderListener()
    }
    return object : MobileReaderListener by this@bindReconnectionListener {
        override fun onReaderReconnectStarted(
            reader: Reader,
            cancelReconnect: Cancelable,
            reason: DisconnectReason
        ) {
            super.onReaderReconnectStarted(reader, cancelReconnect, reason)
            reconnectionListener.onReaderReconnectStarted(reader, cancelReconnect, reason)
        }

        override fun onReaderReconnectSucceeded(reader: Reader) {
            super.onReaderReconnectSucceeded(reader)
            reconnectionListener.onReaderReconnectSucceeded(reader)
        }

        override fun onReaderReconnectFailed(reader: Reader) {
            super.onReaderReconnectFailed(reader)
            reconnectionListener.onReaderReconnectFailed(reader)
        }
    }
}

fun ReaderReconnectionListener.toTapToPayReaderListener() : TapToPayReaderListener {
    return object : TapToPayReaderListener, ReaderReconnectionListener by this@toTapToPayReaderListener {

    }
}

fun ReaderReconnectionListener.toMobileReaderListener(): MobileReaderListener {
    return object : MobileReaderListener,
        ReaderReconnectionListener by this@toMobileReaderListener {

        }
}
