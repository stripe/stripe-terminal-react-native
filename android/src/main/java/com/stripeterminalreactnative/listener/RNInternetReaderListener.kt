package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.InternetReaderListener
import com.stripe.stripeterminal.external.callable.ReaderDisconnectListener

class RNInternetReaderListener(private val context: ReactApplicationContext) :
    InternetReaderListener, ReaderDisconnectListener by readerDisconnectDelete(context)
