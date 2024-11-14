package com.stripeterminalreactnative.listener

import com.stripe.stripeterminal.external.callable.InternetReaderListener
import com.stripe.stripeterminal.external.callable.ReaderDisconnectListener

class RNInternetReaderListener(private val readerDisconnectListener: ReaderDisconnectListener) :
    InternetReaderListener, ReaderDisconnectListener by readerDisconnectListener
