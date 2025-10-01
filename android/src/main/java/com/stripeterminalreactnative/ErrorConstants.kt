package com.stripeterminalreactnative

/**
 * Constants used for error object structure and keys.
 * These constants ensure consistency between error creation and testing.
 */
internal object ErrorConstants {

    // Error object keys
    const val ERROR_KEY = "error"
    const val PAYMENT_INTENT_KEY = "paymentIntent"

    // Error property keys
    const val NAME_KEY = "name"
    const val MESSAGE_KEY = "message"
    const val CODE_KEY = "code"
    const val NATIVE_ERROR_CODE_KEY = "nativeErrorCode"
    const val METADATA_KEY = "metadata"

    // Error name values
    const val STRIPE_ERROR_NAME = "StripeError"
    const val NON_STRIPE_ERROR_NAME = "NonStripeError"

    // Metadata keys
    const val API_ERROR_KEY = "apiError"
    const val UNDERLYING_ERROR_KEY = "underlyingError"
    const val EXCEPTION_CLASS_KEY = "exceptionClass"

    // ApiError keys
    const val API_ERROR_CODE_KEY = "code"
    const val API_ERROR_MESSAGE_KEY = "message"
    const val API_ERROR_DECLINE_CODE_KEY = "declineCode"

    // UnderlyingError keys
    const val UNDERLYING_ERROR_CODE_KEY = "code"
    const val UNDERLYING_ERROR_MESSAGE_KEY = "message"

    // Default messages
    const val UNKNOWN_ERROR_MESSAGE = "Unknown error"
    const val UNKNOWN_CAUSE_MESSAGE = "Unknown cause"
}
