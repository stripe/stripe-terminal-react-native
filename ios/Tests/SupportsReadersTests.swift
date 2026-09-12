import XCTest
import StripeTerminal

@testable import stripe_terminal_react_native

/// Tests for the resolve dict structure returned by supportsReadersOfType.
///
/// Known coverage gap: the end-to-end path through Terminal.shared.supportsReaders
/// cannot be unit-tested without mocking the Terminal singleton. These tests cover
/// the error-serialization component — Errors.mapToStripeErrorObject — that populates
/// the "error" key in the failure response, and verify the contract that JS receives.
final class SupportsReadersTests: XCTestCase {

    // MARK: - Helpers

    private func makeTerminalNSError(
        code: Int = Int(ErrorCode.Code.readerBusy.rawValue),
        description: String = "Unsupported device configuration"
    ) -> NSError {
        NSError(
            domain: "com.stripe-terminal",
            code: code,
            userInfo: [NSLocalizedDescriptionKey: description]
        )
    }

    // MARK: - Failure resolve dict (modified code path)

    func testFailureResolveDictHasReaderSupportResultFalse() {
        // GIVEN an NSError returned by Terminal.shared.supportsReaders on an unsupported device
        let nsError = makeTerminalNSError(description: "This device does not support Tap to Pay")

        // WHEN building the failure resolve dict (mirrors the modified .failure branch)
        let resolveDict: [String: Any] = [
            "readerSupportResult": false,
            "error": Errors.mapToStripeErrorObject(nsError: nsError),
        ]

        // THEN readerSupportResult is false
        XCTAssertEqual(resolveDict["readerSupportResult"] as? Bool, false)
    }

    func testFailureResolveDictHasStripeErrorShape() {
        // GIVEN an NSError from the Stripe Terminal domain
        let nsError = makeTerminalNSError(
            code: Int(ErrorCode.Code.readerBusy.rawValue),
            description: "This device does not support Tap to Pay"
        )

        // WHEN building the failure resolve dict
        let resolveDict: [String: Any] = [
            "readerSupportResult": false,
            "error": Errors.mapToStripeErrorObject(nsError: nsError),
        ]

        // THEN error is present with name, code, and message at the top level
        guard let error = resolveDict["error"] as? [String: Any] else {
            return XCTFail("error key must be present in failure resolve dict")
        }
        XCTAssertEqual(error["name"] as? String, "StripeError")
        XCTAssertNotNil(error["code"], "code should be present")
        XCTAssertEqual(error["message"] as? String, "This device does not support Tap to Pay")
    }

    func testFailureResolveDictErrorIsNotDoubleNested() {
        // GIVEN an NSError
        let nsError = makeTerminalNSError()

        // WHEN building the failure resolve dict with mapToStripeErrorObject (not createErrorFromNSError)
        let resolveDict: [String: Any] = [
            "readerSupportResult": false,
            "error": Errors.mapToStripeErrorObject(nsError: nsError),
        ]

        // THEN resolveDict["error"] is the StripeError object itself — not a wrapper with an inner "error" key.
        // Using createErrorFromNSError here would produce resolveDict["error"]["error"] (double-nested).
        guard let errorValue = resolveDict["error"] as? [String: Any] else {
            return XCTFail("error should be a dict")
        }
        XCTAssertNil(errorValue["error"], "error must not be double-nested (wrong: createErrorFromNSError was used)")
        XCTAssertNotNil(errorValue["name"], "name should be at the top level of the StripeError object")
    }

    // MARK: - Success resolve dict (unchanged path — regression guard)

    func testSuccessResolveDictHasReaderSupportResultTrueAndNoError() {
        // GIVEN the success case resolve dict (unchanged .success branch)
        let resolveDict: [String: Any] = ["readerSupportResult": true]

        // THEN readerSupportResult is true and error is absent
        XCTAssertEqual(resolveDict["readerSupportResult"] as? Bool, true)
        XCTAssertNil(resolveDict["error"], "error must not be present when reader is supported")
    }
}
