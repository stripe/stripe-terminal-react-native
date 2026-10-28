import XCTest

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
}
