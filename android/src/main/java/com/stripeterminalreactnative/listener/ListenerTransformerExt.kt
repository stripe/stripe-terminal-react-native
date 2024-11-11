package com.stripeterminalreactnative.listener

import com.stripe.stripeterminal.external.callable.Cancelable
import com.stripe.stripeterminal.external.callable.MobileReaderListener
import com.stripe.stripeterminal.external.callable.ReaderReconnectionListener
import com.stripe.stripeterminal.external.callable.TapToPayReaderListener
import com.stripe.stripeterminal.external.models.DisconnectReason
import com.stripe.stripeterminal.external.models.Reader

fun MobileReaderListener?.bindReconnectionListener(reconnectionListener: ReaderReconnectionListener): MobileReaderListener {
    if (this == null) {
        return object : MobileReaderListener, ReaderReconnectionListener by reconnectionListener {}
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

fun TapToPayReaderListener?.bindReconnectionListener(reconnectionListener: ReaderReconnectionListener): TapToPayReaderListener {
    if (this == null) {
        return object : TapToPayReaderListener,
            ReaderReconnectionListener by reconnectionListener {}
    }
    return object : TapToPayReaderListener by this@bindReconnectionListener {
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
