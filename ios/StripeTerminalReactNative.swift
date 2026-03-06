import StripeTerminal
import Foundation

enum ReactNativeConstants: String, CaseIterable {
    case UPDATE_DISCOVERED_READERS = "didUpdateDiscoveredReaders"
    case FINISH_DISCOVERING_READERS = "didFinishDiscoveringReaders"
    case REPORT_AVAILABLE_UPDATE = "didReportAvailableUpdate"
    case START_INSTALLING_UPDATE = "didStartInstallingUpdate"
    case REPORT_UPDATE_PROGRESS = "didReportReaderSoftwareUpdateProgress"
    case FINISH_INSTALLING_UPDATE = "didFinishInstallingUpdate"
    case FETCH_TOKEN_PROVIDER = "onFetchTokenProviderListener"
    case REQUEST_READER_INPUT = "didRequestReaderInput"
    case REQUEST_READER_DISPLAY_MESSAGE = "didRequestReaderDisplayMessage"
    case CHANGE_PAYMENT_STATUS = "didChangePaymentStatus"
    case CHANGE_CONNECTION_STATUS = "didChangeConnectionStatus"
    case START_READER_RECONNECT = "didStartReaderReconnect"
    case READER_RECONNECT_SUCCEED = "didSucceedReaderReconnect"
    case READER_RECONNECT_FAIL = "didFailReaderReconnect"
    case CHANGE_OFFLINE_STATUS = "didChangeOfflineStatus"
    case FORWARD_PAYMENT_INTENT = "didForwardPaymentIntent"
    case REPORT_FORWARDING_ERROR = "didReportForwardingError"
    case DISCONNECT = "didDisconnect"
    case UPDATE_BATTERY_LEVEL = "didUpdateBatteryLevel"
    case REPORT_LOW_BATTERY_WARNING = "didReportLowBatteryWarning"
    case REPORT_READER_EVENT = "didReportReaderEvent"
    case ACCEPT_TERMS_OF_SERVICE = "didAcceptTermsOfService"
    case PAYMENT_METHOD_SELECTION_REQUIRED = "onPaymentMethodSelectionRequired"
    case QR_CODE_DISPLAY_REQUIRED = "onQrCodeDisplayRequired"
}

@objc(StripeTerminalReactNative)
class StripeTerminalReactNative: RCTEventEmitter, DiscoveryDelegate, MobileReaderDelegate, TerminalDelegate, OfflineDelegate, InternetReaderDelegate, TapToPayReaderDelegate, ReaderDelegate {

    var discoveredReadersList: [Reader]? = nil
    var paymentIntents: [AnyHashable : PaymentIntent] = [:]
    var setupIntents: [AnyHashable : SetupIntent] = [:]

    override func supportedEvents() -> [String]! {
        return ReactNativeConstants.allCases.map {
            $0.rawValue
        }
    }

    @objc override func constantsToExport() -> [AnyHashable : Any]! {
        return ReactNativeConstants.allCases.reduce(into: [String: String]()) {
            $0[String(describing: $1)] = $1.rawValue
        }
    }

    @objc override static func requiresMainQueueSetup() -> Bool {
        return false
    }

    var discoverCancelable: Cancelable? = nil
    var easyConnectCancelable: Cancelable? = nil
    var collectPaymentMethodCancelable: Cancelable? = nil
    var processRefundCancelable: Cancelable? = nil
    var collectSetupIntentCancelable: Cancelable? = nil
    var installUpdateCancelable: Cancelable? = nil
    var readReusableCardCancelable: Cancelable? = nil
    var cancelReaderConnectionCancellable: Cancelable? = nil
    var collectDataCancellable: Cancelable? = nil
    var collectInputsCancellable: Cancelable? = nil
    var confirmPaymentIntentCancelable: Cancelable? = nil
    var processPaymentIntentCancelable: Cancelable? = nil
    var confirmSetupIntentCancelable: Cancelable? = nil
    var processSetupIntentCancelable: Cancelable? = nil
    var loggingToken: String? = nil

    // Single callback storage for MPOS - only one payment flow at a time
    var paymentMethodSelectionCallback: PaymentMethodSelectionCompletionBlock?
    var qrCodeDisplayCallback: QrCodeDisplayCompletionBlock?

    // Registration flags - JS tells native whether it will handle callbacks
    var paymentMethodSelectionHandlerRegistered = false
    var qrCodeDisplayHandlerRegistered = false

    // Store available payment options to select from later
    var availablePaymentOptions: [PaymentOption] = []


    func terminal(_ terminal: Terminal, didUpdateDiscoveredReaders readers: [Reader]) {
        discoveredReadersList = readers
        guard terminal.connectionStatus == .notConnected || terminal.connectionStatus == .discovering else { return }

        sendEvent(withName: ReactNativeConstants.UPDATE_DISCOVERED_READERS.rawValue, body: ["readers": Mappers.mapFromReaders(readers)])
    }

    @objc(initialize:resolver:rejecter:)
    func initialize(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        // iOS SDK doesn't support Apps On Devices
        if let error = Errors.validateAppsOnDevicesConnectionTokenProviderNotUsed(params) {
            resolve(error)
            return
        }

        var connectedReader: NSDictionary? = nil

        TokenProvider.delegate = self

        let logLevel = Mappers.mapToLogLevel(params["logLevel"] as? String)

        if (Terminal.isInitialized()) {
            if let reader = Terminal.shared.connectedReader {
                connectedReader = Mappers.mapFromReader(reader)
            }
            Terminal.shared.logLevel = logLevel
        } else {
            Terminal.initWithTokenProvider(TokenProvider.shared)
            Terminal.shared.logLevel = logLevel
        }

        Terminal.shared.offlineDelegate = self

        if Terminal.shared.responds(to: NSSelectorFromString("setReactNativeSdkVersion:")) && params["reactNativeVersion"] != nil {
            Terminal.shared.performSelector(
                inBackground: NSSelectorFromString("setReactNativeSdkVersion:"),
                with: params["reactNativeVersion"]
            )
        }

        Terminal.shared.delegate = self

        resolve(["reader": connectedReader])
    }

    @objc(cancelCollectPaymentMethod:rejecter:)
    func cancelCollectPaymentMethod(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let cancelable = collectPaymentMethodCancelable else {
            resolve(Errors.createErrorFromCode(code: ErrorCode.cancelFailedAlreadyCompleted, message: "collectPaymentMethod could not be canceled because the command has already been canceled or has completed."))
            return
        }
        DispatchQueue.main.async {
            cancelable.cancel() { error in
                if let error = error as NSError? {
                    resolve(Errors.createErrorFromNSError(nsError: error))
                } else {
                    resolve([:])
                }
            }
        }
    }

    @objc(cancelProcessRefund:rejecter:)
    func cancelProcessRefund(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let cancelable = processRefundCancelable else {
            resolve(Errors.createErrorFromCode(code: ErrorCode.cancelFailedAlreadyCompleted, message: "processRefund could not be canceled because the command has already been canceled or has completed."))
            return
        }
        DispatchQueue.main.async {
            cancelable.cancel() { error in
                if let error = error as NSError? {
                    resolve(Errors.createErrorFromNSError(nsError: error))
                } else {
                    resolve([:])
                }
            }
        }
    }

    @objc(cancelConfirmPaymentIntent:rejecter:)
    func cancelConfirmPaymentIntent(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let cancelable = confirmPaymentIntentCancelable else {
            resolve(Errors.createErrorFromCode(code: ErrorCode.cancelFailedAlreadyCompleted, message: "cancelConfirmPaymentIntent could not be canceled because the command has already been canceled or has completed."))
            return
        }
        cancelable.cancel() { error in
            if let error = error as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error))
            } else {
                resolve([:])
            }
        }
    }

    @objc(cancelProcessPaymentIntent:rejecter:)
    func cancelProcessPaymentIntent(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let cancelable = processPaymentIntentCancelable else {
            resolve(Errors.createErrorFromCode(code: ErrorCode.cancelFailedAlreadyCompleted, message: "processPaymentIntent could not be canceled because the command has already been canceled or has completed."))
            return
        }
        cancelable.cancel() { error in
            if let error = error as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error))
            } else {
                resolve([:])
            }
        }
    }

    @objc(cancelConfirmSetupIntent:rejecter:)
    func cancelConfirmSetupIntent(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let cancelable = confirmSetupIntentCancelable else {
            resolve(Errors.createErrorFromCode(code: ErrorCode.cancelFailedAlreadyCompleted, message: "cancelConfirmSetupIntent could not be canceled because the command has already been canceled or has completed."))
            return
        }
        cancelable.cancel() { error in
            if let error = error as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error))
            } else {
                resolve([:])
            }
        }
    }

    @objc(cancelProcessSetupIntent:rejecter:)
    func cancelProcessSetupIntent(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let cancelable = processSetupIntentCancelable else {
            resolve(Errors.createErrorFromCode(code: ErrorCode.cancelFailedAlreadyCompleted, message: "cancelProcessSetupIntent could not be canceled because the command has already been canceled or has completed."))
            return
        }
        cancelable.cancel() { error in
            if let error = error as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error))
            } else {
                resolve([:])
            }
        }
    }

    @objc(cancelCollectSetupIntent:rejecter:)
    func cancelCollectSetupIntent(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let cancelable = collectSetupIntentCancelable else {
            resolve(Errors.createErrorFromCode(code: ErrorCode.cancelFailedAlreadyCompleted, message: "collectSetupIntent could not be canceled because the command has already been canceled or has completed."))
            return
        }
        DispatchQueue.main.async {
            cancelable.cancel() { error in
                if let error = error as NSError? {
                    resolve(Errors.createErrorFromNSError(nsError: error))
                } else {
                    resolve([:])
                }
            }
        }
    }

    @objc(simulateReaderUpdate:resolver:rejecter:)
    func simulateReaderUpdate(update: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        Terminal.shared.simulatorConfiguration.availableReaderUpdate = Mappers.mapToSimulateReaderUpdate(update)
        resolve([:])
    }

    @objc(setSimulatedCard:resolver:rejecter:)
    func setSimulatedCard(cardNumber: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        Terminal.shared.simulatorConfiguration.simulatedCard = SimulatedCard(testCardNumber: cardNumber)
        resolve([:])
    }

    @objc(setSimulatedOfflineMode:resolver:rejecter:)
    func setSimulatedOfflineMode(simulatedOffline: Bool, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        Terminal.shared.simulatorConfiguration.offlineEnabled = simulatedOffline;
        resolve([:])
    }

    @objc(setSimulatedCollectInputsResult:resolver:rejecter:)
    func setSimulatedCollectInputsResult(
      _ behavior: String,
      resolver resolve: @escaping RCTPromiseResolveBlock,
      rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        let allowedValues = ["all", "none", "timeout"]
        if !allowedValues.contains(behavior.lowercased()) {
            reject("Failed", "You must provide \(allowedValues) parameters.", nil)
            return
        }

        let result: SimulatedCollectInputsResult = Mappers.mapToSimulatedCollectInputsResult(behavior)
        Terminal.shared.simulatorConfiguration.simulatedCollectInputsResult = result
        resolve([:])
    }

    @objc(setConnectionToken:resolver:rejecter:)
    func setConnectionToken(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        let token = params["token"] as? String
        let error = params["error"] as? String

        TokenProvider.shared.setConnectionToken(token: token, error: error)
        resolve([:])
    }

    @objc(discoverReaders:resolver:rejecter:)
    func discoverReaders(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let simulated = params["simulated"] as? Bool
        let discoveryMethod = params["discoveryMethod"] as? String
        let timeout = params["timeout"] as? UInt ?? 0
        let locationId = params["locationId"] as? String
        let discoveryFilter = Mappers.mapToDiscoveryFilter(params["discoveryFilter"] as? NSDictionary)
        let config: DiscoveryConfiguration
        do {
            config = try Mappers.mapToDiscoveryConfiguration(discoveryMethod, simulated: simulated ?? false,  locationId: locationId, discoveryFilter: discoveryFilter, timeout: timeout)
        } catch {
            resolve(Errors.createErrorFromNSError(nsError: error as NSError))
          return
        }

        guard discoverCancelable == nil else {
            let message = Errors.createBusyMessage(command: "discoverReaders", by: "discoverReaders")
            resolve(Errors.createErrorFromRnCodeEnum(rnCode: Errors.RNErrorCode.READER_BUSY, message: message))
            return
        }

        self.discoverCancelable = Terminal.shared.discoverReaders(config, delegate: self) { error in
            self.discoverCancelable = nil
            if let error = error as NSError? {
                let _error = Errors.createErrorFromNSError(nsError: error)

                resolve(_error)
                self.sendEvent(withName: ReactNativeConstants.FINISH_DISCOVERING_READERS.rawValue, body: ["result": _error])
            } else {
                resolve([:])
                self.sendEvent(withName: ReactNativeConstants.FINISH_DISCOVERING_READERS.rawValue, body: ["result": ["error": nil]])
            }
        }
    }

    @objc(cancelDiscovering:rejecter:)
    func cancelDiscovering(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let cancelable = discoverCancelable else {
            resolve(Errors.createErrorFromCode(code: ErrorCode.cancelFailedAlreadyCompleted, message: "discoverReaders could not be canceled because the command has already been canceled or has completed."))
            return
        }
        cancelable.cancel() { error in
            if let error = error as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error))
            } else {
                resolve([:])
            }
        }
    }

    @objc(easyConnect:resolver:rejecter:)
    func easyConnect(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let discoveryMethod = params["discoveryMethod"] as? String else {
            resolve(Errors.createErrorFromRnCodeEnum(rnCode: Errors.RNErrorCode.INVALID_REQUIRED_PARAMETER, message: "You must provide a discoveryMethod"))
            return
        }

        let simulated = params["simulated"] as? Bool ?? false
        let timeout = params["timeout"] as? UInt ?? 0
        let locationId = params["locationId"] as? String
        let discoveryFilter = Mappers.mapToDiscoveryFilter(params["discoveryFilter"] as? NSDictionary)

        let autoReconnectOnUnexpectedDisconnect = params["autoReconnectOnUnexpectedDisconnect"] as? Bool ?? true
        let failIfInUse = params["failIfInUse"] as? Bool ?? false
        let merchantDisplayName = params["merchantDisplayName"] as? String
        let onBehalfOf = params["onBehalfOf"] as? String
        let tosAcceptancePermitted = params["tosAcceptancePermitted"] as? Bool ?? true

        let discoveryConfig: DiscoveryConfiguration
        do {
            discoveryConfig = try Mappers.mapToDiscoveryConfiguration(discoveryMethod, simulated: simulated, locationId: locationId, discoveryFilter: discoveryFilter, timeout: timeout)
        } catch {
            resolve(Errors.createErrorFromNSError(nsError: error as NSError))
            return
        }
        let connectionConfig: ConnectionConfiguration
        do {
            connectionConfig = try getConnectionConfig(
              locationId: locationId,
              autoReconnectOnUnexpectedDisconnect: autoReconnectOnUnexpectedDisconnect,
              failIfInUse: failIfInUse,
              merchantDisplayName: merchantDisplayName,
              onBehalfOf: onBehalfOf,
              tosAcceptancePermitted: tosAcceptancePermitted,
              discoveryMethod: Mappers.mapToDiscoveryMethod(discoveryMethod))!
        } catch {
            resolve(Errors.createErrorFromNSError(nsError: error as NSError))
            return
        }

        let easyConnectConfig: EasyConnectConfiguration
        do {
            easyConnectConfig = try getEasyConnectConfiguration(
                discoveryConfig: discoveryConfig,
                connectionConfig: connectionConfig
            )
        } catch {
            resolve(Errors.createErrorFromNSError(nsError: error as NSError))
            return
        }

        guard easyConnectCancelable == nil else {
            let message = Errors.createBusyMessage(command: "easyConnect", by: "easyConnect")
            resolve(Errors.createErrorFromRnCodeEnum(rnCode: Errors.RNErrorCode.READER_BUSY, message: message))
            return
        }
        self.easyConnectCancelable = Terminal.shared.easyConnect(easyConnectConfig) { reader, error in
            self.easyConnectCancelable = nil
            if let reader {
                resolve(["reader": Mappers.mapFromReader(reader)])
            } else if let error = error as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error as NSError))
            } else {
                resolve([:])
            }
        }
    }

    @objc(cancelEasyConnect:rejecter:)
    func cancelEasyConnect(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let cancelable = easyConnectCancelable else {
            resolve(Errors.createErrorFromCode(code: ErrorCode.cancelFailedAlreadyCompleted, message: "easyConnect could not be canceled because the command has already been canceled or has completed."))
            return
        }
        cancelable.cancel() { error in
            if let error = error as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error as NSError))
            } else {
                resolve([:])
                self.easyConnectCancelable = nil
            }
        }
    }

    @objc(connectReader:resolver:rejecter:)
    func connectReader(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let reader = params["reader"] as? NSDictionary else {
            resolve(Errors.createErrorFromRnCodeEnum(rnCode: Errors.RNErrorCode.INVALID_REQUIRED_PARAMETER, message: "You must provide a reader object"))
            return
        }
        guard let discoveryMethod = params["discoveryMethod"] as? String else {
            resolve(Errors.createErrorFromRnCodeEnum(rnCode: Errors.RNErrorCode.INVALID_REQUIRED_PARAMETER, message: "You must provide a discoveryMethod"))
            return
        }

        // since simulated readers don't contain `id` property we take serialNumber as a fallback
        let readerId = reader["serialNumber"] as? String
        let discoveryMethodType = Mappers.mapToDiscoveryMethod(discoveryMethod)
        guard let selectedReader = discoveredReadersList?.first(where: { $0.serialNumber == readerId }) else {
            resolve(Errors.createErrorFromRnCodeEnum(rnCode: Errors.RNErrorCode.INVALID_REQUIRED_PARAMETER, message: "Could not find reader with id \(readerId ?? "")"))
            return

        }

        let locationId = params["locationId"] as? String
        let autoReconnectOnUnexpectedDisconnect = params["autoReconnectOnUnexpectedDisconnect"] as? Bool ?? true
        let failIfInUse: Bool = params["failIfInUse"] as? Bool ?? false
        let onBehalfOf: String? = params["onBehalfOf"] as? String
        let merchantDisplayName: String? = params["merchantDisplayName"] as? String
        let tosAcceptancePermitted: Bool = params["tosAcceptancePermitted"] as? Bool ?? true

        self.paymentMethodSelectionHandlerRegistered = params["hasPaymentMethodSelectionCallback"] as? Bool ?? false
        self.qrCodeDisplayHandlerRegistered = params["hasQrCodeDisplayCallback"] as? Bool ?? false

        let connectionConfig: ConnectionConfiguration
        do {
            connectionConfig = try getConnectionConfig(
                locationId: locationId,
                autoReconnectOnUnexpectedDisconnect: autoReconnectOnUnexpectedDisconnect,
                failIfInUse: failIfInUse,
                merchantDisplayName: merchantDisplayName,
                onBehalfOf: onBehalfOf,
                tosAcceptancePermitted: tosAcceptancePermitted,
                discoveryMethod: discoveryMethodType)! // TODO find way to !
        } catch {
            resolve(Errors.createErrorFromNSError(nsError: error as NSError))
            return
        }

        Terminal.shared.connectReader(selectedReader, connectionConfig: connectionConfig) { reader, error in
            if let reader {
                resolve(["reader": Mappers.mapFromReader(reader)])
            } else if let error = error as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error))
            } else {
                resolve([:])
            }
        }
    }

    private func getConnectionConfig(
        locationId: String?,
        autoReconnectOnUnexpectedDisconnect: Bool,
        failIfInUse: Bool,
        merchantDisplayName: String?,
        onBehalfOf: String?,
        tosAcceptancePermitted: Bool,
        discoveryMethod: DiscoveryMethod) throws -> ConnectionConfiguration? {
        switch discoveryMethod {
        case .bluetoothScan, .bluetoothProximity:
            guard let locationId else {
                throw NSError(domain: "StripeTerminal", code: -1, userInfo: [NSLocalizedDescriptionKey: "Location ID is required for Bluetooth connection"])
            }
            return try BluetoothConnectionConfigurationBuilder(delegate: self, locationId: locationId)
               .setAutoReconnectOnUnexpectedDisconnect(autoReconnectOnUnexpectedDisconnect)
               .build()
        case .internet:
            return try InternetConnectionConfigurationBuilder(delegate: self)
                .setFailIfInUse(failIfInUse)
                .setAllowCustomerCancel(true)
                .build()
        case .tapToPay:
            guard let locationId else {
                throw NSError(domain: "StripeTerminal", code: -1, userInfo: [NSLocalizedDescriptionKey: "Location ID is required for Tap to Pay connection"])
            }
            let builder = TapToPayConnectionConfigurationBuilder(delegate: self, locationId: locationId)
                .setMerchantDisplayName(merchantDisplayName)
                .setOnBehalfOf(onBehalfOf)
                .setAutoReconnectOnUnexpectedDisconnect(autoReconnectOnUnexpectedDisconnect)
                .setTosAcceptancePermitted(tosAcceptancePermitted)

            return try builder.build()
        case .usb:
            guard let locationId else {
                throw NSError(domain: "StripeTerminal", code: -1, userInfo: [NSLocalizedDescriptionKey: "Location ID is required for USB connection"])
            }
            return try UsbConnectionConfigurationBuilder(delegate: self, locationId: locationId)
                .setAutoReconnectOnUnexpectedDisconnect(autoReconnectOnUnexpectedDisconnect)
                .build()
        @unknown default:
            return nil
        }
    }

    private func getEasyConnectConfiguration(
        discoveryConfig: DiscoveryConfiguration,
        connectionConfig: ConnectionConfiguration
    ) throws -> EasyConnectConfiguration {
        switch discoveryConfig {
        case let internetDiscoveryConfig as InternetDiscoveryConfiguration:
            guard let internetConnectionConfig = connectionConfig as? InternetConnectionConfiguration else {
                throw NSError(domain: "StripeTerminal", code: -1, userInfo: [NSLocalizedDescriptionKey: "Internet easyConnect requires Internet connection configuration"])
            }
            return InternetEasyConnectConfiguration(
                discoveryConfiguration: internetDiscoveryConfig,
                connectionConfiguration: internetConnectionConfig
            )

        case let tapToPayDiscoveryConfig as TapToPayDiscoveryConfiguration:
            guard let tapToPayConnectionConfig = connectionConfig as? TapToPayConnectionConfiguration else {
                throw NSError(domain: "StripeTerminal", code: -1, userInfo: [NSLocalizedDescriptionKey: "TapToPay easyConnect requires TapToPay connection configuration"])
            }
            return TapToPayEasyConnectConfiguration(
                discoveryConfiguration: tapToPayDiscoveryConfig,
                connectionConfiguration: tapToPayConnectionConfig
            )

        default:
            let configType = String(describing: type(of: discoveryConfig))
            throw NSError(domain: "StripeTerminal", code: -1, userInfo: [NSLocalizedDescriptionKey: "Easy connect is not supported for \(configType)"])
        }
    }

    @objc(disconnectReader:rejecter:)
    func disconnectReader(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        Terminal.shared.disconnectReader() { error in
            if let error = error as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error))
            } else {
                self.paymentIntents = [:]
                resolve([:])
            }
        }
    }

    @objc(rebootReader:rejecter:)
    func rebootReader(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        Terminal.shared.rebootReader() { error in
            if let error = error as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error))
            } else {
                self.paymentIntents = [:]
                resolve([:])
            }
        }
    }

    func tapToPayReaderDidAcceptTermsOfService(_ reader: Reader) {
        sendEvent(withName: ReactNativeConstants.ACCEPT_TERMS_OF_SERVICE.rawValue, body: ["reader": reader])
    }

    @objc(createPaymentIntent:resolver:rejecter:)
    func createPaymentIntent(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let amount = params["amount"] as? NSNumber ?? 0
        let currency = params["currency"] as? String ?? ""
        let setupFutureUsage = params["setupFutureUsage"] as? String
        let paymentMethodTypes = params["paymentMethodTypes"] as? [String] ?? []
        let onBehalfOf = params["onBehalfOf"] as? String
        let transferDataDestination = params["transferDataDestination"] as? String
        let applicationFeeAmount = params["applicationFeeAmount"] as? NSNumber

        let description = params["description"] as? String
        let statementDescriptor = params["statementDescriptor"] as? String
        let statementDescriptorSuffix = params["statementDescriptorSuffix"] as? String
        let receiptEmail = params["receiptEmail"] as? String
        let customer = params["customer"] as? String
        let transferGroup = params["transferGroup"] as? String
        let metadata = params["metadata"] as? [String : String]
        let paymentMethodOptions = params["paymentMethodOptions"] as? [AnyHashable : Any] ?? [:]
        let extendedAuth = paymentMethodOptions["requestExtendedAuthorization"] as? Bool ?? false
        let incrementalAuth = paymentMethodOptions["requestIncrementalAuthorizationSupport"] as? Bool ?? false
        let requestedPriority = paymentMethodOptions["requestedPriority"] as? String
        let requestPartialAuthorization = paymentMethodOptions["requestPartialAuthorization"] as? String
        let cardPresentCaptureMethod = paymentMethodOptions["captureMethod"] as? String
        let captureMethod = params["captureMethod"] as? String

        let paymentParamsBuilder = PaymentIntentParametersBuilder(amount: UInt(truncating: amount),currency: currency)
            .setCaptureMethod(captureMethod == "automatic" ? .automatic : .manual)
            .setSetupFutureUsage(setupFutureUsage)
            .setOnBehalfOf(onBehalfOf)
            .setTransferDataDestination(transferDataDestination)
            .setApplicationFeeAmount(applicationFeeAmount)
            .setStripeDescription(description)
            .setStatementDescriptor(statementDescriptor)
            .setStatementDescriptorSuffix(statementDescriptorSuffix)
            .setReceiptEmail(receiptEmail)
            .setCustomer(customer)
            .setTransferGroup(transferGroup)
            .setMetadata(metadata)

        if !paymentMethodTypes.isEmpty {
            let mappedTypes = paymentMethodTypes.map(Mappers.mapPaymentMethodType)
            paymentParamsBuilder.setPaymentMethodTypes(mappedTypes)
        }

        let cardPresentParamsBuilder = CardPresentParametersBuilder()
            .setRequestExtendedAuthorization(extendedAuth)
            .setRequestIncrementalAuthorizationSupport(incrementalAuth)
        switch requestedPriority {
        case "domestic":
            cardPresentParamsBuilder.setRequestedPriority(CardPresentRouting.domestic)
        case "international":
            cardPresentParamsBuilder.setRequestedPriority(CardPresentRouting.international)
        default:
            break
        }
        switch requestPartialAuthorization {
        case "if_available":
            cardPresentParamsBuilder.setRequestPartialAuthorization(CardPresentRequestPartialAuthorization.ifAvailable)
        case "never":
            cardPresentParamsBuilder.setRequestPartialAuthorization(CardPresentRequestPartialAuthorization.never)
        default:
            break
        }

        switch cardPresentCaptureMethod {
          case "manual":
              cardPresentParamsBuilder.setCaptureMethod(CardPresentCaptureMethod.manual)
          case "manual_preferred":
              cardPresentParamsBuilder.setCaptureMethod(CardPresentCaptureMethod.manualPreferred)
          default:
              break
        }

        let cardPresentParams: CardPresentParameters
        do {
            cardPresentParams = try cardPresentParamsBuilder.build()
        } catch {
            resolve(Errors.createErrorFromNSError(nsError: error as NSError))
            return
        }

        let paymentMethodOptionsParameters: PaymentMethodOptionsParameters
        do {
            paymentMethodOptionsParameters = try PaymentMethodOptionsParametersBuilder(cardPresentParameters: cardPresentParams).build()
        } catch {
            resolve(Errors.createErrorFromNSError(nsError: error as NSError))
            return
        }
        paymentParamsBuilder.setPaymentMethodOptionsParameters(paymentMethodOptionsParameters)

        let paymentParams: PaymentIntentParameters
        do {
            paymentParams = try paymentParamsBuilder.build()
        } catch {
            resolve(Errors.createErrorFromNSError(nsError: error as NSError))
            return
        }

        let offlineBehavior = params["offlineBehavior"] as? String
        let offlineBehaviorFromTransactionLimit: OfflineBehavior = {
            switch offlineBehavior {
            case "prefer_online": return OfflineBehavior.preferOnline
            case "require_online": return OfflineBehavior.requireOnline
            case "force_offline": return OfflineBehavior.forceOffline
            default: return OfflineBehavior.preferOnline
            }
        }()

        let offlineCreateConfig: CreateConfiguration
        do {
            offlineCreateConfig = try CreateConfigurationBuilder().setOfflineBehavior(offlineBehaviorFromTransactionLimit).build()
        } catch {
            resolve(Errors.createErrorFromNSError(nsError: error as NSError))
            return
        }

        let uuid = UUID().uuidString
        Terminal.shared.createPaymentIntent(paymentParams, createConfig: offlineCreateConfig) { pi, error in
            if let error = error as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error, uuid: uuid))
            } else if let paymentIntent = pi {
                self.paymentIntents[uuid] = paymentIntent
                let mappedPaymentIntent = Mappers.mapFromPaymentIntent(paymentIntent, uuid: uuid)
                resolve(["paymentIntent": mappedPaymentIntent])
            }
        }
    }

    @objc(createSetupIntent:resolver:rejecter:)
    func createSetupIntent(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let setupIntentParams: SetupIntentParameters
        do {
            setupIntentParams = try Mappers.mapToSetupIntent(params).build()
        } catch {
            resolve(Errors.createErrorFromNSError(nsError: error as NSError))
            return
        }

        let uuid = UUID().uuidString
        Terminal.shared.createSetupIntent(setupIntentParams) { si, error in
            if let error = error as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error, uuid: uuid))
            } else if let setupIntent = si {
                self.setupIntents[uuid] = setupIntent
                let mappedSetupIntent = Mappers.mapFromSetupIntent(setupIntent, uuid: uuid)
                resolve(["setupIntent": mappedSetupIntent])
            }
        }
    }

    @objc(collectPaymentMethod:resolver:rejecter:)
    func collectPaymentMethod(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        self.paymentMethodSelectionCallback = nil
        self.qrCodeDisplayCallback = nil

        guard let (paymentIntent, uuid) = getPaymentIntentAndUuid(from: params, resolve: resolve) else {
            return
        }

        guard let collectConfig = buildCollectPaymentIntentConfiguration(from: params, resolve: resolve) else {
            return
        }

        self.collectPaymentMethodCancelable = Terminal.shared.collectPaymentMethod(
            paymentIntent,
            collectConfig: collectConfig
        ) { pi, collectError  in
            if let error = collectError as NSError? {
                self.collectPaymentMethodCancelable = nil
                resolve(Errors.createErrorFromNSError(nsError: error, uuid: uuid))
            } else if let paymentIntent = pi {
                // Always store the latest instance of the PaymentIntent so we pass the latest instance back in
                // to the confirm call.
                self.paymentIntents[uuid] = paymentIntent
                let mappedPaymentIntent = Mappers.mapFromPaymentIntent(paymentIntent, uuid: uuid)
                resolve(["paymentIntent": mappedPaymentIntent])
            }
        }
    }

    @objc(retrievePaymentIntent:resolver:rejecter:)
    func retrievePaymentIntent(secret: String?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let clientSecret = secret else {
            resolve(Errors.createErrorFromRnCodeEnum(rnCode: Errors.RNErrorCode.INVALID_REQUIRED_PARAMETER, message: "You must provide cliectSecret."))
            return
        }

        let uuid = UUID().uuidString
        Terminal.shared.retrievePaymentIntent(clientSecret: clientSecret) { pi, error in
            if let error = error as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error, uuid: uuid))
            } else if let paymentIntent = pi {
                self.paymentIntents[uuid] = paymentIntent
                let mappedPaymentIntent = Mappers.mapFromPaymentIntent(paymentIntent, uuid: uuid)
                resolve(["paymentIntent": mappedPaymentIntent])
            }
        }
    }

    @objc(processPaymentIntent:resolver:rejecter:)
    func processPaymentIntent(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let (paymentIntent, uuid) = getPaymentIntentAndUuid(from: params, resolve: resolve) else {
            return
        }

        guard let collectConfig = buildCollectPaymentIntentConfiguration(from: params, resolve: resolve) else {
            return
        }

        guard let confirmConfig = buildConfirmPaymentIntentConfiguration(from: params, resolve: resolve) else {
            return
        }

        self.processPaymentIntentCancelable = Terminal.shared.processPaymentIntent(paymentIntent, collectConfig: collectConfig, confirmConfig: confirmConfig) { processedPaymentIntent, processError in
            self.processPaymentIntentCancelable = nil
            if let error = processError as NSError? {
                let result = Errors.createErrorFromNSError(nsError: error)
                resolve(result)
            } else if let processedPaymentIntent {
                self.paymentIntents = [:]
                let pi = Mappers.mapFromPaymentIntent(processedPaymentIntent, uuid: uuid)
                resolve(["paymentIntent": pi])
            }
        }
    }

    @objc(getLocations:resolver:rejecter:)
    func getLocations(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let limit = params["limit"] as? NSNumber
        let endingBefore = params["endingBefore"] as? String
        let startingAfter = params["startingAfter"] as? String

        let listParametersBuilder = ListLocationsParametersBuilder()

        if let limitValue = limit {
            listParametersBuilder.setLimit(limitValue.uintValue)
        }
        if let endingBeforeValue = endingBefore {
            listParametersBuilder.setEndingBefore(endingBeforeValue)
        }
        if let startingAfterValue = startingAfter {
            listParametersBuilder.setStartingAfter(startingAfterValue)
        }

        let listParameters: ListLocationsParameters
        do {
            listParameters = try listParametersBuilder.build()
        } catch {
            resolve(Errors.createErrorFromNSError(nsError: error as NSError))
            return
        }

        Terminal.shared.listLocations(parameters: listParameters) { locations, hasMore, error in
            if let error = error as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error))
            } else if let locations = locations {
                let list = Mappers.mapFromLocationsList(locations)
                resolve(["locations": list, "hasMore": hasMore])
            }
        }
    }

    @objc(confirmPaymentIntent:resolver:rejecter:)
    func confirmPaymentIntent(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let (paymentIntent, uuid) = getPaymentIntentAndUuid(from: params, resolve: resolve) else {
            return
        }

        guard let confirmConfig = buildConfirmPaymentIntentConfiguration(from: params, resolve: resolve) else {
            return
        }

        self.confirmPaymentIntentCancelable = Terminal.shared.confirmPaymentIntent(paymentIntent,confirmConfig: confirmConfig) { pi, error in
            self.confirmPaymentIntentCancelable = nil
            if let error = error as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error, uuid: uuid))
            } else if let paymentIntent = pi {
                self.paymentIntents = [:]
                let mappedPaymentIntent = Mappers.mapFromPaymentIntent(paymentIntent, uuid: uuid)
                resolve(["paymentIntent": mappedPaymentIntent])
            }
        }
        self.collectPaymentMethodCancelable = nil
    }

    func terminal(_ terminal: Terminal, didChangePaymentStatus status: PaymentStatus) {
        let result = Mappers.mapFromPaymentStatus(status)
        sendEvent(withName: ReactNativeConstants.CHANGE_PAYMENT_STATUS.rawValue, body: ["result": result])
    }

    func terminal(_ terminal: Terminal, didChangeConnectionStatus status: ConnectionStatus) {
        let result = Mappers.mapFromConnectionStatus(status)
        sendEvent(withName: ReactNativeConstants.CHANGE_CONNECTION_STATUS.rawValue, body: ["result": result])
    }

    func reader(_ reader: Reader, didStartReconnect cancelable: Cancelable, disconnectReason: DisconnectReason) {
        self.cancelReaderConnectionCancellable = cancelable
        let result = Mappers.mapFromReaderDisconnectReason(disconnectReason)
        let reader = Mappers.mapFromReader(reader)
        sendEvent(withName: ReactNativeConstants.START_READER_RECONNECT.rawValue, body: ["reason": result, "reader": reader])
    }

    func readerDidSucceedReconnect(_ reader: Reader) {
        let reader = Mappers.mapFromReader(reader)
        sendEvent(withName: ReactNativeConstants.READER_RECONNECT_SUCCEED.rawValue, body: ["reader": reader])
    }

    func readerDidFailReconnect(_ reader: Reader) {
        let reader = Mappers.mapFromReader(reader)
        sendEvent(withName: ReactNativeConstants.READER_RECONNECT_FAIL.rawValue, body: ["reader": reader])
    }

    @objc(cancelReaderReconnection:rejecter:)
    func cancelReaderReconnection(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        self.cancelReaderConnectionCancellable?.cancel() { error in
            if let error = error as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error))
            } else {
                resolve([:])
            }
        }
    }

    @objc(cancelPaymentIntent:resolver:rejecter:)
    func cancelPaymentIntent(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let (paymentIntent, uuid) = getPaymentIntentAndUuid(from: params, resolve: resolve) else {
            return
        }
        Terminal.shared.cancelPaymentIntent(paymentIntent) { pi, collectError  in
            if let error = collectError as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error, uuid: uuid))
            } else if let paymentIntent = pi {
                self.paymentIntents[uuid] = nil
                let mappedPaymentIntent = Mappers.mapFromPaymentIntent(paymentIntent, uuid: uuid)
                resolve(["paymentIntent": mappedPaymentIntent])
            }
        }
    }

    @objc(installAvailableUpdate:rejecter:)
    func installAvailableUpdate(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        Terminal.shared.installAvailableUpdate()
        resolve([:])
    }

    @objc(cancelInstallingUpdate:rejecter:)
    func cancelInstallingUpdate(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        self.installUpdateCancelable?.cancel() { error in
            if let error = error as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error))
            } else {
                resolve([:])
            }
        }
    }

    @objc(setReaderDisplay:resolver:rejecter:)
    func setReaderDisplay(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let invalidParams = Errors.validateRequiredParameters(params: params, requiredParams: ["currency", "tax", "total"])

        guard invalidParams == nil else {
            resolve(Errors.createErrorFromRnCodeEnum(rnCode: Errors.RNErrorCode.INVALID_REQUIRED_PARAMETER, message: "You must provide \(invalidParams!) parameters."))
            return
        }

        let currency = params["currency"] as? String
        let tax = params["tax"] as? NSNumber
        let total = params["total"] as? NSNumber

        let cartBuilder = CartBuilder(currency: currency!)
            .setTax(Int(truncating: tax!))
            .setTotal(Int(truncating: total!))

        let cartLineItems = Mappers.mapToCartLineItems(params["lineItems"] as? NSArray ?? NSArray())
        cartBuilder.setLineItems(cartLineItems)

        let cart: Cart
        do {
            cart = try cartBuilder.build()
        } catch {
            resolve(Errors.createErrorFromNSError(nsError: error as NSError))
            return
        }

        Terminal.shared.setReaderDisplay(cart) { error in
            if let error = error as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error))
            } else {
                resolve([:])
            }
        }
    }

    @objc(cancelSetupIntent:resolver:rejecter:)
    func cancelSetupIntent(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let (setupIntent, uuid) = getSetupIntentAndUuid(from: params, resolve: resolve) else {
            return
        }
        Terminal.shared.cancelSetupIntent(setupIntent) { si, collectError  in
            if let error = collectError as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error, uuid: uuid))
            } else if let setupIntent = si {
                self.setupIntents[uuid] = nil
                let mappedSetupIntent = Mappers.mapFromSetupIntent(setupIntent, uuid: uuid)
                resolve(["setupIntent": mappedSetupIntent])
            }
        }
    }

    @objc(clearReaderDisplay:rejecter:)
    func clearReaderDisplay(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        Terminal.shared.clearReaderDisplay() { error in
            if let error = error as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error))
            } else {
                resolve([:])
            }
        }
    }

    @objc(retrieveSetupIntent:resolver:rejecter:)
    func retrieveSetupIntent(secret: String?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let clientSecret = secret else {
            resolve(Errors.createErrorFromRnCodeEnum(rnCode: Errors.RNErrorCode.INVALID_REQUIRED_PARAMETER, message: "You must provide cliectSecret."))
            return
        }
        let uuid = UUID().uuidString
        Terminal.shared.retrieveSetupIntent(clientSecret: clientSecret) { si, error in
            if let error = error as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error, uuid: uuid))
            } else if let setupIntent = si {
                self.setupIntents[uuid] = setupIntent
                let mappedSetupIntent = Mappers.mapFromSetupIntent(setupIntent, uuid: uuid)
                resolve(["setupIntent": mappedSetupIntent])
            }
        }
    }

    @objc(collectSetupIntentPaymentMethod:resolver:rejecter:)
    func collectSetupIntentPaymentMethod(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let (setupIntent, uuid) = getSetupIntentAndUuid(from: params, resolve: resolve) else {
            return
        }

        let allowRedisplay = params["allowRedisplay"] as? String ?? "unspecified"

        guard let setupIntentConfiguration = buildCollectSetupIntentConfiguration(from: params, resolve: resolve) else {
            return
        }

        self.collectSetupIntentCancelable = Terminal.shared.collectSetupIntentPaymentMethod(setupIntent, allowRedisplay: Mappers.mapToAllowRedisplay(allowToredisplay: allowRedisplay), setupConfig: setupIntentConfiguration) { si, collectError  in
            if let error = collectError as NSError? {
                self.collectSetupIntentCancelable = nil
                resolve(Errors.createErrorFromNSError(nsError: error, uuid: uuid))
            } else if let setupIntent = si {
                self.setupIntents[uuid] = setupIntent
                let mappedSetupIntent = Mappers.mapFromSetupIntent(setupIntent, uuid: uuid)
                resolve(["setupIntent": mappedSetupIntent])
            }
        }
    }

    @objc(confirmSetupIntent:resolver:rejecter:)
    func confirmSetupIntent(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let (setupIntent, uuid) = getSetupIntentAndUuid(from: params, resolve: resolve) else {
            return
        }

        self.confirmSetupIntentCancelable = Terminal.shared.confirmSetupIntent(setupIntent) { si, collectError  in
            self.confirmSetupIntentCancelable = nil
            if let error = collectError as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error, uuid: uuid))
            } else if let setupIntent = si {
                self.setupIntents = [:]
                let mappedSetupIntent = Mappers.mapFromSetupIntent(setupIntent, uuid: uuid)
                resolve(["setupIntent": mappedSetupIntent])
            }
        }
        self.collectSetupIntentCancelable = nil
    }

    @objc(processSetupIntent:resolver:rejecter:)
    func processSetupIntent(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let (setupIntent, uuid) = getSetupIntentAndUuid(from: params, resolve: resolve) else {
            return
        }

        let allowRedisplay = params["allowRedisplay"] as? String ?? "unspecified"

        guard let collectConfig = buildCollectSetupIntentConfiguration(from: params, resolve: resolve) else {
            return
        }

        self.processSetupIntentCancelable = Terminal.shared.processSetupIntent(setupIntent, allowRedisplay: Mappers.mapToAllowRedisplay(allowToredisplay: allowRedisplay), collectConfig: collectConfig) { processedSetupIntent, processError in
            self.processSetupIntentCancelable = nil
            if let error = processError as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error, uuid: uuid))
            } else if let processedSetupIntent {
                self.setupIntents = [:]
                let mappedSetupIntent = Mappers.mapFromSetupIntent(processedSetupIntent, uuid: uuid)
                resolve(["setupIntent": mappedSetupIntent])
            }
        }
    }

    @objc(processRefund:resolver:rejecter:)
    func processRefund(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let invalidParams = Errors.validateRequiredParameters(params: params, requiredParams: ["amount", "currency"])

        guard invalidParams == nil else {
            resolve(Errors.createErrorFromRnCodeEnum(rnCode: Errors.RNErrorCode.INVALID_REQUIRED_PARAMETER, message: "You must provide \(invalidParams!) parameters."))
            return
        }
        let chargeId = params["chargeId"] as? String
        let paymentIntentId = params["paymentIntentId"] as? String
        let clientSecret = params["clientSecret"] as? String
        let amount = params["amount"] as? NSNumber
        let currency = params["currency"] as? String
        let intAmount = UInt(truncating: amount!);
        let refundApplicationFee = params["refundApplicationFee"] as? NSNumber
        let reverseTransfer = params["reverseTransfer"] as? NSNumber
        let customerCancellation = Mappers.mapToCustomerCancellation(params["customerCancellation"] as? String)
        let metadata = params["metadata"] as? [String : String]

        let refundParams: RefundParameters
        do {
            if let paymentIntentId = paymentIntentId, let clientSecret = clientSecret, !paymentIntentId.isEmpty, !clientSecret.isEmpty {
                refundParams = try RefundParametersBuilder(paymentIntentId: paymentIntentId, clientSecret: clientSecret, amount: intAmount, currency: currency!)
                    .setReverseTransfer(reverseTransfer?.intValue == 1 ? true : false)
                    .setRefundApplicationFee(refundApplicationFee?.intValue == 1 ? true : false)
                    .setMetadata(metadata)
                    .build()
            } else if let chargeId = chargeId, !chargeId.isEmpty {
                refundParams = try RefundParametersBuilder(chargeId: chargeId,amount: intAmount, currency: currency!)
                    .setReverseTransfer(reverseTransfer?.intValue == 1 ? true : false)
                    .setRefundApplicationFee(refundApplicationFee?.intValue == 1 ? true : false)
                    .setMetadata(metadata)
                    .build()
            } else {
                resolve(Errors.createErrorFromRnCodeEnum(rnCode: Errors.RNErrorCode.INVALID_REQUIRED_PARAMETER, message: "You must provide either a charge ID or a payment intent ID with clientSecret."))
                return
            }
        } catch {
            resolve(Errors.createErrorFromNSError(nsError: error as NSError))
            return
        }

        let refundConfiguration: CollectRefundConfiguration
        let configurationBuilder = CollectRefundConfigurationBuilder()
        do {
            if let customerCancellation = customerCancellation {
                configurationBuilder.setCustomerCancellation(customerCancellation)
            }
            refundConfiguration = try configurationBuilder.build()
        } catch {
            resolve(Errors.createErrorFromNSError(nsError: error as NSError))
            return
        }

        self.processRefundCancelable = Terminal.shared.processRefund(refundParams, collectConfig: refundConfiguration) { refund, error in
            if let error = error as NSError? {
                self.processRefundCancelable = nil
              resolve(Errors.createErrorFromNSError(nsError: error))
          } else if let refund = refund {
              let refund = Mappers.mapFromRefund(refund)
              resolve(["refund": refund])
          } else {
              resolve([:])
          }
        }
    }

    @objc(collectData:resolver:rejecter:)
    func collectData(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let collectDataTypeParam = params["collectDataType"] as? String ?? ""

        let collectDataType = Mappers.mapToCollectDataType(collectDataTypeParam)
        guard let collectDataType else {
            resolve(Errors.createErrorFromRnCodeEnum(rnCode: Errors.RNErrorCode.INVALID_REQUIRED_PARAMETER, message: "You must provide a collectDataType."))
            return
        }

        let customerCancellation = Mappers.mapToCustomerCancellation(params["customerCancellation"] as? String)
        let collectDataConfig: CollectDataConfiguration
        let configurationBuilder = CollectDataConfigurationBuilder()
        do {
            if let customcustomerCancellation = customerCancellation {
                configurationBuilder.setCustomerCancellation(customcustomerCancellation)
            }
            collectDataConfig = try configurationBuilder.setCollectDataType(collectDataType)
                .build()
        } catch {
            resolve(Errors.createErrorFromNSError(nsError: error as NSError))
            return
        }

        self.collectDataCancellable = Terminal.shared.collectData(collectDataConfig) { collectedData, error in
            self.collectDataCancellable = nil
            if let error = error as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error))
            } else if let collectedData {
                resolve(["collectedData": Mappers.mapFromCollectedData(collectedData)])
            } else {
                resolve([:])
            }
        }
    }

    @objc(cancelCollectData:rejecter:)
    func cancelCollectData(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let cancelable = collectDataCancellable else {
            resolve(Errors.createErrorFromCode(code: ErrorCode.cancelFailedAlreadyCompleted, message: "collectDataCancellable could not be canceled because the command has already been canceled or has completed."))
            return
        }
        cancelable.cancel() { error in
            if let error = error as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error))
            }
            else {
                resolve([:])
            }
        }
    }

    @objc(print:resolver:rejecter:)
    func print(contentUri: NSString, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let image = Mappers.mapToUIImage(contentUri as String) else {
            resolve(Errors.createErrorFromRnCodeEnum(rnCode: Errors.RNErrorCode.INVALID_REQUIRED_PARAMETER, message: "You must provide a valid base64 string or a 'data:' URI scheme"))
            return
        }
        let printContent: PrintContent
        do {
            printContent = try PrintContentBuilder(image: image).build()
        } catch {
            resolve(Errors.createErrorFromNSError(nsError: error as NSError))
            return
        }
        Terminal.shared.print(printContent) { error in
            if let error = error as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error))
            } else {
                resolve([:])
            }
        }
    }

    @objc(clearCachedCredentials:rejecter:)
    func clearCachedCredentials(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        Terminal.shared.clearCachedCredentials()
        self.paymentIntents = [:]
        resolve([:])
    }

    @objc(getLoggingToken:rejecter:)
    func getLoggingToken(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        resolve(["token": self.loggingToken])
    }

    @objc(getOfflineStatus:rejecter:)
    func getOfflineStatus(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let result = Mappers.mapFromOfflineStatus(Terminal.shared.offlineStatus)

        resolve(result)
    }

    @objc(getPaymentStatus:rejecter:)
    func getPaymentStatus(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let result = Mappers.mapFromPaymentStatus(Terminal.shared.paymentStatus)

        resolve(result)
    }

    @objc(getConnectionStatus:rejecter:)
    func getConnectionStatus(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let result = Mappers.mapFromConnectionStatus(Terminal.shared.connectionStatus)

        resolve(result)
    }

    @objc(getConnectedReader:rejecter:)
    func getConnectedReader(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        if let connectedReader = Terminal.shared.connectedReader {
            let result = Mappers.mapFromReader(connectedReader)
            resolve(result)
        } else {
            resolve([:])
        }
    }


    @objc(collectInputs:resolver:rejecter:)
    func collectInputs(_ params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let invalidParams = Errors.validateRequiredParameters(params: params, requiredParams: ["inputs"])

        guard invalidParams == nil else {
            resolve(Errors.createErrorFromRnCodeEnum(rnCode: Errors.RNErrorCode.INVALID_REQUIRED_PARAMETER, message: "You must provide \(invalidParams!) parameters."))
            return
        }

        let collectInputsParameters: CollectInputsParameters

        var inputs: [Input] = []
        let collectInputs = params["inputs"] as? [NSDictionary]
        if let collectInputs = collectInputs {
            for collectInput in collectInputs {
                let inputType = collectInput["formType"] as? String ?? ""
                switch (inputType) {
                case "email":
                    var toggles: [Toggle] = []
                    let toggleList = collectInput["toggles"] as? [NSDictionary]
                    if let toggleList = toggleList {
                        for it in toggleList {
                            do {
                                let title = it["title"] as! String
                                let description = it["description"] as! String
                                let defaultValue = it["defaultValue"] as! String
                                let toggle = try ToggleBuilder(defaultValue: (defaultValue == "enabled") ? ToggleValue.enabled : ToggleValue.disabled).setTitle(title).setStripeDescription(description).build()
                                toggles.append(toggle)
                            } catch {
                                resolve(Errors.createErrorFromNSError(nsError: error as NSError))
                                return
                            }
                        }
                    }
                    do {
                        let input = try EmailInputBuilder(title: collectInput["title"] as! String)
                            .setRequired(collectInput["required"] as? Bool ?? false)
                            .setStripeDescription(collectInput["description"] as? String ?? "")
                            .setSkipButtonText(collectInput["skipButtonText"] as? String ?? "")
                            .setSubmitButtonText(collectInput["submitButtonText"] as? String ?? "")
                            .setToggles(toggles)
                            .build()
                        inputs.append(input)
                    } catch {
                        resolve(Errors.createErrorFromNSError(nsError: error as NSError))
                        return
                    }
                    break
                case "numeric":
                    var toggles: [Toggle] = []
                    let toggleList = collectInput["toggles"] as? [NSDictionary]
                    if let toggleList = toggleList {
                        for it in toggleList {
                            do {
                                let title = it["title"] as! String
                                let description = it["description"] as! String
                                let defaultValue = it["defaultValue"] as! String
                                let toggle = try ToggleBuilder(defaultValue: (defaultValue == "enabled") ? ToggleValue.enabled : ToggleValue.disabled).setTitle(title).setStripeDescription(description).build()
                                toggles.append(toggle)
                            } catch {
                                resolve(Errors.createErrorFromNSError(nsError: error as NSError))
                                return
                            }
                        }
                    }
                    do {
                        let input = try NumericInputBuilder(title: collectInput["title"] as! String)
                            .setRequired(collectInput["required"] as? Bool ?? false)
                            .setStripeDescription(collectInput["description"] as? String ?? "")
                            .setSkipButtonText(collectInput["skipButtonText"] as? String ?? "")
                            .setSubmitButtonText(collectInput["submitButtonText"] as? String ?? "")
                            .setToggles(toggles)
                            .build()
                        inputs.append(input)
                    } catch {
                        resolve(Errors.createErrorFromNSError(nsError: error as NSError))
                        return
                    }
                    break
                case "phone":
                    var toggles: [Toggle] = []
                    let toggleList = collectInput["toggles"] as? [NSDictionary]
                    if let toggleList = toggleList {
                        for it in toggleList {
                            do {
                                let title = it["title"] as! String
                                let description = it["description"] as! String
                                let defaultValue = it["defaultValue"] as! String
                                let toggle = try ToggleBuilder(defaultValue: (defaultValue == "enabled") ? ToggleValue.enabled : ToggleValue.disabled).setTitle(title).setStripeDescription(description).build()
                                toggles.append(toggle)
                            } catch {
                                resolve(Errors.createErrorFromNSError(nsError: error as NSError))
                                return
                            }
                        }
                    }
                    do {
                        let input = try PhoneInputBuilder(title: collectInput["title"] as! String)
                            .setRequired(collectInput["required"] as? Bool ?? false)
                            .setStripeDescription(collectInput["description"] as? String ?? "")
                            .setSkipButtonText(collectInput["skipButtonText"] as? String ?? "")
                            .setSubmitButtonText(collectInput["submitButtonText"] as? String ?? "")
                            .setToggles(toggles)
                            .build()
                        inputs.append(input)
                    } catch {
                       resolve(Errors.createErrorFromNSError(nsError: error as NSError))
                       return
                    }
                    break
                case "text":
                    var toggles: [Toggle] = []
                    let toggleList = collectInput["toggles"] as? [NSDictionary]
                    if let toggleList = toggleList {
                        for it in toggleList {
                            do {
                                let title = it["title"] as! String
                                let description = it["description"] as! String
                                let defaultValue = it["defaultValue"] as! String
                                let toggle = try ToggleBuilder(defaultValue: (defaultValue == "enabled") ? ToggleValue.enabled : ToggleValue.disabled).setTitle(title).setStripeDescription(description).build()
                                toggles.append(toggle)
                            } catch {
                                resolve(Errors.createErrorFromNSError(nsError: error as NSError))
                                return
                            }
                        }
                    }
                    do {
                        let input = try TextInputBuilder(title: collectInput["title"] as! String)
                            .setRequired(collectInput["required"] as? Bool ?? false)
                            .setStripeDescription(collectInput["description"] as? String ?? "")
                            .setSkipButtonText(collectInput["skipButtonText"] as? String ?? "")
                            .setSubmitButtonText(collectInput["submitButtonText"] as? String ?? "")
                            .setToggles(toggles)
                            .build()
                        inputs.append(input)
                    } catch {
                        resolve(Errors.createErrorFromNSError(nsError: error as NSError))
                        return
                    }
                    break
                case "selection":
                    var toggles: [Toggle] = []
                    let toggleList = collectInput["toggles"] as? [NSDictionary]
                    if let toggleList = toggleList {
                        for it in toggleList {
                            do {
                                let title = it["title"] as! String
                                let description = it["description"] as! String
                                let defaultValue = it["defaultValue"] as! String
                                let toggle = try ToggleBuilder(defaultValue: (defaultValue == "enabled") ? ToggleValue.enabled : ToggleValue.disabled).setTitle(title).setStripeDescription(description).build()
                                toggles.append(toggle)
                            } catch {
                                resolve(Errors.createErrorFromNSError(nsError: error as NSError))
                                return
                            }
                        }
                    }
                    var selectionButtons: [SelectionButton] = []
                    let selections = collectInput["selectionButtons"] as? [NSDictionary]
                    if let selections = selections {
                        for it in selections {
                            do {
                                let style = it["style"] as! String
                                let text = it["text"] as! String
                                let id = (it["id"] as? String) ?? ""
                                let button = try SelectionButtonBuilder(style: (style == "primary") ? .primary : .secondary,
                                                                        text: text,
                                                                        id: id
                                ).build()
                                selectionButtons.append(button)
                            } catch {
                                resolve(Errors.createErrorFromNSError(nsError: error as NSError))
                                return
                            }
                        }
                    }
                    do {
                        let input = try SelectionInputBuilder(title: collectInput["title"] as! String)
                            .setRequired(collectInput["required"] as? Bool ?? false)
                            .setStripeDescription(collectInput["description"] as? String ?? "")
                            .setSkipButtonText(collectInput["skipButtonText"] as? String ?? "")
                            .setSelectionButtons(selectionButtons)
                            .setToggles(toggles)
                            .build()
                        inputs.append(input)
                    } catch {
                        resolve(Errors.createErrorFromNSError(nsError: error as NSError))
                        return
                    }
                    break
                case "signature":
                    var toggles: [Toggle] = []
                    let toggleList = collectInput["toggles"] as? [NSDictionary]
                    if let toggleList = toggleList {
                        for it in toggleList {
                            do {
                                let title = it["title"] as! String
                                let description = it["description"] as! String
                                let defaultValue = it["defaultValue"] as! String
                                let toggle = try ToggleBuilder(defaultValue: (defaultValue == "enabled") ? ToggleValue.enabled : ToggleValue.disabled).setTitle(title).setStripeDescription(description).build()
                                toggles.append(toggle)
                            } catch {
                                resolve(Errors.createErrorFromNSError(nsError: error as NSError))
                                return
                            }
                        }
                    }
                    do {
                        let input = try SignatureInputBuilder(title: collectInput["title"] as! String)
                            .setRequired(collectInput["required"] as? Bool ?? false)
                            .setStripeDescription(collectInput["description"] as? String ?? "")
                            .setSkipButtonText(collectInput["skipButtonText"] as? String ?? "")
                            .setSubmitButtonText(collectInput["submitButtonText"] as? String ?? "")
                            .setToggles(toggles)
                            .build()
                        inputs.append(input)
                    } catch {
                        resolve(Errors.createErrorFromNSError(nsError: error as NSError))
                        return
                    }
                    break
                default: break
                }
            }
        }

        do {
            collectInputsParameters = try CollectInputsParametersBuilder(inputs: inputs).build()
        } catch {
            resolve(Errors.createErrorFromNSError(nsError: error as NSError))
            return
        }

        DispatchQueue.main.async {
            self.collectInputsCancellable = Terminal.shared.collectInputs(collectInputsParameters) { collectInputResults, error in
                self.collectInputsCancellable = nil
                if let error = error as NSError? {
                    resolve(Errors.createErrorFromNSError(nsError: error))
                } else {
                    resolve(Mappers.mapFromCollectInputsResults(collectInputResults ?? []))
                }
            }
        }
    }

    @objc(cancelCollectInputs:rejecter:)
    func cancelCollectInputs(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let cancelable = collectInputsCancellable else {
            resolve(Errors.createErrorFromCode(code: ErrorCode.cancelFailedAlreadyCompleted, message: "collectInputsCancellable could not be canceled because the command has already been canceled or has completed."))
            return
        }
        cancelable.cancel() { error in
            if let error = error as NSError? {
                resolve(Errors.createErrorFromNSError(nsError: error))
            }
            else {
                resolve([:])
            }
        }
    }

    @objc(getReaderSettings:rejecter:)
    func getReaderSettings(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        Task {
            do {
                let result = try await Terminal.shared.retrieveReaderSettings()
                resolve(Mappers.mapFromReaderSettings(result))
            } catch {
                resolve(Errors.createErrorFromNSError(nsError: error as NSError))
            }
        }
    }

    @objc(setReaderSettings:resolver:rejecter:)
    func setReaderSettings(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let invalidParams = Errors.validateRequiredParameters(params: params, requiredParams: ["textToSpeechViaSpeakers"])

        guard invalidParams == nil else {
            resolve(Errors.createErrorFromRnCodeEnum(rnCode: Errors.RNErrorCode.INVALID_REQUIRED_PARAMETER, message: "You must provide \(invalidParams!) parameters."))
            return
        }

        let textToSpeechViaSpeakers = params["textToSpeechViaSpeakers"] as? Bool ?? false
        Task {
            do {
                let readerSettingsParameters = try ReaderAccessibilityParametersBuilder().setTextToSpeechViaSpeakers(textToSpeechViaSpeakers).build()
                let result = try await Terminal.shared.setReaderSettings(readerSettingsParameters)
                resolve(Mappers.mapFromReaderSettings(result))
            } catch {
                resolve(Errors.createErrorFromNSError(nsError: error as NSError))
            }
        }
    }

    @objc(supportsReadersOfType:resolver:rejecter:)
    func supportsReadersOfType(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let invalidParams = Errors.validateRequiredParameters(params: params, requiredParams: ["deviceType", "discoveryMethod"])

        if let invalidParams {
            resolve(Errors.createErrorFromRnCodeEnum(rnCode: Errors.RNErrorCode.INVALID_REQUIRED_PARAMETER, message: "You must provide \(invalidParams) parameters."))
            return
        }

        let deviceTypeParam = params["deviceType"] as? String ?? ""
        let simulated = params["simulated"] as? Bool ?? false
        let discoveryMethod = params["discoveryMethod"] as? String
        let deviceType = Mappers.mapToDeviceType(deviceTypeParam)
        guard let deviceType else {
            resolve(Errors.createErrorFromRnCodeEnum(rnCode: Errors.RNErrorCode.INVALID_REQUIRED_PARAMETER, message: "You must provide correct deviceType parameter."))
            return
        }
        let result = Terminal.shared.supportsReaders(of: deviceType, discoveryMethod: Mappers.mapToDiscoveryMethod(discoveryMethod), simulated: simulated)
        switch result {
        case .success(_):
            resolve(["readerSupportResult": true])
            break
        case .failure(let error):
            resolve(["readerSupportResult": false])
            break
        }
    }

    @objc(getNativeSdkVersion:rejecter:)
    func getNativeSdkVersion(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        resolve(SCPSDKVersion)
    }

    func reader(_ reader: Reader, didReportAvailableUpdate update: ReaderSoftwareUpdate) {
        sendEvent(withName: ReactNativeConstants.REPORT_AVAILABLE_UPDATE.rawValue, body: ["result": Mappers.mapFromReaderSoftwareUpdate(update) ?? [:]])
    }

    func reader(_ reader: Reader, didStartInstallingUpdate update: ReaderSoftwareUpdate, cancelable: Cancelable?) {
        self.installUpdateCancelable = cancelable
        sendEvent(withName: ReactNativeConstants.START_INSTALLING_UPDATE.rawValue, body: ["result": Mappers.mapFromReaderSoftwareUpdate(update) ?? [:]])
    }

    func reader(_ reader: Reader, didReportReaderSoftwareUpdateProgress progress: Float) {
        let result: [AnyHashable : Any?] = [
            "progress": String(progress),
        ]
        sendEvent(withName: ReactNativeConstants.REPORT_UPDATE_PROGRESS.rawValue, body: ["result": result])
    }

    func reader(_ reader: Reader, didFinishInstallingUpdate update: ReaderSoftwareUpdate?, error: Error?) {
        var result = Mappers.mapFromReaderSoftwareUpdate(update) ?? [:]
        if let nsError = error as NSError? {
           let errorAsDictionary = Errors.createErrorFromNSError(nsError: nsError)
            // createError will return a dictionary of ["error": {the error}]
            // so merge that with the result so we have a single result.error
            result = result.merging(errorAsDictionary, uniquingKeysWith: { _, error in
                error
            })
        }
        sendEvent(withName: ReactNativeConstants.FINISH_INSTALLING_UPDATE.rawValue, body: ["result": result])
    }

    func reader(_ reader: Reader, didRequestReaderInput inputOptions: ReaderInputOptions = []) {
        let result = Mappers.mapFromReaderInputOptions(inputOptions)
        sendEvent(withName: ReactNativeConstants.REQUEST_READER_INPUT.rawValue, body: ["result": result])
    }

    func reader(_ reader: Reader, didRequestReaderDisplayMessage displayMessage: ReaderDisplayMessage) {
        let result = Mappers.mapFromReaderDisplayMessage(displayMessage)
        sendEvent(withName: ReactNativeConstants.REQUEST_READER_DISPLAY_MESSAGE.rawValue, body: ["result": result])
    }

    func reader(_ reader: Reader, didDisconnect reason: DisconnectReason) {
        let result = Mappers.mapFromReaderDisconnectReason(reason)
        sendEvent(withName: ReactNativeConstants.DISCONNECT.rawValue, body: ["reason": result])
    }

    func tapToPayReader(_ reader: Reader, didStartInstallingUpdate update: ReaderSoftwareUpdate, cancelable: Cancelable?) {
        self.installUpdateCancelable = cancelable
        sendEvent(withName: ReactNativeConstants.START_INSTALLING_UPDATE.rawValue, body: ["result": Mappers.mapFromReaderSoftwareUpdate(update) ?? [:]])
    }

    func tapToPayReader(_ reader: Reader, didReportReaderSoftwareUpdateProgress progress: Float) {
        let result: [AnyHashable : Any?] = [
            "progress": String(progress),
        ]
        sendEvent(withName: ReactNativeConstants.REPORT_UPDATE_PROGRESS.rawValue, body: ["result": result])
    }

    func tapToPayReader(_ reader: Reader, didFinishInstallingUpdate update: ReaderSoftwareUpdate?, error: (any Error)?) {
        var result = Mappers.mapFromReaderSoftwareUpdate(update) ?? [:]
        if let nsError = error as NSError? {
           let errorAsDictionary = Errors.createErrorFromNSError(nsError: nsError)
            // createError will return a dictionary of ["error": {the error}]
            // so merge that with the result so we have a single result.error
            result = result.merging(errorAsDictionary, uniquingKeysWith: { _, error in
                error
            })
        }
        sendEvent(withName: ReactNativeConstants.FINISH_INSTALLING_UPDATE.rawValue, body: ["result": result])
    }

    func tapToPayReader(_ reader: Reader, didRequestReaderInput inputOptions: ReaderInputOptions = []) {
        let result = Mappers.mapFromReaderInputOptions(inputOptions)
        sendEvent(withName: ReactNativeConstants.REQUEST_READER_INPUT.rawValue, body: ["result": result])
    }

    func tapToPayReader(_ reader: Reader, didRequestReaderDisplayMessage displayMessage: ReaderDisplayMessage) {
        let result = Mappers.mapFromReaderDisplayMessage(displayMessage)
        sendEvent(withName: ReactNativeConstants.REQUEST_READER_DISPLAY_MESSAGE.rawValue, body: ["result": result])
    }

    func terminal(_ terminal: Terminal, didChange offlineStatus: OfflineStatus) {
        let result = Mappers.mapFromOfflineStatus(offlineStatus)
        sendEvent(withName: ReactNativeConstants.CHANGE_OFFLINE_STATUS.rawValue, body: ["result": result])
    }

    func terminal(_ terminal: Terminal, didForwardPaymentIntent intent: PaymentIntent, error: Error?) {
        let result = Mappers.mapFromPaymentIntent(intent, uuid: "")
        var body: [String: Any] = ["result": result]

        if let nsError = error as NSError? {
           let errorAsDictionary = Errors.createErrorFromNSError(nsError: nsError)
            // createError will return a dictionary of ["error": {the error}]
            // so merge that with the result so we have [result:, error:]
            body = body.merging(errorAsDictionary, uniquingKeysWith: { _, error in
                error
            })
        }

        sendEvent(withName: ReactNativeConstants.FORWARD_PAYMENT_INTENT.rawValue, body: body)
    }

    func terminal(_ terminal: Terminal, didReportForwardingError error: Error) {
        let result = Errors.createErrorFromNSError(nsError: error as NSError)
        sendEvent(withName: ReactNativeConstants.REPORT_FORWARDING_ERROR.rawValue, body: ["result": result])
    }

    func reader(_ reader: Reader, didReportReaderEvent event: ReaderEvent, info: [AnyHashable : Any]?) {
        let result = Mappers.mapFromReaderEvent(event)
        sendEvent(withName: ReactNativeConstants.REPORT_READER_EVENT.rawValue, body: ["result": result])
    }

    func reader(_ reader: Reader, didReportBatteryLevel batteryLevel: Float, status: BatteryStatus, isCharging: Bool) {
        let result: NSDictionary = [
            "batteryLevel": batteryLevel,
            "batteryStatus": Mappers.mapFromBatteryStatus(status),
            "isCharging": isCharging,
        ]
        sendEvent(withName: ReactNativeConstants.UPDATE_BATTERY_LEVEL.rawValue, body: ["result": result])
    }

    func readerDidReportLowBatteryWarning(_ reader: Reader) {
        let result = "LOW BATTERY"
        sendEvent(withName: ReactNativeConstants.REPORT_LOW_BATTERY_WARNING.rawValue, body: ["result": result])
    }

    // MARK: - MPOS Callback Implementations

    /**
     * Called when payment method selection is required (e.g., card vs WeChat Pay).
     * If JS has registered a handler, emit event. Otherwise, default to card.
     * Note: Changes to MPOS callbacks require reader reconnect to take effect during development.
     */
    @objc func reader(
        _ reader: Reader,
        didRequestPaymentMethodSelection paymentIntent: PaymentIntent,
        availablePaymentOptions: [PaymentOption],
        completion: @escaping PaymentMethodSelectionCompletionBlock
    ) {
        self.availablePaymentOptions = availablePaymentOptions
        if self.paymentMethodSelectionHandlerRegistered {
            self.paymentMethodSelectionCallback = completion
            sendEvent(withName: ReactNativeConstants.PAYMENT_METHOD_SELECTION_REQUIRED.rawValue, body: [
                "paymentIntent": Mappers.mapFromPaymentIntent(paymentIntent, uuid: ""),
                "availablePaymentOptions": Mappers.mapFromPaymentOptions(availablePaymentOptions)
            ])
        } else {
            // Default to card payment
            if let cardOption = availablePaymentOptions.first(where: { $0.type == .card }) {
                completion(cardOption, nil)
            } else if let firstOption = availablePaymentOptions.first {
                completion(firstOption, nil)
            } else {
                completion(nil, NSError(domain: "StripeTerminalReactNative", code: 0, userInfo: [NSLocalizedDescriptionKey: "No payment options available"]))
            }
        }
    }

    /**
     * Called when a QR code needs to be displayed to the customer.
     * If JS has registered a handler, emit event. Otherwise, fail with error.
     * Note: Changes to MPOS callbacks require reader reconnect to take effect during development.
     */
    @objc func reader(
        _ reader: Reader,
        didRequestQrCodeDisplay paymentIntent: PaymentIntent,
        qrData: QrCodeDisplayData,
        completion: @escaping QrCodeDisplayCompletionBlock
    ) {
        if self.qrCodeDisplayHandlerRegistered {
            self.qrCodeDisplayCallback = completion
            sendEvent(withName: ReactNativeConstants.QR_CODE_DISPLAY_REQUIRED.rawValue, body: [
                "paymentIntent": Mappers.mapFromPaymentIntent(paymentIntent, uuid: ""),
                "qrData": Mappers.mapFromQrCodeDisplayData(qrData)
            ])
        } else {
            // Fail - QR display requires a handler
            completion(NSError(domain: "StripeTerminalReactNative", code: 0, userInfo: [NSLocalizedDescriptionKey: "QR code display requires implementing onQrCodeDisplayRequired callback"]))
        }
    }

    // MARK: - MPOS Handler Registration Methods


    // MARK: - MPOS Callback Response Methods

    @objc(selectPaymentOption:resolver:rejecter:)
    func selectPaymentOption(
        paymentOptionType: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let completion = self.paymentMethodSelectionCallback else {
            resolve(Errors.createErrorFromCode(code: ErrorCode.canceled, message: "No payment method selection callback available"))
            return
        }
        self.paymentMethodSelectionCallback = nil

        // Find the payment option by type
        let paymentOption: PaymentOption?
        if paymentOptionType == "card" {
            paymentOption = self.availablePaymentOptions.first(where: { $0.type == .card })
        } else {
            // For non-card options, match by paymentMethodType
            let targetType = Mappers.mapToPaymentMethodType(paymentOptionType)
            paymentOption = self.availablePaymentOptions.first(where: {
                $0.type == .nonCard && $0.paymentMethodType == targetType
            })
        }

        guard let selectedOption = paymentOption else {
            completion(nil, NSError(domain: "StripeTerminal", code: -1, userInfo: [NSLocalizedDescriptionKey: "Payment option not found: \(paymentOptionType)"]))
            resolve(Errors.createErrorFromCode(code: ErrorCode.canceled, message: "Payment option not found: \(paymentOptionType)"))
            return
        }

        completion(selectedOption, nil)
        resolve([:])
    }

    @objc(failPaymentMethodSelection:resolver:rejecter:)
    func failPaymentMethodSelection(
        errorMessage: String?,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let completion = self.paymentMethodSelectionCallback else {
            resolve(Errors.createErrorFromCode(code: ErrorCode.canceled, message: "No payment method selection callback available"))
            return
        }
        self.paymentMethodSelectionCallback = nil

        let error = NSError(domain: "StripeTerminal", code: -1, userInfo: [NSLocalizedDescriptionKey: errorMessage ?? "Payment method selection failed"])
        completion(nil, error)
        resolve([:])
    }

    @objc(confirmQrCodeDisplayed:rejecter:)
    func confirmQrCodeDisplayed(
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let completion = self.qrCodeDisplayCallback else {
            resolve(Errors.createErrorFromCode(code: ErrorCode.canceled, message: "No QR code display callback available"))
            return
        }
        self.qrCodeDisplayCallback = nil

        completion(nil)  // nil error means success
        resolve([:])
    }

    @objc(failQrCodeDisplay:resolver:rejecter:)
    func failQrCodeDisplay(
        errorMessage: String?,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let completion = self.qrCodeDisplayCallback else {
            resolve(Errors.createErrorFromCode(code: ErrorCode.canceled, message: "No QR code display callback available"))
            return
        }
        self.qrCodeDisplayCallback = nil

        let error = NSError(domain: "StripeTerminal", code: -1, userInfo: [NSLocalizedDescriptionKey: errorMessage ?? "QR code display failed"])
        completion(error)
        resolve([:])
    }

    // MARK: - Helper Functions

    private func getPaymentIntentAndUuid(from params: NSDictionary, resolve: @escaping RCTPromiseResolveBlock) -> (PaymentIntent, String)? {
        guard let paymentIntentJSON = params["paymentIntent"] as? NSDictionary else {
            resolve(Errors.createErrorFromRnCodeEnum(rnCode: Errors.RNErrorCode.INVALID_REQUIRED_PARAMETER, message: "You must provide paymentIntent."))
            return nil
        }
        guard let uuid = paymentIntentJSON["sdkUuid"] as? String else {
            resolve(Errors.createErrorFromRnCodeEnum(rnCode: Errors.RNErrorCode.INVALID_REQUIRED_PARAMETER, message: "The PaymentIntent is missing sdkUuid field. This method requires you to use the PaymentIntent that was returned from either createPaymentIntent or retrievePaymentIntent."))
            return nil
        }
        guard let paymentIntent = self.paymentIntents[uuid] else {
            resolve(Errors.createErrorFromRnCodeEnum(rnCode: Errors.RNErrorCode.INVALID_REQUIRED_PARAMETER, message: "No PaymentIntent was found with the sdkUuid \(uuid). The PaymentIntent provided must be re-retrieved with retrievePaymentIntent or a new PaymentIntent must be created with createPaymentIntent."))
            return nil
        }
        return (paymentIntent, uuid)
    }

    private func getSetupIntentAndUuid(from params: NSDictionary, resolve: @escaping RCTPromiseResolveBlock) -> (SetupIntent, String)? {
        guard let setupIntentJson = params["setupIntent"] as? NSDictionary else {
            resolve(Errors.createErrorFromRnCodeEnum(rnCode: Errors.RNErrorCode.INVALID_REQUIRED_PARAMETER, message: "You must provide setupIntent."))
            return nil
        }
        guard let uuid = setupIntentJson["sdkUuid"] as? String else {
            resolve(Errors.createErrorFromRnCodeEnum(rnCode: Errors.RNErrorCode.INVALID_REQUIRED_PARAMETER, message: "The SetupIntent is missing sdkUuid field. This method requires you to use the SetupIntent that was returned from either createSetupIntent or retrieveSetupIntent."))
            return nil
        }
        guard let setupIntent = self.setupIntents[uuid] else {
            resolve(Errors.createErrorFromRnCodeEnum(rnCode: Errors.RNErrorCode.INVALID_REQUIRED_PARAMETER, message: "No SetupIntent was found with the sdkUuid \(uuid). The SetupIntent provided must be re-retrieved with retrieveSetupIntent or a new SetupIntent must be created with createSetupIntent."))
            return nil
        }
        return (setupIntent, uuid)
    }

    private func busyMessage(command: String, by busyBy: String) -> String {
        return "Could not execute \(command) because the SDK is busy with another command: \(busyBy)."
    }

    private func buildCollectPaymentIntentConfiguration(from params: NSDictionary, resolve: @escaping RCTPromiseResolveBlock) -> CollectPaymentIntentConfiguration? {
        do {
            return try Mappers.buildCollectPaymentIntentConfiguration(from: params)
        } catch {
            resolve(Errors.createErrorFromNSError(nsError: error as NSError))
            return nil
        }
    }

    private func buildConfirmPaymentIntentConfiguration(from params: NSDictionary, resolve: @escaping RCTPromiseResolveBlock) -> ConfirmPaymentIntentConfiguration? {
        do {
            return try Mappers.buildConfirmPaymentIntentConfiguration(from: params)
        } catch {
            resolve(Errors.createErrorFromNSError(nsError: error as NSError))
            return nil
        }
    }

    private func buildCollectSetupIntentConfiguration(from params: NSDictionary, resolve: @escaping RCTPromiseResolveBlock) -> CollectSetupIntentConfiguration? {
        do {
            return try Mappers.buildCollectSetupIntentConfiguration(from: params)
        } catch {
            resolve(Errors.createErrorFromNSError(nsError: error as NSError))
            return nil
        }
    }
}
