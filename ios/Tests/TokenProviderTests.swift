import XCTest

@testable import stripe_terminal_react_native
import StripeTerminal

final class TokenProviderTests: XCTestCase {

    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }

    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    func testNormalFlow() {
        let tokenProvider = TokenProvider()
        let expectation = self.expectation(description: "callback called")
        var token: String? = nil
        var error: Error? = nil
      
        let completion: ConnectionTokenCompletionBlock = { result, e in
            token = result
            error = e
            expectation.fulfill()
        }
        tokenProvider.fetchConnectionToken(completion)
        tokenProvider.setConnectionToken(token: "123456", error: nil)
        waitForExpectations(timeout: 2.0) { e in
          XCTAssertEqual(token, "123456")
          XCTAssertNil(error)
          XCTAssertEqual(tokenProvider.queue.count, 0)
        }
    }
  
    func testErrorFlow() {
        let tokenProvider = TokenProvider()
        let expectation = self.expectation(description: "callback called")
        var token: String? = nil
        var error: Error? = nil
      
        let completion: ConnectionTokenCompletionBlock = { result, e in
            token = result
            error = e
            expectation.fulfill()
        }
        tokenProvider.fetchConnectionToken(completion)
        tokenProvider.setConnectionToken(token: nil, error: "failed")
        waitForExpectations(timeout: 2.0) { e in
          XCTAssertNotNil(error)
          XCTAssertNil(token)
          XCTAssertEqual(tokenProvider.queue.count, 0)
        }
    }

    func testMultipleRequestFlow() {
        let tokenProvider = TokenProvider()
        let expectation = self.expectation(description: "callback called")
        expectation.expectedFulfillmentCount = 2
        var token: String? = nil
        var error: Error? = nil
        var token2: String? = nil
        var error2: Error? = nil
      
        let completion: ConnectionTokenCompletionBlock = { result, e in
            token = result
            error = e
            expectation.fulfill()
        }
        let completion2: ConnectionTokenCompletionBlock = { result, e in
            token2 = result
            error2 = e
            expectation.fulfill()
        }
        tokenProvider.fetchConnectionToken(completion)
        tokenProvider.fetchConnectionToken(completion2)
        tokenProvider.setConnectionToken(token: "123456", error: nil)
        waitForExpectations(timeout: 2.0) { e in
          XCTAssertEqual(token, "123456")
          XCTAssertEqual(token2, "123456")
          XCTAssertNil(error)
          XCTAssertNil(error2)
          XCTAssertEqual(tokenProvider.queue.count, 0)
        }
    }
  
    func testMultipleRequestFailFlow() {
        let tokenProvider = TokenProvider()
        let expectation = self.expectation(description: "callback called")
        expectation.expectedFulfillmentCount = 2
        var token: String? = nil
        var error: Error? = nil
        var token2: String? = nil
        var error2: Error? = nil
      
        let completion: ConnectionTokenCompletionBlock = { result, e in
            token = result
            error = e
            expectation.fulfill()
        }
        let completion2: ConnectionTokenCompletionBlock = { result, e in
            token2 = result
            error2 = e
            expectation.fulfill()
        }
        tokenProvider.fetchConnectionToken(completion)
        tokenProvider.fetchConnectionToken(completion2)
        tokenProvider.setConnectionToken(token: "", error: "failed")
        waitForExpectations(timeout: 2.0) { e in
          XCTAssertNotNil(error)
          XCTAssertNotNil(error2)
          XCTAssertNil(token)
          XCTAssertNil(token2)
          XCTAssertEqual(tokenProvider.queue.count, 0)
        }
    }
}
