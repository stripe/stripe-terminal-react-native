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
            let formType = result["formType"] as? String,
            let text = result["text"] as? String else {
            XCTFail("CollectInput TestResult should have had text, formType, skipped and toggles")
            return
        }
        XCTAssertFalse(skipped)
        XCTAssertEqual(toggles.count, 2)
        XCTAssertEqual(toggles[0], "enabled")
        XCTAssertEqual(toggles[1], "skipped")
        XCTAssertEqual(formType, "text")
        XCTAssertEqual(text, "Written text from the reader")
        
        output = Mappers.mapFromCollectInputsResults([
            numericResult, phoneResult, emailResult, selectionResult, signatureResult
        ])
        XCTAssertNotNil(output.object(forKey: "collectInputResults"))
        XCTAssertTrue(output["collectInputResults"] is [NSDictionary])
        
        results = output["collectInputResults"] as! [NSDictionary]
        
        let testNumericString = "numericString"
        let testPhone = "phone"
        let testEmail = "email"
        let testSelection = "selection"
        let testSignatureSvg = "signatureSvg"
        XCTAssertEqual(results.count, 5)
        XCTAssertTrue(results[0][testNumericString] != nil)
        XCTAssertTrue(results[1][testPhone] != nil)
        XCTAssertTrue(results[2][testEmail] != nil)
        XCTAssertTrue(results[3][testSelection] != nil)
        XCTAssertTrue(results[4][testSignatureSvg] != nil)
        
        XCTAssertTrue(results[0]["formType"] as! String == "numeric")
        XCTAssertTrue(results[1]["formType"] as! String == "phone")
        XCTAssertTrue(results[2]["formType"] as! String == "email")
        XCTAssertTrue(results[3]["formType"] as! String == "selection")
        XCTAssertTrue(results[4]["formType"] as! String == "signature")
            
        for result in results {
            if ((result.object(forKey: testNumericString)) != nil) {
                guard
                    let skipped = result["skipped"] as? Bool,
                    let toggles = result["toggles"] as? [String],
                    let numericString = result[testNumericString] as? String else {
                    XCTFail("CollectInput NumericResult should have had numericString, skipped and toggles")
                    return
                }
                XCTAssertFalse(skipped)
                XCTAssertEqual(toggles.count, 2)
                XCTAssertEqual(toggles[0], "enabled")
                XCTAssertEqual(toggles[1], "skipped")
                XCTAssertEqual(numericString, "123456")
            }
            if ((result.object(forKey: testPhone)) != nil) {
                guard
                    let skipped = result["skipped"] as? Bool,
                    let toggles = result["toggles"] as? [String],
                    let phone = result[testPhone] as? String else {
                    XCTFail("CollectInput PhoneResult should have had phone, skipped and toggles")
                    return
                }
                XCTAssertFalse(skipped)
                XCTAssertEqual(toggles.count, 2)
                XCTAssertEqual(toggles[0], "enabled")
                XCTAssertEqual(toggles[1], "skipped")
                XCTAssertEqual(phone, "+1 425-555-1234")
            }
            if ((result.object(forKey: testEmail)) != nil) {
                guard
                    let skipped = result["skipped"] as? Bool,
                    let toggles = result["toggles"] as? [String],
                    let email = result[testEmail] as? String else {
                    XCTFail("CollectInput EmailResult should have had email, skipped and toggles")
                    return
                }
                XCTAssertFalse(skipped)
                XCTAssertEqual(toggles.count, 2)
                XCTAssertEqual(toggles[0], "enabled")
                XCTAssertEqual(toggles[1], "skipped")
                XCTAssertEqual(email, "unit.test@abc.com")
            }
            if ((result.object(forKey: testSelection)) != nil) {
                guard
                    let skipped = result["skipped"] as? Bool,
                    let toggles = result["toggles"] as? [String],
                    let selection = result[testSelection] as? String else {
                    XCTFail("CollectInput SelectionResult should have had selection, skipped and toggles")
                    return
                }
                XCTAssertFalse(skipped)
                XCTAssertEqual(toggles.count, 2)
                XCTAssertEqual(toggles[0], "enabled")
                XCTAssertEqual(toggles[1], "skipped")
                XCTAssertEqual(selection, "Yes")
            }
            if ((result.object(forKey: testSignatureSvg)) != nil) {
                guard
                    let skipped = result["skipped"] as? Bool,
                    let toggles = result["toggles"] as? [String],
                    let signatureSvg = result[testSignatureSvg] as? String else {
                    XCTFail("CollectInput SignatureResult should have had signatureSvg, skipped and toggles")
                    return
                }
                XCTAssertFalse(skipped)
                XCTAssertEqual(toggles.count, 2)
                XCTAssertEqual(toggles[0], "enabled")
                XCTAssertEqual(toggles[1], "skipped")
                XCTAssertEqual(signatureSvg, "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 974 943\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"10\" stroke=\"black\"><g><path d=\"M468.5171463.52472 L468.5171 463.52472 \"/></g></svg>")
            }
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
