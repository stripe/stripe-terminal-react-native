import XCTest
import StripeTerminal

@testable import stripe_terminal_react_native

final class ReaderDelegateForwarderTests: XCTestCase {
    override func tearDown() {
        ReaderDelegateForwarder.shared.target = nil
        TokenProvider.delegate = nil
        if Terminal.isInitialized() {
            Terminal.shared.delegate = nil
            Terminal.shared.offlineDelegate = nil
        }
        super.tearDown()
    }

    func testExistingConnectionConfigurationsDeliverDisconnectToNewModuleAfterReload() throws {
        let original = ReaderEventEmitter()
        initialize(original)
        let reader = try makeReader()
        let methods: [DiscoveryMethod] = [.bluetoothScan, .bluetoothProximity, .internet, .tapToPay, .usb]
        let configurations = try methods.map { try connectionConfiguration(original, method: $0) }

        for configuration in configurations {
            let delegate = try XCTUnwrap(configuration.delegate)
            delegate.reader?(reader, didDisconnect: .disconnectRequested)
        }
        XCTAssertEqual(original.events.count, methods.count)
        original.events.removeAll()

        // Reload replaces the module, while native connections keep their original configurations.
        let replacement = ReaderEventEmitter()
        initialize(replacement)

        for configuration in configurations {
            let delegate = try XCTUnwrap(configuration.delegate)
            delegate.reader?(reader, didDisconnect: .rebootRequested)
        }

        XCTAssertTrue(original.events.isEmpty)
        XCTAssertEqual(replacement.events.count, methods.count)
        for (name, body) in replacement.events {
            XCTAssertEqual(name, "didDisconnect")
            XCTAssertEqual(body["reason"] as? String, "rebootRequested")
        }
    }

    func testConnectionDelegateSurvivesOriginalModuleDeallocation() throws {
        var original: ReaderEventEmitter? = ReaderEventEmitter()
        weak var oldModule = original
        initialize(try XCTUnwrap(original))
        let configuration = try connectionConfiguration(try XCTUnwrap(original), method: .tapToPay)

        let replacement = ReaderEventEmitter()
        initialize(replacement)
        original = nil

        XCTAssertNil(oldModule, "The forwarding delegate must not keep the old module alive")
        let delegate = try XCTUnwrap(configuration.delegate as? TapToPayReaderDelegate)
        delegate.reader(try makeReader(), didRequestReaderInput: .tapCard)

        XCTAssertEqual(replacement.events.count, 1)
        XCTAssertEqual(replacement.events.first?.0, "didRequestReaderInput")
        XCTAssertEqual(replacement.events.first?.1["result"] as? [String], ["tapCard"])
    }

    func testReaderEventsReachReplacementModule() throws {
        let original = ReaderEventEmitter()
        initialize(original)
        let configuration = try connectionConfiguration(original, method: .bluetoothScan)
        let delegate = try XCTUnwrap(configuration.delegate as? MobileReaderDelegate)
        let tapToPayDelegate = try XCTUnwrap(configuration.delegate as? TapToPayReaderDelegate)
        let reader = try makeReader()
        let updateType: NSObject.Type = ReaderSoftwareUpdateFixture.self
        let update = try XCTUnwrap(updateType.init() as? ReaderSoftwareUpdate)

        let replacement = ReaderEventEmitter()
        initialize(replacement)

        delegate.readerDidSucceedReconnect?(reader)
        delegate.readerDidFailReconnect?(reader)
        delegate.reader(reader, didReportAvailableUpdate: update)
        delegate.reader(reader, didReportReaderSoftwareUpdateProgress: 0.5)
        XCTAssertEqual((replacement.events.last?.1["result"] as? NSDictionary)?["progress"] as? Float, 0.5)
        delegate.reader(reader, didRequestReaderInput: [.tapCard, .insertCard])
        XCTAssertEqual(replacement.events.last?.1["result"] as? [String], ["insertCard", "tapCard"])
        delegate.reader(reader, didRequestReaderDisplayMessage: .removeCard)
        XCTAssertEqual(replacement.events.last?.1["result"] as? String, "removeCard")
        delegate.reader?(reader, didReportReaderEvent: .cardInserted, info: nil)
        delegate.reader?(reader, didReportBatteryLevel: 0.75, status: .nominal, isCharging: true)
        let battery = replacement.events.last?.1["result"] as? NSDictionary
        XCTAssertEqual(battery?["batteryLevel"] as? Float, 0.75)
        XCTAssertEqual(battery?["batteryStatus"] as? String, "nominal")
        XCTAssertEqual(battery?["isCharging"] as? Bool, true)
        delegate.readerDidReportLowBatteryWarning?(reader)
        tapToPayDelegate.tapToPayReaderDidAcceptTermsOfService?(reader)

        XCTAssertTrue(original.events.isEmpty)
        XCTAssertEqual(replacement.events.map { $0.0 }, [
            "didSucceedReaderReconnect", "didFailReaderReconnect",
            "didReportAvailableUpdate", "didReportReaderSoftwareUpdateProgress",
            "didRequestReaderInput", "didRequestReaderDisplayMessage",
            "didReportReaderEvent", "didUpdateBatteryLevel", "didReportLowBatteryWarning",
            "didAcceptTermsOfService",
        ])
    }

    func testCancelableHandlesReachReplacementModule() throws {
        let original = ReaderEventEmitter()
        initialize(original)
        let configuration = try connectionConfiguration(original, method: .bluetoothScan)
        let delegate = try XCTUnwrap(configuration.delegate as? MobileReaderDelegate)
        let reader = try makeReader()
        let updateType: NSObject.Type = ReaderSoftwareUpdateFixture.self
        let update = try XCTUnwrap(updateType.init() as? ReaderSoftwareUpdate)
        let cancelable: Cancelable = try makeSdkObject("SCPCancelable")

        let replacement = ReaderEventEmitter()
        initialize(replacement)

        delegate.reader?(reader, didStartReconnect: cancelable, disconnectReason: .bluetoothSignalLost)
        XCTAssertTrue(replacement.cancelReaderConnectionCancellable === cancelable)
        XCTAssertNil(original.cancelReaderConnectionCancellable)
        XCTAssertEqual(replacement.events.last?.1["reason"] as? String, "bluetoothSignalLost")

        delegate.reader(reader, didStartInstallingUpdate: update, cancelable: cancelable)
        XCTAssertTrue(replacement.installUpdateCancelable === cancelable)
        XCTAssertNil(original.installUpdateCancelable)
        delegate.reader(reader, didFinishInstallingUpdate: nil, error: nil)
        XCTAssertNil(replacement.installUpdateCancelable)

        XCTAssertTrue(original.events.isEmpty)
        XCTAssertEqual(replacement.events.map { $0.0 }, [
            "didStartReaderReconnect", "didStartInstallingUpdate", "didFinishInstallingUpdate",
        ])
    }

    func testFailedInitializeDoesNotReplaceReaderEventTarget() throws {
        let original = ReaderEventEmitter()
        initialize(original)
        let configuration = try connectionConfiguration(original, method: .internet)
        let replacement = ReaderEventEmitter()
        replacement.initialize(params: [:], resolver: { result in
            XCTAssertNotNil((result as? NSDictionary)?["error"])
        }, rejecter: { _, _, _ in XCTFail("Expected a resolved validation error") })

        let delegate = try XCTUnwrap(configuration.delegate)
        delegate.reader?(try makeReader(), didDisconnect: .disconnectRequested)

        XCTAssertEqual(original.events.count, 1)
        XCTAssertTrue(replacement.events.isEmpty)
    }

    func testReaderEventsWithNoTargetAreSafelyIgnored() throws {
        let module = ReaderEventEmitter()
        initialize(module)
        let configuration = try connectionConfiguration(module, method: .tapToPay)
        let delegate = try XCTUnwrap(configuration.delegate as? TapToPayReaderDelegate)
        let reader = try makeReader()
        ReaderDelegateForwarder.shared.target = nil

        delegate.reader?(reader, didDisconnect: .disconnectRequested)
        delegate.reader(reader, didRequestReaderInput: .tapCard)
        delegate.reader(reader, didReportReaderSoftwareUpdateProgress: 0.5)
        delegate.reader(reader, didFinishInstallingUpdate: nil, error: nil)

        XCTAssertTrue(module.events.isEmpty)
    }

    private func initialize(_ module: ReaderEventEmitter) {
        var resolved = false
        module.initialize(params: ["localeConfig": ["type": "hardcoded", "locale": "en-US"]], resolver: { result in
            resolved = true
            XCTAssertNil((result as? NSDictionary)?["error"])
        }, rejecter: { _, _, _ in XCTFail("Initialization should succeed") })
        XCTAssertTrue(resolved)

        // First-time Terminal initialization can emit token-provider events.
        // Start each test's reader-event assertions after setup is complete.
        module.events.removeAll()
    }

    private func connectionConfiguration(_ module: StripeTerminalReactNative, method: DiscoveryMethod) throws -> ConnectionConfiguration {
        try XCTUnwrap(module.getConnectionConfig(
            locationId: "tml_test",
            autoReconnectOnUnexpectedDisconnect: true,
            failIfInUse: false,
            merchantDisplayName: nil,
            onBehalfOf: nil,
            tosAcceptancePermitted: true,
            testReaderUpdate: nil,
            discoveryMethod: method
        ))
    }

    // Native SDK models do not expose public initializers.
    private func makeSdkObject<T: NSObject>(_ name: String) throws -> T {
        let type = try XCTUnwrap(NSClassFromString(name) as? NSObject.Type)
        return try XCTUnwrap(type.init() as? T)
    }

    private func makeReader() throws -> Reader {
        let reader: Reader = try makeSdkObject("SCPReader")
        reader.setValue("SIMULATED", forKey: "serialNumber")
        return reader
    }
}

private final class ReaderEventEmitter: StripeTerminalReactNative {
    var events: [(String, [String: Any])] = []

    override func sendEvent(withName name: String!, body: Any!) {
        events.append((name, body as? [String: Any] ?? [:]))
    }
}

private final class ReaderSoftwareUpdateFixture: ReaderSoftwareUpdate {
    override var deviceSoftwareVersion: String { "test-version" }
    override var requiredAt: Date { Date(timeIntervalSince1970: 0) }
    override var durationEstimate: UpdateTimeEstimate { .estimate1To2Minutes }
    override var components: UpdateComponent { .firmware }
    override var isTestUpdate: Bool { true }
}
