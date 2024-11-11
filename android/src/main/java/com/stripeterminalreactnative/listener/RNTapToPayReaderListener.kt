package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.ReaderDisconnectListener
import com.stripe.stripeterminal.external.callable.TapToPayReaderListener

class RNTapToPayReaderListener(private val context: ReactApplicationContext) :
    TapToPayReaderListener, ReaderDisconnectListener by readerDisconnectDelete(context)

