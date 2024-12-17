package com.stripeterminalreactnative.listener

import com.stripe.stripeterminal.external.callable.ReaderDisconnectListener
import com.stripe.stripeterminal.external.callable.ReaderReconnectionListener
import com.stripe.stripeterminal.external.callable.TapToPayReaderListener

class RNTapToPayReaderListener(
    private val readerDisconnectListener: ReaderDisconnectListener,
    private val readerReconnectionListener: ReaderReconnectionListener
) : TapToPayReaderListener,
    ReaderDisconnectListener by readerDisconnectListener,
    ReaderReconnectionListener by readerReconnectionListener

