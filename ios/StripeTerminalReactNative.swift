import StripeTerminal
import Foundation

enum ReactNativeConstants: String, CaseIterable {
    case UPDATE_DISCOVERED_READERS = "didUpdateDiscoveredReaders"
    case FINISH_DISCOVERING_READERS = "didFinishDiscoveringReaders"
    case REPORT_UNEXPECTED_READER_DISCONNECT = "didReportUnexpectedReaderDisconnect"
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
    case OFFLINE_STATUS_CHANGE = "didOfflineStatusChange"
    case PAYMENT_INTENT_FORWARDED = "didPaymentIntentForwarded"
    case FORWARDING_FAILURE = "didForwardingFailure"
}

@objc(StripeTerminalReactNative)
class StripeTerminalReactNative: RCTEventEmitter, DiscoveryDelegate, BluetoothReaderDelegate, LocalMobileReaderDelegate, TerminalDelegate, ReconnectionDelegate, OfflineDelegate {
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
    var collectPaymentMethodCancelable: Cancelable? = nil
    var collectRefundPaymentMethodCancelable: Cancelable? = nil
    var collectSetupIntentCancelable: Cancelable? = nil
    var installUpdateCancelable: Cancelable? = nil
    var readReusableCardCancelable: Cancelable? = nil
    var cancelReaderConnectionCancellable: Cancelable? = nil
    var loggingToken: String? = nil
    var terminal: Terminal? = nil

    func terminal(_ terminal: Terminal, didUpdateDiscoveredReaders readers: [Reader]) {
        discoveredReadersList = readers
        guard terminal.connectionStatus == .notConnected else { return }

        sendEvent(withName: ReactNativeConstants.UPDATE_DISCOVERED_READERS.rawValue, body: ["readers": Mappers.mapFromReaders(readers)])
    }

    @objc(initialize:resolver:rejecter:)
    func initialize(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        var connectedReader: NSDictionary? = nil

        TokenProvider.delegate = self

        let logLevel = Mappers.mapToLogLevel(params["logLevel"] as? String)

        if (Terminal.hasTokenProvider()) {
            if let reader = Terminal.shared.connectedReader {
                connectedReader = Mappers.mapFromReader(reader)
            }
            Terminal.shared.logLevel = logLevel
        } else {
            Terminal.setTokenProvider(TokenProvider.shared)
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
            resolve(Errors.createError(code: ErrorCode.cancelFailedAlreadyCompleted, message: "collectPaymentMethod could not be canceled because the command has already been canceled or has completed."))
            return
        }
        cancelable.cancel() { error in
            if let error = error as NSError? {
                resolve(Errors.createError(nsError: error))
            }
            else {
                resolve([:])
            }
            self.collectPaymentMethodCancelable = nil
        }
    }

    @objc(cancelCollectRefundPaymentMethod:rejecter:)
    func cancelCollectRefundPaymentMethod(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let cancelable = collectRefundPaymentMethodCancelable else {
            resolve(Errors.createError(code: ErrorCode.cancelFailedAlreadyCompleted, message: "collectRefundPaymentMethod could not be canceled because the command has already been canceled or has completed."))
            return
        }
        cancelable.cancel() { error in
            if let error = error as NSError? {
                resolve(Errors.createError(nsError: error))
            }
            else {
                resolve([:])
            }
            self.collectRefundPaymentMethodCancelable = nil
        }
    }

    @objc(cancelCollectSetupIntent:rejecter:)
    func cancelCollectSetupIntent(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let cancelable = collectSetupIntentCancelable else {
            resolve(Errors.createError(code: ErrorCode.cancelFailedAlreadyCompleted, message: "collectSetupIntent could not be canceled because the command has already been canceled or has completed."))
            return
        }
        cancelable.cancel() { error in
            if let error = error as NSError? {
                resolve(Errors.createError(nsError: error))
            }
            else {
                resolve([:])
            }
            self.collectSetupIntentCancelable = nil
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

        let config: DiscoveryConfiguration
        do {
            config = try Mappers.mapToDiscoveryConfiguration(discoveryMethod, simulated: simulated ?? false)
        } catch {
            resolve(Errors.createError(nsError: error as NSError))
            return
        }

        guard discoverCancelable == nil else {
            let message = busyMessage(command: "discoverReaders", by: "discoverReaders")
            resolve(Errors.createError(code: CommonErrorType.AlreadyDiscovering, message: message))
            return
        }

        self.discoverCancelable = Terminal.shared.discoverReaders(config, delegate: self) { error in
            if let error = error as NSError? {
                let _error = Errors.createError(nsError: error)

                resolve(_error)
                self.sendEvent(withName: ReactNativeConstants.FINISH_DISCOVERING_READERS.rawValue, body: ["result": _error])
                self.discoverCancelable = nil
            } else {
                resolve([:])
                self.sendEvent(withName: ReactNativeConstants.FINISH_DISCOVERING_READERS.rawValue, body: ["result": ["error": nil]])
                self.discoverCancelable = nil
            }
        }
    }

    @objc(cancelDiscovering:rejecter:)
    func cancelDiscovering(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let cancelable = discoverCancelable else {
            resolve(Errors.createError(code: ErrorCode.cancelFailedAlreadyCompleted, message: "discoverReaders could not be canceled because the command has already been canceled or has completed."))
            return
        }
        cancelable.cancel() { error in
            if let error = error as NSError? {
                resolve(Errors.createError(nsError: error))
                self.discoverCancelable = nil
            } else {
                resolve([:])
                self.discoverCancelable = nil
            }
        }
    }


    @objc(connectBluetoothReader:resolver:rejecter:)
    func connectBluetoothReader(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let reader = params["reader"] as? NSDictionary else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "You must provide a reader object"))
            return
        }

        // since simulated readers don't contain `id` property we take serialNumber as a fallback
        let readerId = reader["serialNumber"] as? String

        guard let selectedReader = discoveredReadersList?.first(where: { $0.serialNumber == readerId }) else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "Could not find reader with id \(readerId ?? "")"))
            return

        }

        let locationId = params["locationId"] as? String
        let autoReconnectOnUnexpectedDisconnect = params["autoReconnectOnUnexpectedDisconnect"] as? Bool ?? false

        let connectionConfig: BluetoothConnectionConfiguration
        do {
            connectionConfig = try BluetoothConnectionConfigurationBuilder(locationId: locationId ?? selectedReader.locationId ?? "")
                .setAutoReconnectOnUnexpectedDisconnect(autoReconnectOnUnexpectedDisconnect)
                .setAutoReconnectionDelegate(autoReconnectOnUnexpectedDisconnect ? self : nil)
                .build()
        } catch {
            resolve(Errors.createError(nsError: error as NSError))
            return
        }

        Terminal.shared.connectBluetoothReader(selectedReader, delegate: self, connectionConfig: connectionConfig) { reader, error in
            if let reader = reader {
                resolve(["reader": Mappers.mapFromReader(reader)])
            } else if let error = error as NSError? {
                resolve(Errors.createError(nsError: error))
            } else {
                resolve([:])
            }
        }
    }

    @objc(connectInternetReader:resolver:rejecter:)
    func connectInternetReader(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let reader = params["reader"] as? NSDictionary else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "You must provide a reader object"))
            return
        }

        // since simulated readers don't contain `id` property we take serialNumber as a fallback
        let readerId = reader["serialNumber"] as? String

        guard let selectedReader = discoveredReadersList?.first(where: { $0.serialNumber == readerId }) else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "Could not find reader with id \(readerId ?? "")"))
            return
        }

        let connectionConfig: InternetConnectionConfiguration
        do {
             connectionConfig = try InternetConnectionConfigurationBuilder()
                .setFailIfInUse(params["failIfInUse"] as? Bool ?? false)
                .setAllowCustomerCancel(true)
                .build()
        }  catch {
            resolve(Errors.createError(nsError: error as NSError))
            return
        }

        Terminal.shared.connectInternetReader(selectedReader, connectionConfig: connectionConfig) { reader, error in
            if let reader = reader {
                resolve(["reader": Mappers.mapFromReader(reader)])
            } else if let error = error as NSError? {
                resolve(Errors.createError(nsError: error))
            }
        }
    }

    @objc(connectLocalMobileReader:resolver:rejecter:)
    func connectLocalMobileReader(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let reader = params["reader"] as? NSDictionary else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "You must provide a reader object"))
            return
        }

        // since simulated readers don't contain `id` property we take serialNumber as a fallback
        let readerId = reader["serialNumber"] as? String

        guard let selectedReader = discoveredReadersList?.first(where: { $0.serialNumber == readerId }) else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "Could not find reader with id \(readerId ?? "")"))
            return
        }

        let locationId = params["locationId"] as? String
        let onBehalfOf: String? = params["onBehalfOf"] as? String
        let merchantDisplayName: String? = params["merchantDisplayName"] as? String
        let tosAcceptancePermitted: Bool = params["tosAcceptancePermitted"] as? Bool ?? true

        let connectionConfig: LocalMobileConnectionConfiguration
        do {
            connectionConfig = try LocalMobileConnectionConfigurationBuilder(locationId: locationId ?? selectedReader.locationId ?? "")
                .setMerchantDisplayName(merchantDisplayName ?? nil)
                .setOnBehalfOf(onBehalfOf ?? nil)
                .setTosAcceptancePermitted(tosAcceptancePermitted)
                .build()
        }  catch {
            resolve(Errors.createError(nsError: error as NSError))
            return
        }

        Terminal.shared.connectLocalMobileReader(selectedReader, delegate: self, connectionConfig: connectionConfig) { reader, error in
            if let reader = reader {
                resolve(["reader": Mappers.mapFromReader(reader)])
            } else if let error = error as NSError? {
                resolve(Errors.createError(nsError: error))
            } else {
                resolve([:])
            }
        }
    }

    @objc(disconnectReader:rejecter:)
    func disconnectReader(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        Terminal.shared.disconnectReader() { error in
            if let error = error as NSError? {
                resolve(Errors.createError(nsError: error))
            } else {
                self.paymentIntents = [:]
                self.terminal = nil
                resolve([:])
            }
        }
    }

    func terminal(_ terminal: Terminal, didReportUnexpectedReaderDisconnect reader: Reader) {
        let error = Errors.createError(code: ErrorCode.unexpectedSdkError, message: "Reader has been disconnected unexpectedly")
        sendEvent(withName: ReactNativeConstants.REPORT_UNEXPECTED_READER_DISCONNECT.rawValue, body: error)
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

        let stripeDescription = params["stripeDescription"] as? String
        let statementDescriptor = params["statementDescriptor"] as? String
        let receiptEmail = params["receiptEmail"] as? String
        let customer = params["customer"] as? String
        let transferGroup = params["transferGroup"] as? String
        let metadata = params["metadata"] as? [String : String]
        let paymentMethodOptions = params["paymentMethodOptions"] as? [AnyHashable : Any] ?? [:]
        let extendedAuth = paymentMethodOptions["requestExtendedAuthorization"] as? Bool ?? false
        let incrementalAuth = paymentMethodOptions["requestIncrementalAuthorizationSupport"] as? Bool ?? false
        let requestedPriority = paymentMethodOptions["requestedPriority"] as? String
        let captureMethod = params["captureMethod"] as? String

        let paymentParamsBuilder = PaymentIntentParametersBuilder(amount: UInt(truncating: amount),currency: currency)
            .setPaymentMethodTypes(paymentMethodTypes)
            .setCaptureMethod(captureMethod == "automatic" ? .automatic : .manual)
            .setSetupFutureUsage(setupFutureUsage)
            .setOnBehalfOf(onBehalfOf)
            .setTransferDataDestination(transferDataDestination)
            .setApplicationFeeAmount(applicationFeeAmount)
            .setStripeDescription(stripeDescription)
            .setStatementDescriptor(statementDescriptor)
            .setReceiptEmail(receiptEmail)
            .setCustomer(customer)
            .setTransferGroup(transferGroup)
            .setMetadata(metadata)

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

        let cardPresentParams: CardPresentParameters
        do {
            cardPresentParams = try cardPresentParamsBuilder.build()
        } catch {
            resolve(Errors.createError(nsError: error as NSError))
            return
        }

        let paymentMethodOptionsParameters: PaymentMethodOptionsParameters
        do {
            paymentMethodOptionsParameters = try PaymentMethodOptionsParametersBuilder(cardPresentParameters: cardPresentParams).build()
        } catch {
            resolve(Errors.createError(nsError: error as NSError))
            return
        }
        paymentParamsBuilder.setPaymentMethodOptionsParameters(paymentMethodOptionsParameters)

        let paymentParams: PaymentIntentParameters
        do {
            paymentParams = try paymentParamsBuilder.build()
        } catch {
            resolve(Errors.createError(nsError: error as NSError))
            return
        }

        let offlineBehavior = params["offlineBehavior"] as? String
        let offlineModeTransactionLimit = params["offlineModeTransactionLimit"] as? NSNumber ?? 0
        let offlineModeStoredTransactionLimit = params["offlineModeStoredTransactionLimit"] as? NSNumber ?? 0
        
        var isOverOfflineTransactionLimit = amount.intValue >= offlineModeTransactionLimit.intValue
        if let offlinePaymentTotalByCurrency = Terminal.shared.offlineStatus.sdk.paymentAmountsByCurrency[paymentParams.currency]?.intValue {
            isOverOfflineTransactionLimit = isOverOfflineTransactionLimit || (offlinePaymentTotalByCurrency >= offlineModeStoredTransactionLimit.intValue)
        }
        let offlineBehaviorFromTransactionLimit: OfflineBehavior = {
            if isOverOfflineTransactionLimit {
                return .requireOnline
            } else {
                switch offlineBehavior {
                case "prefer_online": return OfflineBehavior.preferOnline
                case "require_online": return OfflineBehavior.requireOnline
                case "force_offline": return OfflineBehavior.forceOffline
                default: return OfflineBehavior.preferOnline
                }
            }
        }()
        
        let offlineCreateConfig: CreateConfiguration
        do {
            offlineCreateConfig = try CreateConfigurationBuilder().setOfflineBehavior(offlineBehaviorFromTransactionLimit).build()
        } catch {
            resolve(Errors.createError(nsError: error as NSError))
            return
        }
        
        Terminal.shared.createPaymentIntent(paymentParams, createConfig: offlineCreateConfig) { pi, error in
            if let error = error as NSError? {
                resolve(Errors.createError(nsError: error))
            } else if let pi = pi {
                let uuid = UUID().uuidString
                let paymentIntent = Mappers.mapFromPaymentIntent(pi, uuid: uuid)
                self.paymentIntents[uuid] = pi
                resolve(["paymentIntent": paymentIntent])
            }
        }
    }

    @objc(createSetupIntent:resolver:rejecter:)
    func createSetupIntent(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let setupIntentParams: SetupIntentParameters
        do {
            setupIntentParams = try SetupIntentParametersBuilder()
                .setCustomer(params["customerId"] as? String)
                .build()
        } catch {
            resolve(Errors.createError(nsError: error as NSError))
            return
        }

        Terminal.shared.createSetupIntent(setupIntentParams) { si, error in
            if let error = error as NSError? {
                resolve(Errors.createError(nsError: error))
            } else if let si = si {
                let uuid = UUID().uuidString
                let setupIntent = Mappers.mapFromSetupIntent(si,uuid: uuid)
                self.setupIntents[uuid] = si
                resolve(["setupIntent": setupIntent])
            }
        }
    }

    @objc(collectPaymentMethod:resolver:rejecter:)
    func collectPaymentMethod(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let paymentIntentJSON = params["paymentIntent"] as? NSDictionary else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "You must provide paymentIntent."))
            return
        }
        guard let uuid = paymentIntentJSON["sdk_uuid"] as? String else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "The PaymentIntent is missing sdk_uuid field. This method requires you to use the PaymentIntent that was returned from either createPaymentIntent or retrievePaymentIntent."))
            return
        }
        guard let paymentIntent = self.paymentIntents[uuid] else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "No PaymentIntent was found with the sdk_uuid \(uuid). The PaymentIntent provided must be re-retrieved with retrievePaymentIntent or a new PaymentIntent must be created with createPaymentIntent."))
            return
        }

        let skipTipping = params["skipTipping"] as? Bool ?? false
        let updatePaymentIntent = params["updatePaymentIntent"] as? Bool ?? false
        let enableCustomerCancellation = params["enableCustomerCancellation"] as? Bool ?? false

        let collectConfigBuilder = CollectConfigurationBuilder()
            .setSkipTipping(skipTipping)
            .setUpdatePaymentIntent(updatePaymentIntent)
            .setEnableCustomerCancellation(enableCustomerCancellation)

        if let eligibleAmount = params["tipEligibleAmount"] as? Int {
            do {
                let tippingConfig = try TippingConfigurationBuilder()
                    .setEligibleAmount(eligibleAmount)
                    .build()
                collectConfigBuilder.setTippingConfiguration(tippingConfig)
            } catch {
                resolve(Errors.createError(nsError: error as NSError))
                return
            }
        }

        let collectConfig: CollectConfiguration
        do {
             collectConfig = try collectConfigBuilder.build()
        } catch {
            resolve(Errors.createError(nsError: error as NSError))
            return
        }

        self.collectPaymentMethodCancelable = Terminal.shared.collectPaymentMethod(
            paymentIntent,
            collectConfig: collectConfig
        ) { pi, collectError  in
            if let error = collectError as NSError? {
                resolve(Errors.createError(nsError: error))
            } else if let paymentIntent = pi {
                let paymentIntent = Mappers.mapFromPaymentIntent(paymentIntent, uuid: uuid)
                resolve(["paymentIntent": paymentIntent])
            }
            self.collectPaymentMethodCancelable = nil
        }
    }

    @objc(retrievePaymentIntent:resolver:rejecter:)
    func retrievePaymentIntent(secret: String?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let clientSecret = secret else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "You must provide cliectSecret."))
            return
        }

        Terminal.shared.retrievePaymentIntent(clientSecret: clientSecret) { pi, error in
            if let error = error as NSError? {
                resolve(Errors.createError(nsError: error))
            } else if let pi = pi {
                let uuid = UUID().uuidString
                let paymentIntent = Mappers.mapFromPaymentIntent(pi, uuid: uuid)
                self.paymentIntents[uuid] = pi
                resolve(["paymentIntent": paymentIntent])
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
            resolve(Errors.createError(nsError: error as NSError))
            return
        }

        Terminal.shared.listLocations(parameters: listParameters) { locations, hasMore, error in
            if let error = error as NSError? {
                resolve(Errors.createError(nsError: error))
            } else if let locations = locations {
                let list = Mappers.mapFromLocationsList(locations)
                resolve(["locations": list, "hasMore": hasMore])
            }
        }
    }

    @objc(confirmPaymentIntent:resolver:rejecter:)
    func confirmPaymentIntent(paymentIntentJson: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let uuid = paymentIntentJson["sdk_uuid"] as? String else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "The PaymentIntent is missing sdk_uuid field. This method requires you to use the PaymentIntent that was returned from either createPaymentIntent or retrievePaymentIntent."))
            return
        }
        guard let paymentIntent = self.paymentIntents[uuid] else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "No PaymentIntent was found with the sdk_uuid \(uuid). The PaymentIntent provided must be re-retrieved with retrievePaymentIntent or a new PaymentIntent must be created with createPaymentIntent."))
            return
        }

        Terminal.shared.confirmPaymentIntent(paymentIntent) { pi, error in
            if let error = error as NSError? {
                resolve(Errors.createError(nsError: error))
            } else if let pi = pi {
                let uuid = UUID().uuidString
                let paymentIntent = Mappers.mapFromPaymentIntent(pi, uuid: uuid)
                self.paymentIntents = [:]
                resolve(["paymentIntent": paymentIntent])
            }
        }
    }

    func terminal(_ terminal: Terminal, didChangePaymentStatus status: PaymentStatus) {
        let result = Mappers.mapFromPaymentStatus(status)
        sendEvent(withName: ReactNativeConstants.CHANGE_PAYMENT_STATUS.rawValue, body: ["result": result])
    }

    func terminal(_ terminal: Terminal, didChangeConnectionStatus status: ConnectionStatus) {
        let result = Mappers.mapFromConnectionStatus(status)
        sendEvent(withName: ReactNativeConstants.CHANGE_CONNECTION_STATUS.rawValue, body: ["result": result])
    }

    func reader(_ reader: Reader, didStartReconnect cancelable: Cancelable) {
        self.cancelReaderConnectionCancellable = cancelable
        let reader = Mappers.mapFromReader(reader)
        sendEvent(withName: ReactNativeConstants.START_READER_RECONNECT.rawValue, body: ["reader": reader])
    }

    func readerDidSucceedReconnect(_ reader: Reader) {
        let reader = Mappers.mapFromReader(reader)
        sendEvent(withName: ReactNativeConstants.READER_RECONNECT_SUCCEED.rawValue, body: ["reader": reader])
    }

    func readerDidFailReconnect(_ reader: Reader) {
        let error = Errors.createError(code: ErrorCode.unexpectedSdkError, message: "Reader reconnect fail")
        sendEvent(withName: ReactNativeConstants.READER_RECONNECT_FAIL.rawValue, body: error)
    }

    @objc(cancelReaderReconnection:rejecter:)
    func cancelReaderReconnection(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        self.cancelReaderConnectionCancellable?.cancel() { error in
            if let error = error as NSError? {
                resolve(Errors.createError(nsError: error))
            } else {
                resolve([:])
            }
        }
    }

    @objc(cancelPaymentIntent:resolver:rejecter:)
    func cancelPaymentIntent(paymentIntentJson: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let uuid = paymentIntentJson["sdk_uuid"] as? String else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "The PaymentIntent is missing sdk_uuid field. This method requires you to use the PaymentIntent that was returned from either createPaymentIntent or retrievePaymentIntent."))
            return
        }
        guard let paymentIntent = self.paymentIntents[uuid] else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "No PaymentIntent was found with the sdk_uuid \(uuid). The PaymentIntent provided must be re-retrieved with retrievePaymentIntent or a new PaymentIntent must be created with createPaymentIntent."))
            return
        }
        Terminal.shared.cancelPaymentIntent(paymentIntent) { pi, collectError  in
            if let error = collectError as NSError? {
                resolve(Errors.createError(nsError: error))
            } else if let pi = pi {
                let uuid = UUID().uuidString
                let paymentIntent = Mappers.mapFromPaymentIntent(pi, uuid: uuid)
                self.paymentIntents[pi.stripeId] = nil
                resolve(["paymentIntent": paymentIntent])
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
                resolve(Errors.createError(nsError: error))
            } else {
                resolve([:])
            }
        }
    }

    @objc(setReaderDisplay:resolver:rejecter:)
    func setReaderDisplay(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let invalidParams = Errors.validateRequiredParameters(params: params, requiredParams: ["currency", "tax", "total"])

        guard invalidParams == nil else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "You must provide \(invalidParams!) parameters."))
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
            resolve(Errors.createError(nsError: error as NSError))
            return
        }

        Terminal.shared.setReaderDisplay(cart) { error in
            if let error = error as NSError? {
                resolve(Errors.createError(nsError: error))
            } else {
                resolve([:])
            }
        }
    }

    @objc(cancelSetupIntent:resolver:rejecter:)
    func cancelSetupIntent(setupIntentJson: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let uuid = setupIntentJson["sdk_uuid"] as? String else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "The SetupIntent is missing sdk_uuid field. This method requires you to use the SetupIntent that was returned from either createPaymentIntent or retrievePaymentIntent."))
            return
        }
        guard let setupIntent = self.setupIntents[uuid] else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "No SetupIntent was found with the sdk_uuid \(uuid). The SetupIntent provided must be re-retrieved with retrieveSetupIntent or a new SetupIntent must be created with createSetupIntent."))
            return
        }
        Terminal.shared.cancelSetupIntent(setupIntent) { si, collectError  in
            if let error = collectError as NSError? {
                resolve(Errors.createError(nsError: error))
            } else if let si = si {
                let uuid = UUID().uuidString
                let setupIntent = Mappers.mapFromSetupIntent(si,uuid: uuid)
                self.setupIntents[si.stripeId] = nil
                resolve(["setupIntent": setupIntent])
            }
        }
    }

    @objc(clearReaderDisplay:rejecter:)
    func clearReaderDisplay(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        Terminal.shared.clearReaderDisplay() { error in
            if let error = error as NSError? {
                resolve(Errors.createError(nsError: error))
            } else {
                resolve([:])
            }
        }
    }

    @objc(retrieveSetupIntent:resolver:rejecter:)
    func retrieveSetupIntent(secret: String?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let clientSecret = secret else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "You must provide cliectSecret."))
            return
        }
        Terminal.shared.retrieveSetupIntent(clientSecret: clientSecret) { si, error in
            if let error = error as NSError? {
                resolve(Errors.createError(nsError: error))
            } else if let si = si {
                let uuid = UUID().uuidString
                self.setupIntents[uuid] = si
                let si = Mappers.mapFromSetupIntent(si,uuid: uuid)
                resolve(["setupIntent": si])
            }
        }
    }

    @objc(collectSetupIntentPaymentMethod:resolver:rejecter:)
    func collectSetupIntentPaymentMethod(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let setupIntentJson = params["setupIntent"] as? NSDictionary else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "You must provide setupIntent."))
            return
        }

        guard let uuid = setupIntentJson["sdk_uuid"] as? String else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "The SetupIntent is missing sdk_uuid field. This method requires you to use the SetupIntent that was returned from either createPaymentIntent or retrievePaymentIntent."))
            return
        }
        guard let setupIntent = self.setupIntents[uuid] else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "No SetupIntent was found with the sdk_uuid \(uuid). The SetupIntent provided must be re-retrieved with retrieveSetupIntent or a new SetupIntent must be created with createSetupIntent."))
            return
        }

        let customerConsentCollected = params["customerConsentCollected"] as? Bool ?? false
        let enableCustomerCancellation = params["enableCustomerCancellation"] as? Bool ?? false
        let setupIntentConfiguration: SetupIntentConfiguration
        do {
            setupIntentConfiguration = try SetupIntentConfigurationBuilder().setEnableCustomerCancellation(enableCustomerCancellation)
                .build()
        } catch {
            resolve(Errors.createError(nsError: error as NSError))
            return
        }
        

        self.collectSetupIntentCancelable = Terminal.shared.collectSetupIntentPaymentMethod(setupIntent, customerConsentCollected: customerConsentCollected, setupConfig: setupIntentConfiguration) { si, collectError  in
            if let error = collectError as NSError? {
                resolve(Errors.createError(nsError: error))
            } else if let setupIntent = si {
                let setupIntent = Mappers.mapFromSetupIntent(setupIntent, uuid: uuid)
                resolve(["setupIntent": setupIntent])
            }
            self.collectSetupIntentCancelable = nil
        }
    }

    @objc(confirmSetupIntent:resolver:rejecter:)
    func confirmSetupIntent(setupIntentJson: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let uuid = setupIntentJson["sdk_uuid"] as? String else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "The SetupIntent is missing sdk_uuid field. This method requires you to use the SetupIntent that was returned from either createPaymentIntent or retrievePaymentIntent."))
            return
        }
        guard let setupIntent = self.setupIntents[uuid] else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "No SetupIntent was found with the sdk_uuid \(uuid). The SetupIntent provided must be re-retrieved with retrieveSetupIntent or a new SetupIntent must be created with createSetupIntent."))
            return
        }


        Terminal.shared.confirmSetupIntent(setupIntent) { si, collectError  in
            if let error = collectError as NSError? {
                resolve(Errors.createError(nsError: error))
            } else if let setupIntent = si {
                let uuid = UUID().uuidString
                let setupIntent = Mappers.mapFromSetupIntent(setupIntent, uuid: uuid)
                resolve(["setupIntent": setupIntent])
            }
        }
    }

    @objc(collectRefundPaymentMethod:resolver:rejecter:)
    func collectRefundPaymentMethod(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let invalidParams = Errors.validateRequiredParameters(params: params, requiredParams: ["chargeId", "amount", "currency"])

        guard invalidParams == nil else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "You must provide \(invalidParams!) parameters."))
            return
        }
        let chargeId = params["chargeId"] as? String
        let amount = params["amount"] as? NSNumber
        let currency = params["currency"] as? String
        let intAmount = UInt(truncating: amount!);
        let refundApplicationFee = params["refundApplicationFee"] as? NSNumber
        let reverseTransfer = params["reverseTransfer"] as? NSNumber
        let enableCustomerCancellation = params["enableCustomerCancellation"] as? Bool ?? false

        let refundParams: RefundParameters
        do {
            refundParams = try RefundParametersBuilder(chargeId: chargeId!,amount: intAmount, currency: currency!)
                .setReverseTransfer(reverseTransfer?.intValue == 1 ? true : false)
                .setRefundApplicationFee(refundApplicationFee?.intValue == 1 ? true : false)
                .build()
        } catch {
            resolve(Errors.createError(nsError: error as NSError))
            return
        }
        
        let refundConfiguration: RefundConfiguration
        do {
            refundConfiguration = try RefundConfigurationBuilder().setEnableCustomerCancellation(enableCustomerCancellation)
                .build()
        } catch {
            resolve(Errors.createError(nsError: error as NSError))
            return
        }

        self.collectRefundPaymentMethodCancelable = Terminal.shared.collectRefundPaymentMethod(refundParams, refundConfig: refundConfiguration) { error in
            if let error = error as NSError? {
                resolve(Errors.createError(nsError: error))
            } else {
                resolve([:])
            }
            self.collectRefundPaymentMethodCancelable = nil
        }
    }

    @objc(confirmRefund:rejecter:)
    func confirmRefund(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        Terminal.shared.confirmRefund() { rf, error in
            if let error = error as NSError? {
                resolve(Errors.createError(nsError: error))
            } else {
                let refund = Mappers.mapFromRefund(rf!)
                resolve(["refund": refund])
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
           let errorAsDictionary = Errors.createError(nsError: nsError)
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

    func localMobileReader(_ reader: Reader, didStartInstallingUpdate update: ReaderSoftwareUpdate, cancelable: Cancelable?) {
        self.installUpdateCancelable = cancelable
        sendEvent(withName: ReactNativeConstants.START_INSTALLING_UPDATE.rawValue, body: ["result": Mappers.mapFromReaderSoftwareUpdate(update) ?? [:]])
    }

    func localMobileReader(_ reader: Reader, didReportReaderSoftwareUpdateProgress progress: Float) {
        let result: [AnyHashable : Any?] = [
            "progress": String(progress),
        ]
        sendEvent(withName: ReactNativeConstants.REPORT_UPDATE_PROGRESS.rawValue, body: ["result": result])
    }

    func localMobileReader(_ reader: Reader, didFinishInstallingUpdate update: ReaderSoftwareUpdate?, error: Error?) {
        var result = Mappers.mapFromReaderSoftwareUpdate(update) ?? [:]
        if let nsError = error as NSError? {
           let errorAsDictionary = Errors.createError(nsError: nsError)
            // createError will return a dictionary of ["error": {the error}]
            // so merge that with the result so we have a single result.error
            result = result.merging(errorAsDictionary, uniquingKeysWith: { _, error in
                error
            })
        }
        sendEvent(withName: ReactNativeConstants.FINISH_INSTALLING_UPDATE.rawValue, body: ["result": result])
    }

    func localMobileReader(_ reader: Reader, didRequestReaderInput inputOptions: ReaderInputOptions = []) {
        let result = Mappers.mapFromReaderInputOptions(inputOptions)
        sendEvent(withName: ReactNativeConstants.REQUEST_READER_INPUT.rawValue, body: ["result": result])
    }

    func localMobileReader(_ reader: Reader, didRequestReaderDisplayMessage displayMessage: ReaderDisplayMessage) {
        let result = Mappers.mapFromReaderDisplayMessage(displayMessage)
        sendEvent(withName: ReactNativeConstants.REQUEST_READER_DISPLAY_MESSAGE.rawValue, body: ["result": result])
    }

    func terminal(_ terminal: Terminal, didChange offlineStatus: OfflineStatus) {
        self.terminal = terminal
        let offlineStatus = Mappers.mapFromOfflineStatus(offlineStatus)
        sendEvent(withName: ReactNativeConstants.OFFLINE_STATUS_CHANGE.rawValue, body: ["result": offlineStatus])
    }
    
    func terminal(_ terminal: Terminal, didForwardPaymentIntent intent: PaymentIntent, error: Error?) {
        self.terminal = terminal
        let result = Mappers.mapFromPaymentIntent(intent, uuid: "")
        sendEvent(withName: ReactNativeConstants.PAYMENT_INTENT_FORWARDED.rawValue, body: ["result": result])
    }
    
    func terminal(_ terminal: Terminal, didReportForwardingError error: Error) {
        self.terminal = terminal
        let result = Errors.createError(nsError: error as NSError)
        sendEvent(withName: ReactNativeConstants.FORWARDING_FAILURE.rawValue, body: ["result": result])
    }

    @objc(getOfflineStatus:rejecter:)
    func getOfflineStatus(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let offlinePaymentAmountsByCurrencyDic = self.terminal?.offlineStatus.sdk.paymentAmountsByCurrency
        let sdkDic: NSDictionary = [
            "offlinePaymentsCount": self.terminal?.offlineStatus.sdk.paymentsCount,
            "offlinePaymentAmountsByCurrency": offlinePaymentAmountsByCurrencyDic
        ]
        
        resolve(["sdk": sdkDic])
    }
}
