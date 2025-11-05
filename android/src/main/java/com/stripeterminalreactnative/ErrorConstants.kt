package com.stripeterminalreactnative

/**
 * Constants used for error object structure and keys.
 * These constants ensure consistency between error creation and testing.
 */
internal object ErrorConstants {

    // Top-level error object keys
    const val ERROR_KEY = "error"
    const val PAYMENT_INTENT_KEY = "paymentIntent"
    const val SETUP_INTENT_KEY = "setupIntent"
    const val REFUND_KEY = "refund"
    const val API_ERROR_KEY = "apiError"
    const val UNDERLYING_ERROR_KEY = "underlyingError"
    const val METADATA_KEY = "metadata"

    // Error property keys
    const val NAME_KEY = "name"
    const val MESSAGE_KEY = "message"
    const val CODE_KEY = "code"
    const val NATIVE_ERROR_CODE_KEY = "nativeErrorCode"

    // Error name values
    const val STRIPE_ERROR_NAME = "StripeError"
    const val NON_STRIPE_ERROR_NAME = "NonStripeError"

    // ApiError keys
    const val API_ERROR_CODE_KEY = "code"
    const val API_ERROR_MESSAGE_KEY = "message"
    const val API_ERROR_DECLINE_CODE_KEY = "declineCode"
    const val API_ERROR_CHARGE_KEY = "charge"
    const val API_ERROR_DOC_URL_KEY = "docUrl"
    const val API_ERROR_PARAM_KEY = "param"
    const val API_ERROR_TYPE_KEY = "type"

    // UnderlyingError keys
    const val UNDERLYING_ERROR_CODE_KEY = "code"
    const val UNDERLYING_ERROR_MESSAGE_KEY = "message"

    // Default messages
    const val UNKNOWN_ERROR_MESSAGE = "Unknown error"
    const val UNKNOWN_CAUSE_MESSAGE = "Unknown cause"
    
    // Default values
    const val API_ERROR_REQUIRED_FIELD_EMPTY = ""
    const val API_ERROR_UNKNOWN_CODE = "unknown_api_error_code"
}
