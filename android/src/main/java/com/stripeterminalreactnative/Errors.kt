package com.stripeterminalreactnative

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.stripe.stripeterminal.external.api.ApiError
import com.stripe.stripeterminal.external.models.TerminalErrorCode
import com.stripe.stripeterminal.external.models.TerminalException

/**
 * Creates an error response from a throwable
 *
 * @param throwable The throwable to convert to an error response
 * @return ReadableMap containing the error structure
 */
internal fun createError(throwable: Throwable): ReadableMap = nativeMapOf { putError(throwable) }

/**
 * Creates an error response from a throwable with a UUID
 *
 * @param throwable The throwable to convert to an error response
 * @param uuid The UUID to associate with response objects (PaymentIntent, SetupIntent)
 * @return ReadableMap containing the error structure
 */
internal fun createError(throwable: Throwable, uuid: String): ReadableMap = nativeMapOf { putError(throwable, uuid) }

/**
 * Populates this WritableMap with error structure
 *
 * Adds both the error object and any associated response objects (PaymentIntent, SetupIntent)
 * to the root level of the response.
 *
 * @param throwable The throwable to convert to an error
 * @param uuid Optional UUID to associate with response objects
 * @return This WritableMap for chaining
 */
internal fun WritableMap.putError(throwable: Throwable, uuid: String? = null): ReadableMap = apply {
    putMap(
        ErrorConstants.ERROR_KEY,
        nativeMapOf {
            putErrorContents(throwable)
        }
    )

    addResponseObjects(throwable, uuid)
}

/**
 * Adds error contents (name, message, code, apiError, underlyingError, metadata) to the error object
 *
 * Routes to the appropriate handler based on whether the throwable is a TerminalException or not.
 *
 * @param throwable The throwable to convert
 */
private fun WritableMap.putErrorContents(throwable: Throwable?) {
    when (throwable) {
        is TerminalException -> putStripeErrorContents(throwable)
        else -> putNonStripeErrorContents(throwable)
    }
}

/**
 * Populates StripeError contents from TerminalException
 *
 * Extracts name, message, code, and other fields from a TerminalException and
 * adds them to this WritableMap.
 *
 * @param exception The TerminalException to extract error information from
 */
private fun WritableMap.putStripeErrorContents(exception: TerminalException) {
    putString(ErrorConstants.NAME_KEY, ErrorConstants.STRIPE_ERROR_NAME)
    putString(ErrorConstants.MESSAGE_KEY, exception.errorMessage)
    putString(ErrorConstants.CODE_KEY, exception.errorCode.convertToReactNativeErrorCode())
    putString(ErrorConstants.NATIVE_ERROR_CODE_KEY, exception.errorCode.toString())

    addTopLevelApiError(exception.apiError)
    addTopLevelUnderlyingError(exception.cause)
    addPlatformMetadata()
}

/**
 * Populates NonStripeError contents from generic Throwable
 *
 * Handles non-TerminalException throwables by creating a generic error structure
 * with UNEXPECTED_SDK_ERROR code.
 *
 * @param throwable The generic throwable to extract error information from
 */
private fun WritableMap.putNonStripeErrorContents(throwable: Throwable?) {
    putString(ErrorConstants.NAME_KEY, ErrorConstants.NON_STRIPE_ERROR_NAME)
    putString(ErrorConstants.MESSAGE_KEY, throwable?.message ?: ErrorConstants.UNKNOWN_ERROR_MESSAGE)
    putString(ErrorConstants.CODE_KEY, TerminalErrorCode.UNEXPECTED_SDK_ERROR.convertToReactNativeErrorCode())
    putString(ErrorConstants.NATIVE_ERROR_CODE_KEY, TerminalErrorCode.UNEXPECTED_SDK_ERROR.toString())

    addTopLevelUnderlyingError(throwable?.cause)
    addPlatformMetadata()
}

/**
 * Adds response objects that may accompany an error (paymentIntent, setupIntent, refund)
 *
 * These objects are placed at the top-level alongside the error object.
 * They represent the state of resources even when the operation fails (partial success).
 *
 * Example: A payment may be declined (error), but the PaymentIntent was still created
 * and needs to be returned so the caller can retry or cancel it.
 *
 * Note: Android TerminalException does not have a refund property yet.
 * Future: refund will be added to TerminalException in upcoming SDK versions.
 *
 * @param throwable The throwable that may contain response objects
 * @param uuid Optional UUID to associate with response objects
 */
private fun WritableMap.addResponseObjects(throwable: Throwable, uuid: String?) {
    if (throwable is TerminalException) {
        throwable.paymentIntent?.let {
            putMap(ErrorConstants.PAYMENT_INTENT_KEY, mapFromPaymentIntent(it, uuid ?: ""))
        }
        throwable.setupIntent?.let {
            putMap(ErrorConstants.SETUP_INTENT_KEY, mapFromSetupIntent(it, uuid ?: ""))
        }
        // TODO: Add refund support when available in Android Terminal SDK
        // throwable.refund?.let {
        //     putMap(ErrorConstants.REFUND_KEY, mapFromRefund(it))
        // }
    }
}

/**
 * Adds ApiError information to top-level of error object
 *
 * Maps Android's ApiError to the unified apiError structure.
 *
 * Field handling (matching iOS behavior and TypeScript contract):
 * - code: Required field, fallback to "unknown_api_error_code" if null
 * - message: Required field (non-null String in SDK)
 * - declineCode: Required field, fallback to empty string if null
 * - type, charge, docUrl, param: Optional fields, omitted if null
 *
 * @param apiError The ApiError from TerminalException, or null if not available
 */
private fun WritableMap.addTopLevelApiError(apiError: ApiError?) {
    apiError?.let { apiErr ->
        putMap(
            ErrorConstants.API_ERROR_KEY,
            nativeMapOf {
                putString(ErrorConstants.API_ERROR_CODE_KEY, apiErr.code ?: ErrorConstants.API_ERROR_UNKNOWN_CODE)
                putString(ErrorConstants.API_ERROR_MESSAGE_KEY, apiErr.message)
                putString(ErrorConstants.API_ERROR_DECLINE_CODE_KEY, apiErr.declineCode ?: ErrorConstants.API_ERROR_REQUIRED_FIELD_EMPTY)
                apiErr.type?.let { putString(ErrorConstants.API_ERROR_TYPE_KEY, it.toString()) }
                apiErr.charge?.let { putString(ErrorConstants.API_ERROR_CHARGE_KEY, it) }
                apiErr.docUrl?.let { putString(ErrorConstants.API_ERROR_DOC_URL_KEY, it) }
                apiErr.param?.let { putString(ErrorConstants.API_ERROR_PARAM_KEY, it) }
            }
        )
    }
}

/**
 * Adds underlying error information to top-level of error object
 *
 * Maps Android's exception cause to the unified underlyingError structure.
 *
 * @param cause The cause of the exception, or null if not available
 */
private fun WritableMap.addTopLevelUnderlyingError(cause: Throwable?) {
    cause?.let { c ->
        putMap(
            ErrorConstants.UNDERLYING_ERROR_KEY,
            nativeMapOf {
                putString(ErrorConstants.UNDERLYING_ERROR_CODE_KEY, c.javaClass.simpleName)
                putString(ErrorConstants.UNDERLYING_ERROR_MESSAGE_KEY, c.message ?: ErrorConstants.UNKNOWN_CAUSE_MESSAGE)
            }
        )
    }
}

/**
 * Adds platform-specific metadata fields to the error object
 *
 * Android: Currently empty - no platform-specific fields are extracted from TerminalException.
 * iOS: Extracts fields like deviceBannedUntilDate, httpStatusCode, etc. from NSError.userInfo.
 */
private fun WritableMap.addPlatformMetadata() {
    putMap(ErrorConstants.METADATA_KEY, nativeMapOf {})
}

/**
 * Requires a cancelable to be non-null, throwing TerminalException if null
 *
 * Used to validate that a cancelable operation exists before attempting to cancel it.
 *
 * @param T The type of the cancelable
 * @param cancelable The cancelable to validate
 * @param lazyMessage Lazy message provider for the exception
 * @return The non-null cancelable
 * @throws TerminalException with CANCEL_FAILED code if cancelable is null
 */
@Throws(TerminalException::class)
internal fun <T> requireCancelable(cancelable: T?, lazyMessage: () -> String): T {
    return cancelable ?: throw TerminalException(
        TerminalErrorCode.CANCEL_FAILED,
        lazyMessage()
    )
}

/**
 * Throws TerminalException if command is not null (indicating SDK is busy)
 *
 * Used to check if an operation is already in progress before starting a new one.
 *
 * @param T The type of the command
 * @param command The current command being executed, or null if SDK is idle
 * @param lazyMessage Lazy message provider for the exception
 * @return Unit? Always returns null if successful
 * @throws TerminalException with READER_BUSY code if command is not null
 */
@Throws(TerminalException::class)
internal fun <T> throwIfBusy(command: T?, lazyMessage: () -> String): Unit? {
    return command?.run {
        throw TerminalException(
            TerminalErrorCode.READER_BUSY,
            lazyMessage()
        )
    }
}

/**
 * Requires a non-null parameter, throwing TerminalException if null
 *
 * Used to validate required parameters in SDK methods.
 *
 * @param T The type of the parameter
 * @param input The parameter to validate
 * @param lazyMessage Lazy message provider for the exception
 * @return The non-null parameter
 * @throws TerminalException with INVALID_REQUIRED_PARAMETER code if input is null
 */
@Throws(TerminalException::class)
internal fun <T> requireNonNullParameter(input: T?, lazyMessage: () -> String): T {
    return input ?: throw TerminalException(
        TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
        lazyMessage()
    )
}

/**
 * Executes a block and resolves promise with error if TerminalException is thrown
 *
 * Provides a convenient way to wrap SDK operations and automatically handle exceptions.
 *
 * @param promise The React Native promise to resolve with error if exception occurs
 * @param block The block to execute
 */
internal fun withExceptionResolver(promise: Promise, block: () -> Unit) {
    try {
        block()
    } catch (e: TerminalException) {
        promise.resolve(createError(e))
    }
}

/**
 * Executes a suspending block and resolves promise with error if TerminalException is thrown
 *
 * Provides a convenient way to wrap suspending SDK operations and automatically handle exceptions.
 *
 * @param promise The React Native promise to resolve with error if exception occurs
 * @param block The suspending block to execute
 */
internal suspend fun withSuspendExceptionResolver(promise: Promise, block: suspend () -> Unit) {
    try {
        block()
    } catch (e: TerminalException) {
        promise.resolve(createError(e))
    }
}

/**
 * Converts Android Terminal SDK TerminalErrorCode to React Native error code string
 *
 * This extension function maps Android-specific error codes to the unified React Native
 * error code strings that are consistent across both platforms (iOS and Android).
 *
 * Note: Exhaustive when expression - if new error codes are added to the Android SDK,
 * this function will fail to compile, ensuring all cases are explicitly handled.
 *
 * @receiver TerminalErrorCode from Android Terminal SDK
 * @return Unified React Native error code string
 */
fun TerminalErrorCode.convertToReactNativeErrorCode(): String = when (this) {
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
    TerminalErrorCode.INVALID_MOTO_CONFIGURATION -> "INVALID_MOTO_CONFIGURATION"
}
