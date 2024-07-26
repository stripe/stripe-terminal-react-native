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
        let output: NSDictionary = Mappers.mapFromCollectInputsResults([
            textResult
        ])
        XCTAssertNotNil(output.object(forKey: "collectInputResults"))
        XCTAssertTrue(output["collectInputResults"] is [NSDictionary])

        let results: [NSDictionary] = output["collectInputResults"] as! [NSDictionary]

        XCTAssertEqual(results.count, 1)
        guard let result = results.first else {
            XCTFail("CollectInput result should have had a result")
            return
        }
        guard
            let skipped = result["skipped"] as? Bool,
            let toggles = result["toggles"] as? [String],
            let text = result["text"] as? String else {
            XCTFail("CollectInput result should have had text, skipped and toggles")
            return
        }
        XCTAssertFalse(skipped)
        XCTAssertEqual(toggles.count, 2)
        XCTAssertEqual(toggles[0], "enabled")
        XCTAssertEqual(toggles[1], "skipped")
        XCTAssertEqual(text, "Written text from the reader")
    }
}

struct TestableTextResult : stripe_terminal_react_native.TextResult {
    var skipped: Bool
    var text: String?
    var toggles: [NSNumber]
}
