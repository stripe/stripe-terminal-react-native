import StripeTerminal
import Foundation

class Errors {
    enum RNErrorCode: String {
        case CANCEL_FAILED = "CANCEL_FAILED"
        case NOT_CONNECTED_TO_READER = "NOT_CONNECTED_TO_READER"
        case ALREADY_CONNECTED_TO_READER = "ALREADY_CONNECTED_TO_READER"
        case BLUETOOTH_PERMISSION_DENIED = "BLUETOOTH_PERMISSION_DENIED"
        case CONFIRM_INVALID_PAYMENT_INTENT = "CONFIRM_INVALID_PAYMENT_INTENT"
        case CONFIRM_INVALID_SETUP_INTENT = "CONFIRM_INVALID_SETUP_INTENT"
        case INVALID_CLIENT_SECRET = "INVALID_CLIENT_SECRET"
        case UNSUPPORTED_OPERATION = "UNSUPPORTED_OPERATION"
        case UNEXPECTED_OPERATION = "UNEXPECTED_OPERATION"
        case UNSUPPORTED_SDK = "UNSUPPORTED_SDK"
        case MISSING_PREREQUISITE = "MISSING_PREREQUISITE"
        case MISSING_REQUIRED_PARAMETER = "MISSING_REQUIRED_PARAMETER"
        case INVALID_REQUIRED_PARAMETER = "INVALID_REQUIRED_PARAMETER"
        case INVALID_TIP_PARAMETER = "INVALID_TIP_PARAMETER"
        case INVALID_MOTO_CONFIGURATION = "INVALID_MOTO_CONFIGURATION"

        case CANCELED = "CANCELED"
        case LOCATION_SERVICES_DISABLED = "LOCATION_SERVICES_DISABLED"
        case BLUETOOTH_SCAN_TIMED_OUT = "BLUETOOTH_SCAN_TIMED_OUT"
        case BLUETOOTH_LOW_ENERGY_UNSUPPORTED = "BLUETOOTH_LOW_ENERGY_UNSUPPORTED"
        case READER_SOFTWARE_UPDATE_FAILED_BATTERY_LOW = "READER_SOFTWARE_UPDATE_FAILED_BATTERY_LOW"
        case READER_SOFTWARE_UPDATE_FAILED_INTERRUPTED = "READER_SOFTWARE_UPDATE_FAILED_INTERRUPTED"
        case CARD_INSERT_NOT_READ = "CARD_INSERT_NOT_READ"
        case CARD_SWIPE_NOT_READ = "CARD_SWIPE_NOT_READ"
        case CARD_READ_TIMED_OUT = "CARD_READ_TIMED_OUT"
        case CARD_REMOVED = "CARD_REMOVED"
        case CUSTOMER_CONSENT_REQUIRED = "CUSTOMER_CONSENT_REQUIRED"
        case CARD_LEFT_IN_READER = "CARD_LEFT_IN_READER"
        case USB_DISCOVERY_TIMED_OUT = "USB_DISCOVERY_TIMED_OUT"

        case READER_BUSY = "READER_BUSY"
        case READER_COMMUNICATION_ERROR = "READER_COMMUNICATION_ERROR"
        case BLUETOOTH_ERROR = "BLUETOOTH_ERROR"
        case BLUETOOTH_DISCONNECTED = "BLUETOOTH_DISCONNECTED"
        case BLUETOOTH_RECONNECT_STARTED = "BLUETOOTH_RECONNECT_STARTED"
        case USB_DISCONNECTED = "USB_DISCONNECTED"
        case READER_CONNECTED_TO_ANOTHER_DEVICE = "READER_CONNECTED_TO_ANOTHER_DEVICE"
        case READER_BATTERY_CRITICALLY_LOW = "READER_BATTERY_CRITICALLY_LOW"
        case READER_SOFTWARE_UPDATE_FAILED = "READER_SOFTWARE_UPDATE_FAILED"
        case READER_SOFTWARE_UPDATE_FAILED_READER_ERROR = "READER_SOFTWARE_UPDATE_FAILED_READER_ERROR"
        case READER_SOFTWARE_UPDATE_FAILED_SERVER_ERROR = "READER_SOFTWARE_UPDATE_FAILED_SERVER_ERROR"
        case TAP_TO_PAY_NFC_DISABLED = "TAP_TO_PAY_NFC_DISABLED"
        case UNSUPPORTED_READER_VERSION = "UNSUPPORTED_READER_VERSION"
        case GENERIC_READER_ERROR = "GENERIC_READER_ERROR"

        case UNEXPECTED_SDK_ERROR = "UNEXPECTED_SDK_ERROR"

        case DECLINED_BY_STRIPE_API = "DECLINED_BY_STRIPE_API"
        case DECLINED_BY_READER = "DECLINED_BY_READER"
        case MOBILE_WALLET_NOT_SUPPORTED_ON_SETUP_INTENTS = "MOBILE_WALLET_NOT_SUPPORTED_ON_SETUP_INTENTS"

        case REQUEST_TIMED_OUT = "REQUEST_TIMED_OUT"
        case STRIPE_API_CONNECTION_ERROR = "STRIPE_API_CONNECTION_ERROR"
        case STRIPE_API_ERROR = "STRIPE_API_ERROR"
        case STRIPE_API_RESPONSE_DECODING_ERROR = "STRIPE_API_RESPONSE_DECODING_ERROR"
        case CONNECTION_TOKEN_PROVIDER_ERROR = "CONNECTION_TOKEN_PROVIDER_ERROR"
        case CONNECTION_TOKEN_PROVIDER_ERROR_WHILE_FORWARDING = "CONNECTION_TOKEN_PROVIDER_ERROR_WHILE_FORWARDING"
        case SESSION_EXPIRED = "SESSION_EXPIRED"
        case ANDROID_API_LEVEL_ERROR = "ANDROID_API_LEVEL_ERROR"

        case AMOUNT_EXCEEDS_MAX_OFFLINE_AMOUNT = "AMOUNT_EXCEEDS_MAX_OFFLINE_AMOUNT"
        case OFFLINE_PAYMENTS_DATABASE_TOO_LARGE = "OFFLINE_PAYMENTS_DATABASE_TOO_LARGE"
        case READER_CONNECTION_NOT_AVAILABLE_OFFLINE = "READER_CONNECTION_NOT_AVAILABLE_OFFLINE"
        case LOCATION_CONNECTION_NOT_AVAILABLE_OFFLINE = "LOCATION_CONNECTION_NOT_AVAILABLE_OFFLINE"
        case NO_LAST_SEEN_ACCOUNT = "NO_LAST_SEEN_ACCOUNT"
        case INVALID_OFFLINE_CURRENCY = "INVALID_OFFLINE_CURRENCY"
        case CARD_SWIPE_NOT_AVAILABLE = "CARD_SWIPE_NOT_AVAILABLE"
        case INTERAC_NOT_SUPPORTED_OFFLINE = "INTERAC_NOT_SUPPORTED_OFFLINE"
        case ONLINE_PIN_NOT_SUPPORTED_OFFLINE = "ONLINE_PIN_NOT_SUPPORTED_OFFLINE"
        case OFFLINE_AND_CARD_EXPIRED = "OFFLINE_AND_CARD_EXPIRED"
        case OFFLINE_TRANSACTION_DECLINED = "OFFLINE_TRANSACTION_DECLINED"
        case OFFLINE_TESTMODE_PAYMENT_IN_LIVEMODE = "OFFLINE_TESTMODE_PAYMENT_IN_LIVEMODE"
        case OFFLINE_LIVEMODE_PAYMENT_IN_TESTMODE = "OFFLINE_LIVEMODE_PAYMENT_IN_TESTMODE"
        case OFFLINE_PAYMENT_INTENT_NOT_FOUND = "OFFLINE_PAYMENT_INTENT_NOT_FOUND"
        case OFFLINE_COLLECT_AND_CONFIRM_MISMATCH = "OFFLINE_COLLECT_AND_CONFIRM_MISMATCH"
        case NOT_CONNECTED_TO_INTERNET_AND_REQUIRE_ONLINE_SET = "NOT_CONNECTED_TO_INTERNET_AND_REQUIRE_ONLINE_SET"
        case MISSING_EMV_DATA = "MISSING_EMV_DATA"
        case ACCOUNT_ID_MISMATCH_WHILE_FORWARDING = "ACCOUNT_ID_MISMATCH_WHILE_FORWARDING"
        case FORCE_OFFLINE_WITH_FEATURE_DISABLED = "FORCE_OFFLINE_WITH_FEATURE_DISABLED"
        case OFFLINE_MODE_UNSUPPORTED_ANDROID_VERSION = "OFFLINE_MODE_UNSUPPORTED_ANDROID_VERSION"
        case TEST_CARD_IN_LIVEMODE = "TEST_CARD_IN_LIVEMODE"

        case COLLECT_INPUTS_APPLICATION_ERROR = "COLLECT_INPUTS_APPLICATION_ERROR"
        case COLLECT_INPUTS_TIMED_OUT = "COLLECT_INPUTS_TIMED_OUT"
        case COLLECT_INPUTS_INVALID_PARAMETER = "COLLECT_INPUTS_INVALID_PARAMETER"
        case COLLECT_INPUTS_UNSUPPORTED = "COLLECT_INPUTS_UNSUPPORTED"
        case ALLOW_REDISPLAY_INVALID = "ALLOW_REDISPLAY_INVALID"
        case INVALID_SURCHARGE_PARAMETER = "INVALID_SURCHARGE_PARAMETER"
        case READER_COMMUNICATION_SSL_ERROR = "READER_COMMUNICATION_SSL_ERROR"
        case READER_SETTINGS_ERROR = "READER_SETTINGS_ERROR"
        case FEATURE_NOT_ENABLED_ON_ACCOUNT = "FEATURE_NOT_ENABLED_ON_ACCOUNT"

        case TAP_TO_PAY_LIBRARY_NOT_INCLUDED = "TAP_TO_PAY_LIBRARY_NOT_INCLUDED"
        case TAP_TO_PAY_UNSUPPORTED_DEVICE = "TAP_TO_PAY_UNSUPPORTED_DEVICE"
        case TAP_TO_PAY_UNSUPPORTED_ANDROID_VERSION = "TAP_TO_PAY_UNSUPPORTED_ANDROID_VERSION"
        case TAP_TO_PAY_DEVICE_TAMPERED = "TAP_TO_PAY_DEVICE_TAMPERED"
        case TAP_TO_PAY_INSECURE_ENVIRONMENT = "TAP_TO_PAY_INSECURE_ENVIRONMENT"
        case TAP_TO_PAY_DEBUG_NOT_SUPPORTED = "TAP_TO_PAY_DEBUG_NOT_SUPPORTED"
        case TAP_TO_PAY_UNSUPPORTED_PROCESSOR = "TAP_TO_PAY_UNSUPPORTED_PROCESSOR"

        case PRINTER_BUSY = "PRINTER_BUSY"
        case PRINTER_PAPERJAM = "PRINTER_PAPERJAM"
        case PRINTER_OUT_OF_PAPER = "PRINTER_OUT_OF_PAPER"
        case PRINTER_COVER_OPEN = "PRINTER_COVER_OPEN"
        case PRINTER_ABSENT = "PRINTER_ABSENT"
        case PRINTER_UNAVAILABLE = "PRINTER_UNAVAILABLE"
        case PRINTER_ERROR = "PRINTER_ERROR"

        case READER_TAMPERED = "READER_TAMPERED"
        case READER_MISSING_ENCRYPTION_KEYS = "READER_MISSING_ENCRYPTION_KEYS"
        case OFFLINE_ENCRYPTION_KEYS_UNAVAILABLE = "OFFLINE_ENCRYPTION_KEYS_UNAVAILABLE"
        case USB_PERMISSION_DENIED = "USB_PERMISSION_DENIED"
        case USB_RECONNECT_STARTED = "USB_RECONNECT_STARTED"
        case CANCELED_DUE_TO_INTEGRATION_ERROR = "CANCELED_DUE_TO_INTEGRATION_ERROR"
    }
    
    // MARK: - Utilities

    /// Rejects a React Native promise with an error code and message.
    ///
    /// - Parameters:
    ///   - reject: The React Native promise reject block
    ///   - rnCode: The React Native error code
    ///   - message: The error message (uses code if empty)
    class func rejectPromise(_ reject: RCTPromiseRejectBlock, rnCode: String, message: String) {
        reject(rnCode, message.isEmpty ? rnCode : message, nil)
    }
    
    /// Validates that all required parameters are present in the provided dictionary.
    ///
    /// - Parameters:
    ///   - params: The dictionary containing parameters to validate
    ///   - requiredParams: Array of parameter names that must be present
    /// - Returns: A comma-separated string of missing parameter names, or `nil` if all are present
    class func validateRequiredParameters(params: NSDictionary, requiredParams: [String]) -> String? {
        let missing = requiredParams.filter { params.object(forKey: $0) == nil }
        return missing.isEmpty ? nil : missing.joined(separator: ", ")
    }

    /// Creates a busy error message indicating the SDK is already executing another command.
    ///
    /// - Parameters:
    ///   - command: The command that was attempted
    ///   - busyCommand: The command currently being executed
    /// - Returns: A formatted error message
    class func createBusyMessage(command: String, by busyCommand: String) -> String {
        return "Could not execute \(command) because the SDK is busy with another command: \(busyCommand)."
    }
    
    // MARK: - Internal: Error Object Building
    
    /// Creates a base error object dictionary with standard fields.
    ///
    /// - Parameters:
    ///   - name: The error name (defaults to "StripeError")
    ///   - code: The React Native error code
    ///   - nativeErrorCode: The native SDK error code
    ///   - message: The error message
    ///   - metadata: Platform-specific metadata
    /// - Returns: The error object dictionary
    private class func stripeErrorObject(
        name: String = "StripeError",
        code: String,
        nativeErrorCode: String,
        message: String,
        metadata: [String: Any]
    ) -> [String: Any] {
        return [
            ErrorConstants.nameKey: name,
            ErrorConstants.messageKey: message.isEmpty ? ErrorConstants.unknownErrorMessage : message,
            ErrorConstants.codeKey: code,
            ErrorConstants.nativeErrorCodeKey: nativeErrorCode,
            ErrorConstants.metadataKey: metadata
        ]
    }
    
    /// Wraps an error object in the standard error response structure.
    ///
    /// - Parameters:
    ///   - code: The React Native error code
    ///   - nativeErrorCode: The native SDK error code
    ///   - message: The error message
    /// - Returns: A dictionary with the error wrapped under the "error" key
    private class func createWrappedError(code: String, nativeErrorCode: String, message: String) -> [String: Any] {
        let error = stripeErrorObject(
            code: code,
            nativeErrorCode: nativeErrorCode,
            message: message,
            metadata: [:]
        )
        return [ErrorConstants.errorKey: error]
    }
    
    // MARK: - Error Creation
    
    /// Creates an error response from a Stripe Terminal SDK error code.
    ///
    /// - Parameters:
    ///   - code: The Stripe Terminal SDK error code
    ///   - message: The error message to include
    /// - Returns: A dictionary containing the wrapped error structure
    class func createErrorFromCode(code: ErrorCode.Code, message: String) -> [String: Any] {
        let rn = convertToReactNativeErrorCode(from: code)
        return createWrappedError(code: rn, nativeErrorCode: code.stringValue, message: message)
    }

    /// Creates an error response from a React Native error code enum.
    ///
    /// - Parameters:
    ///   - rnCode: The React Native error code enum value
    ///   - message: The error message to include
    /// - Returns: A dictionary containing the wrapped error structure
    class func createErrorFromRnCodeEnum(rnCode: RNErrorCode, message: String) -> [String: Any] {
        return createWrappedError(code: rnCode.rawValue, nativeErrorCode: rnCode.rawValue, message: message)
    }

    /// Creates an error response from an NSError instance.
    ///
    /// Converts an iOS NSError into the unified error structure used across the React Native bridge.
    /// Response objects (PaymentIntent, SetupIntent, Refund) are placed at the top level alongside the error.
    ///
    /// - Parameter nsError: The NSError to convert
    /// - Returns: A dictionary containing the wrapped error structure with response objects at top level
    class func createErrorFromNSError(nsError: NSError) -> [String: Any] {
        return createErrorFromNSError(nsError: nsError, uuid: nil)
    }
    
    /// Converts an iOS NSError into the unified error structure with UUID for response objects.
    ///
    /// This overload is used when the error may contain PaymentIntent, SetupIntent, or Refund
    /// that need to be tracked with a UUID for later retrieval (matching Android behavior).
    ///
    /// Response objects are placed at the top level alongside the error object:
    /// ```
    /// {
    ///   "error": {...},
    ///   "paymentIntent": {...},  // Optional, at top level
    ///   "setupIntent": {...},    // Optional, at top level
    ///   "refund": {...}          // Optional, at top level
    /// }
    /// ```
    ///
    /// - Parameters:
    ///   - nsError: The NSError to convert
    ///   - uuid: The UUID to associate with response objects (PaymentIntent, SetupIntent, Refund)
    /// - Returns: A dictionary containing the wrapped error structure with response objects at top level
    class func createErrorFromNSError(nsError: NSError, uuid: String?) -> [String: Any] {
        var result: [String: Any] = [ErrorConstants.errorKey: mapToStripeErrorObject(nsError: nsError)]
        
        addResponseObjectsToTopLevel(from: nsError, to: &result, uuid: uuid ?? "")
        
        return result
    }
    
    // MARK: - Error Mapping
    
    /// Maps an NSError to the unified StripeError object structure.
    ///
    /// Extracts error information, API error details, response objects, underlying error,
    /// and platform-specific metadata from the NSError.
    ///
    /// - Parameter nsError: The NSError to convert
    /// - Returns: A dictionary containing the complete StripeError structure (without top-level "error" key)
    class func mapToStripeErrorObject(nsError: NSError) -> [String: Any] {
        return mapToStripeErrorObject(nsError: nsError, uuid: nil)
    }
    
    /// Maps an NSError to the unified StripeError object structure with optional UUID for response objects.
    ///
    /// Returns only the error object itself (without PI/SI/Refund). Response objects should be added
    /// at the top level by the caller using addResponseObjectsToTopLevel().
    ///
    /// - Parameters:
    ///   - nsError: The NSError to convert
    ///   - uuid: Optional UUID (unused, kept for backwards compatibility)
    /// - Returns: A dictionary containing the complete StripeError structure (without top-level "error" key or response objects)
    class func mapToStripeErrorObject(nsError: NSError, uuid: String?) -> [String: Any] {
        let errorInfo = extractErrorInformation(from: nsError)
        
        var result = stripeErrorObject(
            name: errorInfo.errorName,
            code: errorInfo.code,
            nativeErrorCode: errorInfo.nativeErrorCode,
            message: nsError.localizedDescription,
            metadata: [:]
        )
        
        if errorInfo.isStripeError {
            extractApiErrorToTopLevel(from: nsError, to: &result)
        }
        
        extractUnderlyingErrorToTopLevel(from: nsError, to: &result)
        
        result[ErrorConstants.metadataKey] = addPlatformMetadata(from: nsError)
        
        return result
    }

    /// Internal structure containing extracted error information.
    private struct ErrorInformation {
        let isStripeError: Bool
        let code: String
        let nativeErrorCode: String
        let errorName: String
    }
    
    /// Extracts and classifies error information from an NSError.
    ///
    /// Determines if the error is from Stripe Terminal SDK and maps it to the appropriate
    /// React Native error code.
    ///
    /// - Parameter nsError: The NSError to extract information from
    /// - Returns: An ErrorInformation struct containing classified error details
    private class func extractErrorInformation(from nsError: NSError) -> ErrorInformation {
        let stripeDomain = ErrorConstants.stripeTerminalDomain
        let isStripeError = (nsError.domain == stripeDomain)
        
        let code: String
        let nativeErrorCode: String
        
        if isStripeError {
            let codeEnum = ErrorCode.Code(rawValue: nsError.code)
            if let ce = codeEnum {
                let rn = convertToReactNativeErrorCode(from: ce)
                code = rn
            } else {
                code = RNErrorCode.UNEXPECTED_SDK_ERROR.rawValue
            }
            nativeErrorCode = String(nsError.code)
        } else {
            let nonStripeErrorMapping = mapNonStripeError(nsError: nsError)
            code = nonStripeErrorMapping.code
            nativeErrorCode = nonStripeErrorMapping.nativeErrorCode
        }
        
        return ErrorInformation(
            isStripeError: isStripeError,
            code: code,
            nativeErrorCode: nativeErrorCode,
            errorName: isStripeError ? ErrorConstants.stripeErrorName : ErrorConstants.nonStripeErrorName
        )
    }
    
    /// Maps non-Stripe errors to the unified error structure.
    ///
    /// Handles errors that don't originate from the Stripe Terminal SDK by creating a generic
    /// error code and native error identifier.
    ///
    /// - Parameter nsError: The non-Stripe NSError to map
    /// - Returns: A tuple containing the React Native error code and formatted native error code
    private class func mapNonStripeError(nsError: NSError) -> (code: String, nativeErrorCode: String) {
        return (
            code: RNErrorCode.UNEXPECTED_SDK_ERROR.rawValue,
            nativeErrorCode: "\(nsError.domain):\(nsError.code)"
        )
    }
    
    /// Extracts API error information from NSError and adds it to the result dictionary.
    ///
    /// Maps iOS NSError data to the unified apiError structure.
    ///
    /// - Parameters:
    ///   - nsError: The NSError containing API error information
    ///   - result: The result dictionary to populate (modified in place)
    private class func extractApiErrorToTopLevel(from nsError: NSError, to result: inout [String: Any]) {
        guard hasApiErrorInformation(nsError) else {
            return
        }
        
        var apiError: [String: Any] = [:]
        
        addRequiredApiErrorFields(from: nsError, to: &apiError)
        addOptionalApiErrorFields(from: nsError, to: &apiError)
        
        result[ErrorConstants.apiErrorKey] = apiError
    }
    
    /// Checks if the NSError contains API-level error information.
    ///
    /// Matches Android's behavior: only add apiError when TerminalException.apiError != null.
    /// The presence of stripeAPIErrorCode in userInfo is the key indicator of API error information.
    ///
    /// - Parameter nsError: The NSError to check
    /// - Returns: true if API error information exists, false otherwise
    private class func hasApiErrorInformation(_ nsError: NSError) -> Bool {
        return nsError.userInfo[ErrorConstants.stripeAPIErrorCode] != nil
    }

    /// Adds required ApiError fields per TypeScript contract.
    ///
    /// These fields (code, message, declineCode) are non-optional in the TypeScript ApiErrorInformation interface
    /// and must always be present to maintain cross-platform consistency with Android.
    ///
    /// - Parameters:
    ///   - nsError: The NSError containing API error information
    ///   - apiError: The dictionary to add fields to (modified in place)
    private class func addRequiredApiErrorFields(from nsError: NSError, to apiError: inout [String: Any]) {
        apiError[ErrorConstants.apiErrorCodeKey] = nsError.userInfo[ErrorConstants.stripeAPIErrorCode] as? String ?? ErrorConstants.apiErrorUnknownCode
        
        if let failureReason = nsError.userInfo[ErrorConstants.stripeAPIFailureReason] as? String {
            apiError[ErrorConstants.apiErrorMessageKey] = failureReason
        } else {
            apiError[ErrorConstants.apiErrorMessageKey] = nsError.localizedDescription
        }
        
        apiError[ErrorConstants.apiErrorDeclineCodeKey] = nsError.userInfo[ErrorConstants.stripeAPIDeclineCode] as? String ?? ErrorConstants.apiErrorRequiredFieldEmpty
    }
    
    /// Adds optional ApiError fields from NSError userInfo.
    ///
    /// These fields (type, docUrl, param, charge) are optional in the TypeScript ApiErrorInformation interface
    /// and will only be present if available from the Stripe SDK.
    ///
    /// - Parameters:
    ///   - nsError: The NSError containing API error information
    ///   - apiError: The dictionary to add fields to (modified in place)
    private class func addOptionalApiErrorFields(from nsError: NSError, to apiError: inout [String: Any]) {
        apiError[ErrorConstants.apiErrorTypeKey] = nsError.userInfo[ErrorConstants.stripeAPIErrorType] as? String
        apiError[ErrorConstants.apiErrorDocUrlKey] = nsError.userInfo[ErrorConstants.stripeAPIDocUrl] as? String
        apiError[ErrorConstants.apiErrorParamKey] = nsError.userInfo[ErrorConstants.stripeAPIErrorParameter] as? String
        apiError[ErrorConstants.apiErrorChargeKey] = nsError.userInfo[ErrorConstants.stripeAPICharge] as? String
    }
    
    /// Adds response objects to the top level of the error response (matching Android structure).
    ///
    /// These objects are placed at the top-level alongside the error object.
    /// They represent the state of resources even when the operation fails (partial success).
    ///
    /// Example: A payment may be declined (error), but the PaymentIntent was still created
    /// and needs to be returned so the caller can retry or cancel it.
    ///
    /// - Parameters:
    ///   - nsError: The NSError that may contain response objects
    ///   - result: The top-level result dictionary (contains "error" key)
    ///   - uuid: The UUID to associate with response objects for tracking
    private class func addResponseObjectsToTopLevel(from nsError: NSError, to result: inout [String: Any], uuid: String) {
        if let confirmError = nsError as? ConfirmPaymentIntentError, let paymentIntent = confirmError.paymentIntent {
            result[ErrorConstants.paymentIntentKey] = Mappers.mapFromPaymentIntent(paymentIntent, uuid: uuid)
        } else if let confirmError = nsError as? ConfirmSetupIntentError, let setupIntent = confirmError.setupIntent {
            result[ErrorConstants.setupIntentKey] = Mappers.mapFromSetupIntent(setupIntent, uuid: uuid)
        } else if let confirmError = nsError as? ConfirmRefundError, let refund = confirmError.refund {
            result[ErrorConstants.refundKey] = Mappers.mapFromRefund(refund)
        }
    }
    
    /// Extracts underlying error information from NSError and adds it to the result dictionary.
    ///
    /// Maps iOS NSError underlying error + localized information to the unified underlyingError structure.
    /// Includes domain, code, message, failure reason, and recovery suggestion.
    ///
    /// - Parameters:
    ///   - nsError: The NSError containing underlying error information
    ///   - result: The result dictionary to populate (modified in place)
    private class func extractUnderlyingErrorToTopLevel(from nsError: NSError, to result: inout [String: Any]) {
        var underlyingError: [String: Any] = [:]
        
        if let underlying = nsError.userInfo[NSUnderlyingErrorKey] as? NSError {
            underlyingError[ErrorConstants.underlyingErrorCodeKey] = String(underlying.code)
            underlyingError[ErrorConstants.underlyingErrorMessageKey] = underlying.localizedDescription
            underlyingError[ErrorConstants.underlyingErrorIosDomainKey] = underlying.domain
        } else {
            underlyingError[ErrorConstants.underlyingErrorCodeKey] = String(nsError.code)
            underlyingError[ErrorConstants.underlyingErrorMessageKey] = nsError.localizedDescription
            underlyingError[ErrorConstants.underlyingErrorIosDomainKey] = nsError.domain
        }
        
        if let failure = nsError.localizedFailureReason, !failure.isEmpty {
            underlyingError[ErrorConstants.underlyingErrorIosLocalizedFailureReasonKey] = failure
        }
        if let suggestion = nsError.localizedRecoverySuggestion, !suggestion.isEmpty {
            underlyingError[ErrorConstants.underlyingErrorIosLocalizedRecoverySuggestionKey] = suggestion
        }
        
        result[ErrorConstants.underlyingErrorKey] = underlyingError
    }
    
    /// Adds platform-specific metadata fields extracted from NSError.userInfo.
    ///
    /// **Platform differences:**
    /// - **iOS:** Extracts fields like deviceBannedUntilDate, httpStatusCode, etc. from NSError.userInfo
    /// - **Android:** Currently returns empty metadata - no platform-specific fields are extracted
    ///
    /// - Parameter nsError: The NSError containing platform-specific information
    /// - Returns: A dictionary of platform-specific metadata fields
    private class func addPlatformMetadata(from nsError: NSError) -> [String: Any] {
        var metadata: [String: Any] = [:]
        
        metadata[ErrorConstants.deviceBannedUntilDateKey] = nsError.userInfo[ErrorConstants.deviceBannedUntilDate] as? String
        metadata[ErrorConstants.prepareFailedReasonKey] = nsError.userInfo[ErrorConstants.prepareFailedReason] as? String
        metadata[ErrorConstants.httpStatusCodeKey] = nsError.userInfo[ErrorConstants.httpStatusCode] as? Int
        metadata[ErrorConstants.readerMessageKey] = nsError.userInfo[ErrorConstants.readerMessage] as? String
        metadata[ErrorConstants.stripeAPIRequestIdKey] = nsError.userInfo[ErrorConstants.stripeAPIRequestId] as? String
        metadata[ErrorConstants.stripeAPIFailureReasonKey] = nsError.userInfo[ErrorConstants.stripeAPIFailureReason] as? String
        metadata[ErrorConstants.offlineDeclineReasonKey] = nsError.userInfo[ErrorConstants.offlineDeclineReason] as? String
        
        return metadata
    }

    /// Converts Stripe Terminal iOS ErrorCode to React Native error code string.
    ///
    /// This function maps iOS-specific error codes to the unified React Native error code strings
    /// that are consistent across both platforms (iOS and Android).
    ///
    /// - Note: No default case is used in the switch statement. This ensures that if new error codes
    ///         are added to the Stripe Terminal SDK, the code will fail to compile, forcing explicit
    ///         handling and preventing silent mapping failures.
    ///
    /// - Parameter code: The Stripe Terminal SDK error code
    /// - Returns: The unified React Native error code string
    private class func convertToReactNativeErrorCode(from code: ErrorCode.Code) -> String {
        switch code {
        case .canceled: return RNErrorCode.CANCELED.rawValue
        case .notConnectedToReader: return RNErrorCode.NOT_CONNECTED_TO_READER.rawValue
        case .alreadyConnectedToReader: return RNErrorCode.ALREADY_CONNECTED_TO_READER.rawValue
        case .bluetoothDisabled: return RNErrorCode.BLUETOOTH_PERMISSION_DENIED.rawValue
        case .bluetoothAccessDenied: return RNErrorCode.BLUETOOTH_PERMISSION_DENIED.rawValue
        case .bluetoothScanTimedOut: return RNErrorCode.BLUETOOTH_SCAN_TIMED_OUT.rawValue
        case .bluetoothLowEnergyUnsupported: return RNErrorCode.BLUETOOTH_LOW_ENERGY_UNSUPPORTED.rawValue
        case .locationServicesDisabled: return RNErrorCode.LOCATION_SERVICES_DISABLED.rawValue
        case .connectionTokenProviderCompletedWithNothing: return RNErrorCode.CONNECTION_TOKEN_PROVIDER_ERROR.rawValue
        case .connectionTokenProviderCompletedWithNothingWhileForwarding: return RNErrorCode.CONNECTION_TOKEN_PROVIDER_ERROR_WHILE_FORWARDING.rawValue
        case .connectionTokenProviderCompletedWithError: return RNErrorCode.CONNECTION_TOKEN_PROVIDER_ERROR.rawValue
        case .connectionTokenProviderCompletedWithErrorWhileForwarding: return RNErrorCode.CONNECTION_TOKEN_PROVIDER_ERROR_WHILE_FORWARDING.rawValue
        case .connectionTokenProviderTimedOut: return RNErrorCode.REQUEST_TIMED_OUT.rawValue
        case .confirmInvalidPaymentIntent: return RNErrorCode.CONFIRM_INVALID_PAYMENT_INTENT.rawValue
        case .invalidRefundParameters: return RNErrorCode.INVALID_REQUIRED_PARAMETER.rawValue
        case .cancelFailedAlreadyCompleted: return RNErrorCode.CANCEL_FAILED.rawValue
        case .invalidClientSecret: return RNErrorCode.INVALID_CLIENT_SECRET.rawValue
        case .invalidDiscoveryConfiguration: return RNErrorCode.MISSING_REQUIRED_PARAMETER.rawValue
        case .invalidReaderForUpdate: return RNErrorCode.READER_SOFTWARE_UPDATE_FAILED.rawValue
        case .unsupportedSDK: return RNErrorCode.UNSUPPORTED_SDK.rawValue
        case .incompatibleReader: return RNErrorCode.UNSUPPORTED_READER_VERSION.rawValue
        case .readerBusy: return RNErrorCode.READER_BUSY.rawValue
        case .readerCommunicationError: return RNErrorCode.READER_COMMUNICATION_ERROR.rawValue
        case .nfcDisabled: return RNErrorCode.TAP_TO_PAY_NFC_DISABLED.rawValue
        case .bluetoothError: return RNErrorCode.BLUETOOTH_ERROR.rawValue
        case .bluetoothDisconnected: return RNErrorCode.BLUETOOTH_DISCONNECTED.rawValue
        case .bluetoothPeerRemovedPairingInformation: return RNErrorCode.BLUETOOTH_ERROR.rawValue
        case .bluetoothAlreadyPairedWithAnotherDevice: return RNErrorCode.READER_CONNECTED_TO_ANOTHER_DEVICE.rawValue
        case .bluetoothConnectTimedOut: return RNErrorCode.REQUEST_TIMED_OUT.rawValue
        case .readerSoftwareUpdateFailed: return RNErrorCode.READER_SOFTWARE_UPDATE_FAILED.rawValue
        case .readerSoftwareUpdateFailedBatteryLow: return RNErrorCode.READER_SOFTWARE_UPDATE_FAILED_BATTERY_LOW.rawValue
        case .readerSoftwareUpdateFailedServerError: return RNErrorCode.READER_SOFTWARE_UPDATE_FAILED_SERVER_ERROR.rawValue
        case .readerSoftwareUpdateFailedReaderError: return RNErrorCode.READER_SOFTWARE_UPDATE_FAILED_READER_ERROR.rawValue
        case .readerSoftwareUpdateFailedInterrupted: return RNErrorCode.READER_SOFTWARE_UPDATE_FAILED_INTERRUPTED.rawValue
        case .readerSoftwareUpdateFailedExpiredUpdate: return RNErrorCode.READER_SOFTWARE_UPDATE_FAILED.rawValue
        case .bluetoothConnectionFailedBatteryCriticallyLow: return RNErrorCode.READER_BATTERY_CRITICALLY_LOW.rawValue
        case .unsupportedReaderVersion: return RNErrorCode.UNSUPPORTED_READER_VERSION.rawValue
        case .unknownReaderIpAddress: return RNErrorCode.GENERIC_READER_ERROR.rawValue
        case .internetConnectTimeOut: return RNErrorCode.REQUEST_TIMED_OUT.rawValue
        case .connectFailedReaderIsInUse: return RNErrorCode.READER_CONNECTED_TO_ANOTHER_DEVICE.rawValue
        case .unexpectedSdkError: return RNErrorCode.UNEXPECTED_SDK_ERROR.rawValue
        case .unexpectedReaderError: return RNErrorCode.GENERIC_READER_ERROR.rawValue
        case .encryptionKeyFailure: return RNErrorCode.READER_MISSING_ENCRYPTION_KEYS.rawValue
        case .encryptionKeyStillInitializing: return RNErrorCode.READER_MISSING_ENCRYPTION_KEYS.rawValue
        case .declinedByStripeAPI: return RNErrorCode.DECLINED_BY_STRIPE_API.rawValue
        case .declinedByReader: return RNErrorCode.DECLINED_BY_READER.rawValue
        case .refundFailed: return RNErrorCode.STRIPE_API_ERROR.rawValue
        case .cardInsertNotRead: return RNErrorCode.CARD_INSERT_NOT_READ.rawValue
        case .cardSwipeNotRead: return RNErrorCode.CARD_SWIPE_NOT_READ.rawValue
        case .cardReadTimedOut: return RNErrorCode.CARD_READ_TIMED_OUT.rawValue
        case .cardRemoved: return RNErrorCode.CARD_REMOVED.rawValue
        case .cardLeftInReader: return RNErrorCode.CARD_LEFT_IN_READER.rawValue
        case .commandNotAllowed: return RNErrorCode.UNSUPPORTED_OPERATION.rawValue
        case .unsupportedMobileDeviceConfiguration: return RNErrorCode.UNSUPPORTED_OPERATION.rawValue
        case .passcodeNotEnabled: return RNErrorCode.UNSUPPORTED_OPERATION.rawValue
        case .commandNotAllowedDuringCall: return RNErrorCode.UNSUPPORTED_OPERATION.rawValue
        case .invalidAmount: return RNErrorCode.INVALID_REQUIRED_PARAMETER.rawValue
        case .invalidCurrency: return RNErrorCode.INVALID_REQUIRED_PARAMETER.rawValue
        case .notConnectedToInternet: return RNErrorCode.STRIPE_API_CONNECTION_ERROR.rawValue
        case .requestTimedOut: return RNErrorCode.REQUEST_TIMED_OUT.rawValue
        case .stripeAPIError: return RNErrorCode.STRIPE_API_ERROR.rawValue
        case .stripeAPIResponseDecodingError: return RNErrorCode.STRIPE_API_RESPONSE_DECODING_ERROR.rawValue
        case .internalNetworkError: return RNErrorCode.STRIPE_API_CONNECTION_ERROR.rawValue
        case .sessionExpired: return RNErrorCode.SESSION_EXPIRED.rawValue
        case .featureNotAvailableWithConnectedReader: return RNErrorCode.UNSUPPORTED_OPERATION.rawValue
        case .featureNotAvailable: return RNErrorCode.UNSUPPORTED_OPERATION.rawValue
        case .commandRequiresCardholderConsent: return RNErrorCode.CUSTOMER_CONSENT_REQUIRED.rawValue
        case .invalidListLocationsLimitParameter: return RNErrorCode.INVALID_REQUIRED_PARAMETER.rawValue
        case .bluetoothConnectionInvalidLocationIdParameter: return RNErrorCode.INVALID_REQUIRED_PARAMETER.rawValue
        case .invalidRequiredParameter: return RNErrorCode.INVALID_REQUIRED_PARAMETER.rawValue
        case .invalidRequiredParameterOnBehalfOf: return RNErrorCode.INVALID_REQUIRED_PARAMETER.rawValue
        case .cardSwipeNotAvailable: return RNErrorCode.CARD_SWIPE_NOT_AVAILABLE.rawValue
        case .offlineAndCardExpired: return RNErrorCode.OFFLINE_AND_CARD_EXPIRED.rawValue
        case .offlineTransactionDeclined: return RNErrorCode.OFFLINE_TRANSACTION_DECLINED.rawValue
        case .interacNotSupportedOffline: return RNErrorCode.INTERAC_NOT_SUPPORTED_OFFLINE.rawValue
        case .onlinePinNotSupportedOffline: return RNErrorCode.ONLINE_PIN_NOT_SUPPORTED_OFFLINE.rawValue
        case .offlineTestCardInLivemode: return RNErrorCode.OFFLINE_TESTMODE_PAYMENT_IN_LIVEMODE.rawValue
        case .offlinePaymentsDatabaseTooLarge: return RNErrorCode.OFFLINE_PAYMENTS_DATABASE_TOO_LARGE.rawValue
        case .readerConnectionNotAvailableOffline: return RNErrorCode.READER_CONNECTION_NOT_AVAILABLE_OFFLINE.rawValue
        case .offlineCollectAndConfirmMismatch: return RNErrorCode.OFFLINE_COLLECT_AND_CONFIRM_MISMATCH.rawValue
        case .readerConnectionOfflineLocationMismatch: return RNErrorCode.LOCATION_CONNECTION_NOT_AVAILABLE_OFFLINE.rawValue
        case .readerConnectionOfflineNeedsUpdate: return RNErrorCode.UNSUPPORTED_READER_VERSION.rawValue
        case .readerConnectionOfflinePairingUnseenDisabled: return RNErrorCode.MISSING_PREREQUISITE.rawValue
        case .noLastSeenAccount: return RNErrorCode.NO_LAST_SEEN_ACCOUNT.rawValue
        case .notConnectedToInternetAndOfflineBehaviorRequireOnline: return RNErrorCode.NOT_CONNECTED_TO_INTERNET_AND_REQUIRE_ONLINE_SET.rawValue
        case .amountExceedsMaxOfflineAmount: return RNErrorCode.AMOUNT_EXCEEDS_MAX_OFFLINE_AMOUNT.rawValue
        case .missingEMVData: return RNErrorCode.MISSING_EMV_DATA.rawValue
        case .invalidOfflineCurrency: return RNErrorCode.INVALID_OFFLINE_CURRENCY.rawValue
        case .accountIdMismatchWhileForwarding: return RNErrorCode.ACCOUNT_ID_MISMATCH_WHILE_FORWARDING.rawValue
        case .updatePaymentIntentUnavailableWhileOffline: return RNErrorCode.UNEXPECTED_OPERATION.rawValue
        case .updatePaymentIntentUnavailableWhileOfflineModeEnabled: return RNErrorCode.UNEXPECTED_OPERATION.rawValue
        case .forwardingLiveModePaymentInTestMode: return RNErrorCode.OFFLINE_LIVEMODE_PAYMENT_IN_TESTMODE.rawValue
        case .forwardingTestModePaymentInLiveMode: return RNErrorCode.OFFLINE_TESTMODE_PAYMENT_IN_LIVEMODE.rawValue
        case .readerConnectionConfigurationInvalid: return RNErrorCode.MISSING_REQUIRED_PARAMETER.rawValue
        case .readerTippingParameterInvalid: return RNErrorCode.INVALID_TIP_PARAMETER.rawValue
        case .surchargeNoticeRequiresUpdatePaymentIntent: return RNErrorCode.ALLOW_REDISPLAY_INVALID.rawValue
        case .surchargeUnavailableWithDynamicCurrencyConversion: return RNErrorCode.UNEXPECTED_OPERATION.rawValue
        case .invalidLocationIdParameter: return RNErrorCode.MISSING_REQUIRED_PARAMETER.rawValue
        case .bluetoothReconnectStarted: return RNErrorCode.BLUETOOTH_RECONNECT_STARTED.rawValue
        case .readerNotAccessibleInBackground: return RNErrorCode.UNSUPPORTED_OPERATION.rawValue
        case .offlineBehaviorForceOfflineWithFeatureDisabled: return RNErrorCode.FORCE_OFFLINE_WITH_FEATURE_DISABLED.rawValue
        case .collectInputsApplicationError: return RNErrorCode.COLLECT_INPUTS_APPLICATION_ERROR.rawValue
        case .collectInputsTimedOut: return RNErrorCode.COLLECT_INPUTS_TIMED_OUT.rawValue
        case .collectInputsInvalidParameter: return RNErrorCode.COLLECT_INPUTS_INVALID_PARAMETER.rawValue
        case .collectInputsUnsupported: return RNErrorCode.COLLECT_INPUTS_UNSUPPORTED.rawValue
        case .readerMissingEncryptionKeys: return RNErrorCode.READER_MISSING_ENCRYPTION_KEYS.rawValue
        case .offlineEncryptionKeysUnavailable: return RNErrorCode.OFFLINE_ENCRYPTION_KEYS_UNAVAILABLE.rawValue
        case .requestDynamicCurrencyConversionRequiresUpdatePaymentIntent: return RNErrorCode.UNEXPECTED_OPERATION.rawValue
        case .dynamicCurrencyConversionNotAvailable: return RNErrorCode.UNEXPECTED_OPERATION.rawValue
        case .surchargingNotAvailable: return RNErrorCode.UNEXPECTED_OPERATION.rawValue
        case .usbDiscoveryTimedOut: return RNErrorCode.USB_DISCOVERY_TIMED_OUT.rawValue
        case .usbDisconnected: return RNErrorCode.USB_DISCONNECTED.rawValue
        
        case .cancelFailedUnavailable: return RNErrorCode.CANCEL_FAILED.rawValue
        case .nilPaymentIntent: return RNErrorCode.INVALID_REQUIRED_PARAMETER.rawValue
        case .nilSetupIntent: return RNErrorCode.INVALID_REQUIRED_PARAMETER.rawValue
        case .nilRefundPaymentMethod: return RNErrorCode.INVALID_REQUIRED_PARAMETER.rawValue
        case .invalidConnectionConfiguration: return RNErrorCode.INVALID_REQUIRED_PARAMETER.rawValue
        case .surchargeConsentRequiresAmountSurcharge: return RNErrorCode.INVALID_REQUIRED_PARAMETER.rawValue
        case .surchargeConsentNoticeRequiresAmountSurchargeAndCollectConsent: return RNErrorCode.INVALID_REQUIRED_PARAMETER.rawValue
        case .surchargeConsentRequestedForUnsupportedReader: return RNErrorCode.UNSUPPORTED_OPERATION.rawValue
        case .surchargeConsentDeclined: return RNErrorCode.DECLINED_BY_STRIPE_API.rawValue
        case .surchargeConsentTimeout: return RNErrorCode.REQUEST_TIMED_OUT.rawValue
        case .canceledDueToIntegrationError: return RNErrorCode.CANCELED_DUE_TO_INTEGRATION_ERROR.rawValue
        case .tapToPayReaderTOSAcceptanceRequiresiCloudSignIn: return RNErrorCode.READER_SOFTWARE_UPDATE_FAILED.rawValue
        case .tapToPayReaderTOSAcceptanceCanceled: return RNErrorCode.CANCELED.rawValue
        case .tapToPayReaderFailedToPrepare: return RNErrorCode.READER_SOFTWARE_UPDATE_FAILED.rawValue
        case .tapToPayReaderDeviceBanned: return RNErrorCode.UNSUPPORTED_READER_VERSION.rawValue
        case .tapToPayReaderTOSNotYetAccepted: return RNErrorCode.READER_SOFTWARE_UPDATE_FAILED.rawValue
        case .tapToPayReaderTOSAcceptanceFailed: return RNErrorCode.READER_SOFTWARE_UPDATE_FAILED.rawValue
        case .tapToPayReaderMerchantBlocked: return RNErrorCode.DECLINED_BY_STRIPE_API.rawValue
        case .tapToPayReaderInvalidMerchant: return RNErrorCode.INVALID_REQUIRED_PARAMETER.rawValue
        case .tapToPayReaderAccountDeactivated: return RNErrorCode.DECLINED_BY_STRIPE_API.rawValue
        case .printerBusy: return RNErrorCode.PRINTER_BUSY.rawValue
        case .printerPaperJam: return RNErrorCode.PRINTER_PAPERJAM.rawValue
        case .printerOutOfPaper: return RNErrorCode.PRINTER_OUT_OF_PAPER.rawValue
        case .printerCoverOpen: return RNErrorCode.PRINTER_COVER_OPEN.rawValue
        case .printerAbsent: return RNErrorCode.PRINTER_ABSENT.rawValue
        case .printerUnavailable: return RNErrorCode.PRINTER_UNAVAILABLE.rawValue
        case .printerError: return RNErrorCode.PRINTER_ERROR.rawValue
        case .readerConnectedToAnotherDevice: return RNErrorCode.READER_CONNECTED_TO_ANOTHER_DEVICE.rawValue
        case .readerTampered: return RNErrorCode.READER_TAMPERED.rawValue
        case .genericReaderError: return RNErrorCode.GENERIC_READER_ERROR.rawValue
        case .collectDataApplicationError: return RNErrorCode.COLLECT_INPUTS_APPLICATION_ERROR.rawValue
        case .displaySurchargeConsentApplicationError: return RNErrorCode.COLLECT_INPUTS_APPLICATION_ERROR.rawValue
        case .commandInvalidAllowRedisplay: return RNErrorCode.ALLOW_REDISPLAY_INVALID.rawValue
        case .tapToPayInternalNetworkError: return RNErrorCode.STRIPE_API_CONNECTION_ERROR.rawValue

        
        // NOTE: No default case - this ensures that any new ErrorCode cases 
        // added to the Stripe Terminal SDK will cause a COMPILER ERROR,
        // forcing us to explicitly handle new cases and preventing silent mapping failures.
        }
    }
}

/// Extension providing string value conversion for ErrorCode.Code.
extension ErrorCode.Code {
    /// Returns the string representation of the error code using Stripe Terminal SDK.
    var stringValue: String {
        return Terminal.stringFromError(self)
    }
}
