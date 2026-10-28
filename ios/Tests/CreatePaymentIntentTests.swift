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

    func testCaptureMethodMapping() {
        XCTAssertNil(Mappers.mapToCaptureMethod(nil), "nil should preserve the SDK's automatic-async default")
        XCTAssertEqual(Mappers.mapToCaptureMethod("automatic"), .automatic)
        XCTAssertEqual(Mappers.mapToCaptureMethod("automatic_async"), .automaticAsync)
        XCTAssertEqual(Mappers.mapToCaptureMethod("manual"), .manual)
        XCTAssertNil(Mappers.mapToCaptureMethod("unknown_value"))

        XCTAssertEqual(Mappers.mapFromCaptureMethod(.automatic), "automatic")
        XCTAssertEqual(Mappers.mapFromCaptureMethod(.automaticAsync), "automatic_async")
        XCTAssertEqual(Mappers.mapFromCaptureMethod(.manual), "manual")
    }

    func testInstallmentsInputIsAbsentWhenPaymentMethodOptionsAreAbsent() throws {
        let installments = try sut.mapToInstallmentsParameters(nil)

        XCTAssertNil(installments)
    }

    func testEmptyPaymentMethodOptionsOmitsInstallments() throws {
        let installments = try sut.mapToInstallmentsParameters([:])

        XCTAssertNil(installments)
    }

    func testEnabledInstallmentsInputBuildsAnEnabledNativeModel() throws {
        let installments = try sut.mapToInstallmentsParameters([
            "installments": ["enabled": true]
        ])

        XCTAssertEqual(installments?.enabled, true)
    }

    func testDisabledInstallmentsInputPreservesFalseInTheNativeModel() throws {
        let installments = try sut.mapToInstallmentsParameters([
            "installments": ["enabled": false]
        ])

        XCTAssertEqual(installments?.enabled, false)
    }

    func testInvalidInstallmentsEnabledInputThrows() {
        XCTAssertThrowsError(try sut.mapToInstallmentsParameters([
            "installments": ["enabled": "true"]
        ]))
    }
}
