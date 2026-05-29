import XCTest

@testable import stripe_terminal_react_native
import StripeTerminal

/// Tests for PaymentIntent/SetupIntent map management.
///
/// Known coverage gaps (cannot be unit-tested without Terminal.shared mocking):
/// - disconnectReader, rebootReader, clearCachedCredentials end-to-end: these call
///   clearAllIntentMaps() inside a Terminal.shared completion handler. We test
///   clearAllIntentMaps() directly, but cannot verify the wiring without a mock Terminal.
///   Both iOS and Android clear on-success (inside callback).
/// - updatePaymentIntentFromError / updateSetupIntentFromError positive paths: require
///   constructing ConfirmPaymentIntentError / ConfirmSetupIntentError which have no
///   public initializer. Only negative paths (regular NSError) are tested.
final class IntentMapClearingTests: XCTestCase {

    private var sut: StripeTerminalReactNative!

    override func setUp() {
        super.setUp()
        sut = StripeTerminalReactNative()
    }

    override func tearDown() {
        sut = nil
        super.tearDown()
    }

    /// Creates a dummy PaymentIntent via Obj-C runtime since the SDK has no public initializer.
    private func makeDummyPaymentIntent() -> PaymentIntent {
        let cls: AnyClass = NSClassFromString("SCPPaymentIntent")!
        let instance = (cls as! NSObject.Type).init()
        return instance as! PaymentIntent
    }

    /// Creates a dummy SetupIntent via Obj-C runtime since the SDK has no public initializer.
    private func makeDummySetupIntent() -> SetupIntent {
        let cls: AnyClass = NSClassFromString("SCPSetupIntent")!
        let instance = (cls as! NSObject.Type).init()
        return instance as! SetupIntent
    }

    private func populateMaps() {
        sut.paymentIntents["pi_uuid"] = makeDummyPaymentIntent()
        sut.setupIntents["si_uuid"] = makeDummySetupIntent()

        XCTAssertFalse(sut.paymentIntents.isEmpty)
        XCTAssertFalse(sut.setupIntents.isEmpty)
    }

    // =====================================================================
    // clearAllIntentMaps
    // =====================================================================

    func testClearAllIntentMaps_clearsBothMaps() {
        populateMaps()
        sut.clearAllIntentMaps()

        XCTAssertTrue(sut.paymentIntents.isEmpty)
        XCTAssertTrue(sut.setupIntents.isEmpty)
    }

    func testClearAllIntentMaps_isIdempotent() {
        sut.clearAllIntentMaps()

        XCTAssertTrue(sut.paymentIntents.isEmpty)
        XCTAssertTrue(sut.setupIntents.isEmpty)
    }

    func testClearAllIntentMaps_clearsMultipleEntries() {
        sut.paymentIntents["pi_1"] = makeDummyPaymentIntent()
        sut.paymentIntents["pi_2"] = makeDummyPaymentIntent()
        sut.setupIntents["si_1"] = makeDummySetupIntent()
        sut.setupIntents["si_2"] = makeDummySetupIntent()
        sut.setupIntents["si_3"] = makeDummySetupIntent()

        sut.clearAllIntentMaps()

        XCTAssertTrue(sut.paymentIntents.isEmpty)
        XCTAssertTrue(sut.setupIntents.isEmpty)
    }

    func testClearAllIntentMaps_onlyAffectsIntentMaps() {
        populateMaps()
        sut.discoveredReadersList = [Reader]()

        sut.clearAllIntentMaps()

        XCTAssertTrue(sut.paymentIntents.isEmpty)
        XCTAssertTrue(sut.setupIntents.isEmpty)
        XCTAssertNotNil(sut.discoveredReadersList, "discoveredReadersList should not be affected")
    }

    // =====================================================================
    // updatePaymentIntentFromError — negative cases
    // (Positive cases require real ConfirmPaymentIntentError which can't be constructed)
    // =====================================================================

    func testUpdatePaymentIntentFromError_regularNSError_doesNotModifyMap() {
        let pi = makeDummyPaymentIntent()
        sut.paymentIntents["uuid"] = pi

        let regularError = NSError(domain: "com.stripe-terminal", code: 1000, userInfo: nil)
        sut.updatePaymentIntentFromError(regularError, uuid: "uuid")

        XCTAssertTrue(sut.paymentIntents["uuid"] === pi, "map should retain original intent for non-confirm errors")
    }

    func testUpdatePaymentIntentFromError_emptyMap_doesNotCrash() {
        let regularError = NSError(domain: "com.stripe-terminal", code: 1000, userInfo: nil)
        sut.updatePaymentIntentFromError(regularError, uuid: "nonexistent")

        XCTAssertTrue(sut.paymentIntents.isEmpty)
    }

    // =====================================================================
    // updateSetupIntentFromError — negative cases
    // =====================================================================

    func testUpdateSetupIntentFromError_regularNSError_doesNotModifyMap() {
        let si = makeDummySetupIntent()
        sut.setupIntents["uuid"] = si

        let regularError = NSError(domain: "com.stripe-terminal", code: 1000, userInfo: nil)
        sut.updateSetupIntentFromError(regularError, uuid: "uuid")

        XCTAssertTrue(sut.setupIntents["uuid"] === si, "map should retain original intent for non-confirm errors")
    }

    func testUpdateSetupIntentFromError_emptyMap_doesNotCrash() {
        let regularError = NSError(domain: "com.stripe-terminal", code: 1000, userInfo: nil)
        sut.updateSetupIntentFromError(regularError, uuid: "nonexistent")

        XCTAssertTrue(sut.setupIntents.isEmpty)
    }

    // =====================================================================
    // Direct map manipulation (covers create/retrieve/collect/cancel patterns)
    // =====================================================================

    func testPaymentIntentMap_storeAndRetrieve() {
        let pi = makeDummyPaymentIntent()
        sut.paymentIntents["uuid"] = pi

        XCTAssertTrue(sut.paymentIntents["uuid"] === pi)
        XCTAssertEqual(sut.paymentIntents.count, 1)
    }

    func testSetupIntentMap_storeAndRetrieve() {
        let si = makeDummySetupIntent()
        sut.setupIntents["uuid"] = si

        XCTAssertTrue(sut.setupIntents["uuid"] === si)
        XCTAssertEqual(sut.setupIntents.count, 1)
    }

    func testPaymentIntentMap_setNilRemovesEntry() {
        sut.paymentIntents["uuid"] = makeDummyPaymentIntent()
        sut.paymentIntents["uuid"] = nil

        XCTAssertNil(sut.paymentIntents["uuid"])
        XCTAssertEqual(sut.paymentIntents.count, 0)
    }

    func testSetupIntentMap_setNilRemovesEntry() {
        sut.setupIntents["uuid"] = makeDummySetupIntent()
        sut.setupIntents["uuid"] = nil

        XCTAssertNil(sut.setupIntents["uuid"])
        XCTAssertEqual(sut.setupIntents.count, 0)
    }

    func testPaymentIntentMap_overwritePreservesOtherEntries() {
        let pi1 = makeDummyPaymentIntent()
        let pi2 = makeDummyPaymentIntent()
        let piOther = makeDummyPaymentIntent()

        sut.paymentIntents["uuid"] = pi1
        sut.paymentIntents["other"] = piOther
        sut.paymentIntents["uuid"] = pi2

        XCTAssertTrue(sut.paymentIntents["uuid"] === pi2, "should be updated to new intent")
        XCTAssertTrue(sut.paymentIntents["other"] === piOther, "other entries should be preserved")
        XCTAssertEqual(sut.paymentIntents.count, 2)
    }

    func testSetupIntentMap_overwritePreservesOtherEntries() {
        let si1 = makeDummySetupIntent()
        let si2 = makeDummySetupIntent()
        let siOther = makeDummySetupIntent()

        sut.setupIntents["uuid"] = si1
        sut.setupIntents["other"] = siOther
        sut.setupIntents["uuid"] = si2

        XCTAssertTrue(sut.setupIntents["uuid"] === si2, "should be updated to new intent")
        XCTAssertTrue(sut.setupIntents["other"] === siOther, "other entries should be preserved")
        XCTAssertEqual(sut.setupIntents.count, 2)
    }
}
