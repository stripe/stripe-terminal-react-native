package com.stripeterminalreactnative

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeArray
import com.stripe.stripeterminal.external.CollectInputs
import com.stripe.stripeterminal.external.OfflineMode
import com.stripe.stripeterminal.external.models.Address
import com.stripe.stripeterminal.external.models.AmountDetails
import com.stripe.stripeterminal.external.models.BatteryStatus
import com.stripe.stripeterminal.external.models.CardDetails
import com.stripe.stripeterminal.external.models.CardPresentDetails
import com.stripe.stripeterminal.external.models.CartLineItem
import com.stripe.stripeterminal.external.models.Charge
import com.stripe.stripeterminal.external.models.CollectInputsResult
import com.stripe.stripeterminal.external.models.ConnectionStatus
import com.stripe.stripeterminal.external.models.DeviceType
import com.stripe.stripeterminal.external.models.DisconnectReason
import com.stripe.stripeterminal.external.models.EmailResult
import com.stripe.stripeterminal.external.models.LocalMobileUxConfiguration
import com.stripe.stripeterminal.external.models.Location
import com.stripe.stripeterminal.external.models.LocationStatus
import com.stripe.stripeterminal.external.models.NetworkStatus
import com.stripe.stripeterminal.external.models.NumericResult
import com.stripe.stripeterminal.external.models.OfflineCardPresentDetails
import com.stripe.stripeterminal.external.models.OfflineDetails
import com.stripe.stripeterminal.external.models.OfflineStatus
import com.stripe.stripeterminal.external.models.PaymentIntent
import com.stripe.stripeterminal.external.models.PaymentIntentStatus
import com.stripe.stripeterminal.external.models.PaymentMethod
import com.stripe.stripeterminal.external.models.PaymentMethodDetails
import com.stripe.stripeterminal.external.models.PaymentMethodOptions
import com.stripe.stripeterminal.external.models.PaymentMethodType
import com.stripe.stripeterminal.external.models.PaymentStatus
import com.stripe.stripeterminal.external.models.PhoneResult
import com.stripe.stripeterminal.external.models.Reader
import com.stripe.stripeterminal.external.models.ReaderAccessibility
import com.stripe.stripeterminal.external.models.ReaderDisplayMessage
import com.stripe.stripeterminal.external.models.ReaderEvent
import com.stripe.stripeterminal.external.models.ReaderInputOptions
import com.stripe.stripeterminal.external.models.ReaderInputOptions.ReaderInputOption
import com.stripe.stripeterminal.external.models.ReaderSettings
import com.stripe.stripeterminal.external.models.ReaderSoftwareUpdate
import com.stripe.stripeterminal.external.models.ReaderSupportResult
import com.stripe.stripeterminal.external.models.ReaderTextToSpeechStatus
import com.stripe.stripeterminal.external.models.ReceiptDetails
import com.stripe.stripeterminal.external.models.Refund
import com.stripe.stripeterminal.external.models.SelectionResult
import com.stripe.stripeterminal.external.models.SetupAttempt
import com.stripe.stripeterminal.external.models.SetupAttemptStatus
import com.stripe.stripeterminal.external.models.SetupIntent
import com.stripe.stripeterminal.external.models.SetupIntentCardPresentDetails
import com.stripe.stripeterminal.external.models.SetupIntentPaymentMethodDetails
import com.stripe.stripeterminal.external.models.SetupIntentStatus
import com.stripe.stripeterminal.external.models.SetupIntentUsage
import com.stripe.stripeterminal.external.models.SignatureResult
import com.stripe.stripeterminal.external.models.SimulateReaderUpdate
import com.stripe.stripeterminal.external.models.TextResult
import com.stripe.stripeterminal.external.models.ToggleResult
import com.stripe.stripeterminal.external.models.Wallet
import com.stripe.stripeterminal.log.LogLevel

internal fun getInt(map: ReadableMap, key: String): Int? = if (map.hasKey(key)) map.getInt(key) else null

internal fun getBoolean(map: ReadableMap?, key: String): Boolean =
    if (map?.hasKey(key) == true) map.getBoolean(key) else false

internal fun putDoubleOrNull(mapTarget: WritableMap, key: String, value: Double?) {
    value?.let {
        mapTarget.putDouble(key, it)
    } ?: run {
        mapTarget.putNull(key)
    }
}

internal fun putIntOrNull(mapTarget: WritableMap, key: String, value: Int?) {
    value?.let {
        mapTarget.putInt(key, it)
    } ?: run {
        mapTarget.putNull(key)
    }
}

internal fun nativeMapOf(block: WritableMap.() -> Unit = {}): WritableMap {
    return NativeTypeFactory.writableNativeMap().apply {
        block()
    }
}

internal fun nativeArrayOf(block: WritableArray.() -> Unit = {}): WritableArray {
    return NativeTypeFactory.writableNativeArray().apply {
        block()
    }
}

internal fun mapFromReaders(readers: List<Reader>): ReadableArray =
    readers.collectToWritableArray { mapFromReader(it) }

internal fun mapFromReader(reader: Reader): ReadableMap = nativeMapOf {
    putString("label", reader.label)
    putString("serialNumber", reader.serialNumber)
    putString("id", reader.id)
    putString("locationId", reader.location?.id)
    putString("deviceSoftwareVersion", reader.softwareVersion)
    putString("deviceType", mapFromDeviceType(reader.deviceType))
    putBoolean("simulated", reader.isSimulated)
    putString("locationStatus", mapFromLocationStatus(reader.locationStatus))
    putString("ipAddress", reader.ipAddress)
    putString("baseUrl", reader.baseUrl)
    putString("bootloaderVersion", reader.bootloaderVersion)
    putString("configVersion", reader.configVersion)
    putString("emvKeyProfileId", reader.emvKeyProfileId)
    putString("firmwareVersion", reader.firmwareVersion)
    putString("hardwareVersion", reader.hardwareVersion)
    putString("macKeyProfileId", reader.macKeyProfileId)
    putString("pinKeyProfileId", reader.pinKeyProfileId)
    putString("trackKeyProfileId", reader.trackKeyProfileId)
    putString("settingsVersion", reader.settingsVersion)
    putString("pinKeysetId", reader.pinKeysetId)

    putMap("availableUpdate", mapFromReaderSoftwareUpdate(reader.availableUpdate))
    putMap("location", mapFromLocation(reader.location))
    putString("status", mapFromNetworkStatus(reader.networkStatus))
    putDoubleOrNull(this, "batteryLevel", reader.batteryLevel?.toDouble())
}

internal fun mapFromNetworkStatus(status: Reader.NetworkStatus?): String {
    return when (status) {
        Reader.NetworkStatus.OFFLINE -> "offline"
        Reader.NetworkStatus.ONLINE -> "online"
        else -> "unknown"
    }
}

internal fun mapFromDeviceType(type: DeviceType): String {
    return when (type) {
        DeviceType.CHIPPER_1X -> "chipper1X"
        DeviceType.CHIPPER_2X -> "chipper2X"
        DeviceType.COTS_DEVICE -> "cotsDevice"
        DeviceType.ETNA -> "etna"
        DeviceType.STRIPE_M2 -> "stripeM2"
        DeviceType.STRIPE_S700 -> "stripeS700"
        DeviceType.STRIPE_S700_DEVKIT -> "stripeS700Devkit"
        DeviceType.STRIPE_S710 -> "stripeS710"
        DeviceType.STRIPE_S710_DEVKIT -> "stripeS710Devkit"
        DeviceType.UNKNOWN -> "unknown"
        DeviceType.VERIFONE_P400 -> "verifoneP400"
        DeviceType.WISECUBE -> "wiseCube"
        DeviceType.WISEPAD_3 -> "wisePad3"
        DeviceType.WISEPAD_3S -> "wisePad3s"
        DeviceType.WISEPOS_E -> "wisePosE"
        DeviceType.WISEPOS_E_DEVKIT -> "wisePosEDevkit"
    }
}

internal fun mapToDeviceType(type: String): DeviceType? {
    return when (type) {
        "chipper1X" -> DeviceType.CHIPPER_1X
        "chipper2X" -> DeviceType.CHIPPER_2X
        "cotsDevice" -> DeviceType.COTS_DEVICE
        "etna" -> DeviceType.ETNA
        "stripeM2" -> DeviceType.STRIPE_M2
        "stripeS700" -> DeviceType.STRIPE_S700
        "stripeS700Devkit" -> DeviceType.STRIPE_S700_DEVKIT
        "stripeS710" -> DeviceType.STRIPE_S710
        "stripeS710Devkit" -> DeviceType.STRIPE_S710_DEVKIT
        "verifoneP400" -> DeviceType.VERIFONE_P400
        "wiseCube" -> DeviceType.WISECUBE
        "wisePad3" -> DeviceType.WISEPAD_3
        "wisePad3s" -> DeviceType.WISEPAD_3S
        "wisePosE" -> DeviceType.WISEPOS_E
        "wisePosEDevkit" -> DeviceType.WISEPOS_E_DEVKIT
        else -> null
    }
}

internal fun mapFromLocationStatus(status: LocationStatus): String {
    return when (status) {
        LocationStatus.NOT_SET -> "notSet"
        LocationStatus.SET -> "set"
        LocationStatus.UNKNOWN -> "unknown"
    }
}

internal fun mapToDiscoveryMethod(method: String?): DiscoveryMethod? {
    return when (method) {
        "bluetoothScan" -> DiscoveryMethod.BLUETOOTH_SCAN
        "internet" -> DiscoveryMethod.INTERNET
        "localMobile" -> DiscoveryMethod.LOCAL_MOBILE
        "handoff" -> DiscoveryMethod.HANDOFF
        "usb" -> DiscoveryMethod.USB
        else -> null
    }
}

@OptIn(OfflineMode::class)
internal fun mapFromPaymentIntent(paymentIntent: PaymentIntent, uuid: String): ReadableMap = nativeMapOf {
    putString("id", paymentIntent.id)
    putInt("amount", paymentIntent.amount.toInt())
    putString("captureMethod", paymentIntent.captureMethod)
    putArray("charges", mapFromChargesList(paymentIntent.getCharges()))
    putString("created", convertToUnixTimestamp(paymentIntent.created))
    putString("currency", paymentIntent.currency)
    putMap(
        "metadata",
        nativeMapOf {
            paymentIntent.metadata?.map {
                putString(it.key, it.value)
            }
        }
    )
    putString("statementDescriptor", paymentIntent.statementDescriptor)
    putString("status", mapFromPaymentIntentStatus(paymentIntent.status))
    putMap("amountDetails", mapFromAmountDetails(paymentIntent.amountDetails))
    putInt("amountTip", paymentIntent.amountTip?.toInt() ?: 0)
    putString("statementDescriptorSuffix", paymentIntent.statementDescriptorSuffix)
    putString("sdkUuid", uuid)
    putString("paymentMethodId", paymentIntent.paymentMethodId)
    putMap("paymentMethod", paymentIntent.paymentMethod?.let { mapFromPaymentMethod(it) })
    putMap("offlineDetails", mapFromOfflineDetails(paymentIntent.offlineDetails))
    putMap("paymentMethodOptions",mapFromPaymentMethodOptions(paymentIntent.paymentMethodOptions))
}

internal fun mapFromPaymentMethodOptions(paymentMethodOptions: PaymentMethodOptions?): ReadableMap? = paymentMethodOptions?.let {
    nativeMapOf {
        putMap(
            "cardPresent",
            nativeMapOf {
                putBoolean("requestExtendedAuthorization", it.cardPresent?.requestExtendedAuthorization ?: false)
                putBoolean("requestIncrementalAuthorizationSupport",it.cardPresent?.requestIncrementalAuthorizationSupport ?: false)
                putMap("surcharge",
                    nativeMapOf{
                        putString("status",it.cardPresent?.surcharge?.status)
                        putIntOrNull(this,"maximumAmount",it.cardPresent?.surcharge?.maximumAmount?.toInt())
                    }
                )
            }
        )
    }
}

internal fun mapFromSetupIntent(setupIntent: SetupIntent, uuid: String): ReadableMap = nativeMapOf {
    putString("created", convertToUnixTimestamp(setupIntent.created))
    putString("customer", setupIntent.customerId)
    putString("id", setupIntent.id)
    putString("status", mapFromSetupIntentStatus(setupIntent.status))
    putMap("latestAttempt", mapFromSetupAttempt(setupIntent.latestAttempt))
    putString("usage", mapFromSetupIntentUsage(setupIntent.usage))
    putString("applicationId", setupIntent.applicationId)
    putString("clientSecret", setupIntent.clientSecret)
    putString("description", setupIntent.description)
    putString("mandateId", setupIntent.mandateId)
    putMap(
        "metadata",
        nativeMapOf {
            setupIntent.metadata?.map {
                putString(it.key, it.value)
            }
        }
    )
    putString("onBehalfOfId", setupIntent.onBehalfOfId)
    putString("paymentMethodId", setupIntent.paymentMethodId)
    putArray("paymentMethodTypes", convertListToReadableArray(setupIntent.paymentMethodTypes))
    putString("singleUseMandateId", setupIntent.singleUseMandateId)
    putString("sdkUuid", uuid)
}

internal fun mapFromSetupAttempt(attempt: SetupAttempt?): ReadableMap? = attempt?.let {
    nativeMapOf {
        putString("created", convertToUnixTimestamp(it.created))
        putString("id", it.id)
        putString("status", mapFromSetupAttemptStatus(it.status))
        putString("usage", mapFromSetupIntentUsage(it.usage))
        putBoolean("isLiveMode", it.isLiveMode)
        putMap(
            "paymentMethodDetails",
            mapFromSetupIntentPaymentMethodDetails(it.paymentMethodDetails)
        )
        putString("customer", it.customerId)
        putString("setupIntentId", it.setupIntentId)
        putString("onBehalfOfId", it.onBehalfOfId)
        putString("applicationId", it.applicationId)
        putString("paymentMethodId", it.paymentMethodId)
    }
}

internal fun mapFromSetupIntentPaymentMethodDetails(
    details: SetupIntentPaymentMethodDetails
): ReadableMap = nativeMapOf {
    putMap("cardPresent", mapFromSetupIntentCardPresentDetails(details.cardPresentDetails))
    putMap("interacPresent", mapFromSetupIntentCardPresentDetails(details.interacPresentDetails))
}

internal fun mapFromSetupIntentCardPresentDetails(
    details: SetupIntentCardPresentDetails?
): ReadableMap? = details?.let {
    nativeMapOf {
        putString("emvAuthData", it.emvAuthData)
        putString("generatedCard", it.generatedCard)
    }
}

internal fun mapFromSetupIntentUsage(usage: SetupIntentUsage?): String? = usage?.let {
    when (it) {
        SetupIntentUsage.OFF_SESSION -> "offSession"
        SetupIntentUsage.ON_SESSION -> "onSession"
    }
}

internal fun mapFromSetupAttemptStatus(method: SetupAttemptStatus): String {
    return when (method) {
        SetupAttemptStatus.ABANDONED -> "abandoned"
        SetupAttemptStatus.FAILED -> "failed"
        SetupAttemptStatus.PROCESSING -> "processing"
        SetupAttemptStatus.REQUIRES_ACTION -> "requiresAction"
        SetupAttemptStatus.REQUIRES_CONFIRMATION -> "requiresConfirmation"
        SetupAttemptStatus.SUCCEEDED -> "succeeded"
    }
}

internal fun mapFromChargesList(charges: List<Charge>): ReadableArray =
    charges.collectToWritableArray { mapFromCharge(it) }

internal fun mapFromListLocations(locations: List<Location>): ReadableArray =
    locations.collectToWritableArray { mapFromLocation(it) }

internal fun mapFromReaderInputOptions(options: ReaderInputOptions): ReadableArray = nativeArrayOf {
    options.toString().split('/').forEach {
        when (it.trim()) {
            ReaderInputOption.INSERT.toString() -> pushString("insertCard")
            ReaderInputOption.SWIPE.toString() -> pushString("swipeCard")
            ReaderInputOption.TAP.toString() -> pushString("tapCard")
            ReaderInputOption.NONE.toString() -> {
                // no-op
            }
        }
    }
}

internal fun mapFromReaderEvent(event: ReaderEvent): String {
    return when (event) {
        ReaderEvent.CARD_INSERTED -> "cardInserted"
        ReaderEvent.CARD_REMOVED -> "cardRemoved"
    }
}

internal fun mapFromReaderDisplayMessage(message: ReaderDisplayMessage): String {
    return when (message) {
        ReaderDisplayMessage.CHECK_MOBILE_DEVICE -> "checkMobileDevice"
        ReaderDisplayMessage.INSERT_CARD -> "insertCard"
        ReaderDisplayMessage.INSERT_OR_SWIPE_CARD -> "insertOrSwipeCard"
        ReaderDisplayMessage.MULTIPLE_CONTACTLESS_CARDS_DETECTED -> "multipleContactlessCardsDetected"
        ReaderDisplayMessage.REMOVE_CARD -> "removeCard"
        ReaderDisplayMessage.RETRY_CARD -> "retryCard"
        ReaderDisplayMessage.SWIPE_CARD -> "swipeCard"
        ReaderDisplayMessage.TRY_ANOTHER_CARD -> "tryAnotherCard"
        ReaderDisplayMessage.TRY_ANOTHER_READ_METHOD -> "tryAnotherReadMethod"
        ReaderDisplayMessage.CARD_REMOVED_TOO_EARLY -> "cardRemovedTooEarly"
    }
}

internal fun mapFromCharge(reader: Charge): ReadableMap = nativeMapOf {
    putString("id", reader.id)
    putString("status", reader.status)
    putString("currency", reader.currency)
    putInt("amount", reader.amount.toInt())
    putString("description", reader.description)
    putString("authorizationCode", reader.authorizationCode)
    putMap("paymentMethodDetails", mapFromPaymentMethodDetails(reader.paymentMethodDetails))
}

internal fun mapFromLocation(location: Location?): ReadableMap? = location?.let {
    nativeMapOf {
        putString("id", it.id)
        putString("displayName", it.displayName)

        mapFromAddress(it.address)?.let {
            putMap("address", it)
        } ?: run {
            putNull("address")
        }

        it.livemode?.let {
            putBoolean("livemode", it)
        } ?: run {
            putNull("livemode")
        }
    }
}

internal fun mapFromAddress(address: Address?): ReadableMap? = address?.let {
    nativeMapOf {
        putString("country", it.country)
        putString("city", it.city)
        putString("postalCode", it.postalCode)
        putString("line1", it.line1)
        putString("line2", it.line2)
        putString("state", it.state)
    }
}

internal fun mapFromPaymentIntentStatus(status: PaymentIntentStatus?): String {
    return when (status) {
        PaymentIntentStatus.CANCELED -> "canceled"
        PaymentIntentStatus.REQUIRES_CAPTURE -> "requiresCapture"
        PaymentIntentStatus.REQUIRES_CONFIRMATION -> "requiresConfirmation"
        PaymentIntentStatus.REQUIRES_PAYMENT_METHOD -> "requiresPaymentMethod"
        PaymentIntentStatus.SUCCEEDED -> "succeeded"
        else -> "unknown"
    }
}

internal fun mapToLogLevel(status: String?): LogLevel {
    return when (status) {
        "error" -> LogLevel.ERROR
        "info" -> LogLevel.INFO
        "verbose" -> LogLevel.VERBOSE
        "warning" -> LogLevel.WARNING
        "none" -> LogLevel.NONE
        else -> LogLevel.NONE
    }
}

internal fun mapFromConnectionStatus(status: ConnectionStatus): String {
    return when (status) {
        ConnectionStatus.CONNECTED -> "connected"
        ConnectionStatus.NOT_CONNECTED -> "notConnected"
        ConnectionStatus.CONNECTING -> "connecting"
    }
}

internal fun mapFromPaymentStatus(status: PaymentStatus): String {
    return when (status) {
        PaymentStatus.NOT_READY -> "notReady"
        PaymentStatus.PROCESSING -> "processing"
        PaymentStatus.READY -> "ready"
        PaymentStatus.WAITING_FOR_INPUT -> "waitingForInput"
    }
}

internal fun mapFromSetupIntentStatus(status: SetupIntentStatus?): String {
    return when (status) {
        SetupIntentStatus.CANCELLED -> "canceled"
        SetupIntentStatus.REQUIRES_ACTION -> "requiresAction"
        SetupIntentStatus.REQUIRES_CONFIRMATION -> "requiresConfirmation"
        SetupIntentStatus.REQUIRES_PAYMENT_METHOD -> "requiresPaymentMethod"
        SetupIntentStatus.SUCCEEDED -> "succeeded"
        else -> "unknown"
    }
}

internal fun mapFromSimulateReaderUpdate(update: String): SimulateReaderUpdate {
    return when (update) {
        "available" -> SimulateReaderUpdate.UPDATE_AVAILABLE
        "none" -> SimulateReaderUpdate.NONE
        "random" -> SimulateReaderUpdate.RANDOM
        "required" -> SimulateReaderUpdate.REQUIRED
        "lowBattery" -> SimulateReaderUpdate.LOW_BATTERY
        "lowBatterySucceedConnect" -> SimulateReaderUpdate.LOW_BATTERY_SUCCEED_CONNECT
        else -> SimulateReaderUpdate.NONE
    }
}

private fun convertToUnixTimestamp(timestamp: Long): String = (timestamp * 1000).toString()

internal fun mapFromReaderSoftwareUpdate(update: ReaderSoftwareUpdate?): WritableMap? =
    update?.let {
        nativeMapOf {
            putString("deviceSoftwareVersion", it.version)
            putString(
                "estimatedUpdateTime",
                mapFromUpdateTimeEstimate(it.timeEstimate)
            )
            putString("requiredAt", it.requiredAt.time.toString())
        }
    }

internal fun mapFromUpdateTimeEstimate(time: ReaderSoftwareUpdate.UpdateTimeEstimate): String {
    return when (time) {
        ReaderSoftwareUpdate.UpdateTimeEstimate.FIVE_TO_FIFTEEN_MINUTES -> "estimate5To15Minutes"
        ReaderSoftwareUpdate.UpdateTimeEstimate.LESS_THAN_ONE_MINUTE -> "estimateLessThan1Minute"
        ReaderSoftwareUpdate.UpdateTimeEstimate.ONE_TO_TWO_MINUTES -> "estimate1To2Minutes"
        ReaderSoftwareUpdate.UpdateTimeEstimate.TWO_TO_FIVE_MINUTES -> "estimate2To5Minutes"
    }
}

internal fun mapToCartLineItems(cartLineItems: ReadableArray): List<CartLineItem> =
    cartLineItems.toArrayList().mapNotNull {
        (it as? HashMap<*, *>)?.let { item ->
            mapToCartLineItem(item)
        }
    }

internal fun mapToCartLineItem(cartLineItem: HashMap<*, *>): CartLineItem? {
    val displayName = cartLineItem["displayName"] as? String ?: return null
    val quantity = cartLineItem["quantity"] as? Double ?: return null
    val amount = cartLineItem["amount"] as? Double ?: return null

    return CartLineItem.Builder(displayName, quantity.toInt(), amount.toLong()).build()
}

internal fun mapFromRefund(refund: Refund): ReadableMap = nativeMapOf {
    putIntOrNull(this, "amount", refund.amount?.toInt())
    putString("balanceTransaction", refund.balanceTransaction)
    putString("chargeId", refund.chargeId)
    putIntOrNull(this, "created", refund.created?.toInt())
    putString("currency", refund.currency)
    putString("description", refund.description)
    putString("failureBalanceTransaction", refund.failureBalanceTransaction)
    putString("failureReason", refund.failureReason)
    putString("id", refund.id)
    putMap(
        "metadata",
        nativeMapOf {
            refund.metadata?.map {
                putString(it.key, it.value)
            }
        }
    )
    putString("paymentIntentId", refund.paymentIntentId)
    putMap("paymentMethodDetails", mapFromPaymentMethodDetails(refund.paymentMethodDetails))
    putString("reason", refund.reason)
    putString("receiptNumber", refund.receiptNumber)
    putString("sourceTransferReversal", refund.sourceTransferReversal)
    putString("status", refund.status)
    putString("transferReversal", refund.transferReversal)
}

internal fun mapFromCardDetails(cardDetails: CardDetails?): ReadableMap = nativeMapOf {
    putString("brand", cardDetails?.brand)
    putString("country", cardDetails?.country)
    putInt("expMonth", cardDetails?.expMonth ?: 0)
    putInt("expYear", cardDetails?.expYear ?: 0)
    putString("funding", cardDetails?.funding)
    putString("last4", cardDetails?.last4)
}

internal fun mapFromPaymentMethod(paymentMethod: PaymentMethod?): ReadableMap? =
    paymentMethod?.let {
        nativeMapOf {
            putMap(
                "cardPresentDetails",
                mapFromCardPresentDetails(it.cardPresentDetails)
            )
            putMap(
                "interacPresentDetails",
                mapFromCardPresentDetails(it.interacPresentDetails)
            )
            putString("customer", it.customer)
            putString("id", it.id)
            putMap(
                "metadata",
                nativeMapOf {
                    it.metadata?.map { entry ->
                        putString(entry.key, entry.value)
                    }
                }
            )
        }
    }

private fun <T> Iterable<T>.collectToWritableArray(transform: (T) -> ReadableMap?): ReadableArray =
    fold(nativeArrayOf()) { writableArray, item ->
        writableArray.pushMap(transform(item)); writableArray
    }

private fun mapFromPaymentMethodDetails(paymentMethodDetails: PaymentMethodDetails?): ReadableMap =
    nativeMapOf {
        putMap(
            "cardPresentDetails",
            mapFromCardPresentDetails(paymentMethodDetails?.cardPresentDetails)
        )
        putMap(
            "interacPresentDetails",
            mapFromCardPresentDetails(paymentMethodDetails?.interacPresentDetails)
        )
        putString("type", mapFromPaymentMethodDetailsType(paymentMethodDetails?.type))
    }

internal fun mapFromPaymentMethodDetailsType(type: PaymentMethodType?): String {
    return when (type) {
        PaymentMethodType.CARD -> "card"
        PaymentMethodType.CARD_PRESENT -> "cardPresent"
        PaymentMethodType.INTERAC_PRESENT -> "interacPresent"
        else -> "unknown"
    }
}

private fun mapFromCardPresentDetails(cardPresentDetails: CardPresentDetails?): ReadableMap? =
    cardPresentDetails?.let {
        nativeMapOf {
            putString("brand", it.brand)
            putString("cardholderName", it.cardholderName)
            putString("country", it.country)
            putString("emvAuthData", it.emvAuthData)
            putIntOrNull(this, "expMonth", it.expMonth)
            putIntOrNull(this, "expYear", it.expYear)
            putString("funding", it.funding)
            putString("generatedCard", it.generatedCard)
            putString("last4", it.last4)
            putString("readMethod", it.readMethod)
            putMap("receiptDetails", mapFromReceiptDetails(it.receiptDetails))
            putString("issuer", it.issuer)
            putString("iin", it.iin)
            putString("network", it.network)
            putString("description", it.description)
            putMap("wallet", mapFromWallet(it.wallet))
            putArray(
                "preferredLocales",
                convertListToReadableArray(it.preferredLocales)
            )
        }
    }

private fun mapFromOfflineDetails(offlineDetails: OfflineDetails?): ReadableMap? =
    offlineDetails?.let {
        nativeMapOf {
            putString("storedAt", offlineDetails.storedAt.toString())
            putBoolean("requiresUpload", offlineDetails.requiresUpload)
            putMap(
                "cardPresentDetails",
                mapFromOfflineCardPresentDetails(offlineDetails.cardPresentDetails)
            )
            putMap("amountDetails", mapFromAmountDetails(offlineDetails.amountDetails))
        }
    }

private fun mapFromAmountDetails(amountDetails: AmountDetails?): ReadableMap? =
    amountDetails?.let {
        nativeMapOf {
            putMap(
                "tip",
                nativeMapOf {
                    putIntOrNull(this, "amount", amountDetails.tip?.amount?.toInt())
                }
            )
        }
    }

private fun mapFromOfflineCardPresentDetails(offlineCardPresentDetails: OfflineCardPresentDetails?): ReadableMap? =
    offlineCardPresentDetails?.let {
        nativeMapOf {
            putString("brand", offlineCardPresentDetails.brand)
            putString("cardholderName", offlineCardPresentDetails.cardholderName)
            putIntOrNull(this, "expMonth", offlineCardPresentDetails.expMonth)
            putIntOrNull(this, "expYear", offlineCardPresentDetails.expYear)
            putString("last4", offlineCardPresentDetails.last4)
            putString("readMethod", offlineCardPresentDetails.readMethod)
            putMap(
                "receiptDetails",
                mapFromReceiptDetails(offlineCardPresentDetails.receiptDetails)
            )
        }
    }

internal fun mapFromWallet(wallet: Wallet?): ReadableMap =
    nativeMapOf {
        putString("type", wallet?.type)
    }

private fun convertListToReadableArray(list: List<String>?): ReadableArray? {
    return list?.let {
        WritableNativeArray().apply { for (item in list) { pushString(item) } }
    }
}

fun mapFromReceiptDetails(receiptDetails: ReceiptDetails?): ReadableMap =
    nativeMapOf {
        putString("accountType", receiptDetails?.accountType)
        putString("applicationCryptogram", receiptDetails?.applicationCryptogram)
        putString("applicationPreferredName", receiptDetails?.applicationPreferredName)
        putString("authorizationCode", receiptDetails?.authorizationCode)
        putString("authorizationResponseCode", receiptDetails?.authorizationResponseCode)
        putString("cvm", receiptDetails?.cvm)
        putString("dedicatedFileName", receiptDetails?.dedicatedFileName)
        putString("transactionStatusInformation", receiptDetails?.tsi)
        putString("terminalVerificationResult", receiptDetails?.tvr)
    }

internal fun mapFromNetworkStatus(status: NetworkStatus): String {
    return when (status) {
        NetworkStatus.ONLINE -> "online"
        NetworkStatus.OFFLINE -> "offline"
        NetworkStatus.UNKNOWN -> "unknown"
    }
}

fun mapFromOfflineStatus(offlineStatus: OfflineStatus): ReadableMap {
    val sdkMap = nativeMapOf {
        putString("networkStatus", mapFromNetworkStatus(offlineStatus.sdk.networkStatus))
        putInt("offlinePaymentsCount", offlineStatus.sdk.offlinePaymentsCount)

        val map = nativeMapOf {
            offlineStatus.sdk.offlinePaymentAmountsByCurrency.forEach {
                putInt(it.key, it.value.toInt())
            }
        }
        putMap("offlinePaymentAmountsByCurrency", map)
    }

    val readerMap = nativeMapOf {
        offlineStatus.reader?.also { reader ->
            putString("networkStatus", mapFromNetworkStatus(reader.networkStatus))
            putInt("offlinePaymentsCount", reader.offlinePaymentsCount)

            val map = nativeMapOf {
                reader.offlinePaymentAmountsByCurrency.forEach {
                    putInt(it.key, it.value.toInt())
                }
            }
            putMap("offlinePaymentAmountsByCurrency", map)
        }
    }

    return nativeMapOf {
        putMap("sdk", sdkMap)
        putMap("reader", readerMap)
    }
}

fun mapFromReaderDisconnectReason(reason: DisconnectReason): String {
    return when (reason) {
        DisconnectReason.DISCONNECT_REQUESTED -> "disconnectRequested"
        DisconnectReason.REBOOT_REQUESTED -> "rebootRequested"
        DisconnectReason.SECURITY_REBOOT -> "securityReboot"
        DisconnectReason.CRITICALLY_LOW_BATTERY -> "criticallyLowBattery"
        DisconnectReason.POWERED_OFF -> "poweredOff"
        DisconnectReason.BLUETOOTH_DISABLED -> "bluetoothDisabled"
        else -> { "unknown" }
    }
}

internal fun mapFromReaderSettings(settings: ReaderSettings): ReadableMap {
    return nativeMapOf {
        val ra = settings.readerAccessibility
        if (ra is ReaderAccessibility.Accessibility) {
            val accessibility = nativeMapOf {
                putString(
                    "textToSpeechStatus",
                    when (ra.textToSpeechStatus) {
                        ReaderTextToSpeechStatus.OFF -> "off"
                        ReaderTextToSpeechStatus.HEADPHONES -> "headphones"
                        ReaderTextToSpeechStatus.SPEAKERS -> "speakers"
                    }
                )
            }
            putMap("accessibility", accessibility)
        } else if (ra is ReaderAccessibility.Error) {
            putError(ra.error)
        }
    }
}

@OptIn(CollectInputs::class)
fun mapFromCollectInputsResults(results: List<CollectInputsResult>): ReadableArray {
    return nativeArrayOf {
        results.forEach {
            when (it) {
                is EmailResult -> pushMap(
                    nativeMapOf {
                        putBoolean("skipped", it.skipped)
                        putString("email", it.email)
                        putArray(
                            "toggles",
                            nativeArrayOf {
                                it.toggles.forEach { item ->
                                    pushString(mapFromToggleResult(item))
                                }
                            }
                        )
                    }
                )
                is NumericResult -> pushMap(
                    nativeMapOf {
                        putBoolean("skipped", it.skipped)
                        putString("numericString", it.numericString)
                        putArray(
                            "toggles",
                            nativeArrayOf {
                                it.toggles.forEach { item ->
                                    pushString(mapFromToggleResult(item))
                                }
                            }
                        )
                    }
                )
                is PhoneResult -> pushMap(
                    nativeMapOf {
                        putBoolean("skipped", it.skipped)
                        putString("phone", it.phone)
                        putArray(
                            "toggles",
                            nativeArrayOf {
                                it.toggles.forEach { item ->
                                    pushString(mapFromToggleResult(item))
                                }
                            }
                        )
                    }
                )
                is SelectionResult -> pushMap(
                    nativeMapOf {
                        putBoolean("skipped", it.skipped)
                        putString("selection", it.selection)
                        putArray(
                            "toggles",
                            nativeArrayOf {
                                it.toggles.forEach { item ->
                                    pushString(mapFromToggleResult(item))
                                }
                            }
                        )
                    }
                )
                is SignatureResult -> pushMap(
                    nativeMapOf {
                        putBoolean("skipped", it.skipped)
                        putString("signatureSvg", it.signatureSvg)
                        putArray(
                            "toggles",
                            nativeArrayOf {
                                it.toggles.forEach { item ->
                                    pushString(mapFromToggleResult(item))
                                }
                            }
                        )
                    }
                )
                is TextResult -> pushMap(
                    nativeMapOf {
                        putBoolean("skipped", it.skipped)
                        putString("text", it.text)
                        putArray(
                            "toggles",
                            nativeArrayOf {
                                it.toggles.forEach { item ->
                                    pushString(mapFromToggleResult(item))
                                }
                            }
                        )
                    }
                )
            }
        }
    }
}

@OptIn(CollectInputs::class)
fun mapFromToggleResult(toggleResult: ToggleResult): String {
    return when (toggleResult) {
        ToggleResult.ENABLED -> "enabled"
        ToggleResult.DISABLED -> "disabled"
        ToggleResult.SKIPPED -> "skipped"
        else -> { "unknown" }
    }
}

fun mapFromReaderSupportResult(readerSupportResult: ReaderSupportResult): ReadableMap {
    return nativeMapOf {
        putBoolean("readerSupportResult", readerSupportResult.isSupported)
    }
}

fun mapFromBatteryStatus(status: BatteryStatus): String {
    return when (status) {
        BatteryStatus.CRITICAL -> "CRITICAL"
        BatteryStatus.LOW -> "LOW"
        BatteryStatus.NOMINAL -> "NOMINAL"
        BatteryStatus.UNKNOWN -> "UNKNOWN"
        else -> { "UNKNOWN" }
    }
}

fun mapToTapZoneIndicator(indicator: String?): LocalMobileUxConfiguration.TapZoneIndicator {
    return when (indicator) {
        "default" -> LocalMobileUxConfiguration.TapZoneIndicator.DEFAULT
        "above" -> LocalMobileUxConfiguration.TapZoneIndicator.ABOVE
        "below" -> LocalMobileUxConfiguration.TapZoneIndicator.BELOW
        "front" -> LocalMobileUxConfiguration.TapZoneIndicator.FRONT
        "behind" -> LocalMobileUxConfiguration.TapZoneIndicator.BEHIND
        else -> LocalMobileUxConfiguration.TapZoneIndicator.DEFAULT
    }
}

fun mapToDarkMode(mode: String?): LocalMobileUxConfiguration.DarkMode {
    return when (mode) {
        "dark" -> LocalMobileUxConfiguration.DarkMode.DARK
        "light" -> LocalMobileUxConfiguration.DarkMode.LIGHT
        "system" -> LocalMobileUxConfiguration.DarkMode.SYSTEM
        else -> LocalMobileUxConfiguration.DarkMode.SYSTEM
    }
}

fun hexToArgb(color: String): Int {
    return try {
        val alpha = color.substring(0, 2).toInt(16)
        val red = color.substring(2, 4).toInt(16)
        val green = color.substring(4, 6).toInt(16)
        val blue = color.substring(6, 8).toInt(16)
        (alpha shl 24) or (red shl 16) or (green shl 8) or blue
    } catch (e: NumberFormatException) {
        throw IllegalArgumentException("Invalid ARGB hex format", e)
    }
}
