import XCTest

@testable import stripe_terminal_react_native
import StripeTerminal

/// Tests for the MPOS callback response methods (QR code display and payment method
/// selection) that complete the native SDK's delegate callbacks.
///
/// These verify the error handed to the SDK's completion block, and that each callback
/// is consumed exactly once. What they deliberately do NOT verify: how the native
/// Terminal SDK reacts to that error. The completion blocks are documented in
/// SCPBlocks.h as signalling whether the QR code was *displayed*, and the SDK is a
/// binary framework, so the resulting PaymentIntent state is not observable here.
/// See TERMINAL-57359.
final class QrCodeDisplayCallbackTests: XCTestCase {

    private var sut: StripeTerminalReactNative!

    override func setUp() {
        super.setUp()
        sut = StripeTerminalReactNative()
    }

    override func tearDown() {
        sut = nil
        super.tearDown()
    }

    private func noopResolve(_: Any?) {}
    private func noopReject(_: String?, _: String?, _: Error?) {}

    // =====================================================================
    // failQrCodeDisplay
    // =====================================================================

    func testFailQrCodeDisplay_reportsCanceledInTerminalDomain() {
        var captured: NSError?
        sut.qrCodeDisplayCallback = { error in captured = error as NSError? }

        sut.failQrCodeDisplay(errorMessage: "User cancelled", resolver: noopResolve, rejecter: noopReject)

        XCTAssertEqual(captured?.domain, ErrorConstants.stripeTerminalDomain,
                       "must use the real Terminal domain or Errors.swift maps it to UNEXPECTED_SDK_ERROR")
        XCTAssertEqual(captured?.code, ErrorCode.canceled.rawValue,
                       "must mirror Android's TerminalErrorCode.CANCELED")
        XCTAssertEqual(captured?.localizedDescription, "User cancelled")
    }

    func testFailQrCodeDisplay_codeIsAValidTerminalErrorCode() {
        var captured: NSError?
        sut.qrCodeDisplayCallback = { error in captured = error as NSError? }

        sut.failQrCodeDisplay(errorMessage: nil, resolver: noopResolve, rejecter: noopReject)

        // A code Errors.swift can't resolve to an ErrorCode.Code degrades to
        // UNEXPECTED_SDK_ERROR, which is what the original `code: -1` did.
        XCTAssertNotNil(ErrorCode.Code(rawValue: captured?.code ?? -1),
                        "code must resolve to a real ErrorCode.Code")
    }

    func testFailQrCodeDisplay_usesDefaultMessageWhenNil() {
        var captured: NSError?
        sut.qrCodeDisplayCallback = { error in captured = error as NSError? }

        sut.failQrCodeDisplay(errorMessage: nil, resolver: noopResolve, rejecter: noopReject)

        XCTAssertEqual(captured?.localizedDescription, "QR code display failed")
    }

    func testFailQrCodeDisplay_consumesCallback() {
        var invocations = 0
        sut.qrCodeDisplayCallback = { _ in invocations += 1 }

        sut.failQrCodeDisplay(errorMessage: nil, resolver: noopResolve, rejecter: noopReject)
        sut.failQrCodeDisplay(errorMessage: nil, resolver: noopResolve, rejecter: noopReject)

        XCTAssertEqual(invocations, 1, "callback must fire at most once")
        XCTAssertNil(sut.qrCodeDisplayCallback)
    }

    func testFailQrCodeDisplay_withoutCallback_resolvesErrorWithoutCrashing() {
        var resolved: Any?
        sut.qrCodeDisplayCallback = nil

        sut.failQrCodeDisplay(errorMessage: nil, resolver: { resolved = $0 }, rejecter: noopReject)

        XCTAssertNotNil(resolved, "should resolve an error payload rather than reject or crash")
    }

    // =====================================================================
    // confirmQrCodeDisplayed
    //
    // Regression guard for the root cause of TERMINAL-57359: confirming the QR
    // display consumes the callback, so a subsequent failQrCodeDisplay is a no-op.
    // Cancellation after this point must go through cancelConfirmPaymentIntent.
    // =====================================================================

    func testConfirmQrCodeDisplayed_reportsSuccess() {
        var captured: NSError? = NSError(domain: "sentinel", code: 0)
        sut.qrCodeDisplayCallback = { error in captured = error as NSError? }

        sut.confirmQrCodeDisplayed(resolver: noopResolve, rejecter: noopReject)

        XCTAssertNil(captured, "nil error signals the QR code was displayed successfully")
    }

    func testConfirmQrCodeDisplayed_consumesCallback_makingLaterFailureANoOp() {
        var invocations = 0
        sut.qrCodeDisplayCallback = { _ in invocations += 1 }

        sut.confirmQrCodeDisplayed(resolver: noopResolve, rejecter: noopReject)
        sut.failQrCodeDisplay(errorMessage: "User cancelled", resolver: noopResolve, rejecter: noopReject)

        XCTAssertEqual(invocations, 1,
                       "failQrCodeDisplay after confirm is a no-op — cancel via cancelConfirmPaymentIntent")
        XCTAssertNil(sut.qrCodeDisplayCallback)
    }

    // =====================================================================
    // failPaymentMethodSelection
    // =====================================================================

    func testFailPaymentMethodSelection_reportsCanceledInTerminalDomain() {
        var captured: NSError?
        var capturedOption: PaymentOption?
        sut.paymentMethodSelectionCallback = { option, error in
            capturedOption = option
            captured = error as NSError?
        }

        sut.failPaymentMethodSelection(errorMessage: "User cancelled", resolver: noopResolve, rejecter: noopReject)

        XCTAssertNil(capturedOption)
        XCTAssertEqual(captured?.domain, ErrorConstants.stripeTerminalDomain)
        XCTAssertEqual(captured?.code, ErrorCode.canceled.rawValue,
                       "must mirror Android's TerminalErrorCode.CANCELED")
        XCTAssertEqual(captured?.localizedDescription, "User cancelled")
    }

    func testFailPaymentMethodSelection_usesDefaultMessageWhenNil() {
        var captured: NSError?
        sut.paymentMethodSelectionCallback = { _, error in captured = error as NSError? }

        sut.failPaymentMethodSelection(errorMessage: nil, resolver: noopResolve, rejecter: noopReject)

        XCTAssertEqual(captured?.localizedDescription, "Payment method selection canceled")
    }

    func testFailPaymentMethodSelection_consumesCallback() {
        var invocations = 0
        sut.paymentMethodSelectionCallback = { _, _ in invocations += 1 }

        sut.failPaymentMethodSelection(errorMessage: nil, resolver: noopResolve, rejecter: noopReject)
        sut.failPaymentMethodSelection(errorMessage: nil, resolver: noopResolve, rejecter: noopReject)

        XCTAssertEqual(invocations, 1, "callback must fire at most once")
        XCTAssertNil(sut.paymentMethodSelectionCallback)
    }

    func testFailPaymentMethodSelection_withoutCallback_resolvesErrorWithoutCrashing() {
        var resolved: Any?
        sut.paymentMethodSelectionCallback = nil

        sut.failPaymentMethodSelection(errorMessage: nil, resolver: { resolved = $0 }, rejecter: noopReject)

        XCTAssertNotNil(resolved, "should resolve an error payload rather than reject or crash")
    }
}
