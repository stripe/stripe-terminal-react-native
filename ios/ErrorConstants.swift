import Foundation
import StripeTerminal

/// Constants for error object structure and keys.
struct ErrorConstants {

    // MARK: - RN Response Top-level Keys
    // Keys for the top-level structure returned across the RN bridge.
    static let rnError = "error"
    static let rnPaymentIntent = "paymentIntent"
    static let rnSetupIntent = "setupIntent"
    static let rnRefund = "refund"
    static let rnApiError = "apiError"
    static let rnUnderlyingError = "underlyingError"
    static let rnMetadata = "metadata"

    // MARK: - RN Error Object Keys
    // Keys for the error object within the RN response.
    static let rnErrorName = "name"
    static let rnErrorMessage = "message"
    static let rnErrorCode = "code"
    static let rnErrorNativeErrorCode = "nativeErrorCode"

    // MARK: - RN Error Name Values
    static let rnStripeErrorName = "StripeError"
    static let rnNonStripeErrorName = "NonStripeError"

    // MARK: - RN ApiError Response Keys
    // Keys for the ApiError object returned across the RN bridge.
    // Values match the TypeScript ApiErrorInformation interface field names.
    static let rnApiErrorCode               = "code"
    static let rnApiErrorMessage            = "message"
    static let rnApiErrorDeclineCode        = "declineCode"
    static let rnApiErrorType               = "type"
    static let rnApiErrorCharge             = "charge"
    static let rnApiErrorDocUrl             = "docUrl"
    static let rnApiErrorParam              = "param"
    static let rnApiErrorRequestLogUrl      = "requestLogUrl"
    static let rnApiErrorAdviceCode         = "adviceCode"
    static let rnApiErrorNetworkAdviceCode  = "networkAdviceCode"
    static let rnApiErrorNetworkDeclineCode = "networkDeclineCode"
    // LocalizationResult keys
    static let rnApiErrorLocalizationResult = "localizationResult"
    static let rnLocalizationResultRequestedLocale = "requestedLocale"
    static let rnLocalizationResultResolvedLocale = "resolvedLocale"

    // MARK: - RN UnderlyingError Keys
    // Keys for the underlyingError object returned across the RN bridge.
    static let rnUnderlyingErrorCode = "code"
    static let rnUnderlyingErrorMessage = "message"
    static let rnUnderlyingErrorIosDomain = "iosDomain"
    static let rnUnderlyingErrorIosLocalizedFailureReason = "iosLocalizedFailureReason"
    static let rnUnderlyingErrorIosLocalizedRecoverySuggestion = "iosLocalizedRecoverySuggestion"

    // MARK: - RN Metadata Keys
    // Keys for the metadata object returned across the RN bridge.
    // Values match TypeScript StripeErrorMetadataKeys field names.
    static let rnMetadataDeviceBannedUntilDate  = "deviceBannedUntilDate"
    static let rnMetadataPrepareFailedReason    = "prepareFailedReason"
    static let rnMetadataHttpStatusCode         = "httpStatusCode"
    static let rnMetadataReaderMessage          = "readerMessage"
    static let rnMetadataStripeAPIRequestId     = "stripeAPIRequestId"
    static let rnMetadataStripeAPIFailureReason = "stripeAPIFailureReason"
    static let rnMetadataOfflineDeclineReason   = "offlineDeclineReason"

    // MARK: - NSError UserInfo Keys (from Stripe Terminal SDK)
    // These keys are directly imported from StripeTerminal SDK as ErrorKey enum values.
    // Use .rawValue to access the string key for userInfo dictionary.
    // Reference: https://stripe.dev/stripe-terminal-ios/docs/Errors.html#/c:SCPErrors.h@T@SCPErrorKey

    // Tap to Pay specific
    static let deviceBannedUntilDate = ErrorKey.deviceBannedUntilDate.rawValue
    static let prepareFailedReason = ErrorKey.prepareFailedReason.rawValue

    // API error related
    static let httpStatusCode = ErrorKey.httpStatusCode.rawValue
    static let stripeAPIRequestId = ErrorKey.stripeAPIRequestId.rawValue
    static let stripeAPIFailureReason = ErrorKey.stripeAPIFailureReason.rawValue
    static let stripeAPIDeclineCode = ErrorKey.stripeAPIDeclineCode.rawValue
    static let stripeAPIErrorCode = ErrorKey.stripeAPIErrorCode.rawValue
    static let stripeAPIErrorType = ErrorKey.stripeAPIErrorType.rawValue
    static let stripeAPIDocUrl = ErrorKey.stripeAPIDocUrl.rawValue
    static let stripeAPIErrorParameter = ErrorKey.stripeAPIErrorParameter.rawValue
    static let stripeAPICharge = ErrorKey.stripeAPICharge.rawValue
    // SCPConfirmPaymentIntentError, SCPConfirmSetupIntentError, SCPConfirmRefundError expose
    // apiError as a structured ApiError object via this key. Used to read the 4 fields that
    // don't have individual ErrorKey constants: requestLogUrl, adviceCode, networkAdviceCode,
    // networkDeclineCode.
    static let stripeAPIError = ErrorKey.stripeAPIError.rawValue

    // Reader and offline specific
    static let readerMessage = ErrorKey.readerMessage.rawValue
    static let offlineDeclineReason = ErrorKey.offlineDeclineReason.rawValue

    // MARK: - Default Messages
    static let unknownErrorMessage = "Unknown error"

    // MARK: - Default Values
    /// Empty string default for required apiError fields (e.g., code, declineCode) when SDK returns nil
    /// Required to maintain TypeScript contract (non-optional fields) and cross-platform consistency with Android
    static let apiErrorRequiredFieldEmpty = ""

    /// Default value for unknown API error codes
    /// Used when SDK doesn't provide an API error code
    static let apiErrorUnknownCode = "unknown_api_error_code"

    // MARK: - Domain Constants
    static let stripeTerminalDomain = "com.stripe-terminal"
}
