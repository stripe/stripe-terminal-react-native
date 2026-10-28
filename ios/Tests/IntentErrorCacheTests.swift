import XCTest
import ObjectiveC
import StripeTerminal

@testable import stripe_terminal_react_native

/// Exercises process retry and cache recovery using real native SDK error objects.
/// The fixtures follow the SDK's constructors and JSON decoding, not the RN implementation.
///
/// Native reference: stripe-internal/android@cd839ef15b8a2f463e76e69749dfb0f4186c0808
/// - ios/terminalsdk/StripeTerminalTests/SCPErrorTests.m:231-296 (API errors)
/// - ios/terminalsdk/StripeTerminal/SCPConfirmResourceError.m:88-129 (network errors)
/// - ios/terminalsdk/StripeTerminal/SCPTerminal.m:2785-2819 and SCPPromise.m:124-129 (process completion)
///
/// The process regression tests intercept the native SDK call, then exercise the real
/// RN completion and retry path. Other cases test the cache helpers directly.
final class IntentErrorCacheTests: XCTestCase {

    func testProcessPaymentIntentFailure_retryUsesNativeErrorIntent() throws {
        let sut = StripeTerminalReactNative()
        let original = try makePaymentIntent()
        sut.paymentIntents["uuid"] = original
        let requestError = try makeAPIError([
            "code": "card_declined",
            "type": "card_error",
            "decline_code": "live_mode_test_card",
            "message": "Your card was declined.",
            "payment_intent": paymentIntentJSON
        ])
        let error = try makeConfirmPaymentIntentError(requestError, original: original)

        // The native API-error decoder must supply a new object for the same intent.
        let updated = try XCTUnwrap(error.paymentIntent)
        XCTAssertFalse(updated === original)
        XCTAssertEqual(updated.stripeId, original.stripeId)

        var receivedIntents: [PaymentIntent] = []
        var completion: PaymentIntentCompletionBlock?
        let process: @convention(block) (
            Terminal, PaymentIntent, CollectPaymentIntentConfiguration?, ConfirmPaymentIntentConfiguration?,
            @escaping PaymentIntentCompletionBlock
        ) -> Cancelable? = { _, intent, _, _, callback in
            receivedIntents.append(intent)
            completion = callback
            return nil
        }
        try stubTerminalMethod(
            #selector(Terminal.processPaymentIntent(_:collectConfig:confirmConfig:completion:)), with: process
        )

        var resolved: [String: Any]?
        sut.processPaymentIntent(
            params: ["paymentIntent": ["sdkUuid": "uuid"]],
            resolver: {
                resolved = $0 as? [String: Any]
                XCTAssertTrue(sut.paymentIntents["uuid"] === updated, "Cache must be updated before resolving")
            },
            rejecter: { _, _, _ in XCTFail("Expected a resolved native error") }
        )
        XCTAssertTrue(receivedIntents.first === original)
        // Native process failure supplies nil here; the updated intent is on the error.
        try XCTUnwrap(completion)(nil, error)
        let result = try XCTUnwrap(resolved)

        let mappedError = try XCTUnwrap(result["error"] as? [String: Any])
        let mappedIntent = try XCTUnwrap(mappedError["paymentIntent"] as? NSDictionary)
        let returnedUUID = try XCTUnwrap(mappedIntent["sdkUuid"] as? String)
        XCTAssertEqual(returnedUUID, "uuid")

        sut.processPaymentIntent(
            params: ["paymentIntent": mappedIntent],
            resolver: { _ in },
            rejecter: { _, _, _ in XCTFail("Expected retry to reach the native SDK") }
        )
        XCTAssertEqual(receivedIntents.count, 2)
        XCTAssertTrue(receivedIntents.last === updated, "Retry must pass the native error's intent, not the stale cached instance")
    }

    func testProcessSetupIntentFailure_retryUsesNativeErrorIntent() throws {
        let sut = StripeTerminalReactNative()
        let original = try makeSetupIntent()
        sut.setupIntents["uuid"] = original
        let requestError = try makeAPIError([
            "code": "setup_intent_authentication_failure",
            "type": "invalid_request_error",
            "message": "The latest attempt to set up the payment method has failed because authentication failed.",
            "setup_intent": setupIntentJSON
        ])
        let error = try makeConfirmSetupIntentError(requestError, original: original)

        let updated = try XCTUnwrap(error.setupIntent)
        XCTAssertFalse(updated === original)
        XCTAssertEqual(updated.stripeId, original.stripeId)

        var receivedIntents: [SetupIntent] = []
        var completion: SetupIntentCompletionBlock?
        let process: @convention(block) (
            Terminal, SetupIntent, CollectSetupIntentConfiguration, @escaping SetupIntentCompletionBlock
        ) -> Cancelable? = { _, intent, _, callback in
            receivedIntents.append(intent)
            completion = callback
            return nil
        }
        try stubTerminalMethod(#selector(Terminal.processSetupIntent(_:collectConfig:completion:)), with: process)

        var resolved: [String: Any]?
        sut.processSetupIntent(
            params: ["setupIntent": ["sdkUuid": "uuid"], "allowRedisplay": "always"],
            resolver: {
                resolved = $0 as? [String: Any]
                XCTAssertTrue(sut.setupIntents["uuid"] === updated, "Cache must be updated before resolving")
            },
            rejecter: { _, _, _ in XCTFail("Expected a resolved native error") }
        )
        XCTAssertTrue(receivedIntents.first === original)
        try XCTUnwrap(completion)(nil, error)
        let result = try XCTUnwrap(resolved)

        let mappedError = try XCTUnwrap(result["error"] as? [String: Any])
        let mappedIntent = try XCTUnwrap(mappedError["setupIntent"] as? NSDictionary)
        let returnedUUID = try XCTUnwrap(mappedIntent["sdkUuid"] as? String)
        XCTAssertEqual(returnedUUID, "uuid")

        sut.processSetupIntent(
            params: ["setupIntent": mappedIntent, "allowRedisplay": "always"],
            resolver: { _ in },
            rejecter: { _, _, _ in XCTFail("Expected retry to reach the native SDK") }
        )
        XCTAssertEqual(receivedIntents.count, 2)
        XCTAssertTrue(receivedIntents.last === updated, "Retry must pass the native error's intent, not the stale cached instance")
    }

    func testPaymentIntentNetworkTimeout_preservesCacheWhenNativeErrorHasNoIntent() throws {
        let sut = StripeTerminalReactNative()
        let original = try makePaymentIntent()
        sut.paymentIntents["uuid"] = original
        let requestError = NSError(domain: NSURLErrorDomain, code: NSURLErrorTimedOut)
        let error = try makeConfirmPaymentIntentError(requestError, original: original)

        // Let the SDK decide that the intent state is unknown; do not manually set nil.
        XCTAssertNil(error.paymentIntent)

        sut.updatePaymentIntentFromError(error, uuid: "uuid")

        XCTAssertTrue(sut.paymentIntents["uuid"] === original)
    }

    func testSetupIntentNetworkTimeout_preservesCacheWhenNativeErrorHasNoIntent() throws {
        let sut = StripeTerminalReactNative()
        let original = try makeSetupIntent()
        sut.setupIntents["uuid"] = original
        let requestError = NSError(domain: NSURLErrorDomain, code: NSURLErrorTimedOut)
        let error = try makeConfirmSetupIntentError(requestError, original: original)

        XCTAssertNil(error.setupIntent)

        sut.updateSetupIntentFromError(error, uuid: "uuid")

        XCTAssertTrue(sut.setupIntents["uuid"] === original)
    }

    /// Scoped to a synchronous XCTest case; restore the SDK method even if the test throws.
    private func stubTerminalMethod(_ selector: Selector, with block: Any) throws {
        if !Terminal.isInitialized() {
            Terminal.initWithTokenProvider(TokenProvider.shared)
        }
        let method = try XCTUnwrap(class_getInstanceMethod(Terminal.self, selector))
        let replacement = imp_implementationWithBlock(block)
        let original = method_setImplementation(method, replacement)
        addTeardownBlock {
            method_setImplementation(method, original)
            imp_removeBlock(replacement)
        }
    }

    // MARK: - Native fixtures

    // Reduced from the native confirm_payment_intent_api_error.json and
    // confirm_setup_intent_api_error.json fixtures; IDs are local test values.
    private var paymentIntentJSON: NSDictionary {
        [
            "id": "pi_cache_test", "object": "payment_intent", "created": 1772066544,
            "currency": "usd", "amount": 100, "capture_method": "manual",
            "payment_method_types": ["card_present"], "livemode": false,
            "status": "requires_payment_method"
        ]
    }

    private var setupIntentJSON: NSDictionary {
        [
            "id": "seti_cache_test", "object": "setup_intent", "created": 1772073378,
            "usage": "off_session", "payment_method_types": ["card", "card_present"],
            "livemode": false, "status": "requires_payment_method"
        ]
    }

    private func makePaymentIntent() throws -> PaymentIntent {
        let cls = try nativeClass("SCPPaymentIntent", classSelector: "decodedObjectFromJSON:")
        return try XCTUnwrap(cls.perform(NSSelectorFromString("decodedObjectFromJSON:"), with: paymentIntentJSON)?
            .takeUnretainedValue() as? PaymentIntent)
    }

    private func makeSetupIntent() throws -> SetupIntent {
        let cls = try nativeClass("SCPSetupIntent", classSelector: "decodedObjectFromJSON:")
        return try XCTUnwrap(cls.perform(NSSelectorFromString("decodedObjectFromJSON:"), with: setupIntentJSON)?
            .takeUnretainedValue() as? SetupIntent)
    }

    private func makeAPIError(_ errorJSON: NSDictionary) throws -> NSError {
        let selector = NSSelectorFromString("buildAPIError:httpRequest:httpResponse:")
        let cls = try nativeClass("SCPErrors", classSelector: NSStringFromSelector(selector))
        let method = try XCTUnwrap(class_getClassMethod(cls, selector))
        // NSObject.perform supports at most two arguments; this SDK factory takes three.
        typealias BuildAPIError = @convention(c) (AnyObject, Selector, NSDictionary, NSURLRequest?, HTTPURLResponse?) -> Unmanaged<AnyObject>?
        let build = unsafeBitCast(method_getImplementation(method), to: BuildAPIError.self)
        return try XCTUnwrap(build(cls, selector, ["error": errorJSON], nil, nil)?.takeUnretainedValue() as? NSError)
    }

    private func makeConfirmPaymentIntentError(_ requestError: NSError, original: PaymentIntent) throws -> ConfirmPaymentIntentError {
        let resourceError = try makeConfirmResourceError(requestError, original: original)
        return try XCTUnwrap(makeNativeConfirmError(
            className: "SCPConfirmPaymentIntentError", initializer: "initWithConfirmResourceError:", resourceError: resourceError
        ) as? ConfirmPaymentIntentError)
    }

    private func makeConfirmSetupIntentError(_ requestError: NSError, original: SetupIntent) throws -> ConfirmSetupIntentError {
        let resourceError = try makeConfirmResourceError(requestError, original: original)
        return try XCTUnwrap(makeNativeConfirmError(
            className: "SCPConfirmSetupIntentError", initializer: "initWithProcessResourceError:", resourceError: resourceError
        ) as? ConfirmSetupIntentError)
    }

    private func makeConfirmResourceError(_ requestError: NSError, original: NSObject) throws -> NSObject {
        let cls = try nativeClass("SCPConfirmResourceError", classSelector: "buildWithAPIRequestError:resource:")
        return try XCTUnwrap(cls.perform(
            NSSelectorFromString("buildWithAPIRequestError:resource:"), with: requestError, with: original
        )?.takeUnretainedValue() as? NSObject)
    }

    private func makeNativeConfirmError(className: String, initializer: String, resourceError: NSObject) throws -> NSObject {
        let cls = try nativeClass(className, classSelector: "alloc")
        let selector = NSSelectorFromString(initializer)
        _ = try XCTUnwrap(class_getInstanceMethod(cls, selector), "Missing native initializer: \(initializer)")
        let allocated = try XCTUnwrap(cls.perform(NSSelectorFromString("alloc"))?.takeRetainedValue() as? NSObject)
        return try XCTUnwrap(allocated.perform(selector, with: resourceError)?.takeUnretainedValue() as? NSObject)
    }

    private func nativeClass(_ name: String, classSelector: String) throws -> NSObject.Type {
        let cls = try XCTUnwrap(NSClassFromString(name) as? NSObject.Type, "Missing native SDK class: \(name)")
        _ = try XCTUnwrap(class_getClassMethod(cls, NSSelectorFromString(classSelector)), "Missing native selector: \(classSelector)")
        return cls
    }
}
