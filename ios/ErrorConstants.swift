import Foundation

/// Constants for error object structure and keys.
struct ErrorConstants {
    
    // MARK: - Error Object Keys
    static let errorKey = "error"
    
    // MARK: - Error Property Keys
    static let nameKey = "name"
    static let messageKey = "message"
    static let codeKey = "code"
    static let nativeErrorCodeKey = "nativeErrorCode"
    static let metadataKey = "metadata"
    
    // MARK: - Error Name Values
    static let stripeErrorName = "StripeError"
    static let nonStripeErrorName = "NonStripeError"
    
    // MARK: - Metadata Keys
    static let domainKey = "domain"
    static let isStripeErrorKey = "isStripeError"
    static let unmappedErrorCodeKey = "unmappedErrorCode"
    static let localizedFailureReasonKey = "localizedFailureReason"
    static let localizedRecoverySuggestionKey = "localizedRecoverySuggestion"
    static let underlyingErrorKey = "underlyingError"
    static let userInfoKey = "userInfo"
    
    // MARK: - UnderlyingError Keys
    static let underlyingErrorDomainKey = "domain"
    static let underlyingErrorCodeKey = "code"
    static let underlyingErrorMessageKey = "message"
    
    // MARK: - NSError Keys
    static let nsErrorDomainKey = "domain"
    static let nsErrorCodeKey = "code"
    static let nsErrorUserInfoKey = "userInfo"
    
    // MARK: - Default Messages
    static let unknownErrorMessage = "Unknown error"
    
    // MARK: - Domain Constants
    static let stripeTerminalDomain = "com.stripe-terminal"
    
    // MARK: - Specialized Error Keys
    static let refundKey = "refund"
    static let paymentIntentKey = "paymentIntent"
    static let setupIntentKey = "setupIntent"
    static let requestErrorKey = "requestError"
    static let declineCodeKey = "declineCode"
}
