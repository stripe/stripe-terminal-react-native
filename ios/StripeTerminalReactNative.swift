import StripeTerminal

let UPDATE_DISCOVERED_READERS_LISTENER_NAME = "didUpdateDiscoveredReaders";
let FINISH_DISCOVERING_READERS_LISTENER_NAME = "didFinishDiscoveringReaders";
let REPORT_UNEXPECTED_READER_DISCONNECT_LISTENER_NAME = "didReportUnexpectedReaderDisconnect";
let REPORT_AVAILABLE_UPDATE_LISTENER_NAME = "didReportAvailableUpdate"
let START_INSTALLING_UPDATE_LISTENER_NAME = "didStartInstallingUpdate"
let REPORT_UPDATE_PROGRESS_LISTENER_NAME = "didReportReaderSoftwareUpdateProgress"
let FINISH_INSTALLING_UPDATE_LISTENER_NAME = "didFinishInstallingUpdate"
let FETCH_TOKEN_PROVIDER_LISTENER_NAME = "onFetchTokenProviderListener"
let REQUEST_READER_INPUT_LISTENER_NAME = "didRequestReaderInput"
let REQUEST_READER_DISPLAY_MESSAGE = "didRequestReaderDisplayMessage"
let CHANGE_PAYMENT_STATUS_LISTENER_NAME = "didChangePaymentStatus"
let CHANGE_CONNECTION_STATUS_LISTENER_NAME = "didChangeConnectionStatus"

@objc(StripeTerminalReactNative)
class StripeTerminalReactNative: RCTEventEmitter, DiscoveryDelegate, BluetoothReaderDelegate, TerminalDelegate  {
    var discoveredReadersList: [Reader]? = nil
    var paymentIntents: [AnyHashable : PaymentIntent] = [:]
    var setupIntents: [AnyHashable : SetupIntent] = [:]
    
    override func supportedEvents() -> [String]! {
        return [
            UPDATE_DISCOVERED_READERS_LISTENER_NAME,
            FINISH_DISCOVERING_READERS_LISTENER_NAME,
            REPORT_UNEXPECTED_READER_DISCONNECT_LISTENER_NAME,
            REPORT_AVAILABLE_UPDATE_LISTENER_NAME,
            START_INSTALLING_UPDATE_LISTENER_NAME,
            REPORT_UPDATE_PROGRESS_LISTENER_NAME,
            FINISH_INSTALLING_UPDATE_LISTENER_NAME,
            FETCH_TOKEN_PROVIDER_LISTENER_NAME,
            REQUEST_READER_INPUT_LISTENER_NAME,
            REQUEST_READER_DISPLAY_MESSAGE,
            CHANGE_PAYMENT_STATUS_LISTENER_NAME,
            CHANGE_CONNECTION_STATUS_LISTENER_NAME
        ]
    }
    
    @objc override static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    var discoverCancelable: Cancelable? = nil
    var collectPaymentMethodCancelable: Cancelable? = nil
    var collectSetupIntentCancelable: Cancelable? = nil
    var installUpdateCancelable: Cancelable? = nil
    var readReusableCardCancelable: Cancelable? = nil
    
    func terminal(_ terminal: Terminal, didUpdateDiscoveredReaders readers: [Reader]) {
        discoveredReadersList = readers
        guard terminal.connectionStatus == .notConnected else { return }
        
        sendEvent(withName: UPDATE_DISCOVERED_READERS_LISTENER_NAME, body: ["readers": Mappers.mapFromReaders(readers)])
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
        
        resolve(["reader": connectedReader])
    }
    
    @objc(cancelCollectPaymentMethod:rejecter:)
    func cancelCollectPaymentMethod(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let cancelable = collectPaymentMethodCancelable else {
            resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: "collectPaymentMethod could not be canceled because the command has already been canceled or has completed."))
            return
        }
        cancelable.cancel() { error in
            if let error = error {
                resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription))
            }
            else {
                resolve([:])
            }
            self.collectPaymentMethodCancelable = nil
        }
    }
    
    @objc(cancelCollectSetupIntent:rejecter:)
    func cancelCollectSetupIntent(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let cancelable = collectSetupIntentCancelable else {
            resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: "collectSetupIntent could not be canceled because the command has already been canceled or has completed."))
            return
        }
        cancelable.cancel() { error in
            if let error = error {
                resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription))
            }
            else {
                resolve([:])
            }
            self.collectSetupIntentCancelable = nil
        }
    }

    @objc(cancelReadReusableCard:rejecter:)
    func cancelReadReusableCard(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let cancelable = readReusableCardCancelable else {
            resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: "readReusableCard could not be canceled because the command has already been canceled or has completed."))
            return
        }
        cancelable.cancel() { error in
            if let error = error {
                resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription))
            }
            else {
                resolve([:])
            }
            self.readReusableCardCancelable = nil
        }
    }
    
    @objc(simulateReaderUpdate:resolver:rejecter:)
    func simulateReaderUpdate(update: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        Terminal.shared.simulatorConfiguration.availableReaderUpdate = Mappers.mapToSimulateReaderUpdate(update)
        resolve([:])
    }
    
    @objc(setConnectionToken:resolver:rejecter:)
    func setConnectionToken(token: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) -> Void {
        TokenProvider.shared.setConnectionToken(token: token)
        resolve([:])
    }
    
    @objc(discoverReaders:resolver:rejecter:)
    func discoverReaders(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let simulated = params["simulated"] as? Bool
        let discoveryMethod = params["discoveryMethod"] as? String
        
        let config = DiscoveryConfiguration(
            discoveryMethod: Mappers.mapToDiscoveryMethod(discoveryMethod),
            simulated: simulated ?? false
        )
        
        self.discoverCancelable = Terminal.shared.discoverReaders(config, delegate: self) { error in
            if let error = error {
                let _error = Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription)
                
                self.sendEvent(withName: FINISH_DISCOVERING_READERS_LISTENER_NAME, body: ["result": _error])
                self.discoverCancelable = nil
            } else {
                self.sendEvent(withName: FINISH_DISCOVERING_READERS_LISTENER_NAME, body: ["result": ["error": nil]])
                self.discoverCancelable = nil
            }
        }
        resolve([:])
    }
    
    @objc(cancelDiscovering:rejecter:)
    func cancelDiscovering(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let cancelable = discoverCancelable else {
            resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: "discoverReaders could not be canceled because the command has already been canceled or has completed."))
            return
        }
        cancelable.cancel() { error in
            if let error = error {
                resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription))
                self.discoverCancelable = nil
            } else {
                resolve([:])
                self.discoverCancelable = nil
            }
        }
    }
    
    
    @objc(connectBluetoothReader:resolver:rejecter:)
    func connectBluetoothReader(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let readerId = params["readerId"] as? String else {
            resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: "You must provide readerId"))
            return
        }
        
        guard let selectedReader = discoveredReadersList?.first(where: { $0.serialNumber == readerId }) else {
            resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: "Could not find reader with id \(readerId)"))
            return
            
        }
        
        let locationId = params["locationId"] as? String
        
        let connectionConfig = BluetoothConnectionConfiguration(
            locationId: locationId ?? selectedReader.locationId ?? ""
        )
        
        Terminal.shared.connectBluetoothReader(selectedReader, delegate: self, connectionConfig: connectionConfig) { reader, error in
            if let reader = reader {
                resolve(["reader": Mappers.mapFromReader(reader)])
            } else if let error = error {
                resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription))
            }
        }
    }
    
    @objc(connectInternetReader:resolver:rejecter:)
    func connectInternetReader(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let readerId = params["readerId"] as? String else {
            resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: "You must provide readerId"))
            return
        }
        
        guard let selectedReader = discoveredReadersList?.first(where: { $0.serialNumber == readerId }) else {
            resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: "Could not find reader with id \(readerId)"))
            return
            
        }
        
        let connectionConfig = InternetConnectionConfiguration(failIfInUse: params["failIfInUse"] as? Bool ?? false)
        
        Terminal.shared.connectInternetReader(selectedReader, connectionConfig: connectionConfig) { reader, error in
            if let reader = reader {
                resolve(["reader": Mappers.mapFromReader(reader)])
            } else if let error = error {
                resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription))
            }
        }
    }
    
    @objc(disconnectReader:rejecter:)
    func disconnectReader(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        Terminal.shared.disconnectReader() { error in
            if let error = error {
                resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription))
            } else {
                resolve([:])
            }
        }
    }
    
    func terminal(_ terminal: Terminal, didReportUnexpectedReaderDisconnect reader: Reader) {
        let error = Errors.createError(code: CommonErrorType.Failed.rawValue, message: "Reader has been disconnected unexpectedly")
        sendEvent(withName: REPORT_UNEXPECTED_READER_DISCONNECT_LISTENER_NAME, body: error)
    }
    
    @objc(createPaymentIntent:resolver:rejecter:)
    func createPaymentIntent(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let amount = params["amount"] as? NSNumber ?? 0
        let currency = params["currency"] as? String ?? ""
        let setupFutureUsage = params["setupFutureUsage"] as? String
        let paymentMethodTypes = params["paymentMethodTypes"] as? [String] ?? []

        let paymentIntentParams = PaymentIntentParameters(amount: UInt(truncating: amount), currency: currency, paymentMethodTypes: paymentMethodTypes)
        paymentIntentParams.setupFutureUsage = setupFutureUsage
        
        Terminal.shared.createPaymentIntent(paymentIntentParams) { pi, error in
            if let error = error {
                resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription))
            } else if let pi = pi {
                let paymentIntent = Mappers.mapFromPaymentIntent(pi)
                self.paymentIntents[pi.stripeId] = pi
                resolve(["paymentIntent": paymentIntent])
            }
        }
    }
    
    @objc(createSetupIntent:resolver:rejecter:)
    func createSetupIntent(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let setupIntentParams = SetupIntentParameters(customer: params["customerId"] as? String)
        Terminal.shared.createSetupIntent(setupIntentParams) { si, error in
            if let error = error {
                resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription))
            } else if let si = si {
                let setupIntent = Mappers.mapFromSetupIntent(si)
                self.setupIntents[si.stripeId] = si
                resolve(["setupIntent": setupIntent])
            }
        }
    }
    
    @objc(collectPaymentMethod:resolver:rejecter:)
    func collectPaymentMethod(paymentIntentId: String?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let id = paymentIntentId else {
            resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: "You must provide paymentIntentId."))
            return
        }
        guard let paymentIntent = paymentIntents[id] else {
            resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: "There is no associated paymentIntent with id \(id)"))
            return
        }
        
        self.collectPaymentMethodCancelable = Terminal.shared.collectPaymentMethod(paymentIntent) { pi, collectError  in
            if let error = collectError {
                resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription))
            }
            else if let paymentIntent = pi {
                let paymentIntent = Mappers.mapFromPaymentIntent(paymentIntent)
                resolve(["paymentIntent": paymentIntent])
            }
            self.collectPaymentMethodCancelable = nil
        }
    }
    
    @objc(retrievePaymentIntent:resolver:rejecter:)
    func retrievePaymentIntent(secret: String?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let clientSecret = secret else {
            resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: "You must provide cliectSecret."))
            return
        }
        
        Terminal.shared.retrievePaymentIntent(clientSecret: clientSecret) { pi, error in
            if let error = error {
                resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription))
            } else if let pi = pi {
                let paymentIntent = Mappers.mapFromPaymentIntent(pi)
                self.paymentIntents[pi.stripeId] = pi
                resolve(["paymentIntent": paymentIntent])
            }
        }
    }
    
    @objc(getListLocations:resolver:rejecter:)
    func getListLocations(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let limit = params["limit"] as? NSNumber
        let endingBefore = params["endingBefore"] as? String
        let startingAfter = params["startingAfter"] as? String
        
        let listParameters = ListLocationsParameters(limit: limit, endingBefore: endingBefore, startingAfter: startingAfter)
        
        Terminal.shared.listLocations(parameters: listParameters) { locationsList, hasMore, error in
            if let error = error {
                resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription))
            } else if let locationsList = locationsList {
                let list = Mappers.mapFromLocationsList(locationsList)
                resolve(["locationsList": list, "hasMore": hasMore])
            }
        }
    }
    
    @objc(processPayment:resolver:rejecter:)
    func processPayment(paymentIntentId: String?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let id = paymentIntentId else {
            resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: "You must provide paymentIntentId."))
            return
        }
        guard let paymentIntent = paymentIntents[id] else {
            resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: "There is no associated paymentIntent with id \(id)"))
            return
        }
        
        Terminal.shared.processPayment(paymentIntent) { pi, error in
            if let error = error {
                resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription))
            } else if let pi = pi {
                let paymentIntent = Mappers.mapFromPaymentIntent(pi)
                resolve(["paymentIntent": paymentIntent])
            }
        }
    }
    
    func terminal(_ terminal: Terminal, didChangePaymentStatus status: PaymentStatus) {
        let result = Mappers.mapFromPaymentStatus(status)
        sendEvent(withName: CHANGE_PAYMENT_STATUS_LISTENER_NAME, body: ["result": result])
    }
    
    func terminal(_ terminal: Terminal, didChangeConnectionStatus status: ConnectionStatus) {
        let result = Mappers.mapFromConnectionStatus(status)
        sendEvent(withName: CHANGE_CONNECTION_STATUS_LISTENER_NAME, body: ["result": result])
    }
    
    @objc(cancelPaymentIntent:resolver:rejecter:)
    func cancelPaymentIntent(paymentIntentId: String?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let id = paymentIntentId else {
            resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: "You must provide paymentIntentId."))
            return
        }
        guard let paymentIntent = paymentIntents[id] else {
            resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: "There is no associated paymentIntent with id \(id)"))
            return
        }
        Terminal.shared.cancelPaymentIntent(paymentIntent) { pi, collectError  in
            if let error = collectError {
                resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription))
            }
            else if let pi = pi {
                let paymentIntent = Mappers.mapFromPaymentIntent(pi)

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
            if let error = error {
                resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription))
            }
            else {
                resolve([:])
            }
        }
    }
    
    @objc(setReaderDisplay:resolver:rejecter:)
    func setReaderDisplay(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let invalidParams = Errors.validateRequiredParameters(params: params, requiredParams: ["currency", "tax", "total"])
        
        guard invalidParams == nil else {
            resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: "You must provide \(invalidParams!) parameters."))
            return
        }
        
        let currency = params["currency"] as? String
        let tax = params["tax"] as? NSNumber
        let total = params["total"] as? NSNumber
        
        let cart = Cart(currency: currency!, tax: Int(truncating: tax!), total: Int(truncating: total!))
        
        let cartLineItems = Mappers.mapToCartLineItems(params["lineItems"] as? NSArray ?? NSArray())
        
        guard let lineItems = (cartLineItems as NSArray).mutableCopy() as? NSMutableArray else {
            resolve(Errors.createError(code: CommonErrorType.Unknown.rawValue, message: "Unknown error occured."))
            return
        }
        
        cart.lineItems = lineItems
        
        Terminal.shared.setReaderDisplay(cart) { error in
            if let error = error {
                resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription))
            } else {
                resolve([:])
            }
        }
    }
    
    @objc(cancelSetupIntent:resolver:rejecter:)
    func cancelSetupIntent(setupIntentId: String?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let id = setupIntentId else {
            resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: "You must provide setupIntentId."))
            return
        }
        guard let setupIntent = setupIntents[id] else {
            resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: "There is no associated setupIntentId with id \(id)"))
            return
        }
        Terminal.shared.cancelSetupIntent(setupIntent) { si, collectError  in
            if let error = collectError {
                resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription))
            }
            else if let si = si {
                let setupIntent = Mappers.mapFromSetupIntent(si)

                self.setupIntents[si.stripeId] = nil
                
                resolve(["setupIntent": setupIntent])
            }
        }
    }
    
    @objc(clearReaderDisplay:rejecter:)
    func clearReaderDisplay(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        Terminal.shared.clearReaderDisplay() { error in
            if let error = error {
                resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription))
            } else {
                resolve([:])
             }
        }
    }

    @objc(retrieveSetupIntent:resolver:rejecter:)
    func retrieveSetupIntent(secret: String?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let clientSecret = secret else {
            resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: "You must provide cliectSecret."))
            return
        }
        Terminal.shared.retrieveSetupIntent(clientSecret: clientSecret) { si, error in
            if let error = error {
                resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription))
            } else if let si = si {
                self.setupIntents[si.stripeId] = si
                let si = Mappers.mapFromSetupIntent(si)
                resolve(["setupIntent": si])
            }
        }
    }
    
    @objc(collectSetupIntentPaymentMethod:resolver:rejecter:)
    func collectSetupIntentPaymentMethod(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let setupIntentId = params["setupIntentId"] as? String
        
        guard let id = setupIntentId else {
            resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: "You must provide setupIntentId."))
            return
        }
        guard let setupIntent = setupIntents[id] else {
            resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: "There is no created setupIntent with id \(id)"))
            return
        }
        
        let customerConsentCollected = params["customerConsentCollected"] as? Bool ?? false
        
        self.collectSetupIntentCancelable = Terminal.shared.collectSetupIntentPaymentMethod(setupIntent, customerConsentCollected: customerConsentCollected) { si, collectError  in
            if let error = collectError {
                resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription))
            }
            else if let setupIntent = si {
                let setupIntent = Mappers.mapFromSetupIntent(setupIntent)
                resolve(["setupIntent": setupIntent])
            }
            self.collectSetupIntentCancelable = nil
        }
    }
    
    @objc(confirmSetupIntent:resolver:rejecter:)
    func confirmSetupIntent(setupIntentId: String?, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let id = setupIntentId else {
            resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: "You must provide setupIntentId."))
            return
        }
        guard let setupIntent = setupIntents[id] else {
            resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: "There is no created setupIntent with id \(id)"))
            return
        }
        
        
        Terminal.shared.confirmSetupIntent(setupIntent) { si, collectError  in
            if let error = collectError {
                resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription))
            }
            else if let setupIntent = si {
                let setupIntent = Mappers.mapFromSetupIntent(setupIntent)
                resolve(["setupIntent": setupIntent])
            }
        }
    }
    
    @objc(collectRefundPaymentMethod:resolver:rejecter:)
    func collectRefundPaymentMethod(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let invalidParams = Errors.validateRequiredParameters(params: params, requiredParams: ["chargeId", "amount", "currency"])
        
        guard invalidParams == nil else {
            resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: "You must provide \(invalidParams!) parameters."))
            return
        }
        let chargeId = params["chargeId"] as? String
        let amount = params["amount"] as? NSNumber
        let currency = params["currency"] as? String
        let intAmount = UInt(truncating: amount!);
        
        let refundParams = RefundParameters(chargeId: chargeId!, amount: intAmount, currency: currency!)
        
        Terminal.shared.collectRefundPaymentMethod(refundParams) { error in
            if let error = error {
                resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription))
            } else {
                resolve([:])
            }
        }
    }

    @objc(processRefund:rejecter:)
    func processRefund(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        Terminal.shared.processRefund() { rf, error in
            if let error = error {
                resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription))
            } else {
                let refund = Mappers.mapFromRefund(rf!)
                resolve(["refund": refund])
            }
        }
    }

    @objc(readReusableCard:resolver:rejecter:)
    func readReusableCard(params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let readReusableCardParams = ReadReusableCardParameters();
        readReusableCardParams.customer = params["customer"] as? String ?? ""
        Terminal.shared.readReusableCard(readReusableCardParams) { pm, error in
            if let error = error {
                resolve(Errors.createError(code: CommonErrorType.Failed.rawValue, message: error.localizedDescription))
            } else {
                let pm = Mappers.mapFromPaymentMethod(pm!)
                resolve(["paymentMethod": pm])
            }
        }
    }
    
    @objc(clearCachedCredentials:rejecter:)
    func clearCachedCredentials(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        Terminal.shared.clearCachedCredentials()
        resolve([:])
    }
    
    func reader(_ reader: Reader, didReportAvailableUpdate update: ReaderSoftwareUpdate) {
        sendEvent(withName: REPORT_AVAILABLE_UPDATE_LISTENER_NAME, body: ["result": Mappers.mapFromReaderSoftwareUpdate(update) ?? [:]])
    }
    
    func reader(_ reader: Reader, didStartInstallingUpdate update: ReaderSoftwareUpdate, cancelable: Cancelable?) {
        self.installUpdateCancelable = cancelable
        sendEvent(withName: START_INSTALLING_UPDATE_LISTENER_NAME, body: ["result": Mappers.mapFromReaderSoftwareUpdate(update) ?? [:]])
    }
    
    func reader(_ reader: Reader, didReportReaderSoftwareUpdateProgress progress: Float) {
        let result: [AnyHashable : Any?] = [
            "progress": String(progress),
        ]
        sendEvent(withName: REPORT_UPDATE_PROGRESS_LISTENER_NAME, body: ["result": result])
    }
    
    func reader(_ reader: Reader, didFinishInstallingUpdate update: ReaderSoftwareUpdate?, error: Error?) {
        let result = Mappers.mapFromReaderSoftwareUpdate(update)
        sendEvent(withName: FINISH_INSTALLING_UPDATE_LISTENER_NAME, body: ["result": result ?? [:]])
    }
    
    func reader(_ reader: Reader, didRequestReaderInput inputOptions: ReaderInputOptions = []) {
        let result = Mappers.mapFromReaderInputOptions(inputOptions)
        sendEvent(withName: REQUEST_READER_INPUT_LISTENER_NAME, body: ["result": result])
    }
    
    func reader(_ reader: Reader, didRequestReaderDisplayMessage displayMessage: ReaderDisplayMessage) {
        let result = Mappers.mapFromReaderDisplayMessage(displayMessage)
        sendEvent(withName: REQUEST_READER_DISPLAY_MESSAGE, body: ["result": result])
    }
}
