package com.stripeterminalreactnative

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeArray
import com.stripe.stripeterminal.external.InternalApi
import com.stripe.stripeterminal.external.Surcharging
import com.stripe.stripeterminal.external.models.Address
import com.stripe.stripeterminal.external.models.AffirmDetails
import com.stripe.stripeterminal.external.models.AllowRedisplay
import com.stripe.stripeterminal.external.models.AmountDetails
import com.stripe.stripeterminal.external.models.BatteryStatus
import com.stripe.stripeterminal.external.models.CardDetails
import com.stripe.stripeterminal.external.models.CardPresentDetails
import com.stripe.stripeterminal.external.models.CardPresentRequestPartialAuthorization
import com.stripe.stripeterminal.external.models.CartLineItem
import com.stripe.stripeterminal.external.models.Charge
import com.stripe.stripeterminal.external.models.CollectDataType
import com.stripe.stripeterminal.external.models.CollectInputsResult
import com.stripe.stripeterminal.external.models.CollectPaymentIntentConfiguration
import com.stripe.stripeterminal.external.models.CollectSetupIntentConfiguration
import com.stripe.stripeterminal.external.models.CollectedData
import com.stripe.stripeterminal.external.models.ConfirmPaymentIntentConfiguration
import com.stripe.stripeterminal.external.models.ConnectionConfiguration
import com.stripe.stripeterminal.external.models.CollectSetupIntentConfiguration.CollectionReason
import com.stripe.stripeterminal.external.models.ConnectionStatus
import com.stripe.stripeterminal.external.models.CustomerCancellation
import com.stripe.stripeterminal.external.models.DeviceType
import com.stripe.stripeterminal.external.models.DisconnectReason
import com.stripe.stripeterminal.external.models.DiscoveryConfiguration
import com.stripe.stripeterminal.external.models.DiscoveryFilter
import com.stripe.stripeterminal.external.models.EasyConnectConfiguration
import com.stripe.stripeterminal.external.models.EasyConnectConfiguration.*
import com.stripe.stripeterminal.external.models.EmailResult
import com.stripe.stripeterminal.external.models.GeneratedFrom
import com.stripe.stripeterminal.external.models.KlarnaDetails
import com.stripe.stripeterminal.external.models.Location
import com.stripe.stripeterminal.external.models.LocationStatus
import com.stripe.stripeterminal.external.models.MotoConfiguration
import com.stripe.stripeterminal.external.models.NetworkStatus
import com.stripe.stripeterminal.external.models.NextAction
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
import com.stripe.stripeterminal.external.models.PaynowDetails
import com.stripe.stripeterminal.external.models.PaypayDetails
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
import com.stripe.stripeterminal.external.models.RedirectUrl
import com.stripe.stripeterminal.external.models.Refund
import com.stripe.stripeterminal.external.models.SelectionResult
import com.stripe.stripeterminal.external.models.SetupAttempt
import com.stripe.stripeterminal.external.models.SetupAttemptStatus
import com.stripe.stripeterminal.external.models.SetupIntent
import com.stripe.stripeterminal.external.models.SetupIntentCancellationReason
import com.stripe.stripeterminal.external.models.SetupIntentCardPresentDetails
import com.stripe.stripeterminal.external.models.SetupIntentNextAction
import com.stripe.stripeterminal.external.models.SetupIntentOfflineDetails
import com.stripe.stripeterminal.external.models.SetupIntentParameters
import com.stripe.stripeterminal.external.models.SetupIntentPaymentMethodDetails
import com.stripe.stripeterminal.external.models.SetupIntentStatus
import com.stripe.stripeterminal.external.models.SetupIntentUsage
import com.stripe.stripeterminal.external.models.SignatureResult
import com.stripe.stripeterminal.external.models.SimulateReaderUpdate
import com.stripe.stripeterminal.external.models.SimulatedCollectInputsResult
import com.stripe.stripeterminal.external.models.SimulatedCollectInputsResult.SimulatedCollectInputsResultSucceeded
import com.stripe.stripeterminal.external.models.SimulatedCollectInputsResult.SimulatedCollectInputsResultTimeout
import com.stripe.stripeterminal.external.models.SimulatedCollectInputsSkipBehavior
import com.stripe.stripeterminal.external.models.SurchargeConfiguration
import com.stripe.stripeterminal.external.models.SurchargeConsent
import com.stripe.stripeterminal.external.models.TapToPayUxConfiguration
import com.stripe.stripeterminal.external.models.TextResult
import com.stripe.stripeterminal.external.models.TippingConfiguration
import com.stripe.stripeterminal.external.models.ToggleResult
import com.stripe.stripeterminal.external.models.UseStripeSdk
import com.stripe.stripeterminal.external.models.Wallet
import com.stripe.stripeterminal.external.models.WechatPayDetails
import com.stripe.stripeterminal.external.models.WechatPayDisplayQrCode
import com.stripe.stripeterminal.external.models.PaymentOption
import com.stripe.stripeterminal.external.models.QrCodeDisplayData
import com.stripe.stripeterminal.log.LogLevel
import java.util.Base64
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

internal fun ReadableMap.getDoubleSafely(key: String): Double? {
    if (!hasKey(key)) return null

    val type = this.getType(key)
    return when (type) {
        ReadableType.Number -> getDouble(key)
        ReadableType.String -> getString(key)?.toDoubleOrNull()
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
    reader.livemode?.let { livemode ->
        putBoolean("livemode", livemode)
    }
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
        DeviceType.WISECUBE -> DeviceSerialName.WISECUBE.serialName
        DeviceType.WISEPAD_3 -> DeviceSerialName.WISEPAD_3.serialName
        DeviceType.WISEPAD_3S -> DeviceSerialName.WISEPAD_3S.serialName
        DeviceType.WISEPOS_E -> DeviceSerialName.WISEPOS_E.serialName
        DeviceType.WISEPOS_E_DEVKIT -> DeviceSerialName.WISEPOS_E_DEVKIT.serialName
        DeviceType.TAP_TO_PAY_DEVICE -> DeviceSerialName.TAP_TO_PAY_DEVICE.serialName
        DeviceType.VERIFONE_V660P -> DeviceSerialName.VERIFONE_V660P.serialName
        DeviceType.VERIFONE_V660PA -> DeviceSerialName.VERIFONE_V660PA.serialName
        DeviceType.VERIFONE_M425 -> DeviceSerialName.VERIFONE_M425.serialName
        DeviceType.VERIFONE_M450 -> DeviceSerialName.VERIFONE_M450.serialName
        DeviceType.VERIFONE_P630 -> DeviceSerialName.VERIFONE_P630.serialName
        DeviceType.VERIFONE_UX700 -> DeviceSerialName.VERIFONE_UX700.serialName
        DeviceType.VERIFONE_V660P_DEVKIT -> DeviceSerialName.VERIFONE_V660P_DEVKIT.serialName
        DeviceType.VERIFONE_UX700_DEVKIT -> DeviceSerialName.VERIFONE_UX700_DEVKIT.serialName
        DeviceType.VERIFONE_VM100 -> DeviceSerialName.VERIFONE_VM100.serialName
        DeviceType.VERIFONE_VM110 -> DeviceSerialName.VERIFONE_VM110.serialName
        DeviceType.VERIFONE_VP100 -> DeviceSerialName.VERIFONE_VP100.serialName
        DeviceType.VERIFONE_VP110 -> DeviceSerialName.VERIFONE_VP110.serialName
        DeviceType.VERIFONE_VL110 -> DeviceSerialName.VERIFONE_VL110.serialName
        DeviceType.STRIPE_U200 -> DeviceSerialName.STRIPE_U200.serialName
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
        DeviceSerialName.WISECUBE -> DeviceType.WISECUBE
        DeviceSerialName.WISEPAD_3 -> DeviceType.WISEPAD_3
        DeviceSerialName.WISEPAD_3S -> DeviceType.WISEPAD_3S
        DeviceSerialName.WISEPOS_E -> DeviceType.WISEPOS_E
        DeviceSerialName.WISEPOS_E_DEVKIT -> DeviceType.WISEPOS_E_DEVKIT
        DeviceSerialName.TAP_TO_PAY_DEVICE -> DeviceType.TAP_TO_PAY_DEVICE
        DeviceSerialName.VERIFONE_V660P -> DeviceType.VERIFONE_V660P
        DeviceSerialName.VERIFONE_V660P_DEVKIT -> DeviceType.VERIFONE_V660P_DEVKIT
        DeviceSerialName.VERIFONE_V660PA -> DeviceType.VERIFONE_V660PA
        DeviceSerialName.VERIFONE_M425 -> DeviceType.VERIFONE_M425
        DeviceSerialName.VERIFONE_M450 -> DeviceType.VERIFONE_M450
        DeviceSerialName.VERIFONE_P630 -> DeviceType.VERIFONE_P630
        DeviceSerialName.VERIFONE_UX700 -> DeviceType.VERIFONE_UX700
        DeviceSerialName.VERIFONE_UX700_DEVKIT -> DeviceType.VERIFONE_UX700_DEVKIT
        DeviceSerialName.VERIFONE_VM100 -> DeviceType.VERIFONE_VM100
        DeviceSerialName.VERIFONE_VM110 -> DeviceType.VERIFONE_VM110
        DeviceSerialName.VERIFONE_VP100 -> DeviceType.VERIFONE_VP100
        DeviceSerialName.VERIFONE_VP110 -> DeviceType.VERIFONE_VP110
        DeviceSerialName.VERIFONE_VL110 -> DeviceType.VERIFONE_VL110
        DeviceSerialName.STRIPE_U200 -> DeviceType.STRIPE_U200
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
        "appsOnDevices" -> DiscoveryMethod.APPS_ON_DEVICES
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

internal fun mapToCustomerCancellation(cancellation: String?): CustomerCancellation? {
    return when (cancellation) {
        "enableIfAvailable" -> CustomerCancellation.ENABLE_IF_AVAILABLE
        "disableIfAvailable" -> CustomerCancellation.DISABLE_IF_AVAILABLE
        else -> null
    }
}

@OptIn(InternalApi::class)
internal fun mapToMotoConfiguration(configurationMap: ReadableMap?): MotoConfiguration? {
    return if (configurationMap != null) {
        MotoConfiguration.Builder().apply {
            if (configurationMap.hasKey("skipCvc")) {
                setSkipCvc(configurationMap.getBoolean("skipCvc"))
            }
        }.build()
    } else {
        null
    }
}

@OptIn(InternalApi::class)
internal fun mapToSetupIntentCollectionReason(reason: String?): CollectSetupIntentConfiguration.CollectionReason? {
    return when (reason) {
        "saveCard" -> CollectSetupIntentConfiguration.CollectionReason.SAVE_CARD
        "verify" -> CollectSetupIntentConfiguration.CollectionReason.VERIFY
        else -> null
    }
}

internal fun mapFromPaymentIntent(paymentIntent: PaymentIntent, uuid: String): ReadableMap =
    nativeMapOf {
        putString("id", paymentIntent.id)
        putInt("amount", paymentIntent.amount.toInt())
        putInt("amountCapturable", paymentIntent.amountCapturable.toInt())
        putMap("amountDetails", mapFromAmountDetails(paymentIntent.amountDetails))
        putInt("amountReceived", paymentIntent.amountReceived.toInt())
        paymentIntent.amountRequested?.toInt()?.let { amountRequested ->
            putInt("amountRequested", amountRequested)
        }
        putInt("amountTip", paymentIntent.amountTip?.toInt() ?: 0)
        putInt("applicationFeeAmount", paymentIntent.applicationFeeAmount.toInt())
        putString("canceledAt", convertToUnixTimestamp(paymentIntent.canceledAt))
        putString("cancellationReason", paymentIntent.cancellationReason)
        putString("captureMethod", paymentIntent.captureMethod)
        putArray("charges", mapFromChargesList(paymentIntent.getCharges()))
        putString("clientSecret", paymentIntent.clientSecret)
        putString("confirmationMethod", paymentIntent.confirmationMethod)
        putString("created", convertToUnixTimestamp(paymentIntent.created))
        putString("currency", paymentIntent.currency)
        putString("customer", paymentIntent.customer)
        putString("description", paymentIntent.description)
        paymentIntent.lastPaymentError?.let {
            putMap("lastPaymentError", mapFromApiError(it))
        }
        putBoolean("livemode", paymentIntent.livemode)
        putMap(
            "metadata",
            nativeMapOf {
                paymentIntent.metadata?.map {
                    putString(it.key, it.value)
                }
            }
        )
        putMap("nextAction", mapFromNextAction(paymentIntent.nextAction))
        putMap("offlineDetails", mapFromOfflineDetails(paymentIntent.offlineDetails))
        putString("onBehalfOf", paymentIntent.onBehalfOf)
        putMap("paymentMethod", paymentIntent.paymentMethod?.let { mapFromPaymentMethod(it) })
        putString("paymentMethodId", paymentIntent.paymentMethodId)
        putMap(
            "paymentMethodOptions",
            mapFromPaymentMethodOptions(paymentIntent.paymentMethodOptions)
        )
        putString("receiptEmail", paymentIntent.receiptEmail)
        putString("sdkUuid", uuid)
        putString("setupFutureUsage", paymentIntent.setupFutureUsage)
        putString("statementDescriptor", paymentIntent.statementDescriptor)
        putString("statementDescriptorSuffix", paymentIntent.statementDescriptorSuffix)
        putString("status", mapFromPaymentIntentStatus(paymentIntent.status))
        putString("transferGroup", paymentIntent.transferGroup)
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
                    putMap(
                        "surcharge",
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
    putString("id", setupIntent.id)
    putString("sdkUuid", uuid)
    putString("application", setupIntent.applicationId)
    putString(
        "cancellationReason",
        mapFromSetupIntentCancellationReason(setupIntent.cancellationReason)
    )
    putString("clientSecret", setupIntent.clientSecret)
    putString("created", convertToUnixTimestamp(setupIntent.created))
    putString("customer", setupIntent.customerId)
    putString("description", setupIntent.description)
    putMap("latestAttempt", mapFromSetupAttempt(setupIntent.latestAttempt))
    putBoolean("livemode", setupIntent.isLiveMode)
    putString("mandate", setupIntent.mandateId)
    putMap(
        "metadata",
        nativeMapOf {
            setupIntent.metadata.map {
                putString(it.key, it.value)
            }
        }
    )
    putMap("nextAction", mapFromSetupIntentNextAction(setupIntent.nextAction))
    putMap("offlineDetails", mapFromSetupIntentOfflineDetails(setupIntent.offlineDetails))
    putString("onBehalfOf", setupIntent.onBehalfOfId)
    putMap("paymentMethod", mapFromPaymentMethod(setupIntent.paymentMethod))
    putString("paymentMethodId", setupIntent.paymentMethodId)
    putMap("paymentMethodOptions", mapFromPaymentMethodOptions(setupIntent.paymentMethodOptions))
    putArray("paymentMethodTypes", convertListToReadableArray(setupIntent.paymentMethodTypes))
    putString("singleUseMandate", setupIntent.singleUseMandateId)
    putString("status", mapFromSetupIntentStatus(setupIntent.status))
    putString("usage", mapFromSetupIntentUsage(setupIntent.usage))
    setupIntent.lastSetupError?.let {
        putMap("lastSetupError", mapFromApiError(it))
    }
}

internal fun mapFromSetupIntentNextAction(nextAction: SetupIntentNextAction?): ReadableMap? {
    if (nextAction == null) return null
    return nativeMapOf {
        putString("type", nextAction.type)
        putMap("redirectToUrl", mapFromRedirectToUrl(nextAction.redirectToUrl))
    }
}

internal fun mapFromSetupIntentCancellationReason(reason: SetupIntentCancellationReason?): String? {
    if (reason == null) return null
    return when (reason) {
        SetupIntentCancellationReason.DUPLICATE -> "duplicate"
        SetupIntentCancellationReason.REQUESTED_BY_CUSTOMER -> "requestedByCustomer"
        SetupIntentCancellationReason.ABANDONED -> "abandoned"
    }
}

internal fun mapFromSetupAttempt(attempt: SetupAttempt?): ReadableMap? = attempt?.let {
    nativeMapOf {
        putString("id", it.id)
        putString("applicationId", it.applicationId)
        putString("created", convertToUnixTimestamp(it.created))
        putString("customer", it.customerId)
        putBoolean("livemode", it.isLiveMode)
        putString("onBehalfOfId", it.onBehalfOfId)
        putMap(
            "paymentMethodDetails",
            mapFromSetupIntentPaymentMethodDetails(it.paymentMethodDetails)
        )
        putString("paymentMethodId", it.paymentMethodId)
        putString("setupIntentId", it.setupIntentId)
        putString("status", mapFromSetupAttemptStatus(it.status))
        putString("usage", mapFromSetupIntentUsage(it.usage))
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

internal fun mapFromCharge(charge: Charge): ReadableMap = nativeMapOf {
    putString("id", charge.id)
    putInt("amount", charge.amount.toInt())
    putInt("amountRefunded", charge.amountRefunded.toInt())
    putString("applicationFee", charge.applicationFee)
    putInt("applicationFeeAmount", charge.applicationFeeAmount.toInt())
    putString("authorizationCode", charge.authorizationCode)
    putString("balanceTransaction", charge.balanceTransaction)
    putBoolean("captured", charge.captured)
    putString("calculatedStatementDescriptor", charge.calculatedStatementDescriptor)
    putString("created", convertToUnixTimestamp(charge.created))
    putString("currency", charge.currency)
    putString("customer", charge.customer)
    putString("description", charge.description)
    putBoolean("livemode", charge.livemode)
    putMap(
        "metadata",
        nativeMapOf {
            charge.metadata?.map {
                putString(it.key, it.value)
            }
        }
    )
    putString("onBehalfOf", charge.onBehalfOf)
    putBoolean("paid", charge.paid)
    putString("paymentIntentId", charge.paymentIntentId)
    putMap("paymentMethodDetails", mapFromPaymentMethodDetails(charge.paymentMethodDetails))
    putString("receiptEmail", charge.receiptEmail)
    putString("receiptNumber", charge.receiptNumber)
    putString("receiptUrl", charge.receiptUrl)
    putBoolean("refunded", charge.refunded)
    putString("statementDescriptorSuffix", charge.statementDescriptorSuffix)
    putString("status", charge.status)
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
        PaymentIntentStatus.REQUIRES_REAUTHORIZATION -> "requiresReauthorization"
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
        ConnectionStatus.RECONNECTING -> "reconnecting"
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
        "requiredForOffline" -> SimulateReaderUpdate.REQUIRED_FOR_OFFLINE
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
    putString("id", refund.id)
    putIntOrNull(this, "amount", refund.amount?.toInt())
    putString("balanceTransaction", refund.balanceTransaction)
    putString("chargeId", refund.chargeId)
    refund.created?.let { created ->
        putString("created", convertToUnixTimestamp(created))
    }
    putString("currency", refund.currency)
    putString("description", refund.description)
    putString("failureBalanceTransaction", refund.failureBalanceTransaction)
    putString("failureReason", refund.failureReason)
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
    putMap("generatedFrom", mapFromGeneratedFrom(cardDetails?.generatedFrom))
    putString("last4", cardDetails?.last4)
}

internal fun mapFromGeneratedFrom(generatedFrom: GeneratedFrom?): ReadableMap? {
    return if (generatedFrom == null) {
        null
    } else {
        nativeMapOf {
            putString("charge", generatedFrom.charge)
            putMap(
                "paymentMethodDetails",
                mapFromPaymentMethodDetails(generatedFrom.paymentMethodDetails)
            )
            putString("setupAttempt", generatedFrom.setupAttempt)
        }
    }
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
            putMap(
                "klarnaDetails",
                mapFromKlarnaDetails(it.klarnaDetails)
            )
            putMap("cardDetails", mapFromCardDetails(it.cardDetails))
            putString("customer", it.customer)
            putString("id", it.id)
            putString("type", mapFromPaymentMethodDetailsType(it.type))
            putBoolean("livemode", it.livemode)
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

private fun mapFromPaymentMethodDetails(paymentMethodDetails: PaymentMethodDetails?): ReadableMap? {
    return if (paymentMethodDetails == null) {
        return null
    } else {
        nativeMapOf {
            putMap(
                "cardPresentDetails",
                mapFromCardPresentDetails(paymentMethodDetails.cardPresentDetails)
            )
            putMap(
                "interacPresentDetails",
                mapFromCardPresentDetails(paymentMethodDetails.interacPresentDetails)
            )
            putMap(
                "wechatPayDetails",
                mapFromWechatPayDetails(paymentMethodDetails.wechatPayDetails)
            )
            putMap(
                "affirmDetails",
                mapFromAffirmDetails(paymentMethodDetails.affirmDetails)
            )
            putMap(
                "paynowDetails",
                mapFromPaynowDetails(paymentMethodDetails.paynowDetails)
            )
            putMap(
                "paypayDetails",
                mapFromPaypayDetails(paymentMethodDetails.paypayDetails)
            )
            putMap(
                "klarnaDetails",
                mapFromKlarnaDetails(paymentMethodDetails.klarnaDetails)
            )
            if (paymentMethodDetails.cardDetails != null) {
                putMap("cardDetails", mapFromCardDetails(paymentMethodDetails.cardDetails))
            }
            putString("type", mapFromPaymentMethodDetailsType(paymentMethodDetails.type))
        }
    }
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
        PaymentMethodType.KLARNA -> "klarna"
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
        "klarna" -> PaymentMethodType.KLARNA
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

private fun mapFromKlarnaDetails(klarnaDetails: KlarnaDetails?): ReadableMap? =
    klarnaDetails?.let {
        nativeMapOf {
            putString("location", it.location)
            putString("reader", it.reader)
        }
    }

private fun mapFromSetupIntentOfflineDetails(offlineDetails: SetupIntentOfflineDetails?): ReadableMap? =
    offlineDetails?.let {
        nativeMapOf {
            putString("storedAtMs", offlineDetails.storedAtMs.toString())
            putBoolean("requiresUpload", offlineDetails.requiresUpload)
            putMap(
                "cardPresentDetails",
                mapFromOfflineCardPresentDetails(offlineDetails.cardPresentDetails)
            )
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

internal fun getEasyConnectConfiguration(
    discoveryConfiguration: DiscoveryConfiguration,
    connectionConfiguration: ConnectionConfiguration
): EasyConnectConfiguration {
    return when (discoveryConfiguration) {
        is DiscoveryConfiguration.InternetDiscoveryConfiguration -> {
            require(connectionConfiguration is ConnectionConfiguration.InternetConnectionConfiguration) {
                "Internet discovery requires Internet connection configuration"
            }
            InternetEasyConnectConfiguration(discoveryConfiguration, connectionConfiguration)
        }

        is DiscoveryConfiguration.TapToPayDiscoveryConfiguration -> {
            require(connectionConfiguration is ConnectionConfiguration.TapToPayConnectionConfiguration) {
                "TapToPay discovery requires TapToPay connection configuration"
            }
            TapToPayEasyConnectConfiguration(discoveryConfiguration, connectionConfiguration)
        }

        is DiscoveryConfiguration.AppsOnDevicesDiscoveryConfiguration -> {
            require(connectionConfiguration is ConnectionConfiguration.AppsOnDevicesConnectionConfiguration) {
                "AppsOnDevices discovery requires AppsOnDevices connection configuration"
            }
            AppsOnDevicesEasyConnectionConfiguration(discoveryConfiguration, connectionConfiguration)
        }
        else -> {
            throw IllegalArgumentException("Easy connect is not supported for ${discoveryConfiguration::class.simpleName}")
        }
    }
}

internal fun getDiscoveryConfiguration(
    discoveryMethod: DiscoveryMethod,
    params: ReadableMap,
): DiscoveryConfiguration {
    val locationId = params.getString("locationId")
    val timeout = getInt(params, "timeout") ?: 0
    val simulated = getBoolean(params, "simulated")
    val discoveryFilter =
        mapToDiscoveryFilter(params.getMap("discoveryFilter")) ?: DiscoveryFilter.None

    return when (discoveryMethod) {
        DiscoveryMethod.BLUETOOTH_SCAN -> DiscoveryConfiguration.BluetoothDiscoveryConfiguration(
            timeout = timeout,
            isSimulated = simulated
        )

        DiscoveryMethod.INTERNET -> DiscoveryConfiguration.InternetDiscoveryConfiguration(
            timeout = timeout,
            isSimulated = simulated,
            location = locationId,
            discoveryFilter = discoveryFilter
        )

        DiscoveryMethod.USB -> DiscoveryConfiguration.UsbDiscoveryConfiguration(
            timeout = timeout,
            isSimulated = simulated
        )

        DiscoveryMethod.APPS_ON_DEVICES -> DiscoveryConfiguration.AppsOnDevicesDiscoveryConfiguration()
        DiscoveryMethod.TAP_TO_PAY -> DiscoveryConfiguration.TapToPayDiscoveryConfiguration(
            isSimulated = simulated
        )
    }
}

internal fun mapToDiscoveryFilter(params: ReadableMap?): DiscoveryFilter? {
    return params?.let {
        if (it.hasKey("readerId")) {
            DiscoveryFilter.ByReaderId(it.getString("readerId")?: "")
        } else  if (it.hasKey("serialNumber")) {
            DiscoveryFilter.BySerial(it.getString("serialNumber")?: "")
        } else {
            DiscoveryFilter.None
        }
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
            putMap(
                "donation",
                nativeMapOf {
                    putIntOrNull(this, "amount", amountDetails.donation?.amount?.toInt())
                }
            )
            putMap(
                "surcharge",
                nativeMapOf {
                    putIntOrNull(this, "amount", amountDetails.surcharge?.amount?.toInt())
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

internal fun convertListToReadableArray(list: List<String>?): ReadableArray? {
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

internal fun mapFromNextAction(nextAction: NextAction?): ReadableMap? {
    if (nextAction == null) return null
    return nativeMapOf {
        putString("type", nextAction.type)
        putMap("useStripeSdk", mapFromUseStripeSdk(nextAction.useStripeSdk))
        putMap("redirectToUrl", mapFromRedirectToUrl(nextAction.redirectToUrl))
        putMap(
            "wechatPayDisplayQrCode",
            mapFromWechatPayDisplayQrCode(nextAction.wechatPayDisplayQrCode)
        )
    }
}

internal fun mapFromRedirectToUrl(redirectUrl: RedirectUrl?): ReadableMap? {
    if (redirectUrl == null) return null
    return nativeMapOf {
        putString("url", redirectUrl.url)
        putString("returnUrl", redirectUrl.returnUrl)
    }
}

internal fun mapFromUseStripeSdk(useStripeSdk: UseStripeSdk?): ReadableMap? {
    if (useStripeSdk == null) return null
    return nativeMapOf {
        putString("type", useStripeSdk.type)
    }
}

internal fun mapFromWechatPayDisplayQrCode(wechatPayDisplayQrCode: WechatPayDisplayQrCode?): ReadableMap? {
    if (wechatPayDisplayQrCode == null) return null
    return nativeMapOf {
        putString("data", wechatPayDisplayQrCode.data)
        putString("hostedInstructionsUrl", wechatPayDisplayQrCode.hostedInstructionsUrl)
        putString("imageDataUrl", wechatPayDisplayQrCode.imageDataUrl)
        putString("imageUrlPng", wechatPayDisplayQrCode.imageUrlPng)
        putString("imageUrlSvg", wechatPayDisplayQrCode.imageUrlSvg)
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
        if (collectData is CollectedData.Magstripe) {
            putString("stripeId", collectData.id)
        }
        if (collectData is CollectedData.NfcUid) {
            putString("nfcUid", collectData.uid)
        }
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

fun mapToTapZone(
    indicator: String?,
    bias: Float?,
    xBias: Float?,
    yBias: Float?
): TapToPayUxConfiguration.TapZone {
    return when (indicator) {
        "default" -> TapToPayUxConfiguration.TapZone.Default
        "above" -> {
            if (bias == null) {
                TapToPayUxConfiguration.TapZone.Above()
            } else {
                TapToPayUxConfiguration.TapZone.Above(bias)
            }
        }

        "below" -> {
            if (bias == null) {
                TapToPayUxConfiguration.TapZone.Below()
            } else {
                TapToPayUxConfiguration.TapZone.Below(bias)
            }
        }

        "front" -> {
            if (xBias != null && yBias != null) {
                TapToPayUxConfiguration.TapZone.Front(xBias, yBias)
            } else {
                TapToPayUxConfiguration.TapZone.Front()
            }
        }

        "behind" -> {
            if (xBias != null && yBias != null) {
                TapToPayUxConfiguration.TapZone.Behind(xBias, yBias)
            } else {
                TapToPayUxConfiguration.TapZone.Behind()
            }
        }

        "left" -> {
            if (bias == null) {
                TapToPayUxConfiguration.TapZone.Left()
            } else {
                TapToPayUxConfiguration.TapZone.Left(bias)
            }
        }

        "right" -> {
            if (bias == null) {
                TapToPayUxConfiguration.TapZone.Right()
            } else {
                TapToPayUxConfiguration.TapZone.Right(bias)
            }
        }

        else -> TapToPayUxConfiguration.TapZone.Default
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
internal fun mapToSurchargeConfiguration(surchargeMap: ReadableMap): SurchargeConfiguration? {
    if (surchargeMap.hasKey("amount").not()) return null

    val consent = surchargeMap.getMap("consent")?.let { consentMap ->
        val surchargeConsentCollection =
            consentMap.getString("collection")
                ?.let { SurchargeConsentCollection.fromCollection(it) }
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

@OptIn(Surcharging::class)
internal fun buildConfirmPaymentIntentConfiguration(params: ReadableMap): ConfirmPaymentIntentConfiguration {
    val configBuilder = ConfirmPaymentIntentConfiguration.Builder()

    val surchargeConfiguration = params.getMap("surcharge")?.let {
        mapToSurchargeConfiguration(it)
    }
    configBuilder.setSurcharge(surchargeConfiguration)

    if (params.hasKey("returnUrl")) {
        val returnUrl = params.getString("returnUrl")
        configBuilder.setReturnUrl(returnUrl)
    }

    return configBuilder.build()
}

@OptIn(InternalApi::class)
internal fun buildCollectPaymentIntentConfiguration(params: ReadableMap): CollectPaymentIntentConfiguration {
    val configBuilder = CollectPaymentIntentConfiguration.Builder()

    if (params.hasKey("skipTipping")) {
        configBuilder.skipTipping(getBoolean(params, "skipTipping"))
    }
    if (params.hasKey("tipEligibleAmount")) {
        val tipEligibleAmount = getInt(params, "tipEligibleAmount")?.toLong()
        configBuilder.setTippingConfiguration(
            TippingConfiguration.Builder()
                .setEligibleAmount(tipEligibleAmount)
                .build()
        )
    }
    if (params.hasKey("updatePaymentIntent")) {
        configBuilder.updatePaymentIntent(getBoolean(params, "updatePaymentIntent"))
    }
    val customerCancellation = mapToCustomerCancellation(params.getString("customerCancellation"))
    if (customerCancellation != null) {
        configBuilder.setCustomerCancellation(customerCancellation)
    }
    if (params.hasKey("requestDynamicCurrencyConversion")) {
        configBuilder.setRequestDynamicCurrencyConversion(
            getBoolean(params, "requestDynamicCurrencyConversion")
        )
    }
    if (params.hasKey("surchargeNotice")) {
        configBuilder.setSurchargeNotice(params.getString("surchargeNotice"))
    }
    if (params.hasKey("allowRedisplay")) {
        configBuilder.setAllowRedisplay(mapToAllowRedisplay(params.getString("allowRedisplay")))
    }
    configBuilder.setMotoConfiguration(mapToMotoConfiguration(params.getMap("motoConfiguration")))

    return configBuilder.build()
}

@OptIn(InternalApi::class)
internal fun buildCollectSetupIntentConfiguration(params: ReadableMap): CollectSetupIntentConfiguration {
    val customerCancellation = mapToCustomerCancellation(params.getString("customerCancellation"))
    val motoConfiguration = mapToMotoConfiguration(params.getMap("motoConfiguration"))
    val collectionReason = mapToSetupIntentCollectionReason(params.getString("collectionReason"))

    val configurationBuilder = CollectSetupIntentConfiguration.Builder()
    if (customerCancellation != null) {
        configurationBuilder.setCustomerCancellation(customerCancellation)
    }
    configurationBuilder.setMotoConfiguration(motoConfiguration)
    if (collectionReason != null) {
        configurationBuilder.setCollectionReason(collectionReason)
    }

    return configurationBuilder.build()
}

internal fun getUuidFromPaymentIntentParams(params: ReadableMap): String {
    val paymentIntentJson = requireNonNullParameter(params.getMap("paymentIntent")) {
        "You must provide a paymentIntent"
    }
    return requireNonNullParameter(paymentIntentJson.getString("sdkUuid")) {
        "The PaymentIntent is missing sdkUuid field. This method requires you to use the PaymentIntent that was returned from either createPaymentIntent or retrievePaymentIntent."
    }
}

internal fun getUuidFromSetupIntentParams(params: ReadableMap): String {
    val setupIntentJson = requireNonNullParameter(params.getMap("setupIntent")) {
        "You must provide a setupIntent"
    }
    return requireNonNullParameter(setupIntentJson.getString("sdkUuid")) {
        "The SetupIntent is missing sdkUuid field. This method requires you to use the SetupIntent that was returned from either createSetupIntent or retrieveSetupIntent."
    }
}
// MPOS QR Mappers
internal fun mapFromPaymentOption(paymentOption: PaymentOption, index: Int): ReadableMap =
    nativeMapOf {
        putInt("index", index)
        when (paymentOption) {
            is PaymentOption.CardPayment -> {
                putString("type", "card")
                putString("label", "Card Payment")
                putString("paymentMethodType", "card")
            }
            is PaymentOption.NonCardPayment -> {
                putString("type", "nonCard")
                putString("label", paymentOption.type.name)
                putString("paymentMethodType", mapFromPaymentMethodDetailsType(paymentOption.type))
            }
        }
    }

internal fun mapFromPaymentOptions(paymentOptions: List<PaymentOption>): ReadableArray =
    nativeArrayOf {
        paymentOptions.forEachIndexed { index, option ->
            pushMap(mapFromPaymentOption(option, index))
        }
    }

internal fun mapFromQrCodeDisplayData(qrData: QrCodeDisplayData): ReadableMap =
    nativeMapOf {
        putString("imageUrlPng", qrData.qrCodeImageUrlPng)
        putString("imageUrlSvg", qrData.qrCodeImageUrlSvg)
        putDouble("expiresAtMs", qrData.expiresAtMs.toDouble())
        putString("paymentMethodType", mapFromPaymentMethodDetailsType(qrData.paymentMethodType))
    }
