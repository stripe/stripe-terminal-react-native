package com.stripeterminalreactnative

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import java.util.Base64
import com.facebook.react.bridge.*
import com.stripe.stripeterminal.external.OfflineMode
import com.stripe.stripeterminal.external.Surcharging
import com.stripe.stripeterminal.external.models.*
import com.stripe.stripeterminal.external.models.ReaderInputOptions.ReaderInputOption
import com.stripe.stripeterminal.external.models.SimulatedCollectInputsResult.SimulatedCollectInputsResultSucceeded
import com.stripe.stripeterminal.external.models.SimulatedCollectInputsResult.SimulatedCollectInputsResultTimeout
import com.stripe.stripeterminal.log.LogLevel
import com.stripe.stripeterminal.external.models.SurchargeConsentCollection as NativeSurchargeConsentCollection

internal fun getInt(map: ReadableMap, key: String): Int? =
    if (map.hasKey(key)) map.getInt(key) else null

internal fun ReadableMap.getIntSafely(key: String): Int? {
    if (!hasKey(key)) return null

    val type = this.getType(key)
    return when (type) {
        ReadableType.Number -> getDouble(key).toInt()
        ReadableType.String -> getString(key)?.toIntOrNull()
        else -> null
    }
}

internal fun ReadableMap.getLongSafely(key: String): Long? {
    if (!hasKey(key)) return null

    val type = getType(key)
    return when (type) {
        ReadableType.Number -> getDouble(key).toLong()
        ReadableType.String -> getString(key)?.toLongOrNull()
        else -> null
    }
}

internal fun getBoolean(map: ReadableMap?, key: String): Boolean =
    if (map?.hasKey(key) == true) map.getBoolean(key) else false

internal fun getBoolean(map: ReadableMap?, key: String, defaultValue: Boolean): Boolean =
    if (map?.hasKey(key) == true) map.getBoolean(key) else defaultValue

/**
 * Converts a data URI or base64 string to a Bitmap
 * @param imageData The image data (can be data:image/... URI or base64 string)
 * @return Bitmap object or null if conversion fails
 */
internal fun mapToBitmap(imageData: String): Bitmap? {
    val imageBase64 = when {
        // Handle data URI
        imageData.startsWith("data:image/") -> {
            val components = imageData.split(",", limit = 2)
            if (components.size == 2) components[1] else null
        }
        // Try to decode as base64 string directly
        else -> imageData
    } ?: return null

    if (imageBase64.isEmpty()) return null

    return try {
        val imageBytes = Base64.getDecoder().decode(imageBase64)
        BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
    } catch (_: IllegalArgumentException) {
        null
    }
}

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
        DeviceType.CHIPPER_1X -> DeviceSerialName.CHIPPER_1X.serialName
        DeviceType.CHIPPER_2X -> DeviceSerialName.CHIPPER_2X.serialName
        DeviceType.ETNA -> DeviceSerialName.ETNA.serialName
        DeviceType.STRIPE_M2 -> DeviceSerialName.STRIPE_M2.serialName
        DeviceType.STRIPE_S700 -> DeviceSerialName.STRIPE_S700.serialName
        DeviceType.STRIPE_S700_DEVKIT -> DeviceSerialName.STRIPE_S700_DEVKIT.serialName
        DeviceType.STRIPE_S710 -> DeviceSerialName.STRIPE_S710.serialName
        DeviceType.STRIPE_S710_DEVKIT -> DeviceSerialName.STRIPE_S710_DEVKIT.serialName
        DeviceType.STRIPE_T600 -> DeviceSerialName.STRIPE_T600.serialName
        DeviceType.STRIPE_T610 -> DeviceSerialName.STRIPE_T610.serialName
        DeviceType.STRIPE_T600_DEVKIT -> DeviceSerialName.STRIPE_T600_DEVKIT.serialName
        DeviceType.STRIPE_T610_DEVKIT -> DeviceSerialName.STRIPE_T610_DEVKIT.serialName
        DeviceType.UNKNOWN -> DeviceSerialName.UNKNOWN.serialName
        DeviceType.VERIFONE_P400 -> DeviceSerialName.VERIFONE_P400.serialName
        DeviceType.WISECUBE -> DeviceSerialName.WISECUBE.serialName
        DeviceType.WISEPAD_3 -> DeviceSerialName.WISEPAD_3.serialName
        DeviceType.WISEPAD_3S -> DeviceSerialName.WISEPAD_3S.serialName
        DeviceType.WISEPOS_E -> DeviceSerialName.WISEPOS_E.serialName
        DeviceType.WISEPOS_E_DEVKIT -> DeviceSerialName.WISEPOS_E_DEVKIT.serialName
        DeviceType.TAP_TO_PAY_DEVICE -> DeviceSerialName.TAP_TO_PAY_DEVICE.serialName
        DeviceType.VERIFONE_V660P -> DeviceSerialName.VERIFONE_V660P.serialName
        DeviceType.VERIFONE_M425 -> DeviceSerialName.VERIFONE_M425.serialName
        DeviceType.VERIFONE_M450 -> DeviceSerialName.VERIFONE_M450.serialName
        DeviceType.VERIFONE_P630 -> DeviceSerialName.VERIFONE_P630.serialName
        DeviceType.VERIFONE_UX700 -> DeviceSerialName.VERIFONE_UX700.serialName
        DeviceType.VERIFONE_V660P_DEVKIT -> DeviceSerialName.VERIFONE_V660P_DEVKIT.serialName
        DeviceType.VERIFONE_UX700_DEVKIT -> DeviceSerialName.VERIFONE_UX700_DEVKIT.serialName

    }
}

internal fun mapToDeviceType(type: String): DeviceType? {
    val deviceSerialName = DeviceSerialName.fromSerialName(type)
    return when (deviceSerialName) {
        DeviceSerialName.CHIPPER_1X -> DeviceType.CHIPPER_1X
        DeviceSerialName.CHIPPER_2X -> DeviceType.CHIPPER_2X
        DeviceSerialName.ETNA -> DeviceType.ETNA
        DeviceSerialName.STRIPE_M2 -> DeviceType.STRIPE_M2
        DeviceSerialName.STRIPE_S700 -> DeviceType.STRIPE_S700
        DeviceSerialName.STRIPE_S700_DEVKIT -> DeviceType.STRIPE_S700_DEVKIT
        DeviceSerialName.STRIPE_S710 -> DeviceType.STRIPE_S710
        DeviceSerialName.STRIPE_S710_DEVKIT -> DeviceType.STRIPE_S710_DEVKIT
        DeviceSerialName.VERIFONE_P400 -> DeviceType.VERIFONE_P400
        DeviceSerialName.WISECUBE -> DeviceType.WISECUBE
        DeviceSerialName.WISEPAD_3 -> DeviceType.WISEPAD_3
        DeviceSerialName.WISEPAD_3S -> DeviceType.WISEPAD_3S
        DeviceSerialName.WISEPOS_E -> DeviceType.WISEPOS_E
        DeviceSerialName.WISEPOS_E_DEVKIT -> DeviceType.WISEPOS_E_DEVKIT
        DeviceSerialName.TAP_TO_PAY_DEVICE -> DeviceType.TAP_TO_PAY_DEVICE
        DeviceSerialName.VERIFONE_V660P -> DeviceType.VERIFONE_V660P
        DeviceSerialName.VERIFONE_V660P_DEVKIT -> DeviceType.VERIFONE_V660P_DEVKIT
        DeviceSerialName.VERIFONE_M425 -> DeviceType.VERIFONE_M425
        DeviceSerialName.VERIFONE_M450 -> DeviceType.VERIFONE_M450
        DeviceSerialName.VERIFONE_P630 -> DeviceType.VERIFONE_P630
        DeviceSerialName.VERIFONE_UX700 -> DeviceType.VERIFONE_UX700
        DeviceSerialName.VERIFONE_UX700_DEVKIT -> DeviceType.VERIFONE_UX700_DEVKIT
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
        "tapToPay" -> DiscoveryMethod.TAP_TO_PAY
        "handoff" -> DiscoveryMethod.HANDOFF
        "usb" -> DiscoveryMethod.USB
        else -> null
    }
}

internal fun mapToAllowRedisplay(method: String?): AllowRedisplay {
    return when (method) {
        "always" -> AllowRedisplay.ALWAYS
        "limited" -> AllowRedisplay.LIMITED
        else -> AllowRedisplay.UNSPECIFIED
    }
}

internal fun mapToSetupIntentCollectionReason(method: String?): AllowRedisplay {
    return when (method) {
        "always" -> AllowRedisplay.ALWAYS
        "limited" -> AllowRedisplay.LIMITED
        else -> AllowRedisplay.UNSPECIFIED
    }
}

@OptIn(OfflineMode::class)
internal fun mapFromPaymentIntent(paymentIntent: PaymentIntent, uuid: String): ReadableMap =
    nativeMapOf {
        putString("id", paymentIntent.id)
        putInt("amount", paymentIntent.amount.toInt())
        putString("captureMethod", paymentIntent.captureMethod)
        putArray("charges", mapFromChargesList(paymentIntent.getCharges()))
        putString("clientSecret", paymentIntent.clientSecret)
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
        putMap(
            "paymentMethodOptions",
            mapFromPaymentMethodOptions(paymentIntent.paymentMethodOptions)
        )
    }

internal fun mapFromPaymentMethodOptions(paymentMethodOptions: PaymentMethodOptions?): ReadableMap? =
    paymentMethodOptions?.let {
        nativeMapOf {
            putMap(
                "cardPresent",
                nativeMapOf {
                    putBoolean(
                        "requestExtendedAuthorization",
                        it.cardPresent?.requestExtendedAuthorization ?: false
                    )
                    putBoolean(
                        "requestIncrementalAuthorizationSupport",
                        it.cardPresent?.requestIncrementalAuthorizationSupport ?: false
                    )
                    putString(
                        "requestPartialAuthorization",
                        mapFromRequestPartialAuthorization(it.cardPresent?.requestPartialAuthorization)
                    )
                    putMap("surcharge",
                        nativeMapOf {
                            putString("status", it.cardPresent?.surcharge?.status)
                            putIntOrNull(
                                this,
                                "maximumAmount",
                                it.cardPresent?.surcharge?.maximumAmount?.toInt()
                            )
                        }
                    )
                }
            )
        }
    }

internal fun mapFromRequestPartialAuthorization(partialAuth: CardPresentRequestPartialAuthorization?): String {
    return partialAuth?.typeName.orEmpty()
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
            setupIntent.metadata.map {
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
        PaymentIntentStatus.REQUIRES_ACTION -> "requiresAction"
        PaymentIntentStatus.PROCESSING -> "processing"
        null -> "unknown"
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
        ConnectionStatus.DISCOVERING -> "discovering"
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

internal fun mapFromSimulatedCollectInputsBehavior(behavior: String?): SimulatedCollectInputsResult {
    return when (behavior) {
        "all" -> {
            SimulatedCollectInputsResultSucceeded(SimulatedCollectInputsSkipBehavior.ALL)
        }
        "none" -> {
            SimulatedCollectInputsResultSucceeded(SimulatedCollectInputsSkipBehavior.NONE)
        }
        "timeout" -> {
            SimulatedCollectInputsResultTimeout()
        }
        else -> {
            SimulatedCollectInputsResultSucceeded(SimulatedCollectInputsSkipBehavior.NONE)
        }
    }
}

private fun convertToUnixTimestamp(timestamp: Long): String = (timestamp * 1000).toString()

internal fun mapFromReaderSoftwareUpdate(update: ReaderSoftwareUpdate?): WritableMap? =
    update?.let {
        nativeMapOf {
            putString("deviceSoftwareVersion", it.version)
            putString(
                "estimatedUpdateTime",
                mapFromUpdateTimeEstimate(it.durationEstimate)
            )
            putString("requiredAt", it.requiredAtMs.toString())
        }
    }

internal fun mapFromUpdateTimeEstimate(time: ReaderSoftwareUpdate.UpdateDurationEstimate): String {
    return when (time) {
        ReaderSoftwareUpdate.UpdateDurationEstimate.FIVE_TO_FIFTEEN_MINUTES -> "estimate5To15Minutes"
        ReaderSoftwareUpdate.UpdateDurationEstimate.LESS_THAN_ONE_MINUTE -> "estimateLessThan1Minute"
        ReaderSoftwareUpdate.UpdateDurationEstimate.ONE_TO_TWO_MINUTES -> "estimate1To2Minutes"
        ReaderSoftwareUpdate.UpdateDurationEstimate.TWO_TO_FIVE_MINUTES -> "estimate2To5Minutes"
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
            putMap(
                "wechatPayDetails",
                mapFromWechatPayDetails(it.wechatPayDetails)
            )
            putMap(
                "affirmDetails",
                mapFromAffirmDetails(it.affirmDetails)
            )
            putMap(
                "paynowDetails",
                mapFromPaynowDetails(it.paynowDetails)
            )
            putMap(
                "paypayDetails",
                mapFromPaypayDetails(it.paypayDetails)
            )
            putString("customer", it.customer)
            putString("id", it.id)
            putString("type", mapFromPaymentMethodDetailsType(it.type))
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
        putMap(
            "wechatPayDetails",
            mapFromWechatPayDetails(paymentMethodDetails?.wechatPayDetails)
        )
        putMap(
            "affirmDetails",
            mapFromAffirmDetails(paymentMethodDetails?.affirmDetails)
        )
        putMap(
            "paynowDetails",
            mapFromPaynowDetails(paymentMethodDetails?.paynowDetails)
        )
        putMap(
            "paypayDetails",
            mapFromPaypayDetails(paymentMethodDetails?.paypayDetails)
        )
        if (paymentMethodDetails?.cardDetails != null) {
            putMap("cardDetails", mapFromCardDetails(paymentMethodDetails.cardDetails))
        }
        putString("type", mapFromPaymentMethodDetailsType(paymentMethodDetails?.type))
    }

internal fun mapFromPaymentMethodDetailsType(type: PaymentMethodType?): String {
    return when (type) {
        PaymentMethodType.CARD -> "card"
        PaymentMethodType.CARD_PRESENT -> "cardPresent"
        PaymentMethodType.INTERAC_PRESENT -> "interacPresent"
        PaymentMethodType.WECHAT_PAY -> "wechatPay"
        PaymentMethodType.AFFIRM -> "affirm"
        PaymentMethodType.PAYNOW -> "paynow"
        PaymentMethodType.PAYPAY -> "paypay"
        else -> "unknown"
    }
}

internal fun mapToSetupIntentParameters(params: ReadableMap): SetupIntentParameters {
    val builder = SetupIntentParameters.Builder().apply {
        params.getString("customer")?.let(::setCustomer)
        params.getString("description")?.let(::setDescription)
        params.getArray("paymentMethodTypes")?.let { list ->
            setPaymentMethodTypes(mapToPaymentMethodDetailsType(list))
        }
        params.getMap("metadata")?.let { map ->
            setMetadata(map.toHashMap() as? HashMap<String, String>)
        }
        params.getString("onBehalfOf")?.let(::setOnBehalfOf)
        params.getString("usage")?.let(::setUsage)
    }
    return builder.build()
}

internal fun mapToPaymentMethodDetailsType(array: ReadableArray): List<PaymentMethodType> {
    return array.toArrayList()
        .filterIsInstance<String>()
        .mapNotNull(::mapToPaymentMethodDetailsType)
}

internal fun mapToPaymentMethodDetailsType(type: String): PaymentMethodType? {
    return when (type) {
        "card" -> PaymentMethodType.CARD
        "cardPresent" -> PaymentMethodType.CARD_PRESENT
        "interacPresent" -> PaymentMethodType.INTERAC_PRESENT
        "wechatPay" -> PaymentMethodType.WECHAT_PAY
        "affirm" -> PaymentMethodType.AFFIRM
        "paynow" -> PaymentMethodType.PAYNOW
        "paypay" -> PaymentMethodType.PAYPAY
        else -> null
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
            putMap("receipt", mapFromReceiptDetails(it.receiptDetails))
            putString("issuer", it.issuer)
            putString("iin", it.iin)
            putString("network", it.network)
            putString("description", it.description)
            putMap("wallet", mapFromWallet(it.wallet))
            putArray(
                "preferredLocales",
                convertListToReadableArray(it.preferredLocales)
            )
            putString("location", it.location)
            putString("reader", it.reader)
        }
    }

private fun mapFromWechatPayDetails(wechatPayDetails: WechatPayDetails?): ReadableMap? =
    wechatPayDetails?.let {
        nativeMapOf {
            putString("location", it.location)
            putString("reader", it.reader)
            putString("transactionId", it.transactionId)
        }
    }

private fun mapFromAffirmDetails(affirmDetails: AffirmDetails?): ReadableMap? =
    affirmDetails?.let {
        nativeMapOf {
            putString("location", it.location)
            putString("reader", it.reader)
            putString("transactionId", it.transactionId)
        }
    }

private fun mapFromPaynowDetails(paynowDetails: PaynowDetails?): ReadableMap? =
    paynowDetails?.let {
        nativeMapOf {
            putString("location", it.location)
            putString("reader", it.reader)
            putString("reference", it.reference)
        }
    }

private fun mapFromPaypayDetails(paypayDetails: PaypayDetails?): ReadableMap? =
    paypayDetails?.let {
        nativeMapOf {
            putString("location", it.location)
            putString("reader", it.reader)
        }
    }

private fun mapFromOfflineDetails(offlineDetails: OfflineDetails?): ReadableMap? =
    offlineDetails?.let {
        nativeMapOf {
            putString("storedAtMs", offlineDetails.storedAtMs.toString())
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
        WritableNativeArray().apply {
            for (item in list) {
                pushString(item)
            }
        }
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
        DisconnectReason.USB_DISCONNECTED -> "usbDisconnected"
        DisconnectReason.IDLE_POWER_DOWN -> "idlePowerDown"
        else -> {
            "unknown"
        }
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

private fun CollectInputsResult.getFormType(): String {
    return when (this) {
        is EmailResult -> "email"
        is NumericResult -> "numeric"
        is PhoneResult -> "phone"
        is SelectionResult -> "selection"
        is SignatureResult -> "signature"
        is TextResult -> "text"
    }
}

fun mapFromCollectInputsResults(results: List<CollectInputsResult>): ReadableArray {
    return nativeArrayOf {
        results.forEach {
            when (it) {
                is EmailResult -> pushMap(
                    nativeMapOf {
                        putBoolean("skipped", it.skipped)
                        putString("email", it.email)
                        putString("formType", it.getFormType())
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
                        putString("formType", it.getFormType())
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
                        putString("formType", it.getFormType())
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
                        putString("selectionId", it.selectionId)
                        putString("formType", it.getFormType())
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
                        putString("formType", it.getFormType())
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
                        putString("formType", it.getFormType())
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

fun mapFromToggleResult(toggleResult: ToggleResult): String {
    return when (toggleResult) {
        ToggleResult.ENABLED -> "enabled"
        ToggleResult.DISABLED -> "disabled"
        ToggleResult.SKIPPED -> "skipped"
        else -> {
            "unknown"
        }
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
        else -> {
            "UNKNOWN"
        }
    }
}

fun mapFromCollectedData(collectData: CollectedData): ReadableMap {
    return nativeMapOf {
        putString("stripeId", collectData.id)
        putString("nfcUid", collectData.nfcUid)
        putString("created", convertToUnixTimestamp(collectData.created))
        putBoolean("livemode", collectData.livemode)
    }
}

fun mapFromCollectDataType(type: String): CollectDataType? {
    return when (type) {
        "magstripe" -> CollectDataType.MAGSTRIPE
        "nfcUid" -> CollectDataType.NFC_UID
        else -> null
    }
}

fun mapToTapZoneIndicator(indicator: String?): TapToPayUxConfiguration.TapZoneIndicator {
    return when (indicator) {
        "default" -> TapToPayUxConfiguration.TapZoneIndicator.DEFAULT
        "above" -> TapToPayUxConfiguration.TapZoneIndicator.ABOVE
        "below" -> TapToPayUxConfiguration.TapZoneIndicator.BELOW
        "front" -> TapToPayUxConfiguration.TapZoneIndicator.FRONT
        "behind" -> TapToPayUxConfiguration.TapZoneIndicator.BEHIND
        else -> TapToPayUxConfiguration.TapZoneIndicator.DEFAULT
    }
}

fun mapToDarkMode(mode: String?): TapToPayUxConfiguration.DarkMode {
    return when (mode) {
        "dark" -> TapToPayUxConfiguration.DarkMode.DARK
        "light" -> TapToPayUxConfiguration.DarkMode.LIGHT
        "system" -> TapToPayUxConfiguration.DarkMode.SYSTEM
        else -> TapToPayUxConfiguration.DarkMode.LIGHT
    }
}

fun hexToArgb(color: String): Int {
    return try {
        Color.parseColor(color)
    } catch (e: IllegalArgumentException) {
        throw IllegalArgumentException("Invalid ARGB hex format", e)
    }
}


@OptIn(Surcharging::class)
fun mapToSurchargeConfiguration(surchargeMap: ReadableMap): SurchargeConfiguration? {
    if (surchargeMap.hasKey("amount").not()) return null

    val consent = surchargeMap.getMap("consent")?.let { consentMap ->
        val surchargeConsentCollection =
            consentMap.getString("collection")?.let { SurchargeConsentCollection.fromCollection(it) }
        val collection = when (surchargeConsentCollection) {
            SurchargeConsentCollection.DISABLED -> NativeSurchargeConsentCollection.DISABLED
            SurchargeConsentCollection.ENABLED -> NativeSurchargeConsentCollection.ENABLED
            null -> NativeSurchargeConsentCollection.DISABLED
        }
        val consentBuilder = SurchargeConsent.Builder(collection)

        val notice = consentMap.getString("notice") ?: ""
        consentBuilder.setNotice(notice)
            .build()
    } ?: SurchargeConsent.Builder().build()

    val amount = surchargeMap.getLongSafely("amount") ?: 0L
    return SurchargeConfiguration.Builder(amount)
        .setConsent(consent)
        .build()
}
