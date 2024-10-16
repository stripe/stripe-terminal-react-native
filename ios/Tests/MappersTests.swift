import XCTest

@testable import stripe_terminal_react_native
import StripeTerminal

final class MappersTests: XCTestCase {

    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }

    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    func testLocationStatusMapper() {
        // bric note: Just an example, this isn't really a useful test since this mapper just maps from
        // and to constants
        XCTAssertEqual(Mappers.mapFromLocationStatus(.notSet), "notSet")
    }

    func testCollectInputsReturnsMapper() {
        let textResult = TestableTextResult(skipped: false, text: "Written text from the reader", toggles: [
            ToggleResult.enabled.rawValue as NSNumber,
            ToggleResult.skipped.rawValue as NSNumber,
        ])
        let numericResult = TestableNumericResult(skipped: false, numericString: "123456", toggles: [
            ToggleResult.enabled.rawValue as NSNumber,
            ToggleResult.skipped.rawValue as NSNumber,
        ])
        let phoneResult = TestablePhoneResult(skipped: false, phone: "+1 425-555-1234", toggles: [
            ToggleResult.enabled.rawValue as NSNumber,
            ToggleResult.skipped.rawValue as NSNumber,
        ])
        let emailResult = TestableEmailResult(skipped: false, email: "unit.test@abc.com", toggles: [
            ToggleResult.enabled.rawValue as NSNumber,
            ToggleResult.skipped.rawValue as NSNumber,
        ])
        let selectionResult = TestableSelectionResult(skipped: false, selection: "Yes", toggles: [
            ToggleResult.enabled.rawValue as NSNumber,
            ToggleResult.skipped.rawValue as NSNumber,
        ])
        let signatureResult = TestableSignatureResult(skipped: false, signatureSvg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 974 943\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"10\" stroke=\"black\"><g><path d=\"M468.5171463.52472 L468.5171 463.52472 \"/></g></svg>", toggles: [
            ToggleResult.enabled.rawValue as NSNumber,
            ToggleResult.skipped.rawValue as NSNumber,
        ])
        var output: NSDictionary = Mappers.mapFromCollectInputsResults([
            textResult
        ])
        XCTAssertNotNil(output.object(forKey: "collectInputResults"))
        XCTAssertTrue(output["collectInputResults"] is [NSDictionary])

        var results: [NSDictionary] = output["collectInputResults"] as! [NSDictionary]

        XCTAssertEqual(results.count, 1)
        guard let result = results.first else {
            XCTFail("CollectInput result should have had a result")
            return
        }
        guard
            let skipped = result["skipped"] as? Bool,
            let toggles = result["toggles"] as? [String],
            let text = result["formType"] as? String else {
            XCTFail("CollectInput TestResult should have had formType, skipped and toggles")
            return
        }
        XCTAssertFalse(skipped)
        XCTAssertEqual(toggles.count, 2)
        XCTAssertEqual(toggles[0], "enabled")
        XCTAssertEqual(toggles[1], "skipped")
        XCTAssertEqual(text, "text")
        
        output = Mappers.mapFromCollectInputsResults([
            numericResult, phoneResult, emailResult, selectionResult, signatureResult
        ])
        XCTAssertNotNil(output.object(forKey: "collectInputResults"))
        XCTAssertTrue(output["collectInputResults"] is [NSDictionary])
        
        results = output["collectInputResults"] as! [NSDictionary]
        
        XCTAssertEqual(results.count, 5)
        XCTAssertTrue(results[0]["formType"] as! String == "numeric")
        XCTAssertTrue(results[1]["formType"] as! String == "phone")
        XCTAssertTrue(results[2]["formType"] as! String == "email")
        XCTAssertTrue(results[3]["formType"] as! String == "selection")
        XCTAssertTrue(results[4]["formType"] as! String == "signature")
            
        for result in results {
            guard
                let skipped = result["skipped"] as? Bool,
                let toggles = result["toggles"] as? [String] else {
                XCTFail("CollectInput should have had skipped and toggles")
                return
            }
            XCTAssertFalse(skipped)
            XCTAssertEqual(toggles.count, 2)
            XCTAssertEqual(toggles[0], "enabled")
            XCTAssertEqual(toggles[1], "skipped")
        }
    }
}

struct TestableTextResult : stripe_terminal_react_native.TextResult {
    var skipped: Bool
    var text: String?
    var toggles: [NSNumber]
}

struct TestableNumericResult : stripe_terminal_react_native.NumericResult {
    var skipped: Bool
    var numericString: String?
    var toggles: [NSNumber]
}

struct TestablePhoneResult : stripe_terminal_react_native.PhoneResult {
    var skipped: Bool
    var phone: String?
    var toggles: [NSNumber]
}

struct TestableEmailResult : stripe_terminal_react_native.EmailResult {
    var skipped: Bool
    var email: String?
    var toggles: [NSNumber]
}

struct TestableSelectionResult : stripe_terminal_react_native.SelectionResult {
    var skipped: Bool
    var selection: String?
    var toggles: [NSNumber]
}

struct TestableSignatureResult : stripe_terminal_react_native.SignatureResult {
    var skipped: Bool
    var signatureSvg: String?
    var toggles: [NSNumber]
}
