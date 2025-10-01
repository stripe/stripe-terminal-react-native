import StripeTerminal
import Foundation

class Errors {
    enum RNErrorCode: String {
        // Integration-like
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

        // User-like
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

        // Reader / Hardware
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

        // Unexpected
        case UNEXPECTED_SDK_ERROR = "UNEXPECTED_SDK_ERROR"

        // Payment
        case DECLINED_BY_STRIPE_API = "DECLINED_BY_STRIPE_API"
        case DECLINED_BY_READER = "DECLINED_BY_READER"
        case MOBILE_WALLET_NOT_SUPPORTED_ON_SETUP_INTENTS = "MOBILE_WALLET_NOT_SUPPORTED_ON_SETUP_INTENTS"

        // Network
        case REQUEST_TIMED_OUT = "REQUEST_TIMED_OUT"
        case STRIPE_API_CONNECTION_ERROR = "STRIPE_API_CONNECTION_ERROR"
        case STRIPE_API_ERROR = "STRIPE_API_ERROR"
        case STRIPE_API_RESPONSE_DECODING_ERROR = "STRIPE_API_RESPONSE_DECODING_ERROR"
        case CONNECTION_TOKEN_PROVIDER_ERROR = "CONNECTION_TOKEN_PROVIDER_ERROR"
        case CONNECTION_TOKEN_PROVIDER_ERROR_WHILE_FORWARDING = "CONNECTION_TOKEN_PROVIDER_ERROR_WHILE_FORWARDING"
        case SESSION_EXPIRED = "SESSION_EXPIRED"
        case ANDROID_API_LEVEL_ERROR = "ANDROID_API_LEVEL_ERROR"

        // Offline / Account / Currency constraints
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

        // Collect Inputs / surcharge / DCC
        case COLLECT_INPUTS_APPLICATION_ERROR = "COLLECT_INPUTS_APPLICATION_ERROR"
        case COLLECT_INPUTS_TIMED_OUT = "COLLECT_INPUTS_TIMED_OUT"
        case COLLECT_INPUTS_INVALID_PARAMETER = "COLLECT_INPUTS_INVALID_PARAMETER"
        case COLLECT_INPUTS_UNSUPPORTED = "COLLECT_INPUTS_UNSUPPORTED"
        case ALLOW_REDISPLAY_INVALID = "ALLOW_REDISPLAY_INVALID"
        case INVALID_SURCHARGE_PARAMETER = "INVALID_SURCHARGE_PARAMETER"
        case READER_COMMUNICATION_SSL_ERROR = "READER_COMMUNICATION_SSL_ERROR"
        case READER_SETTINGS_ERROR = "READER_SETTINGS_ERROR"
        case FEATURE_NOT_ENABLED_ON_ACCOUNT = "FEATURE_NOT_ENABLED_ON_ACCOUNT"

        // Tap to Pay
        case TAP_TO_PAY_LIBRARY_NOT_INCLUDED = "TAP_TO_PAY_LIBRARY_NOT_INCLUDED"
        case TAP_TO_PAY_UNSUPPORTED_DEVICE = "TAP_TO_PAY_UNSUPPORTED_DEVICE"
        case TAP_TO_PAY_UNSUPPORTED_ANDROID_VERSION = "TAP_TO_PAY_UNSUPPORTED_ANDROID_VERSION"
        case TAP_TO_PAY_DEVICE_TAMPERED = "TAP_TO_PAY_DEVICE_TAMPERED"
        case TAP_TO_PAY_INSECURE_ENVIRONMENT = "TAP_TO_PAY_INSECURE_ENVIRONMENT"
        case TAP_TO_PAY_DEBUG_NOT_SUPPORTED = "TAP_TO_PAY_DEBUG_NOT_SUPPORTED"
        case TAP_TO_PAY_UNSUPPORTED_PROCESSOR = "TAP_TO_PAY_UNSUPPORTED_PROCESSOR"

        // Printer
        case PRINTER_BUSY = "PRINTER_BUSY"
        case PRINTER_PAPERJAM = "PRINTER_PAPERJAM"
        case PRINTER_OUT_OF_PAPER = "PRINTER_OUT_OF_PAPER"
        case PRINTER_COVER_OPEN = "PRINTER_COVER_OPEN"
        case PRINTER_ABSENT = "PRINTER_ABSENT"
        case PRINTER_UNAVAILABLE = "PRINTER_UNAVAILABLE"
        case PRINTER_ERROR = "PRINTER_ERROR"

        // Misc / Fallback
        case READER_TAMPERED = "READER_TAMPERED"
        case READER_MISSING_ENCRYPTION_KEYS = "READER_MISSING_ENCRYPTION_KEYS"
        case USB_PERMISSION_DENIED = "USB_PERMISSION_DENIED"
        case USB_RECONNECT_STARTED = "USB_RECONNECT_STARTED"
        case CANCELED_DUE_TO_INTEGRATION_ERROR = "CANCELED_DUE_TO_INTEGRATION_ERROR"
        case UNKNOWN = "UNKNOWN"
    }
    
    class func validateRequiredParameters(params: NSDictionary, requiredParams: [String]) -> String? {
        let missing = requiredParams.filter { params.object(forKey: $0) == nil }
        return missing.isEmpty ? nil : missing.joined(separator: ", ")
    }

    class func createErrorFromCode(code: ErrorCode.Code, message: String) -> [String: Any] {
        let rn = convertToReactNativeErrorCode(from: code)
        return createError(code: rn, nativeCode: code.stringValue, message: message)
    }

    class func createErrorFromRnCode(rnCode: String, message: String) -> [String: Any] {
        return createError(code: rnCode, nativeCode: rnCode, message: message)
    }

    class func createErrorFromRnCodeEnum(rnCode: RNErrorCode, message: String) -> [String: Any] {
        return createError(code: rnCode.rawValue, nativeCode: rnCode.rawValue, message: message)
    }

    // MARK: - Unified Error Creation
    
    private class func createError(code: String, nativeCode: String, message: String) -> [String: Any] {
        return stripeWrappedError(code: code, nativeErrorCode: nativeCode, message: message, metadata: [:])
    }

    class func createErrorFromNSError(nsError: NSError) -> [String: Any] {
        let mapped = mapToStripeErrorObject(nsError: nsError)
        return [ErrorConstants.errorKey: mapped]
    }

    class func rejectPromise(_ reject: RCTPromiseRejectBlock, rnCode: String, message: String) {
        reject(rnCode, message.isEmpty ? rnCode : message, nil)
    }

    private class func stripeWrappedError(code: String, nativeErrorCode: String, message: String, metadata: [String: Any]) -> [String: Any] {
        let error = stripeErrorObject(
            code: code,
            nativeErrorCode: nativeErrorCode,
            message: message,
            metadata: metadata
        )
        return [ErrorConstants.errorKey: error]
    }

    class func mapToStripeErrorObject(nsError: NSError) -> [String: Any] {
        let errorInfo = extractErrorInformation(from: nsError)
        let metadata = buildMetadata(from: nsError, isStripeError: errorInfo.isStripeError)
        
        return stripeErrorObject(
            name: errorInfo.errorName,
            code: errorInfo.code,
            nativeErrorCode: errorInfo.nativeErrorCode,
            message: nsError.localizedDescription,
            metadata: metadata
        )
    }

    // MARK: - Error Information Extraction
    
    private struct ErrorInformation {
        let isStripeError: Bool
        let code: String
        let nativeErrorCode: String
        let errorName: String
    }
    
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
    
    private class func buildMetadata(from nsError: NSError, isStripeError: Bool) -> [String: Any] {
        var metadata: [String: Any] = [
            ErrorConstants.domainKey: nsError.domain,
            ErrorConstants.isStripeErrorKey: isStripeError
        ]
        
        // Add unmapped error code information for Stripe errors
        if isStripeError {
            let codeEnum = ErrorCode.Code(rawValue: nsError.code)
            if let ce = codeEnum {
                let rn = convertToReactNativeErrorCode(from: ce)
                if rn == RNErrorCode.UNEXPECTED_SDK_ERROR.rawValue && ce != .unexpectedSdkError {
                    metadata[ErrorConstants.unmappedErrorCodeKey] = toUpperSnakeCase(ce.stringValue)
                }
            } else {
                metadata[ErrorConstants.unmappedErrorCodeKey] = String(nsError.code)
            }
        }
        
        addLocalizedErrorInformation(to: &metadata, from: nsError)
        addUnderlyingErrorInformation(to: &metadata, from: nsError)
        addUserInfoMetadata(to: &metadata, from: nsError)
        
        return metadata
    }

    private class func stripeErrorObject(name: String = ErrorConstants.stripeErrorName, code: String, nativeErrorCode: String, message: String, metadata: [String: Any]) -> [String: Any] {
        return [
            ErrorConstants.nameKey: name,
            ErrorConstants.messageKey: message.isEmpty ? ErrorConstants.unknownErrorMessage : message,
            ErrorConstants.codeKey: code,
            ErrorConstants.nativeErrorCodeKey: nativeErrorCode,
            ErrorConstants.metadataKey: metadata
        ]
    }

    private class func sanitizeUserInfo(_ userInfo: [AnyHashable: Any]) -> [String: Any] {
        var result: [String: Any] = [:]
        for (k, v) in userInfo {
            let key = String(describing: k)
            if let safe = jsonSafeValue(v) {
                result[key] = safe
            }
        }
        return result
    }

    private class func jsonSafeValue(_ value: Any) -> Any? {
        // Use JSONSerialization for basic validation
        if JSONSerialization.isValidJSONObject([value]) {
            return value
        }
        
        // Handle special types that need conversion
        switch value {
        case let url as URL:
            return url.absoluteString
        case let date as Date:
            return ISO8601DateFormatter().string(from: date)
        case let error as NSError:
            return [
                ErrorConstants.nsErrorDomainKey: error.domain,
                ErrorConstants.nsErrorCodeKey: error.code,
                ErrorConstants.nsErrorUserInfoKey: sanitizeUserInfo(error.userInfo)
            ]
        case let dict as [AnyHashable: Any]:
            return sanitizeUserInfo(dict)
        case let nsDict as NSDictionary:
            var bridged: [AnyHashable: Any] = [:]
            nsDict.forEach { (kv) in
                if let k = kv.key as? AnyHashable {
                    bridged[k] = kv.value
                }
            }
            return sanitizeUserInfo(bridged)
        case let arr as [Any]:
            return arr.compactMap { jsonSafeValue($0) }
        case let nsArr as NSArray:
            return nsArr.compactMap { jsonSafeValue($0) }
        default:
            return String(describing: value)
        }
    }

    private class func toUpperSnakeCase(_ input: String) -> String {
        guard !input.isEmpty else { return input }
        
        return input
            .replacingOccurrences(of: "([a-z])([A-Z])", with: "$1_$2", options: .regularExpression)
            .uppercased()
    }

    // Map iOS ErrorCode.Code to RN ErrorCode (UPPER_SNAKE_CASE).
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
        case .requestDynamicCurrencyConversionRequiresUpdatePaymentIntent: return RNErrorCode.UNEXPECTED_OPERATION.rawValue
        case .dynamicCurrencyConversionNotAvailable: return RNErrorCode.UNEXPECTED_OPERATION.rawValue
        case .surchargingNotAvailable: return RNErrorCode.UNEXPECTED_OPERATION.rawValue
        case .usbDiscoveryTimedOut: return RNErrorCode.USB_DISCOVERY_TIMED_OUT.rawValue
        case .usbDisconnected: return RNErrorCode.USB_DISCONNECTED.rawValue
        
        // Additional cases found when removing default - need explicit mapping
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

func createBusyMessage(command: String, by busyCommand: String) -> String {
    return "Could not execute \(command) because the SDK is busy with another command: \(busyCommand)."
}

extension ErrorCode.Code {
    var stringValue: String {
        return Terminal.stringFromError(self)
    }
}

// MARK: - Metadata Helper Functions

extension Errors {
    private class func mapNonStripeError(nsError: NSError) -> (code: String, nativeErrorCode: String) {
        return (
            code: RNErrorCode.UNEXPECTED_SDK_ERROR.rawValue,
            nativeErrorCode: "\(nsError.domain):\(nsError.code)"
        )
    }
    
    private class func addLocalizedErrorInformation(to metadata: inout [String: Any], from nsError: NSError) {
        if let failure = nsError.localizedFailureReason, failure.isEmpty == false {
            metadata[ErrorConstants.localizedFailureReasonKey] = failure
        }
        if let suggestion = nsError.localizedRecoverySuggestion, suggestion.isEmpty == false {
            metadata[ErrorConstants.localizedRecoverySuggestionKey] = suggestion
        }
    }
    
    private class func addUnderlyingErrorInformation(to metadata: inout [String: Any], from nsError: NSError) {
        if let underlying = nsError.userInfo[NSUnderlyingErrorKey] as? NSError {
            metadata[ErrorConstants.underlyingErrorKey] = [
                ErrorConstants.underlyingErrorDomainKey: underlying.domain,
                ErrorConstants.underlyingErrorCodeKey: underlying.code,
                ErrorConstants.underlyingErrorMessageKey: underlying.localizedDescription
            ]
        }
    }
    
    private class func addUserInfoMetadata(to metadata: inout [String: Any], from nsError: NSError) {
        if nsError.userInfo.isEmpty == false {
            let sanitized = sanitizeUserInfo(nsError.userInfo)
            if sanitized.isEmpty == false {
                metadata[ErrorConstants.userInfoKey] = sanitized
            }
        }
    }
}
