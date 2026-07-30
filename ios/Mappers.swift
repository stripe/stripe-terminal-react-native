import StripeTerminal
import UIKit

class Mappers {
    class func mapFromReaders(_ readers: [Reader]) -> [NSDictionary] {
        var readersList: [NSDictionary] = []

        for reader in readers {
            let result = mapFromReader(reader)
            readersList.append(result)
        }

        return readersList
    }

    class func mapFromReader(_ reader: Reader) -> NSDictionary {
        var result: [String: Any] = [:]

        // Required fields
        result["serialNumber"] = reader.serialNumber
        result["simulated"] = reader.simulated
        result["livemode"] = reader.livemode
        result["batteryStatus"] = mapFromBatteryStatus(reader.batteryStatus)
        result["status"] = mapFromReaderNetworkStatus(reader.status)
        result["locationStatus"] = mapFromLocationStatus(reader.locationStatus)
        result["deviceType"] = mapFromDeviceType(reader.deviceType)

        // Optional fields (omitted when nil, RN receives undefined)
        result["label"] = reader.label
        result["batteryLevel"] = reader.batteryLevel
        result["isCharging"] = reader.isCharging
        result["id"] = reader.stripeId
        result["availableUpdate"] = mapFromReaderSoftwareUpdate(reader.availableUpdate)
        result["locationId"] = reader.locationId
        result["ipAddress"] = reader.ipAddress
        result["location"] = mapFromLocation(reader.location)
        result["deviceSoftwareVersion"] = reader.deviceSoftwareVersion

        return NSDictionary(dictionary: result)
    }

    class func mapFromLocationStatus(_ status: LocationStatus) -> String {
        switch status {
        case LocationStatus.notSet: return "notSet"
        case LocationStatus.set: return "set"
        case LocationStatus.unknown: return "unknown"
        @unknown default: return "unknown"
        }
    }

    class func mapFromReaderNetworkStatus(_ status: ReaderNetworkStatus) -> String {
        switch status {
        case ReaderNetworkStatus.offline: return "offline"
        case ReaderNetworkStatus.online: return "online"
        @unknown default: return "unknown"
        }
    }

    class func mapFromBatteryStatus(_ status: BatteryStatus) -> String {
        switch status {
        case BatteryStatus.critical: return "critical"
        case BatteryStatus.low: return "low"
        case BatteryStatus.nominal: return "nominal"
        case BatteryStatus.unknown: return "unknown"
        @unknown default: return "unknown"
        }
    }

    class func mapFromDeviceType(_ type: DeviceType) -> String {
        switch type {
        case .tapToPay: return "tapToPay"
        case .chipper1X: return "chipper1X"
        case .chipper2X: return "chipper2X"
        case .etna: return "etna"
        case .stripeM2: return "stripeM2"
        case .stripeS700: return "stripeS700"
        case .stripeS700DevKit: return "stripeS700Devkit"
        case .stripeS710: return "stripeS710"
        case .stripeS710DevKit: return "stripeS710Devkit"
        case .stripeT600: return "stripeT600"
        case .stripeT600DevKit: return "stripeT600Devkit"
        case .stripeT610: return "stripeT610"
        case .stripeT610DevKit: return "stripeT610Devkit"
        case .stripeU200: return "stripeU200"
        case .wiseCube: return "wiseCube"
        case .wisePad3: return "wisePad3"
        case .wisePosE: return "wisePosE"
        case .wisePosEDevKit: return "wisePosEDevkit"
        case .verifoneV660p: return "verifoneV660p"
        case .verifoneV660pDevKit: return "verifoneV660pDevkit"
        case .verifoneM425: return "verifoneM425"
        case .verifoneM450: return "verifoneM450"
        case .verifoneP630: return "verifoneP630"
        case .verifoneUX700: return "verifoneUX700"
        case .verifoneUX700DevKit: return "verifoneUX700Devkit"
        case .verifoneVM100: return "verifoneVM100"
        case .verifoneVM110: return "verifoneVM110"
        case .verifoneVP100: return "verifoneVP100"
        case .verifoneVP110: return "verifoneVP110"
        case .verifoneVL110: return "verifoneVL110"
        // NOTE: No default case - this ensures that any new DeviceType cases
        // added to the Stripe Terminal SDK will cause a COMPILER ERROR,
        // forcing us to explicitly handle new cases and preventing silent mapping failures.
        }
    }

    class func mapToDeviceType(_ type: String) -> DeviceType? {
        switch type {
        case "tapToPay": return .tapToPay
        case "chipper1X": return .chipper1X
        case "chipper2X": return .chipper2X
        case "etna": return .etna
        case "stripeM2": return .stripeM2
        case "stripeS700": return .stripeS700
        case "stripeS700Devkit": return .stripeS700DevKit
        case "stripeS710": return .stripeS710
        case "stripeS710Devkit": return .stripeS710DevKit
        case "stripeT600": return .stripeT600
        case "stripeT600Devkit": return .stripeT600DevKit
        case "stripeT610": return .stripeT610
        case "stripeT610Devkit": return .stripeT610DevKit
        case "stripeU200": return .stripeU200
        case "wiseCube": return .wiseCube
        case "wisePad3": return .wisePad3
        case "wisePosE": return .wisePosE
        case "wisePosEDevkit": return .wisePosEDevKit
        case "verifoneV660p": return .verifoneV660p
        case "verifoneV660pDevkit": return .verifoneV660pDevKit
        case "verifoneM425": return .verifoneM425
        case "verifoneM450": return .verifoneM450
        case "verifoneP630": return .verifoneP630
        case "verifoneUX700": return .verifoneUX700
        case "verifoneUX700Devkit": return .verifoneUX700DevKit
        case "verifoneVM100": return .verifoneVM100
        case "verifoneVM110": return .verifoneVM110
        case "verifoneVP100": return .verifoneVP100
        case "verifoneVP110": return .verifoneVP110
        case "verifoneVL110": return .verifoneVL110
        default: return nil
        }
    }

    class func mapToCartLineItem(_ cartLineItem: NSDictionary) -> CartLineItem? {
        guard let displayName = cartLineItem["displayName"] as? String else { return nil }
        guard let quantity = cartLineItem["quantity"] as? NSNumber else { return nil }
        guard let amount = cartLineItem["amount"] as? NSNumber else { return nil }

        do {
            let lineItem = try CartLineItemBuilder(displayName: displayName)
                .setQuantity(Int(truncating: quantity))
                .setAmount(Int(truncating: amount))
                .build()
            return lineItem
        } catch {
            print("Error wihle building CartLineItem, error:\(error)")
            return nil
        }
    }

    class func mapToCartLineItems(_ cartLineItems: NSArray) -> [CartLineItem] {
        var items = [CartLineItem]()

        cartLineItems.forEach {
            if let item = $0 as? NSDictionary {
                if let lineItem = Mappers.mapToCartLineItem(item) {
                    items.append(lineItem)
                }
            }
        }
        return items
    }


    class func mapToDiscoveryMethod(_ discoveryMethod: String?) -> DiscoveryMethod {
        if let method = discoveryMethod {
            switch method {
            case "bluetoothProximity": return DiscoveryMethod.bluetoothProximity
            case "bluetoothScan": return DiscoveryMethod.bluetoothScan
            case "internet": return DiscoveryMethod.internet
            case "tapToPay": return DiscoveryMethod.tapToPay
            case "usb": return DiscoveryMethod.usb
            default: return DiscoveryMethod.internet
            }
        }
        return DiscoveryMethod.internet
    }

    class func mapToDiscoveryFilter(_ params: NSDictionary?) -> DiscoveryFilter? {
        guard let params = params else {
            return nil
        }

        // Check for readerId
        if let readerId = params["readerId"] as? String, !readerId.isEmpty {
            return DiscoveryFilter.byReaderId(readerId)
        }

        // Check for serialNumber
        if let serialNumber = params["serialNumber"] as? String, !serialNumber.isEmpty {
            return DiscoveryFilter.bySerialNumber(serialNumber)
        }

        // If params exist but no valid filter found, return none filter
        return DiscoveryFilter.none()
    }

    class func mapToDiscoveryConfiguration(_ discoveryMethod: String?, simulated: Bool, locationId: String?, discoveryFilter: DiscoveryFilter?, timeout: UInt) throws-> DiscoveryConfiguration {
        switch discoveryMethod {
        case "bluetoothScan":
            return try BluetoothScanDiscoveryConfigurationBuilder().setSimulated(simulated).setTimeout(timeout).build()
        case "bluetoothProximity":
            return try BluetoothProximityDiscoveryConfigurationBuilder().setSimulated(simulated).build()
        case "internet":
            let internetDiscoveryConfiguration = InternetDiscoveryConfigurationBuilder()
                .setSimulated(simulated)
                .setLocationId(locationId)
                .setTimeout(timeout)
            if let discoveryFilter {
                internetDiscoveryConfiguration.setDiscoveryFilter(discoveryFilter)
            }
            return try internetDiscoveryConfiguration.build()
        case "tapToPay":
            return try TapToPayDiscoveryConfigurationBuilder().setSimulated(simulated).build()
        case "usb":
            return try UsbDiscoveryConfigurationBuilder().setSimulated(simulated).setTimeout(timeout).build()
        @unknown default:
            print("⚠️ Unknown discovery method! Defaulting to Bluetooth Scan.")
            return try BluetoothScanDiscoveryConfigurationBuilder().setSimulated(simulated).setTimeout(timeout).build()
        }
    }

    class func mapFromMulticaptureStatus(_ status: MulticaptureStatus) -> String {
        switch status {
        case MulticaptureStatus.unknown: return "unknown"
        case MulticaptureStatus.unavailable: return "unavailable"
        case MulticaptureStatus.available: return "available"
        @unknown default: return "unknown"
        }
    }

    class func mapFromCaptureMethod(_ captureMethod: CaptureMethod) -> String {
        switch captureMethod {
        case CaptureMethod.manual: return "manual"
        case CaptureMethod.automatic: return "automatic"
        @unknown default: return "unknown"
        }
    }

    class func mapFromNextAction(_ nextAction: NextAction?) -> NSDictionary {
        guard let nextAction = nextAction else { return [:] }
        var result: [String: Any] = [:]
        result["type"] = nextAction.type
        result["wechatPayDisplayQrCode"] = mapFromWechatPayDisplayQrCode(nextAction.wechatPayDisplayQrCode)
        result["redirectToUrl"] = mapFromRedirectToUrl(nextAction.redirectToUrl)
        result["useStripeSdk"] = mapFromUseStripeSdk(nextAction.useStripeSdk)
        return NSDictionary(dictionary: result)
    }

    class func mapFromUseStripeSdk(_ useStripeSdk: UseStripeSdk?) -> NSDictionary? {
        guard let useStripeSdk = useStripeSdk else { return nil }
        var result: [String: Any] = [:]
        result["type"] = useStripeSdk.type
        return NSDictionary(dictionary: result)
    }

    class func mapFromWechatPayDisplayQrCode(_ wechatPayDisplayQrCode: WechatPayDisplayQrCode?) -> NSDictionary? {
        guard let wechatPayDisplayQrCode = wechatPayDisplayQrCode else { return nil }
        var result: [String: Any] = [:]
        result["data"] = wechatPayDisplayQrCode.data
        result["hostedInstructionsUrl"] = wechatPayDisplayQrCode.hostedInstructionsUrl
        result["imageDataUrl"] = wechatPayDisplayQrCode.imageDataUrl
        result["imageUrlPng"] = wechatPayDisplayQrCode.imageUrlPng
        result["imageUrlSvg"] = wechatPayDisplayQrCode.imageUrlSvg
        return NSDictionary(dictionary: result)
    }

    class func mapFromRedirectToUrl(_ redirectToUrl: RedirectToUrl?) -> NSDictionary? {
        guard let redirectToUrl = redirectToUrl else { return nil }
        var result: [String: Any] = [:]
        result["url"] = redirectToUrl.url
        result["returnUrl"] = redirectToUrl.returnUrl
        return NSDictionary(dictionary: result)
    }
    class func mapFromPaymentIntent(_ paymentIntent: PaymentIntent, uuid: String) -> NSDictionary {
        var result: [String: Any] = [:]

        // Required fields
        result["amount"] = paymentIntent.amount
        result["currency"] = paymentIntent.currency
        result["livemode"] = paymentIntent.livemode
        result["sdkUuid"] = uuid
        result["captureMethod"] = mapFromCaptureMethod(paymentIntent.captureMethod)
        result["charges"] = mapFromCharges(paymentIntent.charges)
        result["status"] = mapFromPaymentIntentStatus(paymentIntent.status)
        result["amountDetails"] = mapFromAmountDetails(paymentIntent.amountDetails)
        result["nextAction"] = mapFromNextAction(paymentIntent.nextAction)

        // amountTip has a default value of 0
        result["amountTip"] = paymentIntent.amountTip ?? 0

        // Optional fields (omitted when nil, RN receives undefined)
        result["id"] = paymentIntent.stripeId
        result["amountCapturable"] = paymentIntent.amountCapturable
        result["amountReceived"] = paymentIntent.amountReceived
        result["amountRequested"] = paymentIntent.amountRequested
        result["applicationFeeAmount"] = paymentIntent.applicationFeeAmount
        result["canceledAt"] = convertDateToUnixTimestamp(date: paymentIntent.canceledAt)
        result["cancellationReason"] = paymentIntent.cancellationReason
        result["clientSecret"] = paymentIntent.clientSecret
        result["confirmationMethod"] = paymentIntent.confirmationMethod
        result["created"] = convertDateToUnixTimestamp(date: paymentIntent.created)
        result["customer"] = paymentIntent.customer
        result["description"] = paymentIntent.stripeDescription
        result["lastPaymentError"] = Errors.mapFromApiError(paymentIntent.lastPaymentError)
        result["metadata"] = paymentIntent.metadata.map { NSDictionary(dictionary: $0) }
        result["offlineDetails"] = paymentIntent.offlineDetails.map { mapFromOfflineDetails($0) }
        result["onBehalfOf"] = paymentIntent.onBehalfOf
        result["paymentMethod"] = paymentIntent.paymentMethod.map { mapFromPaymentMethod($0) }
        result["paymentMethodId"] = paymentIntent.paymentMethodId
        result["paymentMethodOptions"] = mapFromPaymentMethodOptions(paymentIntent.paymentMethodOptions)
        result["paymentMethodTypes"] = paymentIntent.paymentMethodTypes
        result["receiptEmail"] = paymentIntent.receiptEmail
        result["setupFutureUsage"] = paymentIntent.setupFutureUsage
        result["statementDescriptor"] = paymentIntent.statementDescriptor
        result["statementDescriptorSuffix"] = paymentIntent.statementDescriptorSuffix
        result["transferGroup"] = paymentIntent.transferGroup

        return NSDictionary(dictionary: result)
    }

    class func mapFromPaymentMethodOptions(_ options: PaymentMethodOptionsParameters?) -> NSDictionary? {
        guard let options = options else { return nil }
        var result: [String: Any] = [:]

        let cardPresentParams = options.cardPresentParameters
        var cardPresentMap: [String: Any] = [:]
        cardPresentMap["requestExtendedAuthorization"] = cardPresentParams.requestExtendedAuthorization
        cardPresentMap["requestIncrementalAuthorizationSupport"] = cardPresentParams.requestIncrementalAuthorizationSupport
        cardPresentMap["requestPartialAuthorization"] = mapFromRequestPartialAuthorization(cardPresentParams.requestPartialAuthorization?.uintValue)
        cardPresentMap["requestReauthorization"] = mapFromRequestReauthorization(cardPresentParams.requestReauthorization?.uintValue)

        result["cardPresent"] = NSDictionary(dictionary: cardPresentMap)
        return NSDictionary(dictionary: result)
    }

    class func mapFromRequestPartialAuthorization(_ requestPartialAuthorization: UInt?) -> String {
        guard let requestPartialAuthorization = requestPartialAuthorization else {
            return ""
        }
        switch (requestPartialAuthorization) {
        case CardPresentRequestPartialAuthorization.ifAvailable.rawValue:
            return "if_available"
        case CardPresentRequestPartialAuthorization.never.rawValue:
            return "never"
        default:
            return ""
        }
    }

    class func mapFromRequestReauthorization(_ requestReauthorization: UInt?) -> String? {
        guard let requestReauthorization = requestReauthorization else {
            return nil
        }
        switch (requestReauthorization) {
        case CardPresentRequestReauthorization.ifAvailable.rawValue:
            return "if_available"
        case CardPresentRequestReauthorization.never.rawValue:
            return "never"
        default:
            return nil
        }
    }

    class func mapToSetupIntent(_ params: NSDictionary) -> SetupIntentParametersBuilder {
        let builder = SetupIntentParametersBuilder()
            .setCustomer(params["customer"] as? String)
            .setStripeDescription(params["description"] as? String)
            .setOnBehalfOf(params["onBehalfOf"] as? String)
            .setMetadata(params["metadata"] as? [String: String])
        if let paymentMethodTypes = params["paymentMethodTypes"] as? [String] {
            _ = builder.setPaymentMethodTypes(mapPaymentIntentPaymentMethodTypes(paymentMethodTypes))
        }

        if let usage = mapToSetupIntentUsage(params["usage"] as? String) {
            builder.setUsage(usage)
        }
        return builder
    }

    class func mapToSetupIntentUsage(_ usage: String?) -> SetupIntentUsage? {
        switch usage {
        case "offSession":
            return SetupIntentUsage.offSession
        case "onSession":
            return SetupIntentUsage.onSession
        default:
            return nil
        }
    }

    class func mapPaymentIntentPaymentMethodTypes(_ types: [String]) -> [PaymentMethodType] {
        return types.map { mapToPaymentMethodType($0) }
    }

    class func mapToSetupIntentCollectionReason(_ reason: String?) -> SetupIntentCollectionReason? {
        switch reason {
        case "saveCard":
            return SetupIntentCollectionReason.saveCard
        case "verify":
            return SetupIntentCollectionReason.verify
        default:
            return nil
        }
    }

    class func mapToPaymentMethodType(_ paymentMethodType: String) -> PaymentMethodType {
        switch paymentMethodType {
        case "card":
            return PaymentMethodType.card
        case "cardPresent", "card_present":
            return PaymentMethodType.cardPresent
        case "interacPresent", "interac_present":
            return PaymentMethodType.interacPresent
        case "wechatPay", "wechat_pay":
            return PaymentMethodType.wechatPay
        case "affirm":
            return PaymentMethodType.affirm
        case "paynow":
            return PaymentMethodType.paynow
        case "paypay":
            return PaymentMethodType.paypay
        case "klarna":
            return PaymentMethodType.klarna
        default:
            return PaymentMethodType.unknown
        }
    }

    class func mapFromSetupIntent(_ setupIntent: SetupIntent, uuid: String) -> NSDictionary {
        var result: [String: Any] = [:]

        result["sdkUuid"] = uuid
        result["livemode"] = setupIntent.livemode
        result["paymentMethodTypes"] = setupIntent.paymentMethodTypes
        result["status"] = mapFromSetupIntentStatus(setupIntent.status)
        result["usage"] = mapFromSetupIntentUsage(setupIntent.usage)
        result["nextAction"] = mapFromNextAction(setupIntent.nextAction)

        result["id"] = setupIntent.stripeId
        result["application"] = setupIntent.application
        result["cancellationReason"] = setupIntent.cancellationReason
        result["clientSecret"] = setupIntent.clientSecret
        result["created"] = convertDateToUnixTimestamp(date: setupIntent.created)
        result["customer"] = setupIntent.customer
        result["description"] = setupIntent.stripeDescription
        result["latestAttempt"] = mapFromSetupAttempt(setupIntent.latestAttempt)
        result["mandate"] = setupIntent.mandate
        result["metadata"] = setupIntent.metadata.map { NSDictionary(dictionary: $0) }
        result["onBehalfOf"] = setupIntent.onBehalfOf
        result["paymentMethodId"] = setupIntent.paymentMethod
        result["paymentMethodOptions"] = mapFromPaymentMethodOptions(setupIntent.paymentMethodOptions)
        result["singleUseMandate"] = setupIntent.singleUseMandate
        result["lastSetupError"] = Errors.mapFromApiError(setupIntent.lastSetupError)

        return NSDictionary(dictionary: result)
    }

    class func mapFromSetupIntentUsage(_ usage: SetupIntentUsage) -> String {
        switch usage {
        case SetupIntentUsage.offSession: return "offSession"
        case SetupIntentUsage.onSession: return "onSession"
        @unknown default: return "unknown"
        }
    }

    class func mapFromSetupAttempt(_ attempt: SetupAttempt?) -> NSDictionary? {
        guard let attempt = attempt else { return nil }
        var result: [String: Any] = [:]

        // Required fields
        result["id"] = attempt.stripeId
        result["status"] = attempt.status
        result["setupIntentId"] = attempt.setupIntent
        result["livemode"] = attempt.livemode
        result["usage"] = mapFromSetupIntentUsage(attempt.usage)

        // Optional fields
        result["created"] = convertDateToUnixTimestamp(date: attempt.created)
        result["customer"] = attempt.customer
        result["onBehalfOfId"] = attempt.onBehalfOf
        result["applicationId"] = attempt.application
        result["paymentMethodId"] = attempt.paymentMethod
        result["paymentMethodDetails"] = mapFromSetupAttemptPaymentMethodDetails(attempt.paymentMethodDetails)
        result["setupError"] = Errors.mapFromApiError(attempt.setupError)

        return NSDictionary(dictionary: result)
    }

    class func mapFromSetupAttemptPaymentMethodDetails(_ details: SetupAttemptPaymentMethodDetails?) -> NSDictionary? {
        guard let details = details else { return nil }
        var result: [String: Any] = [:]

        // Required field
        result["type"] = mapFromPaymentMethodDetailsType(details.type)

        // Optional fields
        result["cardPresent"] = mapFromSetupAttemptCardPresentDetails(details.cardPresent)
        result["interacPresent"] = mapFromSetupAttemptCardPresentDetails(details.interacPresent)

        return NSDictionary(dictionary: result)
    }

    class func mapFromSetupAttemptCardPresentDetails(_ details: SetupAttemptCardPresentDetails?) -> NSDictionary? {
        guard let unwrappedDetails = details else {
            return nil
        }
        let result: NSDictionary = [
            "emvAuthData": unwrappedDetails.emvAuthData,
            "generatedCard": unwrappedDetails.generatedCard
        ]
        return result
    }


    class func mapFromSetupIntentStatus(_ status: SetupIntentStatus) -> String {
        switch status {
        case SetupIntentStatus.canceled: return "canceled"
        case SetupIntentStatus.processing: return "processing"
        case SetupIntentStatus.requiresConfirmation: return "requiresConfirmation"
        case SetupIntentStatus.requiresPaymentMethod: return "requiresPaymentMethod"
        case SetupIntentStatus.succeeded: return "succeeded"
        case SetupIntentStatus.requiresAction: return "requiresAction"
        @unknown default: return "unknown"
        }
    }

    class func mapFromPaymentIntentStatus(_ status: PaymentIntentStatus) -> String {
        switch status {
        case PaymentIntentStatus.canceled: return "canceled"
        case PaymentIntentStatus.processing: return "processing"
        case PaymentIntentStatus.requiresCapture: return "requiresCapture"
        case PaymentIntentStatus.requiresConfirmation: return "requiresConfirmation"
        case PaymentIntentStatus.requiresPaymentMethod: return "requiresPaymentMethod"
        case PaymentIntentStatus.succeeded: return "succeeded"
        case PaymentIntentStatus.requiresAction: return "requiresAction"
        case PaymentIntentStatus.requiresReauthorization: return "requiresReauthorization"
        @unknown default: return "unknown"
        }
    }

    class func mapFromChargeStatus(_ status: ChargeStatus) -> String {
        switch status {
        case ChargeStatus.failed: return "failed"
        case ChargeStatus.pending: return "pending"
        case ChargeStatus.succeeded: return "succeeded"
        @unknown default: return "unknown"
        }
    }

    class func mapFromReaderDisplayMessage(_ displayMessage: ReaderDisplayMessage) -> String {
        switch displayMessage {
        case ReaderDisplayMessage.insertCard: return "insertCard"
        case ReaderDisplayMessage.insertOrSwipeCard: return "insertOrSwipeCard"
        case ReaderDisplayMessage.multipleContactlessCardsDetected: return "multipleContactlessCardsDetected"
        case ReaderDisplayMessage.removeCard: return "removeCard"
        case ReaderDisplayMessage.retryCard: return "retryCard"
        case ReaderDisplayMessage.swipeCard: return "swipeCard"
        case ReaderDisplayMessage.tryAnotherCard: return "tryAnotherCard"
        case ReaderDisplayMessage.tryAnotherReadMethod: return "tryAnotherReadMethod"
        case ReaderDisplayMessage.cardRemovedTooEarly: return "cardRemovedTooEarly"
        @unknown default: return "unknown"
        }
    }

    class func mapFromReaderInputOptions(_ inputOptions: ReaderInputOptions) -> NSMutableArray {
        let array = inputOptions.rawValue.bitComponents()
        let mappedOptions: NSMutableArray = []

        array.forEach { item in
            switch item {
            case 0: return
            case 1: return mappedOptions.add("swipeCard")
            case 2: return mappedOptions.add("insertCard")
            case 4: return mappedOptions.add("tapCard")
            default: return
            }
        }

        return mappedOptions
    }

    class func mapFromCharges(_ charges: [Charge]) -> [NSDictionary] {
        var list: [NSDictionary] = []

        for charge in charges {
            let result = mapFromCharge(charge)
            list.append(result)
        }

        return list
    }

    class func mapFromReaderSoftwareUpdate(_ update: ReaderSoftwareUpdate?) -> [AnyHashable:Any?]? {
        guard let unwrappedUpdate = update else {
            return nil
        }
        let result: [AnyHashable: Any?] = [
            "deviceSoftwareVersion": unwrappedUpdate.deviceSoftwareVersion,
            "estimatedUpdateTime": mapFromUpdateTimeEstimate(unwrappedUpdate.durationEstimate),
            "requiredAt": Mappers.convertDateToUnixTimestamp(date: unwrappedUpdate.requiredAt),
            "components": mapFromUpdateComponents(unwrappedUpdate.components),
        ]
        return result
    }

    class func mapFromUpdateTimeEstimate(_ time: UpdateTimeEstimate) -> String {
        switch time {
        case UpdateTimeEstimate.estimate1To2Minutes: return "estimate1To2Minutes"
        case UpdateTimeEstimate.estimate2To5Minutes: return "estimate2To5Minutes"
        case UpdateTimeEstimate.estimate5To15Minutes: return "estimate5To15Minutes"
        case UpdateTimeEstimate.estimateLessThan1Minute: return "estimateLessThan1Minute"
        @unknown default: return "unknown"
        }
    }


    class func mapFromLocationsList(_ locations: [Location]) -> [NSDictionary] {
        var list: [NSDictionary] = []

        for location in locations {
            let result = mapFromLocation(location)
            if let result {
                list.append(result)
            }
        }

        return list
    }

    class func mapFromLocation(_ location: Location?) -> NSDictionary? {
        guard let location = location else { return nil }
        var result: [String: Any] = [:]

        // Required fields
        result["id"] = location.stripeId
        result["livemode"] = location.livemode

        // Optional fields
        result["displayName"] = location.displayName
        result["displayNameKanji"] = location.displayNameKanji
        result["displayNameKana"] = location.displayNameKana
        result["address"] = mapFromAddress(location.address)
        result["addressKanji"] = mapFromAddress(location.addressKanji)
        result["addressKana"] = mapFromAddress(location.addressKana)
        result["phone"] = location.phone

        return NSDictionary(dictionary: result)
    }

    class func mapFromAddress(_ address: Address?) -> NSDictionary? {
        guard let address = address else { return nil }
        var result: [String: Any] = [:]
        result["city"] = address.city
        result["country"] = address.country
        result["postalCode"] = address.postalCode
        result["line1"] = address.line1
        result["line2"] = address.line2
        result["state"] = address.state
        result["town"] = address.town
        return NSDictionary(dictionary: result)
    }

    class func mapFromCharge(_ charge: Charge) -> NSDictionary {
        var result: [String: Any] = [:]

        // Required fields
        result["id"] = charge.stripeId
        result["amount"] = charge.amount
        result["amountRefunded"] = charge.amountRefunded
        result["captured"] = charge.captured
        result["currency"] = charge.currency
        result["livemode"] = charge.livemode
        result["metadata"] = NSDictionary(dictionary: charge.metadata)
        result["paid"] = charge.paid
        result["refunded"] = charge.refunded
        result["status"] = mapFromChargeStatus(charge.status)
        result["generatedFrom"] = mapFromGeneratedFrom(charge.generatedFrom)

        // Optional fields
        result["applicationFee"] = charge.applicationFee
        result["applicationFeeAmount"] = charge.applicationFeeAmount
        result["authorizationCode"] = charge.authorizationCode
        result["balanceTransaction"] = charge.balanceTransaction
        result["calculatedStatementDescriptor"] = charge.calculatedStatementDescriptor
        result["created"] = convertDateToUnixTimestamp(date: charge.created)
        result["customer"] = charge.customer
        result["description"] = charge.stripeDescription
        result["onBehalfOf"] = charge.onBehalfOf
        result["paymentIntentId"] = charge.paymentIntentId
        result["paymentMethodDetails"] = mapFromPaymentMethodDetails(charge.paymentMethodDetails)
        result["receiptEmail"] = charge.receiptEmail
        result["receiptNumber"] = charge.receiptNumber
        result["receiptUrl"] = charge.receiptUrl
        result["statementDescriptorSuffix"] = charge.statementDescriptorSuffix

        return NSDictionary(dictionary: result)
    }

    class func convertDateToUnixTimestamp(date: Date?) -> String? {
        if let date {
            let value = date.timeIntervalSince1970 * 1000.0
            return String(format: "%.0f", value)
        }
        return nil
    }

    class func mapToAllowRedisplay(allowToredisplay: String) -> AllowRedisplay {
        switch allowToredisplay {
        case "always": return AllowRedisplay.always
        case "limited": return AllowRedisplay.limited
        default: return AllowRedisplay.unspecified
        }
    }

    class func mapToUpdateComponent(_ component: String) -> UpdateComponent? {
        switch component {
        case "firmware": return .firmware
        case "config": return .config
        case "keys": return .keys
        case "incremental": return .incremental
        default: return nil
        }
    }

    class func mapFromUpdateComponents(_ components: UpdateComponent) -> [String] {
        var result: [String] = []
        if components.contains(.firmware) { result.append("firmware") }
        if components.contains(.config) { result.append("config") }
        if components.contains(.keys) { result.append("keys") }
        if components.contains(.incremental) { result.append("incremental") }
        return result
    }

    class func mapToTestReaderUpdate(_ dict: NSDictionary) -> TestReaderUpdate? {
        guard let type = dict["type"] as? String else { return nil }
        let componentStrings = dict["components"] as? [String] ?? []
        var components: UpdateComponent = []
        for str in componentStrings {
            if let comp = mapToUpdateComponent(str) {
                components.insert(comp)
            }
        }
        switch type {
        case "available": return .available(components)
        case "required": return .required(components)
        case "requiredOffline": return .requiredOffline(components)
        case "lowBattery": return .lowBattery()
        case "lowBatterySucceedConnect": return .lowBatterySucceedConnect()
        case "random": return .random()
        default: return nil
        }
    }

    class func mapToSimulatedCollectInputsResult(_ behavior: String) -> SimulatedCollectInputsResult {
        switch behavior.lowercased() {
        case "all":
            return SimulatedCollectInputsResultSucceeded(
                simulatedCollectInputsSkipBehavior: SimulatedCollectInputsSkipBehavior.all
              )
        case "none":
            return SimulatedCollectInputsResultSucceeded(
                simulatedCollectInputsSkipBehavior: SimulatedCollectInputsSkipBehavior.none
              )
        case "timeout":
            return SimulatedCollectInputsResultTimeout()
        default:
            return SimulatedCollectInputsResultSucceeded(
                simulatedCollectInputsSkipBehavior: SimulatedCollectInputsSkipBehavior.none
              )
        }
    }

    class func mapFromCardPresent(_ cardPresent: CardPresentDetails) -> NSDictionary {
        var result: [String: Any] = [:]

        // Required fields
        result["last4"] = cardPresent.last4
        result["expMonth"] = cardPresent.expMonth
        result["expYear"] = cardPresent.expYear
        result["funding"] = mapFromCardPresentDetailsFunding(cardPresent.funding)
        result["brand"] = mapFromCardPresentDetailsBrand(cardPresent.brand)
        result["issuer"] = cardPresent.issuer
        result["iin"] = cardPresent.iin
        result["description"] = cardPresent.stripeDescription
        result["network"] = mapFromCardPresentDetailsNetwork(cardPresent.network ?? NSNumber(-1))

        // Optional fields
        result["cardholderName"] = cardPresent.cardholderName
        result["generatedCard"] = cardPresent.generatedCard
        result["receipt"] = cardPresent.receipt.map { mapFromReceiptDetails($0) }
        result["emvAuthData"] = cardPresent.emvAuthData
        result["country"] = cardPresent.country
        result["preferredLocales"] = cardPresent.preferredLocales
        result["wallet"] = cardPresent.wallet.map { mapFromCardPresentDetailsWallet($0) }
        result["location"] = cardPresent.location
        result["reader"] = cardPresent.reader
        result["multicaptureStatus"] = mapFromMulticaptureStatus(cardPresent.multicaptureStatus)
        result["reauthorizationStatus"] = mapFromReauthorizationStatus(cardPresent.reauthorizationStatus)
        result["captureBefore"] = convertDateToUnixTimestamp(date: cardPresent.captureBefore)
        result["reauthorizeBefore"] = convertDateToUnixTimestamp(date: cardPresent.reauthorizeBefore)

        return NSDictionary(dictionary: result)
    }

    class func mapFromReauthorizationStatus(_ status: ReauthorizationStatus) -> String {
        switch status {
        case ReauthorizationStatus.available: return "available"
        case ReauthorizationStatus.unavailable: return "unavailable"
        case ReauthorizationStatus.unknown: return "unknown"
        @unknown default: return "unknown"
        }
    }

    class func mapFromWechatPay(_ wechatPay: WechatPayDetails) -> NSDictionary {
        var result: [String: Any] = [:]
        result["location"] = wechatPay.location
        result["reader"] = wechatPay.reader
        result["transactionId"] = wechatPay.transactionId
        return NSDictionary(dictionary: result)
    }

    class func mapFromAffirm(_ affirm: AffirmDetails) -> NSDictionary {
        var result: [String: Any] = [:]
        result["location"] = affirm.location
        result["reader"] = affirm.reader
        result["transactionId"] = affirm.transactionId
        return NSDictionary(dictionary: result)
    }

    class func mapFromPaynow(_ paynow: PaynowDetails) -> NSDictionary {
        var result: [String: Any] = [:]
        result["location"] = paynow.location
        result["reader"] = paynow.reader
        result["reference"] = paynow.reference
        return NSDictionary(dictionary: result)
        }

    class func mapFromPaypay(_ paypay: PaypayDetails) -> NSDictionary {
        var result: [String: Any] = [:]
        result["location"] = paypay.location
        result["reader"] = paypay.reader
        return NSDictionary(dictionary: result)
    }

    class func mapFromKlarna(_ klarna: KlarnaDetails) -> NSDictionary {
        var result: [String: String] = [:]
        result["location"] = klarna.location
        result["reader"] = klarna.reader
        return NSDictionary(dictionary: result)
    }

    class func mapFromOfflineDetails(_ offlineDetails: OfflineDetails) -> NSDictionary {
        var result: [String: Any] = [:]

        // Required field
        result["requiresUpload"] = offlineDetails.requiresUpload

        // Optional fields
        result["storedAtMs"] = convertDateToUnixTimestamp(date: offlineDetails.storedAt)
        result["cardPresentDetails"] = offlineDetails.cardPresentDetails.map { mapFromOfflineCardPresentDetails($0) }
        result["amountDetails"] = offlineDetails.amountDetails.map { mapFromAmountDetails($0) }

        return NSDictionary(dictionary: result)
    }

    class func mapFromAmountDetails(_ amountDetails: AmountDetails?) -> NSDictionary {
        var result: [String: Any] = [:]
        var tipAmount: [String: Any] = [:]
        tipAmount["amount"] = amountDetails?.tip?.amount
        result["tip"] = NSDictionary(dictionary: tipAmount)

        var surchargeMap: [String: Any] = [:]
        if let surcharge = amountDetails?.surcharge {
            if let statusValue = surcharge.status {
                surchargeMap["status"] = statusValue.uintValue == SurchargeStatus.available.rawValue ? "available" : "unavailable"
            }
            surchargeMap["amount"] = surcharge.amount
            surchargeMap["maximumAmount"] = surcharge.maximumAmount
        }
        result["surcharge"] = NSDictionary(dictionary: surchargeMap)

        return NSDictionary(dictionary: result)
    }

    class func mapFromOfflineCardPresentDetails(_ offlineCardPresentDetails: OfflineCardPresentDetails) -> NSDictionary {
        var result: [String: Any] = [:]

        // Required fields
        result["brand"] = offlineCardPresentDetails.brand
        result["expMonth"] = offlineCardPresentDetails.expMonth
        result["expYear"] = offlineCardPresentDetails.expYear
        result["readMethod"] = mapFromReadMethod(offlineCardPresentDetails.readMethod)

        // Optional fields
        result["cardholderName"] = offlineCardPresentDetails.cardholderName
        result["last4"] = offlineCardPresentDetails.last4
        result["receiptDetails"] = offlineCardPresentDetails.receiptDetails.map { mapFromReceiptDetails($0) }

        return NSDictionary(dictionary: result)
    }

    class func mapFromCardPresentDetailsWallet(_ wallet: SCPWallet) -> NSDictionary {
        let result: NSDictionary = [
            "type": wallet.type
        ]
        return result
    }

    class func mapFromCardPresentDetailsFunding(_ type: CardFundingType) -> String {
        switch type {
        case CardFundingType.debit: return "debit"
        case CardFundingType.credit: return "credit"
        case CardFundingType.prepaid: return "prepaid"
        @unknown default: return "other"
        }
    }

    class func mapFromCardPresentDetailsBrand(_ type: CardBrand) -> String {
        switch type {
        case CardBrand.visa: return "visa"
        case CardBrand.amex: return "amex"
        case CardBrand.masterCard: return "masterCard"
        case CardBrand.discover: return "discover"
        case CardBrand.JCB: return "JCB"
        case CardBrand.dinersClub: return "dinersClub"
        case CardBrand.interac: return "interac"
        case CardBrand.unionPay: return "unionPay"
        case CardBrand.eftposAu: return "eftposAu"
        case CardBrand.cartesBancaires: return "cartesBancaires"
        case CardBrand.girocard: return "girocard"
        @unknown default: return "unknown"
        }
    }

    class func mapFromCardPresentDetailsNetwork(_ type: NSNumber) -> String {
        switch type {
        case 0: return "visa"
        case 1: return "amex"
        case 2: return "masterCard"
        case 3: return "discover"
        case 4: return "JCB"
        case 5: return "dinersClub"
        case 6: return "interac"
        case 7: return "unionPay"
        case 8: return "eftposAu"
        default: return "unknown"
        }
    }

    class func mapFromReceiptDetails(_ receiptDetails: ReceiptDetails) -> NSDictionary {
        let result: NSDictionary = [
            "accountType": receiptDetails.accountType,
            "applicationCryptogram": receiptDetails.applicationCryptogram,
            "applicationPreferredName": receiptDetails.applicationPreferredName,
            "authorizationCode": receiptDetails.authorizationCode,
            "authorizationResponseCode": receiptDetails.authorizationResponseCode,
            "dedicatedFileName": receiptDetails.dedicatedFileName,
            "terminalVerificationResults": receiptDetails.terminalVerificationResults,
            "transactionStatusInformation": receiptDetails.transactionStatusInformation,
            "cvm": receiptDetails.cardholderVerificationMethod
        ]
        return result
    }

    class func mapFromPaymentMethodDetailsType(_ type: PaymentMethodType) -> String {
        switch type {
        case PaymentMethodType.card: return "card"
        case PaymentMethodType.cardPresent: return "cardPresent"
        case PaymentMethodType.interacPresent: return "interacPresent"
        case PaymentMethodType.wechatPay: return "wechatPay"
        case PaymentMethodType.affirm: return "affirm"
        case PaymentMethodType.paynow: return "paynow"
        case PaymentMethodType.paypay: return "paypay"
        case PaymentMethodType.klarna: return "klarna"
        @unknown default: return "unknown"
        }
    }

    class func mapFromPaymentMethodDetails(_ paymentMethodDetails: PaymentMethodDetails?) -> NSDictionary? {
        guard let paymentMethodDetails = paymentMethodDetails else { return nil }
        var result: [String: Any] = [:]

        // Required field
        result["type"] = mapFromPaymentMethodDetailsType(paymentMethodDetails.type)

        // Optional fields
        result["cardPresentDetails"] = paymentMethodDetails.cardPresent.map { mapFromCardPresent($0) }
        result["interacPresentDetails"] = paymentMethodDetails.interacPresent.map { mapFromCardPresent($0) }
        result["wechatPayDetails"] = paymentMethodDetails.wechatPay.map { mapFromWechatPay($0) }
        result["affirmDetails"] = paymentMethodDetails.affirm.map { mapFromAffirm($0) }
        result["paynowDetails"] = paymentMethodDetails.paynow.map { mapFromPaynow($0) }
        result["paypayDetails"] = paymentMethodDetails.paypay.map { mapFromPaypay($0) }
        result["klarnaDetails"] = paymentMethodDetails.klarna.map { mapFromKlarna($0) }
        result["cardDetails"] = paymentMethodDetails.card.map { mapFromCardDetails($0) }

        return NSDictionary(dictionary: result)
    }

    class func mapFromRefund(_ refund: Refund) -> NSDictionary {
        var result: [String: Any] = [:]

        // Required fields
        result["id"] = refund.stripeId
        result["amount"] = refund.amount
        result["currency"] = refund.currency
        result["metadata"] = NSDictionary(dictionary: refund.metadata)
        result["status"] = mapFromRefundStatus(refund.status)

        // Optional fields
        result["balanceTransaction"] = refund.balanceTransaction
        result["chargeId"] = refund.chargeId
        result["created"] = convertDateToUnixTimestamp(date: refund.created)
        result["description"] = refund.stripeDescription
        result["failureBalanceTransaction"] = refund.failureBalanceTransaction
        result["failureReason"] = refund.failureReason
        result["paymentIntentId"] = refund.paymentIntentId
        result["paymentMethodDetails"] = mapFromPaymentMethodDetails(refund.paymentMethodDetails)
        result["reason"] = refund.reason
        result["receiptNumber"] = refund.receiptNumber
        result["sourceTransferReversal"] = refund.sourceTransferReversal
        result["transferReversal"] = refund.transferReversal

        return NSDictionary(dictionary: result)
    }

    class func mapFromRefundStatus(_ type: RefundStatus) -> String {
        switch type {
        case RefundStatus.failed: return "failed"
        case RefundStatus.pending: return "pending"
        case RefundStatus.succeeded: return "succeeded"
        case RefundStatus.unknown: return "unknown"
        @unknown default: return "unknown"
        }
    }

    class func mapFromCardDetails(_ cardDetails: CardDetails) -> NSDictionary {
        var result: [String: Any] = [:]

        // Required fields
        result["brand"] = cardDetails.brand
        result["expMonth"] = cardDetails.expMonth
        result["expYear"] = cardDetails.expYear
        result["funding"] = cardDetails.funding
        result["generatedFrom"] = mapFromGeneratedFrom(cardDetails.generatedFrom)

        // Optional fields
        result["country"] = cardDetails.country
        result["last4"] = cardDetails.last4

        return NSDictionary(dictionary: result)
    }

    class func mapFromGeneratedFrom(_ from: GeneratedFrom?) -> NSDictionary? {
        guard let from = from else { return nil }
        var result: [String: Any] = [:]
        result["charge"] = from.charge
        result["paymentMethodDetails"] = mapFromPaymentMethodDetails(from.paymentMethodDetails)
        result["setupAttempt"] = from.setupAttempt
        return NSDictionary(dictionary: result)
    }

    class func mapToCustomerCancellation(_ cancellation: String?) -> CustomerCancellation? {
        switch cancellation {
        case "enableIfAvailable":
            return .enableIfAvailable
        case "disableIfAvailable":
            return .disableIfAvailable
        default:
          return nil
        }
    }

    class func mapToMotoConfiguration(_ configuration: NSDictionary?) -> MotoConfiguration? {
        guard let configuration = configuration else {
           return nil
        }
        let builder = MotoConfigurationBuilder()
        if let skipCvc = configuration["skipCvc"] as? Bool {
            builder.setSkipCvc(skipCvc)
        }
        do {
            return try builder.build()
        } catch (_) {
            return nil
        }
    }

    class func mapFromPaymentMethod(_ paymentMethod: PaymentMethod) -> NSDictionary {
        var result: [String: Any] = [:]

        // Required fields
        result["id"] = paymentMethod.stripeId
        result["type"] = mapFromPaymentMethodDetailsType(paymentMethod.type)
        result["livemode"] = paymentMethod.livemode
        result["metadata"] = NSDictionary(dictionary: paymentMethod.metadata)

        // Optional fields
        result["cardPresentDetails"] = paymentMethod.cardPresent.map { mapFromCardPresent($0) }
        result["cardDetails"] = paymentMethod.card.map { mapFromCardDetails($0) }
        result["interacPresentDetails"] = paymentMethod.interacPresent.map { mapFromCardPresent($0) }
        result["wechatPayDetails"] = paymentMethod.wechatPay.map { mapFromWechatPay($0) }
        result["affirmDetails"] = paymentMethod.affirm.map { mapFromAffirm($0) }
        result["paynowDetails"] = paymentMethod.paynow.map { mapFromPaynow($0) }
        result["paypayDetails"] = paymentMethod.paypay.map { mapFromPaypay($0) }
        result["klarnaDetails"] = paymentMethod.klarna.map { mapFromKlarna($0) }
        result["customer"] = paymentMethod.customer

        return NSDictionary(dictionary: result)
    }

    class func mapFromPaymentStatus(_ paymentStatus: PaymentStatus) -> String {
        switch paymentStatus {
        case PaymentStatus.notReady: return "notReady"
        case PaymentStatus.ready: return "ready"
        case PaymentStatus.processing: return "processing"
        case PaymentStatus.waitingForInput: return "waitingForInput"
        @unknown default: return "unknown"
        }
    }

    class func mapFromConnectionStatus(_ connectionStatus: ConnectionStatus) -> String {
        switch connectionStatus {
        case .connected: return "connected"
        case .connecting: return "connecting"
        case .notConnected: return "notConnected"
        case .discovering: return "discovering"
        case .reconnecting: return "reconnecting"
        @unknown default: return "unknown"
        }
    }

    class func mapToLogLevel(_ logLevel: String?) -> LogLevel {
        switch logLevel {
        case "none": return LogLevel.none
        case "verbose": return LogLevel.verbose
        default: return LogLevel.none
        }
    }

    class func mapToLocaleConfig(_ params: NSDictionary?) throws -> LocaleConfig? {
        guard let params = params else {
            return nil
        }

        switch params["type"] as? String {
        case "hardcoded":
            guard let locale = params["locale"] as? String else {
                return nil
            }
            return try HardcodedLocaleConfigBuilder(locale: locale).build()
        case "cardLanguagePreferenceIfAvailable":
            return LocaleConfig.cardLanguagePreferenceIfAvailable
        default:
            return nil
        }
    }

    class func mapFromNetworkStatus(_ status: NetworkStatus) -> String {
        switch status {
        case NetworkStatus.online: return "online"
        case NetworkStatus.offline: return "offline"
        case NetworkStatus.unknown: return "unknown"
        @unknown default: return "unknown"
        }
    }

    class func mapFromOfflineStatus(_ offlineStatus: OfflineStatus) -> NSDictionary {
        let sdkDict: NSDictionary = [
            "networkStatus": Mappers.mapFromNetworkStatus(offlineStatus.sdk.networkStatus),
            "offlinePaymentsCount": offlineStatus.sdk.paymentsCount ?? 0,
            "offlinePaymentAmountsByCurrency": offlineStatus.sdk.paymentAmountsByCurrency
        ]

        var readerDict: NSDictionary = [:]
        if let reader = offlineStatus.reader {
            readerDict = [
                "networkStatus": Mappers.mapFromNetworkStatus(reader.networkStatus),
                "offlinePaymentsCount": reader.paymentsCount ?? 0,
                "offlinePaymentAmountsByCurrency": reader.paymentAmountsByCurrency
            ]
        }

        return(["sdk": sdkDict, "reader": readerDict])
    }

    class func mapFromReaderTextToSpeechStatus(_ status: ReaderTextToSpeechStatus) -> String {
        switch status {
        case ReaderTextToSpeechStatus.off: return "off"
        case ReaderTextToSpeechStatus.headphones: return "headphones"
        case ReaderTextToSpeechStatus.speakers: return "speakers"
        @unknown default: return "unknown"
        }
    }

    class func mapFromReaderSettings(_ readerSettings: ReaderSettings) -> NSDictionary {
        var accessibility: [String : Any] = [
            "textToSpeechStatus": mapFromReaderTextToSpeechStatus(readerSettings.accessibility.textToSpeechStatus),
        ]

        if let error = readerSettings.accessibility.error as NSError? {
            accessibility["error"] = Errors.mapToStripeErrorObject(nsError: error)
        }

        return(["accessibility": accessibility])
    }

    class func mapFromReaderDisconnectReason(_ reason: DisconnectReason) -> String {
        switch reason {
        case DisconnectReason.disconnectRequested: return "disconnectRequested"
        case DisconnectReason.rebootRequested: return "rebootRequested"
        case DisconnectReason.securityReboot: return "securityReboot"
        case DisconnectReason.criticallyLowBattery: return "criticallyLowBattery"
        case DisconnectReason.poweredOff: return "poweredOff"
        case DisconnectReason.bluetoothDisabled: return "bluetoothDisabled"
        case DisconnectReason.bluetoothSignalLost: return "bluetoothSignalLost"
        case DisconnectReason.usbDisconnected: return "usbDisconnected"
        case DisconnectReason.idlePowerDown: return "idlePowerDown"
        case DisconnectReason.peerRemovedPairingInformation: return "peerRemovedPairingInformation"
        @unknown default: return "unknown"
        }
    }

    class func mapFromReadMethod(_ readMethod: ReadMethod) -> String {
        switch readMethod {
        case ReadMethod.contactEMV: return "contactEMV"
        case ReadMethod.contactlessEMV: return "contactlessEMV"
        case ReadMethod.contactlessMagstripeMode: return "contactlessMagstripeMode"
        case ReadMethod.magneticStripeFallback: return "magneticStripeFallback"
        case ReadMethod.magneticStripeTrack2: return "magneticStripeTrack2"
        @unknown default: return "unknown"
        }
    }

    class func mapFromToggleResult(_ toggleResult: NSNumber) -> String {
        switch toggleResult {
        case 0: return "enabled"
        case 1: return "disabled"
        case 2: return "skipped"
        default: return "unknown"
        }
    }

    class func mapFromToggleResultList(_ toggles: [NSNumber]) -> [String] {
        var list: [String] = []

        for toggle in toggles {
            let result = mapFromToggleResult(toggle)
            list.append(result)
        }

        return list
    }

    class func mapFormType(result: CollectInputsResult) -> String {
        return if result is EmailResult {
            "email"
        } else if result is PhoneResult {
            "phone"
        } else if result is TextResult {
            "text"
        } else if result is NumericResult {
            "numeric"
        } else if result is SignatureResult {
            "signature"
        } else if result is SelectionResult {
            "selection"
        } else {
            ""
        }
    }

    class func mapFromCollectInputsResults(_ results: [CollectInputsResult]) -> NSDictionary {
        var collectInputResults: [NSDictionary] = []
        for result in results {
            if result is EmailResult {
                let result = result as! EmailResult
                let emailResult: NSDictionary = ["skipped": result.skipped, "email": result.email ?? "", "formType": mapFormType(result: result), "toggles": mapFromToggleResultList(result.toggles)]
                collectInputResults.append(emailResult)
            } else if result is PhoneResult {
                let result = result as! PhoneResult
                let phoneResult: NSDictionary = ["skipped": result.skipped, "phone": result.phone ?? "", "formType": mapFormType(result: result), "toggles": mapFromToggleResultList(result.toggles)]
                collectInputResults.append(phoneResult)
            } else if result is TextResult {
                let result = result as! TextResult
                let textResult: NSDictionary = ["skipped": result.skipped, "text": result.text ?? "", "formType": mapFormType(result: result), "toggles": mapFromToggleResultList(result.toggles)]
                collectInputResults.append(textResult)
            } else if result is NumericResult {
                let result = result as! NumericResult
                let numericResult: NSDictionary = ["skipped": result.skipped, "numericString": result.numericString ?? "", "formType": mapFormType(result: result), "toggles": mapFromToggleResultList(result.toggles)]
                collectInputResults.append(numericResult)
            } else if result is SignatureResult {
                let result = result as! SignatureResult
                let signatureResult: NSDictionary = ["skipped": result.skipped, "signatureSvg": result.signatureSvg ?? "", "formType": mapFormType(result: result), "toggles": mapFromToggleResultList(result.toggles)]
                collectInputResults.append(signatureResult)
            } else if result is SelectionResult {
                let result = result as! SelectionResult
                let selectionResult: NSDictionary = ["skipped": result.skipped, "selection": result.selection ?? "", "selectionId": result.selectionId ?? "", "formType": mapFormType(result: result), "toggles": mapFromToggleResultList(result.toggles)]
                collectInputResults.append(selectionResult)
            }
        }

        return (["collectInputResults": collectInputResults])
    }

    class func mapFromReaderEvent(_ readerEvent: ReaderEvent) -> String {
        switch readerEvent {
            case .cardInserted: return "cardInserted"
            case .cardRemoved: return "cardRemoved"
            @unknown default: return "unknown"
        }
    }

    class func mapToCollectDataType(_ type: String) -> CollectDataType? {
        switch type {
            case "unknown": return CollectDataType.unknown
            case "magstripe": return CollectDataType.magstripe
            case "nfcUid": return CollectDataType.nfcUid
            default: return nil
        }
    }

    class func mapFromCollectedData(_ collectData: CollectedData) -> NSDictionary {
        var result: [String: Any] = [:]

        // Required field
        result["livemode"] = collectData.livemode

        // Optional field
        result["created"] = convertDateToUnixTimestamp(date: collectData.created)

        if let magstripeData = collectData as? MagstripeCollectedData {
            result["stripeId"] = magstripeData.stripeId
        } else if let nfcData = collectData as? NfcUidCollectedData {
            result["nfcUid"] = nfcData.uid
        }

        return NSDictionary(dictionary: result)
    }

    class func mapToSurchargeConfiguration(from dict: [String: Any]?) throws -> SurchargeConfiguration? {
        guard let dict = dict else { return nil }
        guard let amount = dict["amount"] as? UInt else {
            return nil
        }

        let surchargeConfigBuilder = SurchargeConfigurationBuilder()
        surchargeConfigBuilder.setAmount(amount)

        let consentBuilder = SurchargeConsentBuilder()
        if let consentDict = dict["consent"] as? [String: Any] {
            if let collectionString = consentDict["collection"] as? String {
                let collection: SurchargeConsentCollection
                switch collectionString.lowercased() {
                    case "enabled":
                        collection = .enabled
                    case "disabled":
                        collection = .disabled
                    default:
                        collection = .disabled
                }
                consentBuilder.setCollection(collection)
            } else {
                consentBuilder.setCollection(.disabled)
            }

            if let notice = consentDict["notice"] as? String {
                consentBuilder.setNotice(notice)
            }
        }
        surchargeConfigBuilder.setSurchargeConsent(try consentBuilder.build())

      return try surchargeConfigBuilder.build()
    }

    /**
     * Converts a data URI or base64 string to a UIImage
     * @param imageData The image data (can be data:image/... URI or base64 string)
     * @return UIImage object or nil if conversion fails
     */
    class func mapToUIImage(_ imageData: String) -> UIImage? {
        let imageBase64: String
        if imageData.hasPrefix("data:image/") {
            // Handle data URI
            let components = imageData.components(separatedBy: ",")
            imageBase64 = components.count == 2 ? components[1] : ""
        } else {
            // Try to decode as base64 string directly
            imageBase64 = imageData
        }

        return Data(base64Encoded: imageBase64).flatMap { UIImage(data: $0) }
    }

    // MARK: - MPOS QR Mappers

    class func mapFromQrCodeDisplayData(_ qrData: QrCodeDisplayData) -> NSDictionary {
        return [
            "imageUrlPng": qrData.qrCodeImageUrlPng,
            "imageUrlSvg": qrData.qrCodeImageUrlSvg,
            "expiresAtMs": qrData.expiresAtMs,
            "paymentMethodType": mapFromPaymentMethodDetailsType(qrData.paymentMethodType)
        ]
    }

    class func mapFromPaymentOption(_ paymentOption: PaymentOption, index: Int) -> [String: Any] {
        var mapped: [String: Any] = ["index": index]
        switch paymentOption.type {
        case .card:
            mapped["type"] = "card"
            mapped["label"] = "Card Payment"
            mapped["paymentMethodType"] = "card"
        case .nonCard:
            let methodType = paymentOption.paymentMethodType
            mapped["type"] = "nonCard"
            mapped["label"] = mapFromPaymentMethodDetailsType(methodType).capitalized
            mapped["paymentMethodType"] = mapFromPaymentMethodDetailsType(methodType)
        @unknown default:
            mapped["type"] = "unknown"
            mapped["label"] = "Unknown"
            mapped["paymentMethodType"] = "unknown"
        }
        return mapped
    }

    class func mapFromPaymentOptions(_ paymentOptions: [PaymentOption]) -> [[String: Any]] {
        return paymentOptions.enumerated().map { (index, option) in
            return mapFromPaymentOption(option, index: index)
        }
    }

    // MARK: - Configuration Builders

    class func buildCollectPaymentIntentConfiguration(from params: NSDictionary) throws -> CollectPaymentIntentConfiguration {
        let skipTipping = params["skipTipping"] as? Bool ?? false
        let updatePaymentIntent = params["updatePaymentIntent"] as? Bool ?? false
        let customerCancellation = mapToCustomerCancellation(params["customerCancellation"] as? String)
        let requestDynamicCurrencyConversion = params["requestDynamicCurrencyConversion"] as? Bool ?? false
        let surchargeNotice = params["surchargeNotice"] as? String
        let motoConfiguration = params["motoConfiguration"] as? NSDictionary

        let skipDonation = params["skipDonation"] as? Bool ?? false

        let collectConfigBuilder = CollectPaymentIntentConfigurationBuilder()
            .setSkipTipping(skipTipping)
            .setSkipDonation(skipDonation)
            .setUpdatePaymentIntent(updatePaymentIntent)
            .setRequestDynamicCurrencyConversion(requestDynamicCurrencyConversion)

        if let customerCancellation {
            collectConfigBuilder.setCustomerCancellation(customerCancellation)
        }

        collectConfigBuilder.setMotoConfiguration(mapToMotoConfiguration(motoConfiguration))

        if let allowRedisplay = params["allowRedisplay"] as? String {
            collectConfigBuilder.setAllowRedisplay(mapToAllowRedisplay(allowToredisplay: allowRedisplay))
        }

        if updatePaymentIntent, let surchargeNoticeValue = surchargeNotice {
            collectConfigBuilder.setSurchargeNotice(surchargeNoticeValue)
        }

        if let eligibleAmount = params["tipEligibleAmount"] as? Int {
            let tippingConfig = try TippingConfigurationBuilder()
                .setEligibleAmount(eligibleAmount)
                .build()
            collectConfigBuilder.setTippingConfiguration(tippingConfig)
        }

        return try collectConfigBuilder.build()
    }

    class func buildConfirmPaymentIntentConfiguration(from params: NSDictionary) throws -> ConfirmPaymentIntentConfiguration {
        let confirmConfigBuilder = ConfirmPaymentIntentConfigurationBuilder()

        if let surchargeDict = params["surcharge"] as? [String: Any],
           let surchargeConfiguration = try mapToSurchargeConfiguration(from: surchargeDict) {
            confirmConfigBuilder.setSurchargeConfiguration(surchargeConfiguration)
        }

        if let returnUrl = params["returnUrl"] as? String {
            confirmConfigBuilder.setReturnUrl(returnUrl)
        }

        return try confirmConfigBuilder.build()
    }

    class func buildCollectSetupIntentConfiguration(from params: NSDictionary) throws -> CollectSetupIntentConfiguration {
        let customerCancellation = mapToCustomerCancellation(params["customerCancellation"] as? String)
        let motoConfiguration = params["motoConfiguration"] as? NSDictionary

        let builder = CollectSetupIntentConfigurationBuilder()

        if let customerCancellation {
            builder.setCustomerCancellation(customerCancellation)
        }

        builder.setMotoConfiguration(mapToMotoConfiguration(motoConfiguration))

        if let collectionReason = mapToSetupIntentCollectionReason(params["collectionReason"] as? String) {
            builder.setCollectionReason(collectionReason)
        }

        return try builder.build()
    }
}

extension UInt {
    init(bitComponents : [UInt]) {
        self = bitComponents.reduce(0, +)
    }

    func bitComponents() -> [UInt] {
        return (0 ..< 8*MemoryLayout<UInt>.size).map( { 1 << $0 }).filter( { self & $0 != 0 } )
    }
}
