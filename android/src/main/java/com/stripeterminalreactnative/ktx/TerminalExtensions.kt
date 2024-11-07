package com.stripeterminalreactnative.ktx

import com.stripe.stripeterminal.Terminal
import com.stripe.stripeterminal.external.callable.*
import com.stripe.stripeterminal.external.models.ConnectionConfiguration
import com.stripe.stripeterminal.external.models.ConnectionConfiguration.BluetoothConnectionConfiguration
import com.stripe.stripeterminal.external.models.ConnectionConfiguration.HandoffConnectionConfiguration
import com.stripe.stripeterminal.external.models.ConnectionConfiguration.InternetConnectionConfiguration
import com.stripe.stripeterminal.external.models.ConnectionConfiguration.TapToPayConnectionConfiguration
import com.stripe.stripeterminal.external.models.ConnectionConfiguration.UsbConnectionConfiguration
import com.stripe.stripeterminal.external.models.DisconnectReason
import com.stripe.stripeterminal.external.models.Reader
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripeterminalreactnative.DiscoveryMethod
import com.stripeterminalreactnative.ReactNativeConstants
import com.stripeterminalreactnative.listener.bindReconnectionListener
import com.stripeterminalreactnative.listener.toTapToPayReaderListener
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
    autoReconnectOnUnexpectedDisconnect: Boolean = false,
    listener: ReaderListenable? = null,
    reconnectionListener: ReaderReconnectionListener
): Reader = when (discoveryMethod) {
    DiscoveryMethod.BLUETOOTH_SCAN -> {
        val connConfig = BluetoothConnectionConfiguration(
            locationId,
            autoReconnectOnUnexpectedDisconnect,
            (listener as? MobileReaderListener).bindReconnectionListener(reconnectionListener)
        )
        connectReader(reader, connConfig)
    }

    DiscoveryMethod.LOCAL_MOBILE -> connectReader(
        reader,
        TapToPayConnectionConfiguration(
            locationId,
            autoReconnectOnUnexpectedDisconnect,
            reconnectionListener.toTapToPayReaderListener()
        )
    )

    DiscoveryMethod.INTERNET -> connectReader(
        reader,
        InternetConnectionConfiguration(internetReaderListener = object : InternetReaderListener {
            override fun onDisconnect(reason: DisconnectReason) {
                super.onDisconnect(reason)
//                context.sendEvent(ReactNativeConstants.REPORT_UNEXPECTED_READER_DISCONNECT.listenerName) {
//                    putMap(
//                        "error",
//                        nativeMapOf {
//                            putString("code", TerminalErrorCode.UNEXPECTED_SDK_ERROR.toString())
//                            putString("message", "Reader has been disconnected unexpectedly")
//                        }
//                    )
//                }
            }
        })
    )

    DiscoveryMethod.HANDOFF -> {
        connectReader(reader, HandoffConnectionConfiguration(listener as? HandoffReaderListener))
    }

    DiscoveryMethod.USB -> {
        val connConfig = UsbConnectionConfiguration(
            locationId,
            autoReconnectOnUnexpectedDisconnect,
            (listener as? MobileReaderListener).bindReconnectionListener(reconnectionListener)
        )
        connectReader(reader, connConfig)
    }

    else -> {
        throw IllegalArgumentException("Unsupported discovery method: $discoveryMethod")
    }
}
