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
    var collectPaymentMethodCancelable: Cancelable? = nil
    var collectRefundPaymentMethodCancelable: Cancelable? = nil
    var collectSetupIntentCancelable: Cancelable? = nil
    var installUpdateCancelable: Cancelable? = nil
    var readReusableCardCancelable: Cancelable? = nil
    var cancelReaderConnectionCancellable: Cancelable? = nil
    var collectInputsCancellable: Cancelable? = nil
    var loggingToken: String? = nil

    func terminal(_ terminal: Terminal, didUpdateDiscoveredReaders readers: [Reader]) {
        discoveredReadersList = readers
        guard terminal.connectionStatus == .notConnected || terminal.connectionStatus == .discovering else { return }

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
        let callbackId = params["callbackId"] as? String

        TokenProvider.shared.setConnectionToken(token: token, error: error, callbackId: callbackId)
        resolve([:])
    }

    @objc(discoverReaders:resolver:rejecter:)
    func discoverReaders(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let simulated = params["simulated"] as? Bool
        let discoveryMethod = params["discoveryMethod"] as? String
        let timeout = params["timeout"] as? UInt ?? 0
        let locationId = params["locationId"] as? String

        let config: DiscoveryConfiguration
        do {
            config = try Mappers.mapToDiscoveryConfiguration(discoveryMethod, simulated: simulated ?? false,  locationId: locationId ?? nil, timeout: timeout)
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


    @objc(connectReader:discoveryMethod:resolver:rejecter:)
    func connectReader(params: NSDictionary, discoveryMethod: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let reader = params["reader"] as? NSDictionary else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "You must provide a reader object"))
            return
        }

        // since simulated readers don't contain `id` property we take serialNumber as a fallback
        let readerId = reader["serialNumber"] as? String
        let discoveryMethodType = Mappers.mapToDiscoveryMethod(discoveryMethod)
        guard let selectedReader = discoveredReadersList?.first(where: { $0.serialNumber == readerId }) else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "Could not find reader with id \(readerId ?? "")"))
            return

        }

        let locationId = params["locationId"] as? String
        let autoReconnectOnUnexpectedDisconnect = params["autoReconnectOnUnexpectedDisconnect"] as? Bool ?? true
        let failIfInUse: Bool = params["failIfInUse"] as? Bool ?? false
        let onBehalfOf: String? = params["onBehalfOf"] as? String
        let merchantDisplayName: String? = params["merchantDisplayName"] as? String
        let tosAcceptancePermitted: Bool = params["tosAcceptancePermitted"] as? Bool ?? true
        
        let connectionConfig: ConnectionConfiguration
        do {
            connectionConfig = try getConnectionConfig(
                selectedReader: selectedReader,
                locationId: locationId,
                autoReconnectOnUnexpectedDisconnect: autoReconnectOnUnexpectedDisconnect,
                failIfInUse: failIfInUse,
                merchantDisplayName: merchantDisplayName,
                onBehalfOf: onBehalfOf,
                tosAcceptancePermitted: tosAcceptancePermitted,
                discoveryMethod: discoveryMethodType)! // TODO find way to !
        } catch {
            resolve(Errors.createError(nsError: error as NSError))
            return
        }

        Terminal.shared.connectReader(selectedReader, connectionConfig: connectionConfig) { reader, error in
            if let reader = reader {
                resolve(["reader": Mappers.mapFromReader(reader)])
            } else if let error = error as NSError? {
                resolve(Errors.createError(nsError: error))
            } else {
                resolve([:])
            }
        }
    }
    
    private func getConnectionConfig(
        selectedReader: Reader,
        locationId: String?,
        autoReconnectOnUnexpectedDisconnect: Bool,
        failIfInUse: Bool,
        merchantDisplayName: String?,
        onBehalfOf: String?,
        tosAcceptancePermitted: Bool,
        discoveryMethod: DiscoveryMethod) throws -> ConnectionConfiguration? {
        switch discoveryMethod {
        case .bluetoothScan, .bluetoothProximity:
            return try BluetoothConnectionConfigurationBuilder(delegate: self, locationId: locationId ?? selectedReader.locationId ?? "")
               .setAutoReconnectOnUnexpectedDisconnect(autoReconnectOnUnexpectedDisconnect)
               .build()
        case .internet:
            return try InternetConnectionConfigurationBuilder(delegate: self)
                .setFailIfInUse(failIfInUse)
                .setAllowCustomerCancel(true)
                .build()
        case .tapToPay:
            return try TapToPayConnectionConfigurationBuilder(delegate: self, locationId: locationId ?? selectedReader.locationId ?? "")
                .setMerchantDisplayName(merchantDisplayName ?? nil)
                .setOnBehalfOf(onBehalfOf ?? nil)
                .setTosAcceptancePermitted(tosAcceptancePermitted)
                .setAutoReconnectOnUnexpectedDisconnect(autoReconnectOnUnexpectedDisconnect)
                .build()
        @unknown default:
            return nil
        }
    }

    @objc(disconnectReader:rejecter:)
    func disconnectReader(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        Terminal.shared.disconnectReader() { error in
            if let error = error as NSError? {
                resolve(Errors.createError(nsError: error))
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
                resolve(Errors.createError(nsError: error))
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

        let stripeDescription = params["stripeDescription"] as? String
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
        let captureMethod = params["captureMethod"] as? String

        let paymentParamsBuilder = PaymentIntentParametersBuilder(amount: UInt(truncating: amount),currency: currency)
            .setCaptureMethod(captureMethod == "automatic" ? .automatic : .manual)
            .setSetupFutureUsage(setupFutureUsage)
            .setOnBehalfOf(onBehalfOf)
            .setTransferDataDestination(transferDataDestination)
            .setApplicationFeeAmount(applicationFeeAmount)
            .setStripeDescription(stripeDescription)
            .setStatementDescriptor(statementDescriptor)
            .setStatementDescriptorSuffix(statementDescriptorSuffix)
            .setReceiptEmail(receiptEmail)
            .setCustomer(customer)
            .setTransferGroup(transferGroup)
            .setMetadata(metadata)

        if !paymentMethodTypes.isEmpty {
            paymentParamsBuilder.setPaymentMethodTypes(paymentMethodTypes.map(Mappers.mapPaymentMethodType))
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
            resolve(Errors.createError(nsError: error as NSError))
            return
        }

        Terminal.shared.createPaymentIntent(paymentParams, createConfig: offlineCreateConfig) { pi, error in
            if let error = error as NSError? {
                var result = Errors.createError(nsError: error)
                if let pi {
                    let paymentIntent = Mappers.mapFromPaymentIntent(pi, uuid: "")
                    result["paymentIntent"] = paymentIntent
                }
                resolve(result)
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
                .setCustomer(params["customer"] as? String)
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
        guard let uuid = paymentIntentJSON["sdkUuid"] as? String else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "The PaymentIntent is missing sdkUuid field. This method requires you to use the PaymentIntent that was returned from either createPaymentIntent or retrievePaymentIntent."))
            return
        }
        guard let paymentIntent = self.paymentIntents[uuid] else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "No PaymentIntent was found with the sdkUuid \(uuid). The PaymentIntent provided must be re-retrieved with retrievePaymentIntent or a new PaymentIntent must be created with createPaymentIntent."))
            return
        }

        let skipTipping = params["skipTipping"] as? Bool ?? false
        let updatePaymentIntent = params["updatePaymentIntent"] as? Bool ?? false
        let enableCustomerCancellation = params["enableCustomerCancellation"] as? Bool ?? false
        let requestDynamicCurrencyConversion = params["requestDynamicCurrencyConversion"] as? Bool ?? false
        let surchargeNotice = params["surchargeNotice"] as? String

        let collectConfigBuilder = CollectConfigurationBuilder()
            .setSkipTipping(skipTipping)
            .setUpdatePaymentIntent(updatePaymentIntent)
            .setEnableCustomerCancellation(enableCustomerCancellation)
            .setRequestDynamicCurrencyConversion(requestDynamicCurrencyConversion)
            .setSurchargeNotice(surchargeNotice)

        if let allowRedisplay = params["allowRedisplay"] as? String {
            collectConfigBuilder.setAllowRedisplay(Mappers.mapToAllowRedisplay(allowToredisplay: allowRedisplay))
        }
        if updatePaymentIntent, let surchargeNoticeValue = surchargeNotice {
            collectConfigBuilder.setSurchargeNotice(surchargeNoticeValue)
        }

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
                var result = Errors.createError(nsError: error)
                if let pi {
                    let paymentIntent = Mappers.mapFromPaymentIntent(pi, uuid: "")
                    result["paymentIntent"] = paymentIntent
                }
                resolve(result)
            } else if let paymentIntent = pi {
                let paymentIntent = Mappers.mapFromPaymentIntent(paymentIntent, uuid: uuid)
                resolve(["paymentIntent": paymentIntent])
            }
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
    func confirmPaymentIntent(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let paymentIntentJson = params["paymentIntent"] as? NSDictionary else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "You must provide paymentIntent that was returned from either createPaymentIntent or retrievePaymentIntent."))
            return
        }
        guard let uuid = paymentIntentJson["sdkUuid"] as? String else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "The PaymentIntent is missing sdkUuid field. This method requires you to use the PaymentIntent that was returned from either createPaymentIntent or retrievePaymentIntent."))
            return
        }
        guard let paymentIntent = self.paymentIntents[uuid] else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "No PaymentIntent was found with the sdkUuid \(uuid). The PaymentIntent provided must be re-retrieved with retrievePaymentIntent or a new PaymentIntent must be created with createPaymentIntent."))
            return
        }

        let amountSurcharge = params["amountSurcharge"] as? NSNumber
        let confirmConfigBuilder = ConfirmConfigurationBuilder()
        if let amountSurchargeValue = amountSurcharge {
            confirmConfigBuilder.setAmountSurcharge(UInt(truncating: amountSurchargeValue))
        }

        let confirmConfig: ConfirmConfiguration
        do {
            confirmConfig = try confirmConfigBuilder.build()
        } catch {
            resolve(Errors.createError(nsError: error as NSError))
            return
        }

        Terminal.shared.confirmPaymentIntent(paymentIntent,confirmConfig: confirmConfig) { pi, error in
            if let error = error as NSError? {
                var result = Errors.createError(nsError: error)
                if let pi {
                    let paymentIntent = Mappers.mapFromPaymentIntent(pi, uuid: "")
                    result["paymentIntent"] = paymentIntent
                }
                resolve(result)
            } else if let pi = pi {
                let uuid = UUID().uuidString
                let paymentIntent = Mappers.mapFromPaymentIntent(pi, uuid: uuid)
                self.paymentIntents = [:]
                resolve(["paymentIntent": paymentIntent])
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
        sendEvent(withName: ReactNativeConstants.START_READER_RECONNECT.rawValue, body: ["reason": result])
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
    func cancelPaymentIntent(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let paymentIntentJson = params["paymentIntent"] as? NSDictionary else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "You must provide paymentIntent that was returned from either createPaymentIntent or retrievePaymentIntent."))
            return
        }
        guard let uuid = paymentIntentJson["sdkUuid"] as? String else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "The PaymentIntent is missing sdkUuid field. This method requires you to use the PaymentIntent that was returned from either createPaymentIntent or retrievePaymentIntent."))
            return
        }
        guard let paymentIntent = self.paymentIntents[uuid] else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "No PaymentIntent was found with the sdkUuid \(uuid). The PaymentIntent provided must be re-retrieved with retrievePaymentIntent or a new PaymentIntent must be created with createPaymentIntent."))
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
    func cancelSetupIntent(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let setupIntentJson = params["setupIntent"] as? NSDictionary else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "You must provide setupIntent."))
            return
        }
        guard let uuid = setupIntentJson["sdkUuid"] as? String else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "The SetupIntent is missing sdkUuid field. This method requires you to use the SetupIntent that was returned from either createPaymentIntent or retrievePaymentIntent."))
            return
        }
        guard let setupIntent = self.setupIntents[uuid] else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "No SetupIntent was found with the sdkUuid \(uuid). The SetupIntent provided must be re-retrieved with retrieveSetupIntent or a new SetupIntent must be created with createSetupIntent."))
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

        guard let uuid = setupIntentJson["sdkUuid"] as? String else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "The SetupIntent is missing sdkUuid field. This method requires you to use the SetupIntent that was returned from either createPaymentIntent or retrievePaymentIntent."))
            return
        }
        guard let setupIntent = self.setupIntents[uuid] else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "No SetupIntent was found with the sdkUuid \(uuid). The SetupIntent provided must be re-retrieved with retrieveSetupIntent or a new SetupIntent must be created with createSetupIntent."))
            return
        }

        let enableCustomerCancellation = params["enableCustomerCancellation"] as? Bool ?? false
        let allowRedisplay = params["allowRedisplay"] as? String ?? "unspecified"
        let setupIntentConfiguration: SetupIntentConfiguration
        do {
            setupIntentConfiguration = try SetupIntentConfigurationBuilder()
                .setEnableCustomerCancellation(enableCustomerCancellation)
                .build()
        } catch {
            resolve(Errors.createError(nsError: error as NSError))
            return
        }

        self.collectSetupIntentCancelable = Terminal.shared.collectSetupIntentPaymentMethod(setupIntent, allowRedisplay: Mappers.mapToAllowRedisplay(allowToredisplay: allowRedisplay), setupConfig: setupIntentConfiguration) { si, collectError  in
            if let error = collectError as NSError? {
                resolve(Errors.createError(nsError: error))
            } else if let setupIntent = si {
                let setupIntent = Mappers.mapFromSetupIntent(setupIntent, uuid: uuid)
                resolve(["setupIntent": setupIntent])
            }
        }
    }

    @objc(confirmSetupIntent:resolver:rejecter:)
    func confirmSetupIntent(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let setupIntentJson = params["setupIntent"] as? NSDictionary else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "You must provide setupIntent."))
            return
        }
        guard let uuid = setupIntentJson["sdkUuid"] as? String else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "The SetupIntent is missing sdkUuid field. This method requires you to use the SetupIntent that was returned from either createPaymentIntent or retrievePaymentIntent."))
            return
        }
        guard let setupIntent = self.setupIntents[uuid] else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "No SetupIntent was found with the sdkUuid \(uuid). The SetupIntent provided must be re-retrieved with retrieveSetupIntent or a new SetupIntent must be created with createSetupIntent."))
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
        self.collectSetupIntentCancelable = nil
    }

    @objc(collectRefundPaymentMethod:resolver:rejecter:)
    func collectRefundPaymentMethod(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let invalidParams = Errors.validateRequiredParameters(params: params, requiredParams: ["amount", "currency"])

        guard invalidParams == nil else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "You must provide \(invalidParams!) parameters."))
            return
        }
        let chargeId = params["chargeId"] as? String
        let paymentIntentId = params["paymentIntentId"] as? String
        if ((chargeId==nil||chargeId!.isEmpty) == (paymentIntentId==nil||paymentIntentId!.isEmpty)) {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "You must provide either a charge ID or a payment intent ID."))
            return
        }
        let amount = params["amount"] as? NSNumber
        let currency = params["currency"] as? String
        let intAmount = UInt(truncating: amount!);
        let refundApplicationFee = params["refundApplicationFee"] as? NSNumber
        let reverseTransfer = params["reverseTransfer"] as? NSNumber
        let enableCustomerCancellation = params["enableCustomerCancellation"] as? Bool ?? false

        let refundParams: RefundParameters
        do {
            if (!paymentIntentId!.isEmpty) {
                refundParams = try RefundParametersBuilder(paymentIntentId: paymentIntentId!,amount: intAmount, currency: currency!)
                    .setReverseTransfer(reverseTransfer?.intValue == 1 ? true : false)
                    .setRefundApplicationFee(refundApplicationFee?.intValue == 1 ? true : false)
                    .build()
            } else {
                refundParams = try RefundParametersBuilder(chargeId: chargeId!,amount: intAmount, currency: currency!)
                    .setReverseTransfer(reverseTransfer?.intValue == 1 ? true : false)
                    .setRefundApplicationFee(refundApplicationFee?.intValue == 1 ? true : false)
                    .build()
            }
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
        self.collectRefundPaymentMethodCancelable = nil
    }

    @objc(collectData:resolver:rejecter:)
    func collectData(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let collectDataTypeParam = params["collectDataType"] as? String ?? ""

        let collectDataType = Mappers.mapToCollectDataType(collectDataTypeParam)
        guard let collectDataType else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "You must provide a collectDataType."))
            return
        }

        let collectDataConfig: CollectDataConfiguration
        do {
            collectDataConfig = try CollectDataConfigurationBuilder().setCollectDataType(collectDataType)
                .build()
        } catch {
            resolve(Errors.createError(nsError: error as NSError))
            return
        }

        Terminal.shared.collectData(collectDataConfig) {
            collectedData, error in
                if let error = error as NSError? {
                    resolve(Errors.createError(nsError: error))
                } else if let collectedData {
                    resolve(Mappers.mapFromCollectedData(collectedData))
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
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "You must provide \(invalidParams!) parameters."))
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
                                resolve(Errors.createError(nsError: error as NSError))
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
                        resolve(Errors.createError(nsError: error as NSError))
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
                                resolve(Errors.createError(nsError: error as NSError))
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
                        resolve(Errors.createError(nsError: error as NSError))
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
                                resolve(Errors.createError(nsError: error as NSError))
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
                       resolve(Errors.createError(nsError: error as NSError))
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
                                resolve(Errors.createError(nsError: error as NSError))
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
                        resolve(Errors.createError(nsError: error as NSError))
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
                                resolve(Errors.createError(nsError: error as NSError))
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
                                let button = try SelectionButtonBuilder(style: (style == "primary") ? .primary : .secondary,
                                                                        text: text).build()
                                selectionButtons.append(button)
                            } catch {
                                resolve(Errors.createError(nsError: error as NSError))
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
                        resolve(Errors.createError(nsError: error as NSError))
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
                                resolve(Errors.createError(nsError: error as NSError))
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
                        resolve(Errors.createError(nsError: error as NSError))
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
            resolve(Errors.createError(nsError: error as NSError))
            return
        }

        DispatchQueue.main.async {
            self.collectInputsCancellable = Terminal.shared.collectInputs(collectInputsParameters) { collectInputResults, error in
                if let error = error as NSError? {
                    resolve(Errors.createError(nsError: error))
                } else {
                    resolve(Mappers.mapFromCollectInputsResults(collectInputResults ?? []))
                }
            }
        }
    }

    @objc(cancelCollectInputs:rejecter:)
    func cancelCollectInputs(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let cancelable = collectInputsCancellable else {
            resolve(Errors.createError(code: ErrorCode.cancelFailedAlreadyCompleted, message: "collectInputsCancellable could not be canceled because the command has already been canceled or has completed."))
            return
        }
        cancelable.cancel() { error in
            if let error = error as NSError? {
                resolve(Errors.createError(nsError: error))
            }
            else {
                resolve([:])
            }
            self.collectInputsCancellable = nil
        }
    }

    @objc(getReaderSettings:rejecter:)
    func getReaderSettings(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        Task {
            do {
                let result = try await Terminal.shared.retrieveReaderSettings()
                resolve(Mappers.mapFromReaderSettings(result))
            } catch {
                resolve(Errors.createError(nsError: error as NSError))
            }
        }
    }

    @objc(setReaderSettings:resolver:rejecter:)
    func setReaderSettings(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let invalidParams = Errors.validateRequiredParameters(params: params, requiredParams: ["textToSpeechViaSpeakers"])

        guard invalidParams == nil else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "You must provide \(invalidParams!) parameters."))
            return
        }

        let textToSpeechViaSpeakers = params["textToSpeechViaSpeakers"] as? Bool ?? false
        Task {
            do {
                let readerSettingsParameters = try ReaderAccessibilityParametersBuilder().setTextToSpeechViaSpeakers(textToSpeechViaSpeakers).build()
                let result = try await Terminal.shared.setReaderSettings(readerSettingsParameters)
                resolve(Mappers.mapFromReaderSettings(result))
            } catch {
                resolve(Errors.createError(nsError: error as NSError))
            }
        }
    }

    @objc(supportsReadersOfType:resolver:rejecter:)
    func supportsReadersOfType(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let invalidParams = Errors.validateRequiredParameters(params: params, requiredParams: ["deviceType", "discoveryMethod"])

        if let invalidParams {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "You must provide \(invalidParams) parameters."))
            return
        }

        let deviceTypeParam = params["deviceType"] as? String ?? ""
        let simulated = params["simulated"] as? Bool ?? false
        let discoveryMethod = params["discoveryMethod"] as? String
        let deviceType = Mappers.mapToDeviceType(deviceTypeParam)
        guard let deviceType else {
            resolve(Errors.createError(code: CommonErrorType.InvalidRequiredParameter, message: "You must provide correct deviceType parameter."))
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
           let errorAsDictionary = Errors.createError(nsError: nsError)
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
           let errorAsDictionary = Errors.createError(nsError: nsError)
            // createError will return a dictionary of ["error": {the error}]
            // so merge that with the result so we have [result:, error:]
            body = body.merging(errorAsDictionary, uniquingKeysWith: { _, error in
                error
            })
        }

        sendEvent(withName: ReactNativeConstants.FORWARD_PAYMENT_INTENT.rawValue, body: body)
    }

    func terminal(_ terminal: Terminal, didReportForwardingError error: Error) {
        let result = Errors.createError(nsError: error as NSError)
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
}
