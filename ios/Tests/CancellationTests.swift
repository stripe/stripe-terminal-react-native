import XCTest
import ObjectiveC
import StripeTerminal

@testable import stripe_terminal_react_native

final class CancellationTests: XCTestCase {

    func testCancelReaderReconnectionWithoutActiveReconnectionResolvesCancelFailed() throws {
        let sut = StripeTerminalReactNative()
        var results: [[String: Any]] = []
        var rejectionCount = 0

        sut.cancelReaderReconnection(
            resolver: { results.append($0 as? [String: Any] ?? [:]) },
            rejecter: { _, _, _ in rejectionCount += 1 }
        )

        XCTAssertEqual(results.count, 1)
        XCTAssertEqual(rejectionCount, 0)
        let error = try XCTUnwrap(results.first?["error"] as? [String: Any])
        XCTAssertEqual(error["code"] as? String, "CANCEL_FAILED")
        XCTAssertEqual(error["error_source"] as? String, "rn")
    }

    func testCancelInstallingUpdateWithoutActiveUpdateResolvesCancelFailed() throws {
        let sut = StripeTerminalReactNative()
        var results: [[String: Any]] = []
        var rejectionCount = 0

        sut.cancelInstallingUpdate(
            resolver: { results.append($0 as? [String: Any] ?? [:]) },
            rejecter: { _, _, _ in rejectionCount += 1 }
        )

        XCTAssertEqual(results.count, 1)
        XCTAssertEqual(rejectionCount, 0)
        let error = try XCTUnwrap(results.first?["error"] as? [String: Any])
        XCTAssertEqual(error["code"] as? String, "CANCEL_FAILED")
        XCTAssertEqual(error["error_source"] as? String, "rn")
    }

    @MainActor
    func testDisconnectedCollectionIsNotReusedAfterReconnect() async throws {
        let disconnect: @convention(block) (Terminal, @escaping ErrorCompletionBlock) -> Void = { _, completion in
            completion(nil)
        }
        try stubTerminalMethod(#selector(Terminal.disconnectReader(_:)), with: disconnect)

        for explicitDisconnect in [false, true] {
            let sut = StripeTerminalReactNative()
            let old = makeCancelable()
            sut.collectPaymentMethodCancelable = old
            if explicitDisconnect {
                let disconnected = await result(of: sut.disconnectReader)
                XCTAssertEqual(disconnected, NSDictionary())
            } else {
                sut.terminal(Terminal.shared, didChangeConnectionStatus: .notConnected)
            }
            sut.terminal(Terminal.shared, didChangeConnectionStatus: .connected)

            let staleCancellation = await result(of: sut.cancelCollectPaymentMethod)
            assertCancelFailed(staleCancellation)
            XCTAssertEqual(old.callCount, 0, "Reconnection must not revive the previous collection")

            let replacement = makeCancelable()
            sut.collectPaymentMethodCancelable = replacement
            let newCancellation = await result(of: sut.cancelCollectPaymentMethod)
            XCTAssertEqual(newCancellation, NSDictionary())
            XCTAssertEqual(replacement.callCount, 1)
        }
    }

    @MainActor
    func testFailedDisconnectPreservesCollectionCancellation() async throws {
        let busy = NSError(domain: "com.stripe-terminal", code: ErrorCode.readerBusy.rawValue)
        let disconnect: @convention(block) (Terminal, @escaping ErrorCompletionBlock) -> Void = { _, completion in
            completion(busy)
        }
        try stubTerminalMethod(#selector(Terminal.disconnectReader(_:)), with: disconnect)
        let sut = StripeTerminalReactNative()
        let handle = makeCancelable()
        sut.collectPaymentMethodCancelable = handle

        let disconnected = await result(of: sut.disconnectReader)
        XCTAssertNotNil(disconnected?["error"])
        let cancellation = await result(of: sut.cancelCollectPaymentMethod)
        XCTAssertEqual(cancellation, NSDictionary())
        XCTAssertEqual(handle.callCount, 1)
    }

    @MainActor
    func testSuccessfulCollectionRemainsCancelableAndCancellationCanRetry() async throws {
        let sut = StripeTerminalReactNative()
        let handle = makeCancelable()
        var completion: PaymentIntentCompletionBlock?
        let collect: @convention(block) (
            Terminal, PaymentIntent, CollectPaymentIntentConfiguration?, @escaping PaymentIntentCompletionBlock
        ) -> Cancelable? = { _, _, _, callback in
            completion = callback
            return handle
        }
        try stubTerminalMethod(#selector(Terminal.collectPaymentMethod(_:collectConfig:completion:)), with: collect)
        let intent = try makePaymentIntent()
        sut.paymentIntents["uuid"] = intent
        var result: NSDictionary?
        sut.collectPaymentMethod(params: ["paymentIntent": ["sdkUuid": "uuid"]],
                                 resolver: { result = $0 as? NSDictionary }, rejecter: unexpectedRejection)
        try XCTUnwrap(completion)(intent, nil)
        XCTAssertNotNil(result?["paymentIntent"])

        handle.error = NSError(domain: "com.stripe-terminal", code: ErrorCode.cancelFailedUnavailable.rawValue)
        let failed = await self.result(of: sut.cancelCollectPaymentMethod)
        XCTAssertEqual((failed?["error"] as? NSDictionary)?["error_source"] as? String, "native")
        handle.error = nil
        let retried = await self.result(of: sut.cancelCollectPaymentMethod)
        XCTAssertEqual(retried, NSDictionary())
        let repeated = await self.result(of: sut.cancelCollectPaymentMethod)
        assertCancelFailed(repeated)
        XCTAssertEqual(handle.callCount, 2, "Retire the handle only after cancellation succeeds")
    }

    @MainActor
    func testLateCancellationAndDisconnectCannotDiscardNewCollection() async throws {
        let sut = StripeTerminalReactNative()
        let old = makeCancelable()
        sut.collectPaymentMethodCancelable = old
        var cancelCompletion: ErrorCompletionBlock?
        let cancelStarted = expectation(description: "Native cancellation started")
        old.onCancel = {
            cancelCompletion = $0
            cancelStarted.fulfill()
        }
        let cancelResolved = expectation(description: "Old cancellation resolves")
        sut.cancelCollectPaymentMethod(resolver: { _ in cancelResolved.fulfill() }, rejecter: unexpectedRejection)
        await fulfillment(of: [cancelStarted], timeout: 1)

        var disconnectCompletion: ErrorCompletionBlock?
        let disconnectStarted = expectation(description: "Native disconnect started")
        let disconnect: @convention(block) (Terminal, @escaping ErrorCompletionBlock) -> Void = { _, callback in
            disconnectCompletion = callback
            disconnectStarted.fulfill()
        }
        try stubTerminalMethod(#selector(Terminal.disconnectReader(_:)), with: disconnect)
        let disconnectResolved = expectation(description: "Old disconnect resolves")
        sut.disconnectReader(resolver: { _ in disconnectResolved.fulfill() }, rejecter: unexpectedRejection)
        await fulfillment(of: [disconnectStarted], timeout: 1)

        sut.terminal(Terminal.shared, didChangeConnectionStatus: .notConnected)
        sut.terminal(Terminal.shared, didChangeConnectionStatus: .connected)
        let replacement = makeCancelable()
        sut.collectPaymentMethodCancelable = replacement
        try XCTUnwrap(cancelCompletion)(nil)
        try XCTUnwrap(disconnectCompletion)(nil)
        await fulfillment(of: [cancelResolved, disconnectResolved], timeout: 1)

        let cancellation = await result(of: sut.cancelCollectPaymentMethod)
        XCTAssertEqual(cancellation, NSDictionary())
        XCTAssertEqual(replacement.callCount, 1)
    }

    @MainActor
    func testCancellationRetiresOnlySuccessfullyCanceledHandle() async throws {
        if !Terminal.isInitialized() { Terminal.initWithTokenProvider(TokenProvider.shared) }
        let sut = StripeTerminalReactNative()
        let operations: [(ReferenceWritableKeyPath<StripeTerminalReactNative, Cancelable?>, PromiseOperation)] = [
            (\.confirmPaymentIntentCancelable, sut.cancelConfirmPaymentIntent),
            (\.processPaymentIntentCancelable, sut.cancelProcessPaymentIntent),
            (\.processRefundCancelable, sut.cancelProcessRefund),
            (\.collectSetupIntentCancelable, sut.cancelCollectSetupIntent),
            (\.confirmSetupIntentCancelable, sut.cancelConfirmSetupIntent),
            (\.processSetupIntentCancelable, sut.cancelProcessSetupIntent)
        ]
        for (keyPath, cancel) in operations {
            let handle = makeCancelable()
            sut[keyPath: keyPath] = handle
            // Reader loss must not discard an operation that can still be canceled (e.g. QR confirmation).
            sut.terminal(Terminal.shared, didChangeConnectionStatus: .notConnected)
            handle.error = NSError(domain: "com.stripe-terminal", code: ErrorCode.cancelFailedUnavailable.rawValue)
            let failed = await result(of: cancel)
            XCTAssertEqual((failed?["error"] as? NSDictionary)?["error_source"] as? String, "native")
            handle.error = nil
            let retried = await result(of: cancel)
            XCTAssertEqual(retried, NSDictionary())
            let repeated = await result(of: cancel)
            assertCancelFailed(repeated)
            XCTAssertEqual(handle.callCount, 2)

            // The operation can complete and a new one start before its cancellation callback arrives.
            let pending = makeCancelable()
            sut[keyPath: keyPath] = pending
            var completion: ErrorCompletionBlock?
            let started = expectation(description: "Cancellation started")
            pending.onCancel = { completion = $0; started.fulfill() }
            let resolved = expectation(description: "Late cancellation resolves")
            cancel({ _ in resolved.fulfill() }, unexpectedRejection)
            await fulfillment(of: [started], timeout: 1)
            let replacement = makeCancelable()
            sut[keyPath: keyPath] = replacement
            try XCTUnwrap(completion)(nil)
            await fulfillment(of: [resolved], timeout: 1)
            let next = await result(of: cancel)
            XCTAssertEqual(next, NSDictionary())
            XCTAssertEqual(replacement.callCount, 1)
        }
    }

    @MainActor
    func testSuccessfulSetupCollectionRetiresHandleBeforeResolving() async throws {
        let sut = StripeTerminalReactNative()
        let handle = makeCancelable()
        var completion: SetupIntentCompletionBlock?
        let collect: @convention(block) (
            Terminal, SetupIntent, CollectSetupIntentConfiguration, @escaping SetupIntentCompletionBlock
        ) -> Cancelable? = { _, _, _, callback in
            completion = callback
            return handle
        }
        try stubTerminalMethod(#selector(Terminal.collectSetupIntentPaymentMethod(_:setupConfig:completion:)), with: collect)
        let intent: SetupIntent = try decodeSdkObject("SCPSetupIntent", json: [
            "id": "seti_test", "object": "setup_intent", "created": 1772073378,
            "usage": "off_session", "payment_method_types": ["card_present"],
            "livemode": false, "status": "requires_confirmation"
        ])
        sut.setupIntents["uuid"] = intent
        var resolved: NSDictionary?
        sut.collectSetupIntentPaymentMethod(params: ["setupIntent": ["sdkUuid": "uuid"], "allowRedisplay": "always"], resolver: {
            XCTAssertNil(sut.collectSetupIntentCancelable)
            resolved = $0 as? NSDictionary
        }, rejecter: unexpectedRejection)
        try XCTUnwrap(completion)(intent, nil)
        XCTAssertNotNil(resolved?["setupIntent"])
        let canceled = await result(of: sut.cancelCollectSetupIntent)
        assertCancelFailed(canceled)
        XCTAssertEqual(handle.callCount, 0)
    }

    @MainActor
    func testSuccessfulRefundRetiresHandleBeforeResolving() async throws {
        let sut = StripeTerminalReactNative()
        let handle = makeCancelable()
        var completion: ConfirmRefundCompletionBlock?
        let process: @convention(block) (
            Terminal, ProcessRefundParameters, CollectRefundConfiguration?, @escaping ConfirmRefundCompletionBlock
        ) -> Cancelable? = { _, _, _, callback in
            completion = callback
            return handle
        }
        try stubTerminalMethod(#selector(Terminal.processRefund(_:collectConfig:completion:)), with: process)
        let refund: Refund = try decodeSdkObject("SCPRefund", json: [
            "id": "re_test", "object": "refund", "amount": 100, "currency": "cad",
            "created": 1772073378, "status": "succeeded", "charge": "ch_test", "metadata": [:]
        ])
        var resolved: NSDictionary?
        sut.processRefund(params: ["chargeId": "ch_test", "amount": 100, "currency": "cad"], resolver: {
            XCTAssertNil(sut.processRefundCancelable)
            resolved = $0 as? NSDictionary
        }, rejecter: unexpectedRejection)
        try XCTUnwrap(completion)(refund, nil)
        XCTAssertNotNil(resolved?["refund"])
        let canceled = await result(of: sut.cancelProcessRefund)
        assertCancelFailed(canceled)
        XCTAssertEqual(handle.callCount, 0)
    }

    private typealias PromiseOperation = (@escaping RCTPromiseResolveBlock, @escaping RCTPromiseRejectBlock) -> Void
    private let unexpectedRejection: RCTPromiseRejectBlock = { _, _, _ in XCTFail("Expected a resolved SDK result") }

    @MainActor
    private func result(of operation: PromiseOperation) async -> NSDictionary? {
        let resolved = expectation(description: "SDK operation resolves")
        var result: NSDictionary?
        operation({
            result = $0 as? NSDictionary
            resolved.fulfill()
        }, unexpectedRejection)
        await fulfillment(of: [resolved], timeout: 1)
        return result
    }

    // Intercept only the native SDK; exercise the real RN entry points and callbacks.
    private func stubTerminalMethod(_ selector: Selector, with block: Any) throws {
        if !Terminal.isInitialized() { Terminal.initWithTokenProvider(TokenProvider.shared) }
        let method = try XCTUnwrap(class_getInstanceMethod(Terminal.self, selector))
        let replacement = imp_implementationWithBlock(block)
        let original = method_setImplementation(method, replacement)
        addTeardownBlock {
            method_setImplementation(method, original)
            imp_removeBlock(replacement)
        }
    }

    private func assertCancelFailed(_ result: NSDictionary?) {
        let error = result?["error"] as? NSDictionary
        XCTAssertEqual(error?["code"] as? String, "CANCEL_FAILED")
        XCTAssertEqual(error?["error_source"] as? String, "rn")
    }

    private func makeCancelable() -> CancellationStub {
        let type: NSObject.Type = CancellationStub.self
        return type.init() as! CancellationStub
    }

    private func makePaymentIntent() throws -> PaymentIntent {
        try decodeSdkObject("SCPPaymentIntent", json: [
            "id": "pi_collect_test", "object": "payment_intent", "created": 1772066544,
            "currency": "usd", "amount": 100, "capture_method": "manual",
            "payment_method_types": ["card_present"], "livemode": false, "status": "requires_confirmation"
        ])
    }

    private func decodeSdkObject<T: NSObject>(_ name: String, json: NSDictionary) throws -> T {
        let type = try XCTUnwrap(NSClassFromString(name) as? NSObject.Type)
        return try XCTUnwrap(type.perform(NSSelectorFromString("decodedObjectFromJSON:"), with: json)?.takeUnretainedValue() as? T)
    }
}

private final class CancellationStub: Cancelable {
    var error: Error?
    var onCancel: ((@escaping ErrorCompletionBlock) -> Void)?
    var callCount = 0

    override func cancel(_ completion: @escaping ErrorCompletionBlock) {
        callCount += 1
        if let onCancel { onCancel(completion) } else { completion(error) }
    }
}
