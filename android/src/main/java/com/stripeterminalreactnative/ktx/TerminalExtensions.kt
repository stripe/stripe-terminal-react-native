package com.stripeterminalreactnative.ktx

import com.stripe.stripeterminal.Terminal
import com.stripe.stripeterminal.external.callable.HandoffReaderListener
import com.stripe.stripeterminal.external.callable.InternetReaderListener
import com.stripe.stripeterminal.external.callable.MobileReaderListener
import com.stripe.stripeterminal.external.callable.ReaderCallback
import com.stripe.stripeterminal.external.callable.ReaderDisconnectListener
import com.stripe.stripeterminal.external.callable.ReaderReconnectionListener
import com.stripe.stripeterminal.external.callable.TapToPayReaderListener
import com.stripe.stripeterminal.external.models.ConnectionConfiguration
import com.stripe.stripeterminal.external.models.Reader
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripeterminalreactnative.DiscoveryMethod
import com.stripeterminalreactnative.listener.bindReconnectionListener
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

// TODO (dhenry): replace this with terminalsdk:ktx when module is publicly available

/**
 * @see [Terminal.connectReader]
 */
suspend fun Terminal.connectReader(
    reader: Reader,
    config: ConnectionConfiguration
): Reader {
    return readerCallbackCoroutine {
        connectReader(reader, config, it)
    }
}

private suspend inline fun readerCallbackCoroutine(crossinline block: (ReaderCallback) -> Unit): Reader {
    return suspendCancellableCoroutine { continuation ->
        block(object : ReaderCallback {
            override fun onSuccess(reader: Reader) {
                continuation.resume(reader)
            }

            override fun onFailure(e: TerminalException) {
                continuation.resumeWithException(e)
            }
        })
    }
}

suspend fun Terminal.connectReader(
    discoveryMethod: DiscoveryMethod,
    reader: Reader,
    locationId: String,
    autoReconnectOnUnexpectedDisconnect: Boolean = true,
    disconnectListener: ReaderDisconnectListener? = null,
    reconnectionListener: ReaderReconnectionListener,
): Reader = when (discoveryMethod) {
    DiscoveryMethod.BLUETOOTH_SCAN -> {
        val connConfig = ConnectionConfiguration.BluetoothConnectionConfiguration(
            locationId,
            autoReconnectOnUnexpectedDisconnect,
            (disconnectListener as? MobileReaderListener).bindReconnectionListener(
                reconnectionListener
            )
        )
        connectReader(reader, connConfig)
    }

    DiscoveryMethod.TAP_TO_PAY -> connectReader(
        reader,
        ConnectionConfiguration.TapToPayConnectionConfiguration(
            locationId,
            autoReconnectOnUnexpectedDisconnect,
            (disconnectListener as? TapToPayReaderListener)?.bindReconnectionListener(
                reconnectionListener
            )
        )
    )

    DiscoveryMethod.INTERNET -> connectReader(
        reader,
        ConnectionConfiguration.InternetConnectionConfiguration(internetReaderListener = (disconnectListener as? InternetReaderListener))
    )

    DiscoveryMethod.HANDOFF -> {
        connectReader(reader,
            ConnectionConfiguration.HandoffConnectionConfiguration(disconnectListener as? HandoffReaderListener)
        )
    }

    DiscoveryMethod.USB -> {
        val connConfig = ConnectionConfiguration.UsbConnectionConfiguration(
            locationId,
            autoReconnectOnUnexpectedDisconnect,
            (disconnectListener as? MobileReaderListener).bindReconnectionListener(
                reconnectionListener
            )
        )
        connectReader(reader, connConfig)
    }

    else -> {
        throw IllegalArgumentException("Unsupported discovery method: $discoveryMethod")
    }
}
