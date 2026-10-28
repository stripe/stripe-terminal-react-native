package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.ReaderDisconnectListener
import com.stripe.stripeterminal.external.callable.ReaderReconnectionListener
import com.stripe.stripeterminal.external.callable.TapToPayReaderListener
import com.stripe.stripeterminal.external.models.TapToPayUpdateRequirement
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants
import com.stripeterminalreactnative.mapFromTapToPayUpdateRequirement
import com.stripeterminalreactnative.nativeArrayOf

class RNTapToPayReaderListener(
    private val context: ReactApplicationContext,
    private val readerDisconnectListener: ReaderDisconnectListener,
    private val readerReconnectionListener: ReaderReconnectionListener
) : TapToPayReaderListener,
    ReaderDisconnectListener by readerDisconnectListener,
    ReaderReconnectionListener by readerReconnectionListener {

    override fun onUpdateRequirementsAvailable(requirements: List<TapToPayUpdateRequirement>) {
        context.sendEvent(ReactNativeConstants.UPDATE_REQUIREMENTS_AVAILABLE.listenerName) {
            putArray("result", nativeArrayOf {
                requirements.forEach { requirement ->
                    pushMap(mapFromTapToPayUpdateRequirement(requirement))
                }
            })
        }
    }
}
