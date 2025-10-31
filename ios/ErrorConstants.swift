import Foundation
import StripeTerminal

/// Constants for error object structure and keys.
struct ErrorConstants {
    
    // MARK: - Top-level Error Keys
    static let errorKey = "error"
    static let paymentIntentKey = "paymentIntent"
    static let setupIntentKey = "setupIntent"
    static let refundKey = "refund"
    static let apiErrorKey = "apiError"
    static let underlyingErrorKey = "underlyingError"
    static let metadataKey = "metadata"
    
    // MARK: - Error Property Keys
    static let nameKey = "name"
    static let messageKey = "message"
    static let codeKey = "code"
    static let nativeErrorCodeKey = "nativeErrorCode"
    
    // MARK: - Error Name Values
    static let stripeErrorName = "StripeError"
    static let nonStripeErrorName = "NonStripeError"
    
    // MARK: - ApiError Keys
    static let apiErrorCodeKey = "code"
    static let apiErrorMessageKey = "message"
    static let apiErrorDeclineCodeKey = "declineCode"
    static let apiErrorChargeKey = "charge"
    static let apiErrorDocUrlKey = "docUrl"
    static let apiErrorParamKey = "param"
    static let apiErrorTypeKey = "type"
    
    // MARK: - UnderlyingError Keys
    static let underlyingErrorCodeKey = "code"
    static let underlyingErrorMessageKey = "message"
    static let underlyingErrorIosDomainKey = "iosDomain"
    static let underlyingErrorIosLocalizedFailureReasonKey = "iosLocalizedFailureReason"
    static let underlyingErrorIosLocalizedRecoverySuggestionKey = "iosLocalizedRecoverySuggestion"
    
    // MARK: - Metadata Keys (iOS-specific from userInfo)
    // These keys match StripeErrorMetadataKeys in TypeScript
    static let deviceBannedUntilDateKey = "deviceBannedUntilDate"
    static let prepareFailedReasonKey = "prepareFailedReason"
    static let httpStatusCodeKey = "httpStatusCode"
    static let readerMessageKey = "readerMessage"
    static let stripeAPIRequestIdKey = "stripeAPIRequestId"
    static let stripeAPIFailureReasonKey = "stripeAPIFailureReason"
    static let offlineDeclineReasonKey = "offlineDeclineReason"
    
    // MARK: - NSError UserInfo Keys (from Stripe Terminal SDK)
    // These keys are directly imported from StripeTerminal SDK as ErrorKey enum values
    // Use .rawValue to access the string key for userInfo dictionary
    // Reference: https://stripe.dev/stripe-terminal-ios/docs/Errors.html#/c:SCPErrors.h@T@SCPErrorKey
    
    // Tap to Pay specific
    static let scpDeviceBannedUntilDate = ErrorKey.deviceBannedUntilDate.rawValue
    static let scpPrepareFailedReason = ErrorKey.prepareFailedReason.rawValue
    
    // API error related
    static let scpHttpStatusCode = ErrorKey.httpStatusCode.rawValue
    static let scpStripeAPIRequestId = ErrorKey.stripeAPIRequestId.rawValue
    static let scpStripeAPIFailureReason = ErrorKey.stripeAPIFailureReason.rawValue
    static let scpStripeAPIErrorType = ErrorKey.stripeAPIErrorType.rawValue
    static let scpStripeAPIDocUrl = ErrorKey.stripeAPIDocUrl.rawValue
    static let scpStripeAPIErrorParameter = ErrorKey.stripeAPIErrorParameter.rawValue
    static let scpStripeAPICharge = "SCPErrorKeyStripeAPICharge" // Not yet available in current SDK version
    
    // Reader and offline specific
    static let scpReaderMessage = ErrorKey.readerMessage.rawValue
    static let scpOfflineDeclineReason = ErrorKey.offlineDeclineReason.rawValue
    
    // MARK: - Default Messages
    static let unknownErrorMessage = "Unknown error"
    
    // MARK: - Domain Constants
    static let stripeTerminalDomain = "com.stripe-terminal"
}
