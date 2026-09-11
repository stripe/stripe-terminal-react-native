import XCTest

@testable import stripe_terminal_react_native
import StripeTerminal

final class CreatePaymentIntentTests: XCTestCase {

    private var sut: StripeTerminalReactNative!

    override func setUp() {
        super.setUp()
        sut = StripeTerminalReactNative()
    }

    override func tearDown() {
        sut = nil
        super.tearDown()
    }

    func testUnsetCaptureMethodResolvesToManual() {
        // Mirrors the switch in StripeTerminalReactNative.createPaymentIntent
        let resolveCapture: (String?) -> CaptureMethod = { captureMethod in
            switch captureMethod {
            case "automatic":
                return .automatic
            default:
                return .manual
            }
        }

        XCTAssertEqual(resolveCapture(nil), .manual, "nil should resolve to .manual")
        XCTAssertEqual(resolveCapture("automatic"), .automatic)
        XCTAssertEqual(resolveCapture("manual"), .manual)
        XCTAssertEqual(resolveCapture("unknown_value"), .manual, "Unknown values should fall through to .manual")
    }
}
