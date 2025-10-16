package com.stripeterminalreactnative

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.stripe.stripeterminal.external.api.ApiError
import com.stripe.stripeterminal.external.models.TerminalErrorCode
import com.stripe.stripeterminal.external.models.TerminalException
import kotlinx.coroutines.CancellationException

internal fun createError(throwable: Throwable): ReadableMap = nativeMapOf { putError(throwable) }

internal fun stripeErrorMapFromThrowable(throwable: Throwable): ReadableMap = nativeMapOf {
    putErrorContents(throwable)
}

internal fun WritableMap.putError(throwable: Throwable): ReadableMap = apply {
    putMap(
        "error",
        nativeMapOf {
            putErrorContents(throwable)
        }
    )
    if (throwable is TerminalException) {
        throwable.paymentIntent?.let {
            putMap("paymentIntent", mapFromPaymentIntent(it, ""))
        }
    }
}

private fun WritableMap.putErrorContents(throwable: Throwable?) {
    when (throwable) {
        is TerminalException -> {
            // Enrich to StripeError shape expected by RN layer
            putString("name", "StripeError")
            putString("message", throwable.errorMessage)
            putString("code", throwable.errorCode.toRnErrorCode())
            putString("nativeErrorCode", throwable.errorCode.toString())
            putMap(
                "metadata",
                nativeMapOf {
                    throwable.apiError?.let { apiErr ->
                        putMap(
                            "apiError",
                            nativeMapOf {
                                putString("code", apiErr.code)
                                putString("message", apiErr.message)
                                putString("declineCode", apiErr.declineCode)
                            }
                        )
                    }
                }
            )
        }
        is CancellationException -> {
            putErrorContents(throwable.cause)
        }
        else -> {
            putUnknownErrorContents(throwable)
        }
    }
}

private fun WritableMap.putUnknownErrorContents(throwable: Throwable?) {
    putString("name", "StripeError")
    putString("message", throwable?.message ?: "Unknown error")
    putString("code", TerminalErrorCode.UNEXPECTED_SDK_ERROR.toRnErrorCode())
    putString("nativeErrorCode", TerminalErrorCode.UNEXPECTED_SDK_ERROR.toString())
    putMap("metadata", nativeMapOf { })
}

@Throws(TerminalException::class)
internal fun <T> requireCancelable(cancelable: T?, lazyMessage: () -> String): T {
    return cancelable ?: throw TerminalException(
        TerminalErrorCode.CANCEL_FAILED,
        lazyMessage()
    )
}

@Throws(TerminalException::class)
internal fun <T> throwIfBusy(command: T?, lazyMessage: () -> String): Unit? {
    return command?.run {
        throw TerminalException(
            TerminalErrorCode.READER_BUSY,
            lazyMessage()
        )
    }
}

@Throws(TerminalException::class)
internal fun <T> requireParam(input: T?, lazyMessage: () -> String): T {
    return input ?: throw TerminalException(
        TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
        lazyMessage()
    )
}

internal fun withExceptionResolver(promise: Promise, block: () -> Unit) {
    try {
        block()
    } catch (e: TerminalException) {
        promise.resolve(createError(e))
    }
}

internal suspend fun withSuspendExceptionResolver(promise: Promise, block: suspend () -> Unit) {
    try {
        block()
    } catch (e: TerminalException) {
        promise.resolve(createError(e))
    }
}

fun TerminalErrorCode.toRnErrorCode(): String = when (this) {
    // Integration-like
    TerminalErrorCode.CANCEL_FAILED -> "CANCEL_FAILED"
    TerminalErrorCode.NOT_CONNECTED_TO_READER -> "NOT_CONNECTED_TO_READER"
    TerminalErrorCode.ALREADY_CONNECTED_TO_READER -> "ALREADY_CONNECTED_TO_READER"
    TerminalErrorCode.BLUETOOTH_PERMISSION_DENIED -> "BLUETOOTH_PERMISSION_DENIED"
    TerminalErrorCode.CONFIRM_INVALID_PAYMENT_INTENT -> "CONFIRM_INVALID_PAYMENT_INTENT"
    TerminalErrorCode.CONFIRM_INVALID_SETUP_INTENT -> "CONFIRM_INVALID_SETUP_INTENT"
    TerminalErrorCode.INVALID_CLIENT_SECRET -> "INVALID_CLIENT_SECRET"
    TerminalErrorCode.UNSUPPORTED_OPERATION -> "UNSUPPORTED_OPERATION"
    TerminalErrorCode.UNEXPECTED_OPERATION -> "UNEXPECTED_OPERATION"
    TerminalErrorCode.UNSUPPORTED_SDK -> "UNSUPPORTED_SDK"
    TerminalErrorCode.USB_PERMISSION_DENIED -> "USB_PERMISSION_DENIED"
    TerminalErrorCode.MISSING_PREREQUISITE -> "MISSING_PREREQUISITE"
    TerminalErrorCode.MISSING_REQUIRED_PARAMETER -> "MISSING_REQUIRED_PARAMETER"
    TerminalErrorCode.INVALID_REQUIRED_PARAMETER -> "INVALID_REQUIRED_PARAMETER"
    TerminalErrorCode.INVALID_TIP_PARAMETER -> "INVALID_TIP_PARAMETER"
    TerminalErrorCode.TAP_TO_PAY_LIBRARY_NOT_INCLUDED -> "TAP_TO_PAY_LIBRARY_NOT_INCLUDED"
    TerminalErrorCode.TAP_TO_PAY_UNSUPPORTED_DEVICE -> "TAP_TO_PAY_UNSUPPORTED_DEVICE"
    TerminalErrorCode.TAP_TO_PAY_UNSUPPORTED_ANDROID_VERSION -> "TAP_TO_PAY_UNSUPPORTED_ANDROID_VERSION"
    TerminalErrorCode.TAP_TO_PAY_DEVICE_TAMPERED -> "TAP_TO_PAY_DEVICE_TAMPERED"
    TerminalErrorCode.TAP_TO_PAY_INSECURE_ENVIRONMENT -> "TAP_TO_PAY_INSECURE_ENVIRONMENT"
    TerminalErrorCode.TAP_TO_PAY_DEBUG_NOT_SUPPORTED -> "TAP_TO_PAY_DEBUG_NOT_SUPPORTED"
    TerminalErrorCode.TAP_TO_PAY_UNSUPPORTED_PROCESSOR -> "TAP_TO_PAY_UNSUPPORTED_PROCESSOR"
    TerminalErrorCode.OFFLINE_MODE_UNSUPPORTED_ANDROID_VERSION -> "OFFLINE_MODE_UNSUPPORTED_ANDROID_VERSION"

    // User-like
    TerminalErrorCode.CANCELED -> "CANCELED"
    TerminalErrorCode.LOCATION_SERVICES_DISABLED -> "LOCATION_SERVICES_DISABLED"
    TerminalErrorCode.BLUETOOTH_SCAN_TIMED_OUT -> "BLUETOOTH_SCAN_TIMED_OUT"
    TerminalErrorCode.BLUETOOTH_LOW_ENERGY_UNSUPPORTED -> "BLUETOOTH_LOW_ENERGY_UNSUPPORTED"
    TerminalErrorCode.READER_SOFTWARE_UPDATE_FAILED_BATTERY_LOW -> "READER_SOFTWARE_UPDATE_FAILED_BATTERY_LOW"
    TerminalErrorCode.READER_SOFTWARE_UPDATE_FAILED_INTERRUPTED -> "READER_SOFTWARE_UPDATE_FAILED_INTERRUPTED"
    TerminalErrorCode.CARD_INSERT_NOT_READ -> "CARD_INSERT_NOT_READ"
    TerminalErrorCode.CARD_SWIPE_NOT_READ -> "CARD_SWIPE_NOT_READ"
    TerminalErrorCode.CARD_READ_TIMED_OUT -> "CARD_READ_TIMED_OUT"
    TerminalErrorCode.CARD_REMOVED -> "CARD_REMOVED"
    TerminalErrorCode.CUSTOMER_CONSENT_REQUIRED -> "CUSTOMER_CONSENT_REQUIRED"
    TerminalErrorCode.CARD_LEFT_IN_READER -> "CARD_LEFT_IN_READER"
    TerminalErrorCode.USB_DISCOVERY_TIMED_OUT -> "USB_DISCOVERY_TIMED_OUT"
    TerminalErrorCode.FEATURE_NOT_ENABLED_ON_ACCOUNT -> "FEATURE_NOT_ENABLED_ON_ACCOUNT"

    // Reader / Hardware
    TerminalErrorCode.READER_BUSY -> "READER_BUSY"
    TerminalErrorCode.READER_COMMUNICATION_ERROR -> "READER_COMMUNICATION_ERROR"
    TerminalErrorCode.READER_TAMPERED -> "READER_TAMPERED"
    TerminalErrorCode.BLUETOOTH_ERROR -> "BLUETOOTH_ERROR"
    TerminalErrorCode.BLUETOOTH_DISCONNECTED -> "BLUETOOTH_DISCONNECTED"
    TerminalErrorCode.BLUETOOTH_RECONNECT_STARTED -> "BLUETOOTH_RECONNECT_STARTED"
    TerminalErrorCode.USB_DISCONNECTED -> "USB_DISCONNECTED"
    TerminalErrorCode.USB_RECONNECT_STARTED -> "USB_RECONNECT_STARTED"
    TerminalErrorCode.READER_CONNECTED_TO_ANOTHER_DEVICE -> "READER_CONNECTED_TO_ANOTHER_DEVICE"
    TerminalErrorCode.READER_BATTERY_CRITICALLY_LOW -> "READER_BATTERY_CRITICALLY_LOW"
    TerminalErrorCode.READER_SOFTWARE_UPDATE_FAILED -> "READER_SOFTWARE_UPDATE_FAILED"
    TerminalErrorCode.READER_SOFTWARE_UPDATE_FAILED_READER_ERROR -> "READER_SOFTWARE_UPDATE_FAILED_READER_ERROR"
    TerminalErrorCode.READER_SOFTWARE_UPDATE_FAILED_SERVER_ERROR -> "READER_SOFTWARE_UPDATE_FAILED_SERVER_ERROR"
    TerminalErrorCode.TAP_TO_PAY_NFC_DISABLED -> "TAP_TO_PAY_NFC_DISABLED"
    TerminalErrorCode.UNSUPPORTED_READER_VERSION -> "UNSUPPORTED_READER_VERSION"
    TerminalErrorCode.GENERIC_READER_ERROR -> "GENERIC_READER_ERROR"

    // Unexpected
    TerminalErrorCode.UNEXPECTED_SDK_ERROR -> "UNEXPECTED_SDK_ERROR"

    // Payment
    TerminalErrorCode.DECLINED_BY_STRIPE_API -> "DECLINED_BY_STRIPE_API"
    TerminalErrorCode.DECLINED_BY_READER -> "DECLINED_BY_READER"

    // Network
    TerminalErrorCode.REQUEST_TIMED_OUT -> "REQUEST_TIMED_OUT"
    TerminalErrorCode.STRIPE_API_CONNECTION_ERROR -> "STRIPE_API_CONNECTION_ERROR"
    TerminalErrorCode.STRIPE_API_ERROR -> "STRIPE_API_ERROR"
    TerminalErrorCode.STRIPE_API_RESPONSE_DECODING_ERROR -> "STRIPE_API_RESPONSE_DECODING_ERROR"
    TerminalErrorCode.CONNECTION_TOKEN_PROVIDER_ERROR -> "CONNECTION_TOKEN_PROVIDER_ERROR"
    TerminalErrorCode.SESSION_EXPIRED -> "SESSION_EXPIRED"
    TerminalErrorCode.ANDROID_API_LEVEL_ERROR -> "ANDROID_API_LEVEL_ERROR"

    // Offline / Account / Currency constraints
    TerminalErrorCode.AMOUNT_EXCEEDS_MAX_OFFLINE_AMOUNT -> "AMOUNT_EXCEEDS_MAX_OFFLINE_AMOUNT"
    TerminalErrorCode.OFFLINE_PAYMENTS_DATABASE_TOO_LARGE -> "OFFLINE_PAYMENTS_DATABASE_TOO_LARGE"
    TerminalErrorCode.READER_CONNECTION_NOT_AVAILABLE_OFFLINE -> "READER_CONNECTION_NOT_AVAILABLE_OFFLINE"
    TerminalErrorCode.LOCATION_CONNECTION_NOT_AVAILABLE_OFFLINE -> "LOCATION_CONNECTION_NOT_AVAILABLE_OFFLINE"
    TerminalErrorCode.NO_LAST_SEEN_ACCOUNT -> "NO_LAST_SEEN_ACCOUNT"
    TerminalErrorCode.INVALID_OFFLINE_CURRENCY -> "INVALID_OFFLINE_CURRENCY"
    TerminalErrorCode.CARD_SWIPE_NOT_AVAILABLE -> "CARD_SWIPE_NOT_AVAILABLE"
    TerminalErrorCode.INTERAC_NOT_SUPPORTED_OFFLINE -> "INTERAC_NOT_SUPPORTED_OFFLINE"
    TerminalErrorCode.ONLINE_PIN_NOT_SUPPORTED_OFFLINE -> "ONLINE_PIN_NOT_SUPPORTED_OFFLINE"
    TerminalErrorCode.MOBILE_WALLET_NOT_SUPPORTED_ON_SETUP_INTENTS -> "MOBILE_WALLET_NOT_SUPPORTED_ON_SETUP_INTENTS"
    TerminalErrorCode.OFFLINE_AND_CARD_EXPIRED -> "OFFLINE_AND_CARD_EXPIRED"
    TerminalErrorCode.OFFLINE_TRANSACTION_DECLINED -> "OFFLINE_TRANSACTION_DECLINED"
    TerminalErrorCode.OFFLINE_COLLECT_AND_CONFIRM_MISMATCH -> "OFFLINE_COLLECT_AND_CONFIRM_MISMATCH"
    TerminalErrorCode.OFFLINE_TESTMODE_PAYMENT_IN_LIVEMODE -> "OFFLINE_TESTMODE_PAYMENT_IN_LIVEMODE"
    TerminalErrorCode.OFFLINE_LIVEMODE_PAYMENT_IN_TESTMODE -> "OFFLINE_LIVEMODE_PAYMENT_IN_TESTMODE"
    TerminalErrorCode.OFFLINE_PAYMENT_INTENT_NOT_FOUND -> "OFFLINE_PAYMENT_INTENT_NOT_FOUND"
    TerminalErrorCode.MISSING_EMV_DATA -> "MISSING_EMV_DATA"
    TerminalErrorCode.CONNECTION_TOKEN_PROVIDER_ERROR_WHILE_FORWARDING -> "CONNECTION_TOKEN_PROVIDER_ERROR_WHILE_FORWARDING"
    TerminalErrorCode.ACCOUNT_ID_MISMATCH_WHILE_FORWARDING -> "ACCOUNT_ID_MISMATCH_WHILE_FORWARDING"
    TerminalErrorCode.FORCE_OFFLINE_WITH_FEATURE_DISABLED -> "FORCE_OFFLINE_WITH_FEATURE_DISABLED"
    TerminalErrorCode.NOT_CONNECTED_TO_INTERNET_AND_REQUIRE_ONLINE_SET -> "NOT_CONNECTED_TO_INTERNET_AND_REQUIRE_ONLINE_SET"
    TerminalErrorCode.TEST_CARD_IN_LIVEMODE -> "TEST_CARD_IN_LIVEMODE"

    // Collect Inputs
    TerminalErrorCode.COLLECT_INPUTS_APPLICATION_ERROR -> "COLLECT_INPUTS_APPLICATION_ERROR"
    TerminalErrorCode.COLLECT_INPUTS_TIMED_OUT -> "COLLECT_INPUTS_TIMED_OUT"
    TerminalErrorCode.COLLECT_INPUTS_INVALID_PARAMETER -> "COLLECT_INPUTS_INVALID_PARAMETER"
    TerminalErrorCode.COLLECT_INPUTS_UNSUPPORTED -> "COLLECT_INPUTS_UNSUPPORTED"

    // Reader settings / security / surcharge
    TerminalErrorCode.READER_SETTINGS_ERROR -> "READER_SETTINGS_ERROR"
    TerminalErrorCode.READER_MISSING_ENCRYPTION_KEYS -> "READER_MISSING_ENCRYPTION_KEYS"
    TerminalErrorCode.INVALID_SURCHARGE_PARAMETER -> "INVALID_SURCHARGE_PARAMETER"
    TerminalErrorCode.READER_COMMUNICATION_SSL_ERROR -> "READER_COMMUNICATION_SSL_ERROR"
    TerminalErrorCode.ALLOW_REDISPLAY_INVALID -> "ALLOW_REDISPLAY_INVALID"
    TerminalErrorCode.CANCELED_DUE_TO_INTEGRATION_ERROR -> "CANCELED_DUE_TO_INTEGRATION_ERROR"

    // Printer
    TerminalErrorCode.PRINTER_BUSY -> "PRINTER_BUSY"
    TerminalErrorCode.PRINTER_PAPERJAM -> "PRINTER_PAPERJAM"
    TerminalErrorCode.PRINTER_OUT_OF_PAPER -> "PRINTER_OUT_OF_PAPER"
    TerminalErrorCode.PRINTER_COVER_OPEN -> "PRINTER_COVER_OPEN"
    TerminalErrorCode.PRINTER_ABSENT -> "PRINTER_ABSENT"
    TerminalErrorCode.PRINTER_UNAVAILABLE -> "PRINTER_UNAVAILABLE"
    TerminalErrorCode.PRINTER_ERROR -> "PRINTER_ERROR"
}
