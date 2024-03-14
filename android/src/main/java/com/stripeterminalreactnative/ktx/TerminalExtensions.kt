package com.stripeterminalreactnative.ktx

import com.stripe.stripeterminal.Terminal
import com.stripe.stripeterminal.external.callable.HandoffReaderListener
import com.stripe.stripeterminal.external.callable.ReaderCallback
import com.stripe.stripeterminal.external.callable.ReaderListenable
import com.stripe.stripeterminal.external.callable.ReaderListener
import com.stripe.stripeterminal.external.callable.ReaderReconnectionListener
import com.stripe.stripeterminal.external.models.ConnectionConfiguration.BluetoothConnectionConfiguration
import com.stripe.stripeterminal.external.models.ConnectionConfiguration.HandoffConnectionConfiguration
import com.stripe.stripeterminal.external.models.ConnectionConfiguration.InternetConnectionConfiguration
import com.stripe.stripeterminal.external.models.ConnectionConfiguration.LocalMobileConnectionConfiguration
import com.stripe.stripeterminal.external.models.ConnectionConfiguration.UsbConnectionConfiguration
import com.stripe.stripeterminal.external.models.Reader
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripeterminalreactnative.DiscoveryMethod
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

// TODO (dhenry): replace this with terminalsdk:ktx when module is publicly available

/**
 * @see [Terminal.connectBluetoothReader]
 */
suspend fun Terminal.connectBluetoothReader(
    reader: Reader,
    config: BluetoothConnectionConfiguration,
    listener: ReaderListener = object : ReaderListener {}
): Reader {
    return readerCallbackCoroutine {
        connectBluetoothReader(reader, config, listener, it)
    }
}

/**
 * @see [Terminal.connectHandoffReader]
 */
suspend fun Terminal.connectHandoffReader(
    reader: Reader,
    config: HandoffConnectionConfiguration,
    listener: HandoffReaderListener = object : HandoffReaderListener {}
): Reader {
    return readerCallbackCoroutine {
        connectHandoffReader(reader, config, listener, it)
    }
}

/**
 * @see [Terminal.connectInternetReader]
 */
suspend fun Terminal.connectInternetReader(
    reader: Reader,
    config: InternetConnectionConfiguration
): Reader {
    return readerCallbackCoroutine { connectInternetReader(reader, config, it) }
}

/**
 * @see [Terminal.connectLocalMobileReader]
 */
suspend fun Terminal.connectLocalMobileReader(
    reader: Reader,
    config: LocalMobileConnectionConfiguration
): Reader {
    return readerCallbackCoroutine { connectLocalMobileReader(reader, config, it) }
}

/**
 * @see [Terminal.connectUsbReader]
 */
suspend fun Terminal.connectUsbReader(
    reader: Reader,
    config: UsbConnectionConfiguration,
    listener: ReaderListener = object : ReaderListener {}
): Reader {
    return readerCallbackCoroutine {
        connectUsbReader(reader, config, listener, it)
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
    autoReconnectOnUnexpectedDisconnect: Boolean = false,
    listener: ReaderListenable? = null,
    reconnectionListener: ReaderReconnectionListener
): Reader = when (discoveryMethod) {
    DiscoveryMethod.BLUETOOTH_SCAN -> {
        val connConfig = BluetoothConnectionConfiguration(
            locationId,
            autoReconnectOnUnexpectedDisconnect,
            reconnectionListener
        )
        if (listener is ReaderListener) {
            connectBluetoothReader(reader, connConfig, listener)
        } else {
            connectBluetoothReader(reader, connConfig)
        }
    }
    DiscoveryMethod.LOCAL_MOBILE -> connectLocalMobileReader(
        reader,
        LocalMobileConnectionConfiguration(locationId)
    )
    DiscoveryMethod.INTERNET -> connectInternetReader(reader, InternetConnectionConfiguration())
    DiscoveryMethod.HANDOFF -> {
        if (listener is HandoffReaderListener) {
            connectHandoffReader(reader, HandoffConnectionConfiguration(), listener)
        } else {
            connectHandoffReader(reader, HandoffConnectionConfiguration())
        }
    }
    DiscoveryMethod.USB -> {
        val connConfig = UsbConnectionConfiguration(
            locationId,
            autoReconnectOnUnexpectedDisconnect,
            reconnectionListener
        )
        if (listener is ReaderListener) {
            connectUsbReader(reader, connConfig, listener)
        } else {
            connectUsbReader(reader, connConfig)
        }
    }
    else -> {
        throw IllegalArgumentException("Unsupported discovery method: $discoveryMethod")
    }
}
