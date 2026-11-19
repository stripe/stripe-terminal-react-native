import Foundation
import StripeTerminal

/// A connected reader outlives the React Native module when JavaScript reloads.
/// Connection configurations hold their delegate weakly and cannot replace it after
/// connecting, so keep one delegate alive and rebind its target during initialize.
final class ReaderDelegateForwarder: NSObject, MobileReaderDelegate, InternetReaderDelegate, TapToPayReaderDelegate {
    static let shared = ReaderDelegateForwarder()

    weak var target: StripeTerminalReactNative?

    private override init() {
        super.init()
    }

    // MARK: - ReaderDelegate (Mobile, Internet, and Tap to Pay)

    func reader(_ reader: Reader, didDisconnect reason: DisconnectReason) {
        target?.reader(reader, didDisconnect: reason)
    }

    func reader(_ reader: Reader, didStartReconnect cancelable: Cancelable, disconnectReason: DisconnectReason) {
        target?.reader(reader, didStartReconnect: cancelable, disconnectReason: disconnectReason)
    }

    func readerDidSucceedReconnect(_ reader: Reader) {
        target?.readerDidSucceedReconnect(reader)
    }

    func readerDidFailReconnect(_ reader: Reader) {
        target?.readerDidFailReconnect(reader)
    }

    // MARK: - ReaderInteractionDelegate (Mobile and Tap to Pay)

    func reader(_ reader: Reader, didStartInstallingUpdate update: ReaderSoftwareUpdate, cancelable: Cancelable?) {
        target?.reader(reader, didStartInstallingUpdate: update, cancelable: cancelable)
    }

    func reader(_ reader: Reader, didReportReaderSoftwareUpdateProgress progress: Float) {
        target?.reader(reader, didReportReaderSoftwareUpdateProgress: progress)
    }

    func reader(_ reader: Reader, didFinishInstallingUpdate update: ReaderSoftwareUpdate?, error: Error?) {
        target?.reader(reader, didFinishInstallingUpdate: update, error: error)
    }

    func reader(_ reader: Reader, didRequestReaderInput inputOptions: ReaderInputOptions) {
        target?.reader(reader, didRequestReaderInput: inputOptions)
    }

    func reader(_ reader: Reader, didRequestReaderDisplayMessage displayMessage: ReaderDisplayMessage) {
        target?.reader(reader, didRequestReaderDisplayMessage: displayMessage)
    }

    // MARK: - MobileReaderDelegate

    func reader(_ reader: Reader, didReportAvailableUpdate update: ReaderSoftwareUpdate) {
        target?.reader(reader, didReportAvailableUpdate: update)
    }

    func reader(_ reader: Reader, didReportReaderEvent event: ReaderEvent, info: [AnyHashable: Any]?) {
        target?.reader(reader, didReportReaderEvent: event, info: info)
    }

    func reader(_ reader: Reader, didReportBatteryLevel batteryLevel: Float, status: BatteryStatus, isCharging: Bool) {
        target?.reader(reader, didReportBatteryLevel: batteryLevel, status: status, isCharging: isCharging)
    }

    func readerDidReportLowBatteryWarning(_ reader: Reader) {
        target?.readerDidReportLowBatteryWarning(reader)
    }

    // MARK: - TapToPayReaderDelegate

    func tapToPayReaderDidAcceptTermsOfService(_ reader: Reader) {
        target?.tapToPayReaderDidAcceptTermsOfService(reader)
    }
}
