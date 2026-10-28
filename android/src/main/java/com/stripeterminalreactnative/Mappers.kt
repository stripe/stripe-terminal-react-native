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
import com.stripe.stripeterminal.external.DonationApi
import com.stripe.stripeterminal.external.InternalApi
import com.stripe.stripeterminal.external.Surcharging
import com.stripe.stripeterminal.external.models.Address
import com.stripe.stripeterminal.external.models.AppTransitionAnimation
import com.stripe.stripeterminal.external.models.AppTransitionPreset
import com.stripe.stripeterminal.external.models.TerminalErrorCode
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripe.stripeterminal.external.models.AffirmDetails
import com.stripe.stripeterminal.external.models.AllowRedisplay
import com.stripe.stripeterminal.external.models.AmountDetails
import com.stripe.stripeterminal.external.models.BatteryStatus
import com.stripe.stripeterminal.external.models.BuzzerVolumeLevel
import com.stripe.stripeterminal.external.models.CardDetails
import com.stripe.stripeterminal.external.models.CardNetworks
import com.stripe.stripeterminal.external.models.CardPresentRequestPartialAuthorization
import com.stripe.stripeterminal.external.models.CardPresentRequestReauthorization
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
import com.stripe.stripeterminal.external.models.InstallmentDetails
import com.stripe.stripeterminal.external.models.InstallmentPlanDetails
import com.stripe.stripeterminal.external.models.InstallmentPlanInterval
import com.stripe.stripeterminal.external.models.InstallmentPlanType
import com.stripe.stripeterminal.external.models.KlarnaDetails
import com.stripe.stripeterminal.external.models.Location
import com.stripe.stripeterminal.external.models.LocationStatus
import com.stripe.stripeterminal.external.models.LocaleConfig
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
import com.stripe.stripeterminal.external.models.ReaderBuzzerVolume
import com.stripe.stripeterminal.external.models.ReaderDisplayMessage
import com.stripe.stripeterminal.external.models.ReaderEvent
import com.stripe.stripeterminal.external.models.ReaderInputOptions
import com.stripe.stripeterminal.external.models.ReaderInputOptions.ReaderInputOption
import com.stripe.stripeterminal.external.models.ReaderSettings
import com.stripe.stripeterminal.external.models.ReaderSettingsParameters
import com.stripe.stripeterminal.external.models.ReaderSoftwareUpdate
import com.stripe.stripeterminal.external.models.ReaderSupportResult
import com.stripe.stripeterminal.external.models.ReaderTextToSpeechStatus
import com.stripe.stripeterminal.external.models.Reauthorization
import com.stripe.stripeterminal.external.models.ReauthorizationStatus
import com.stripe.stripeterminal.external.models.ReceiptDetails
import com.stripe.stripeterminal.external.models.RedirectUrl
import com.stripe.stripeterminal.external.models.Refund
import com.stripe.stripeterminal.external.models.RefundNextAction
import com.stripe.stripeterminal.external.models.RefundNextActionDisplayDetails
import com.stripe.stripeterminal.external.models.RefundNextActionDisplayDetailsEmailSent
import com.stripe.stripeterminal.external.models.SelectionResult
import com.stripe.stripeterminal.external.models.SetupAttempt
import com.stripe.stripeterminal.external.models.SetupAttemptStatus
import com.stripe.stripeterminal.external.models.SetupIntent
import com.stripe.stripeterminal.external.models.SetupIntentCancellationReason
import com.stripe.stripeterminal.external.models.SetupAttemptCardPresentDetails
import com.stripe.stripeterminal.external.models.SetupIntentNextAction
import com.stripe.stripeterminal.external.models.SetupIntentOfflineDetails
import com.stripe.stripeterminal.external.models.SetupIntentParameters
import com.stripe.stripeterminal.external.models.SetupAttemptPaymentMethodDetails
import com.stripe.stripeterminal.external.models.SetupIntentStatus
import com.stripe.stripeterminal.external.models.SetupIntentUsage
import com.stripe.stripeterminal.external.models.SignatureResult
import com.stripe.stripeterminal.external.models.SimulatedCollectInputsResult
import com.stripe.stripeterminal.external.models.SimulatedCollectInputsResult.SimulatedCollectInputsResultSucceeded
import com.stripe.stripeterminal.external.models.SimulatedCollectInputsResult.SimulatedCollectInputsResultTimeout
import com.stripe.stripeterminal.external.models.SimulatedCollectInputsSkipBehavior
import com.stripe.stripeterminal.external.models.SurchargeConfiguration
import com.stripe.stripeterminal.external.models.SurchargeConsent
import com.stripe.stripeterminal.external.models.TapToPayUxConfiguration
import com.stripe.stripeterminal.external.models.TapToPayUpdateRequirement
import com.stripe.stripeterminal.external.models.TestReaderUpdate
import com.stripe.stripeterminal.external.models.TextResult
import com.stripe.stripeterminal.external.models.TippingConfiguration
import com.stripe.stripeterminal.external.models.ToggleResult
import com.stripe.stripeterminal.external.models.UseStripeSdk
import com.stripe.stripeterminal.external.models.Wallet
import com.stripe.stripeterminal.external.models.WechatPayDetails
import com.stripe.stripeterminal.external.models.WechatPayDisplayQrCode
import com.stripe.stripeterminal.external.models.PaymentOption
import com.stripe.stripeterminal.external.models.QrCodeDisplayData
import com.stripe.stripeterminal.external.models.MulticaptureStatus
import com.stripe.stripeterminal.log.LogLevel
import java.util.Base64
import com.stripe.stripeterminal.external.models.SurchargeConsentCollection as NativeSurchargeConsentCollection

internal fun getInt(map: ReadableMap, key: String): Int? = map.getIntSafely(key)

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

internal fun ReadableMap.getBooleanSafely(key: String): Boolean? {
    if (!hasKey(key) || isNull(key) || getType(key) != ReadableType.Boolean) return null

    return getBoolean(key)
}

internal fun getBoolean(map: ReadableMap?, key: String): Boolean =
    map?.getBooleanSafely(key) ?: false

internal fun getBoolean(map: ReadableMap?, key: String, defaultValue: Boolean): Boolean =
    map?.getBooleanSafely(key) ?: defaultValue

internal fun mapToLocaleConfig(map: ReadableMap?): LocaleConfig? {
    if (map == null) {
        return null
    }

    return when (map.getString("type")) {
        "hardcoded" -> {
            val locale = map.getString("locale") ?: return null
            LocaleConfig.HardcodedLocale.Builder(locale).build()
        }
        "cardLanguagePreferenceIfAvailable" -> LocaleConfig.CardLanguagePreferenceIfAvailable
        else -> null
    }
}

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

internal fun putDoubleIfNotNull(mapTarget: WritableMap, key: String, value: Double?) {
    value?.let {
        mapTarget.putDouble(key, it)
    }
}

internal fun putIntIfNotNull(mapTarget: WritableMap, key: String, value: Int?) {
    value?.let {
        mapTarget.putInt(key, it)
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
    putDoubleIfNotNull(this, "batteryLevel", reader.batteryLevel?.toDouble())
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

internal fun mapToDeviceType(type: String): DeviceType {
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
        DeviceSerialName.STRIPE_T600 -> DeviceType.STRIPE_T600
        DeviceSerialName.STRIPE_T600_DEVKIT -> DeviceType.STRIPE_T600_DEVKIT
        DeviceSerialName.STRIPE_T610 -> DeviceType.STRIPE_T610
        DeviceSerialName.STRIPE_T610_DEVKIT -> DeviceType.STRIPE_T610_DEVKIT
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
        DeviceSerialName.UNKNOWN -> DeviceType.UNKNOWN
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
            configurationMap.getBooleanSafely("skipCvc")?.let(::setSkipCvc)
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
        paymentIntent.id?.let { putString("id", it) }
        putInt("amount", paymentIntent.amount.toInt())
        putInt("amountCapturable", paymentIntent.amountCapturable.toInt())
        putMap("amountDetails", mapFromAmountDetails(paymentIntent.amountDetails))
        putInt("amountReceived", paymentIntent.amountReceived.toInt())
        paymentIntent.amountRequested?.toInt()?.let { amountRequested ->
            putInt("amountRequested", amountRequested)
        }
        putInt("amountTip", paymentIntent.amountTip?.toInt() ?: 0)
        putString("application", paymentIntent.application)
        putInt("applicationFeeAmount", paymentIntent.applicationFeeAmount.toInt())
        putString("canceledAt", convertToUnixTimestamp(paymentIntent.canceledAt))
        putString("cancellationReason", paymentIntent.cancellationReason)
        paymentIntent.captureMethod?.let { putString("captureMethod", it) }
        putMap("latestCharge", paymentIntent.latestCharge?.let { mapFromCharge(it) })
        putString("latestChargeId", paymentIntent.latestChargeId)
        putString("clientSecret", paymentIntent.clientSecret)
        putString("confirmationMethod", paymentIntent.confirmationMethod)
        putString("created", convertToUnixTimestamp(paymentIntent.created))
        paymentIntent.currency?.let { putString("currency", it) }
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
        putArray(
            "paymentMethodTypes",
            nativeArrayOf {
                paymentIntent.paymentMethodTypes.forEach { type ->
                    pushString(mapFromPaymentMethodDetailsType(type))
                }
            }
        )
        putString("receiptEmail", paymentIntent.receiptEmail)
        putString("review", paymentIntent.review)
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
                    mapFromRequestReauthorization(it.cardPresent?.requestReauthorization)?.let {
                        putString("requestReauthorization", it)
                    }
                    it.cardPresent?.installments?.let { installments ->
                        putMap("installments", mapFromInstallmentDetails(installments))
                    }
                }
            )
        }
    }

internal fun mapFromInstallmentDetails(installmentDetails: InstallmentDetails?): ReadableMap? =
    installmentDetails?.let { details ->
        nativeMapOf {
            details.enabled?.let { putBoolean("enabled", it) }
            putArray("availablePlans", mapFromInstallmentAvailablePlans(details.availablePlans))
            mapFromInstallmentPlanDetails(details.plan)?.let {
                putMap("plan", it)
            }
        }
    }

internal fun mapFromInstallmentAvailablePlans(plans: List<InstallmentPlanDetails>): ReadableArray =
    nativeArrayOf {
        plans.mapNotNull(::mapFromInstallmentPlanDetails).forEach {
            pushMap(it)
        }
    }

internal fun mapFromInstallmentPlanDetails(plan: InstallmentPlanDetails?): ReadableMap? {
    val nonNullPlan = plan ?: return null
    val type = mapFromInstallmentPlanType(nonNullPlan.type) ?: return null

    return nativeMapOf {
        putString("type", type)
        putIntIfNotNull(this, "count", nonNullPlan.count)
        mapFromInstallmentPlanInterval(nonNullPlan.interval)?.let {
            putString("interval", it)
        }
    }
}

internal fun mapFromInstallmentPlanType(type: InstallmentPlanType?): String? = when (type) {
    InstallmentPlanType.FIXED_COUNT -> "fixed_count"
    InstallmentPlanType.BONUS -> "bonus"
    InstallmentPlanType.REVOLVING -> "revolving"
    else -> null
}

internal fun mapFromInstallmentPlanInterval(interval: InstallmentPlanInterval?): String? = when (interval) {
    InstallmentPlanInterval.MONTH -> "month"
    else -> null
}

internal fun mapFromRequestPartialAuthorization(partialAuth: CardPresentRequestPartialAuthorization?): String {
    return partialAuth?.typeName.orEmpty()
}

internal fun mapFromMulticaptureStatus(status: MulticaptureStatus?): String {
    return when (status) {
        MulticaptureStatus.AVAILABLE -> "available"
        MulticaptureStatus.UNAVAILABLE -> "unavailable"
        else -> "unknown"
    }
}

internal fun mapFromRequestReauthorization(reauth: CardPresentRequestReauthorization?): String? {
    return when (reauth) {
        CardPresentRequestReauthorization.IF_AVAILABLE -> "if_available"
        CardPresentRequestReauthorization.NEVER -> "never"
        else -> null
    }
}

internal fun mapFromReauthorizationStatus(status: ReauthorizationStatus?): String {
    return when (status) {
        ReauthorizationStatus.AVAILABLE -> "available"
        ReauthorizationStatus.UNAVAILABLE -> "unavailable"
        else -> "unknown"
    }
}

internal fun mapFromSetupIntent(setupIntent: SetupIntent, uuid: String): ReadableMap = nativeMapOf {
    setupIntent.id?.let { putString("id", it) }
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
    putArray(
        "paymentMethodTypes",
        nativeArrayOf {
            setupIntent.paymentMethodTypes.forEach { type ->
                pushString(
                    mapToPaymentMethodDetailsType(type)?.let(::mapFromPaymentMethodDetailsType)
                        ?: "unknown"
                )
            }
        }
    )
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
        it.setupError?.let { err -> putMap("setupError", mapFromSetupError(err)) }
    }
}

internal fun mapFromSetupIntentPaymentMethodDetails(
    details: SetupAttemptPaymentMethodDetails
): ReadableMap = nativeMapOf {
    putString("type", mapFromPaymentMethodDetailsType(details.type))
    putMap("cardPresent", mapFromSetupIntentCardPresentDetails(details.cardPresentDetails))
    putMap("interacPresent", mapFromSetupIntentCardPresentDetails(details.interacPresentDetails))
}

internal fun mapFromSetupIntentCardPresentDetails(
    details: SetupAttemptCardPresentDetails?
): ReadableMap? = details?.let {
    nativeMapOf {
        it.emvAuthData?.let { emvAuthData -> putString("emvAuthData", emvAuthData) }
        it.generatedCard?.let { generatedCard -> putString("generatedCard", generatedCard) }
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
    charge.currency?.let { putString("currency", it) }
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
        it.id?.let { id -> putString("id", id) }
        putString("displayName", it.displayName)

        putMap("address", mapFromAddress(it.address))

        it.livemode?.let { livemode ->
            putBoolean("livemode", livemode)
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
        PaymentIntentStatus.REQUIRES_REAUTHORIZATION -> "requiresReauthorization"
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

internal fun mapToUpdateComponent(component: String): ReaderSoftwareUpdate.UpdateComponent? {
    return when (component) {
        "firmware" -> ReaderSoftwareUpdate.UpdateComponent.FIRMWARE
        "config" -> ReaderSoftwareUpdate.UpdateComponent.CONFIG
        "keys" -> ReaderSoftwareUpdate.UpdateComponent.KEYS
        "incremental" -> ReaderSoftwareUpdate.UpdateComponent.INCREMENTAL
        else -> null
    }
}

internal fun mapFromUpdateComponent(component: ReaderSoftwareUpdate.UpdateComponent): String {
    // Keep the RN payload aligned across platforms. If the Android SDK adds a
    // new UpdateComponent and this when-expression needs another branch, update
    // Mappers.mapFromUpdateComponents(_:) in public/ios/Mappers.swift as well.
    return when (component) {
        ReaderSoftwareUpdate.UpdateComponent.FIRMWARE -> "firmware"
        ReaderSoftwareUpdate.UpdateComponent.CONFIG -> "config"
        ReaderSoftwareUpdate.UpdateComponent.KEYS -> "keys"
        ReaderSoftwareUpdate.UpdateComponent.INCREMENTAL -> "incremental"
    }
}

internal fun mapToTestReaderUpdate(map: ReadableMap): TestReaderUpdate? {
    val type = map.getString("type") ?: return null
    val components = map.getArray("components")?.let { arr ->
        (0 until arr.size()).mapNotNull { arr.getString(it)?.let(::mapToUpdateComponent) }.toSet()
    } ?: emptySet()
    return when (type) {
        "available" -> TestReaderUpdate.available(components)
        "required" -> TestReaderUpdate.required(components)
        "requiredOffline" -> TestReaderUpdate.requiredOffline(components)
        "lowBattery" -> TestReaderUpdate.lowBattery()
        "lowBatterySucceedConnect" -> TestReaderUpdate.lowBatterySucceedConnect()
        "random" -> TestReaderUpdate.random()
        else -> null
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
            putArray("components", nativeArrayOf {
                it.components.forEach { component ->
                    pushString(mapFromUpdateComponent(component))
                }
            })
            putBoolean("isTestUpdate", it.isTestUpdate)
        }
    }

internal fun mapFromTapToPayUpdateRequirement(
    requirement: TapToPayUpdateRequirement
): ReadableMap = nativeMapOf {
    putString("requiredAt", requirement.requiredAtMs.toString())
    when (requirement) {
        is TapToPayUpdateRequirement.OperatingSystem -> {
            putString("type", "operatingSystem")
            putInt("apiLevel", requirement.apiLevel)
        }
        is TapToPayUpdateRequirement.SecurityPatch -> {
            putString("type", "securityPatch")
            putString("version", requirement.version)
        }
        is TapToPayUpdateRequirement.TerminalSdk -> {
            putString("type", "terminalSdk")
            putString("version", requirement.version)
        }
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
    putIntIfNotNull(this, "amount", refund.amount?.toInt())
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
    putString("status", mapFromRefundStatus(refund.status))
    putString("transferReversal", refund.transferReversal)
    refund.nextAction?.let {
        putMap("nextAction", mapFromRefundNextAction(it))
    }
}

internal fun mapFromRefundStatus(status: String?): String? =
    when (status) {
        "requires_action" -> "requiresAction"
        else -> status
    }

internal fun mapFromRefundNextAction(nextAction: RefundNextAction): ReadableMap = nativeMapOf {
    putString("type", nextAction.type)
    nextAction.displayDetails?.let {
        putMap("displayDetails", mapFromRefundNextActionDisplayDetails(it))
    }
}

internal fun mapFromRefundNextActionDisplayDetails(
    displayDetails: RefundNextActionDisplayDetails
): ReadableMap = nativeMapOf {
    putMap("emailSent", mapFromRefundNextActionDisplayDetailsEmailSent(displayDetails.emailSent))
    putString("expiresAt", convertToUnixTimestamp(displayDetails.expiresAt))
}

internal fun mapFromRefundNextActionDisplayDetailsEmailSent(
    emailSent: RefundNextActionDisplayDetailsEmailSent
): ReadableMap = nativeMapOf {
    putString("emailSentAt", convertToUnixTimestamp(emailSent.emailSentAt))
    putString("emailSentTo", emailSent.emailSentTo)
}

internal fun mapFromCardDetails(cardDetails: CardDetails?): ReadableMap = nativeMapOf {
    putString("brand", cardDetails?.brand)
    putString("country", cardDetails?.country)
    putInt("expMonth", cardDetails?.expMonth ?: 0)
    putInt("expYear", cardDetails?.expYear ?: 0)
    putString("funding", cardDetails?.funding)
    putMap("generatedFrom", mapFromGeneratedFrom(cardDetails?.generatedFrom))
    putString("last4", cardDetails?.last4)
    putString("authorizationCode", cardDetails?.authorizationCode)
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
                mapFromPaymentMethodCardPresentDetails(it.cardPresentDetails)
            )
            putMap(
                "interacPresentDetails",
                mapFromPaymentMethodCardPresentDetails(it.interacPresentDetails)
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
        "cardPresent", "card_present" -> PaymentMethodType.CARD_PRESENT
        "interacPresent", "interac_present" -> PaymentMethodType.INTERAC_PRESENT
        "wechatPay", "wechat_pay" -> PaymentMethodType.WECHAT_PAY
        "affirm" -> PaymentMethodType.AFFIRM
        "paynow" -> PaymentMethodType.PAYNOW
        "paypay" -> PaymentMethodType.PAYPAY
        "klarna" -> PaymentMethodType.KLARNA
        else -> null
    }
}

private fun mapFromPaymentMethodCardPresentDetails(
    cardPresentDetails: PaymentMethod.CardPresent?
): ReadableMap? = cardPresentDetails?.let {
    nativeMapOf {
        putString("brand", it.brand)
        putString("brandProduct", it.brandProduct)
        putString("cardholderName", it.cardholderName)
        putString("country", it.country)
        putIntIfNotNull(this, "expMonth", it.expMonth)
        putIntIfNotNull(this, "expYear", it.expYear)
        putString("funding", it.funding)
        putString("last4", it.last4)
        putString("readMethod", it.readMethod)
        putString("issuer", it.issuer)
        putString("iin", it.iin)
        putString("description", it.description)
        putMap("networks", mapFromCardNetworks(it.networks))
        putString("paymentAccountReference", it.paymentAccountReference)
        putMap("wallet", mapFromWallet(it.wallet))
        putArray(
            "preferredLocales",
            convertListToReadableArray(it.preferredLocales)
        )
    }
}

private fun mapFromCardNetworks(networks: CardNetworks?): ReadableMap? = networks?.let {
    nativeMapOf {
        putArray("available", convertListToReadableArray(it.available))
        putString("preferred", it.preferred)
    }
}

private fun mapFromCardPresentDetails(cardPresentDetails: Charge.CardPresent?): ReadableMap? =
    cardPresentDetails?.let {
        nativeMapOf {
            it.brand?.let { brand -> putString("brand", brand) }
            putString("cardholderName", it.cardholderName)
            putString("country", it.country)
            putString("emvAuthData", it.emvAuthData)
            putIntIfNotNull(this, "expMonth", it.expMonth)
            putIntIfNotNull(this, "expYear", it.expYear)
            putString("funding", it.funding)
            putString("generatedCard", it.generatedCard)
            it.last4?.let { last4 -> putString("last4", last4) }
            it.readMethod?.let { readMethod -> putString("readMethod", readMethod) }
            mapFromReceiptDetails(it.receiptDetails)?.let { receipt ->
                putMap("receipt", receipt)
            }
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
            putString("paymentAccountReference", it.paymentAccountReference)
            putString("multicaptureStatus", mapFromMulticaptureStatus(it.multicapture?.status))
            putString("reauthorizationStatus", mapFromReauthorizationStatus(it.reauthorization?.status))
            it.captureBefore?.let { captureBefore ->
                putString("captureBefore", convertToUnixTimestamp(captureBefore))
            }
            it.reauthorizeBefore?.let { reauthorizeBefore ->
                putString("reauthorizeBefore", convertToUnixTimestamp(reauthorizeBefore))
            }
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
            mapFromOfflineCardPresentDetails(offlineDetails.cardPresentDetails)?.let { details ->
                putMap("cardPresentDetails", details)
            }
        }
    }

private fun mapFromOfflineDetails(offlineDetails: OfflineDetails?): ReadableMap? =
    offlineDetails?.let {
        nativeMapOf {
            putString("storedAtMs", offlineDetails.storedAtMs.toString())
            putBoolean("requiresUpload", offlineDetails.requiresUpload)
            mapFromOfflineCardPresentDetails(offlineDetails.cardPresentDetails)?.let { details ->
                putMap("cardPresentDetails", details)
            }
            mapFromAmountDetails(offlineDetails.amountDetails)?.let { details ->
                putMap("amountDetails", details)
            }
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
                    putIntIfNotNull(this, "amount", amountDetails.tip?.amount?.toInt())
                }
            )
            putMap(
                "donation",
                nativeMapOf {
                    putIntIfNotNull(this, "amount", amountDetails.donation?.amount?.toInt())
                }
            )
            putMap(
                "surcharge",
                nativeMapOf {
                    amountDetails.surcharge?.let { s ->
                        putIntIfNotNull(this, "amount", s.amount?.toInt())
                        s.status?.let { putString("status", it.typeName) }
                        putIntIfNotNull(this, "maximumAmount", s.maximumAmount?.toInt())
                    }
                }
            )
        }
    }

private fun mapFromOfflineCardPresentDetails(offlineCardPresentDetails: OfflineCardPresentDetails?): ReadableMap? =
    offlineCardPresentDetails?.let {
        nativeMapOf {
            offlineCardPresentDetails.brand?.let { brand -> putString("brand", brand) }
            offlineCardPresentDetails.cardholderName?.let { cardholderName ->
                putString("cardholderName", cardholderName)
            }
            putIntIfNotNull(this, "expMonth", offlineCardPresentDetails.expMonth)
            putIntIfNotNull(this, "expYear", offlineCardPresentDetails.expYear)
            offlineCardPresentDetails.last4?.let { last4 -> putString("last4", last4) }
            offlineCardPresentDetails.readMethod?.let { readMethod ->
                putString("readMethod", readMethod)
            }
            mapFromReceiptDetails(offlineCardPresentDetails.receiptDetails)?.let { receiptDetails ->
                putMap("receiptDetails", receiptDetails)
            }
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

fun mapFromReceiptDetails(receiptDetails: ReceiptDetails?): ReadableMap? =
    receiptDetails?.let {
        nativeMapOf {
            it.accountType?.let { accountType -> putString("accountType", accountType) }
            it.applicationCryptogram?.let { applicationCryptogram ->
                putString("applicationCryptogram", applicationCryptogram)
            }
            it.applicationPreferredName?.let { applicationPreferredName ->
                putString("applicationPreferredName", applicationPreferredName)
            }
            it.authorizationCode?.let { authorizationCode ->
                putString("authorizationCode", authorizationCode)
            }
            it.authorizationResponseCode?.let { authorizationResponseCode ->
                putString("authorizationResponseCode", authorizationResponseCode)
            }
            it.cvm?.let { cvm -> putString("cvm", cvm) }
            it.dedicatedFileName?.let { dedicatedFileName ->
                putString("dedicatedFileName", dedicatedFileName)
            }
            it.tsi?.let { transactionStatusInformation ->
                putString("transactionStatusInformation", transactionStatusInformation)
            }
            it.tvr?.let { terminalVerificationResult ->
                putString("terminalVerificationResult", terminalVerificationResult)
            }
        }
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

internal fun mapToReaderSettingsParameters(params: ReadableMap): ReaderSettingsParameters {
    val hasAccessibility = params.hasKey("textToSpeechViaSpeakers")
    val hasBuzzerVolume = params.hasKey("buzzerVolume")
    if (hasAccessibility == hasBuzzerVolume) {
        throw TerminalException(
            TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
            "You must provide exactly one of textToSpeechViaSpeakers or buzzerVolume."
        )
    }

    if (hasAccessibility) {
        if (params.isNull("textToSpeechViaSpeakers") ||
            params.getType("textToSpeechViaSpeakers") != ReadableType.Boolean
        ) {
            throw TerminalException(
                TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
                "textToSpeechViaSpeakers must be a boolean."
            )
        }
        return ReaderSettingsParameters.AccessibilityParameters(
            params.getBoolean("textToSpeechViaSpeakers")
        )
    }

    if (params.isNull("buzzerVolume") || params.getType("buzzerVolume") != ReadableType.Map) {
        throw TerminalException(
            TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
            "buzzerVolume must be an object."
        )
    }
    val buzzerVolume = requireNonNullParameter(params.getMap("buzzerVolume")) {
        "You must provide buzzerVolume parameters."
    }
    if (!buzzerVolume.hasKey("level") || buzzerVolume.isNull("level") ||
        buzzerVolume.getType("level") != ReadableType.String
    ) {
        throw TerminalException(
            TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
            "You must provide buzzerVolume.level."
        )
    }
    val level = when (val levelParam = buzzerVolume.getString("level")) {
        "low" -> BuzzerVolumeLevel.Low
        "high" -> BuzzerVolumeLevel.High
        "custom" -> {
            if (!buzzerVolume.hasKey("volume") || buzzerVolume.isNull("volume")) {
                throw TerminalException(
                    TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
                    "You must provide volume when buzzerVolume.level is custom."
                )
            }
            if (buzzerVolume.getType("volume") != ReadableType.Number) {
                throw TerminalException(
                    TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
                    "buzzerVolume.volume must be an integer."
                )
            }
            val volume = buzzerVolume.getDouble("volume")
            if (volume % 1 != 0.0) {
                throw TerminalException(
                    TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
                    "buzzerVolume.volume must be an integer."
                )
            }
            BuzzerVolumeLevel.Exact(volume.toInt())
        }
        else -> throw TerminalException(
            TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
            "Unsupported buzzerVolume.level: $levelParam."
        )
    }
    return ReaderSettingsParameters.BuzzerVolumeParameters(level)
}

internal fun mapFromReaderSettings(settings: ReaderSettings): ReadableMap {
    return nativeMapOf {
        val accessibility = nativeMapOf {
            when (val readerAccessibility = settings.readerAccessibility) {
                is ReaderAccessibility.Accessibility -> {
                    putString(
                        "textToSpeechStatus",
                        when (readerAccessibility.textToSpeechStatus) {
                            ReaderTextToSpeechStatus.OFF -> "off"
                            ReaderTextToSpeechStatus.HEADPHONES -> "headphones"
                            ReaderTextToSpeechStatus.SPEAKERS -> "speakers"
                        }
                    )
                }
                is ReaderAccessibility.Error -> {
                    putError(readerAccessibility.error, ErrorSource.NATIVE)
                }
            }
        }
        putMap("accessibility", accessibility)

        val buzzerVolume = when (val readerBuzzerVolume = settings.readerBuzzerVolume) {
            is ReaderBuzzerVolume.BuzzerVolume -> nativeMapOf {
                putInt("currentVolume", readerBuzzerVolume.currentVolume)
                putInt("maxVolume", readerBuzzerVolume.maxVolume)
            }
            is ReaderBuzzerVolume.Error -> nativeMapOf {
                putError(readerBuzzerVolume.error, ErrorSource.NATIVE)
            }
        }
        putMap("buzzerVolume", buzzerVolume)
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
        readerSupportResult.error?.let { error ->
            putError(error, ErrorSource.NATIVE)
        }
    }
}

fun mapFromBatteryStatus(status: BatteryStatus): String {
    return when (status) {
        BatteryStatus.CRITICAL -> ReactNativeBatteryStatus.CRITICAL
        BatteryStatus.LOW -> ReactNativeBatteryStatus.LOW
        BatteryStatus.NOMINAL -> ReactNativeBatteryStatus.NOMINAL
        BatteryStatus.UNKNOWN -> ReactNativeBatteryStatus.UNKNOWN
        else -> {
            ReactNativeBatteryStatus.UNKNOWN
        }
    }.value
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
            if (bias != null) TapToPayUxConfiguration.TapZone.Above(bias)
            else TapToPayUxConfiguration.TapZone.Above()
        }
        "below" -> {
            if (bias != null) TapToPayUxConfiguration.TapZone.Below(bias)
            else TapToPayUxConfiguration.TapZone.Below()
        }
        "front" -> {
            if (xBias != null && yBias != null) TapToPayUxConfiguration.TapZone.Front(xBias, yBias)
            else TapToPayUxConfiguration.TapZone.Front()
        }
        "behind" -> {
            if (xBias != null && yBias != null) TapToPayUxConfiguration.TapZone.Behind(xBias, yBias)
            else TapToPayUxConfiguration.TapZone.Behind()
        }
        "left" -> {
            if (bias != null) TapToPayUxConfiguration.TapZone.Left(bias)
            else TapToPayUxConfiguration.TapZone.Left()
        }
        "right" -> {
            if (bias != null) TapToPayUxConfiguration.TapZone.Right(bias)
            else TapToPayUxConfiguration.TapZone.Right()
        }
        else -> TapToPayUxConfiguration.TapZone.Default
    }
}

fun mapToTheme(theme: String?): TapToPayUxConfiguration.Theme {
    return when (theme) {
        "dark" -> TapToPayUxConfiguration.Theme.DARK
        "light" -> TapToPayUxConfiguration.Theme.LIGHT
        "system" -> TapToPayUxConfiguration.Theme.SYSTEM
        else -> TapToPayUxConfiguration.Theme.SYSTEM
    }
}

fun hexToArgb(color: String): Int {
    if (color.isEmpty()) {
        throw TerminalException(TerminalErrorCode.INVALID_REQUIRED_PARAMETER, "Invalid ARGB hex format")
    }
    return try {
        Color.parseColor(color)
    } catch (e: IllegalArgumentException) {
        throw TerminalException(TerminalErrorCode.INVALID_REQUIRED_PARAMETER, "Invalid ARGB hex format")
    }
}

internal fun mapToTapToPayColor(
    colorScheme: ReadableMap,
    key: String
): TapToPayUxConfiguration.Color {
    if (!colorScheme.hasKey(key) || colorScheme.isNull(key)) {
        return TapToPayUxConfiguration.Color.Default
    }
    val color = requireNonNullParameter(
        when (colorScheme.getType(key)) {
            ReadableType.String -> colorScheme.getString(key)
            else -> null
        }
    ) { "Invalid ARGB hex format" }
    return TapToPayUxConfiguration.Color.Value(hexToArgb(color))
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

@OptIn(InternalApi::class, DonationApi::class)
internal fun buildCollectPaymentIntentConfiguration(params: ReadableMap): CollectPaymentIntentConfiguration {
    val configBuilder = CollectPaymentIntentConfiguration.Builder()

    if (params.hasKey("skipTipping")) {
        configBuilder.skipTipping(getBoolean(params, "skipTipping"))
    }
    if (params.hasKey("skipDonation")) {
        configBuilder.skipDonation(getBoolean(params, "skipDonation"))
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

    val allowRedisplay = mapToAllowRedisplay(params.getString("allowRedisplay"))
    val configurationBuilder = CollectSetupIntentConfiguration.Builder(allowRedisplay)
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
        qrData.qrCodeImageUrlSvg?.let { putString("imageUrlSvg", it) }
        putDouble("expiresAtMs", qrData.expiresAtMs.toDouble())
        putString("paymentMethodType", mapFromPaymentMethodDetailsType(qrData.paymentMethodType))
    }

internal fun mapToAppTransitionAnimation(params: ReadableMap?): AppTransitionAnimation {
    params ?: return AppTransitionAnimation.SystemDefault
    return when (val type = params.getString("type")) {
        "systemDefault" -> AppTransitionAnimation.SystemDefault
        "preset" -> {
            val preset = when (val presetValue = params.getString("preset")) {
                "slideFromBottom" -> AppTransitionPreset.SLIDE_FROM_BOTTOM
                else -> throw TerminalException(TerminalErrorCode.INVALID_REQUIRED_PARAMETER, "Unknown AppTransitionPreset: $presetValue")
            }
            AppTransitionAnimation.Preset(preset)
        }
        "custom" -> {
            val enterAnim = getInt(params, "enterAnim") ?: AppTransitionAnimation.Custom.NO_ANIMATION
            val exitAnim = getInt(params, "exitAnim") ?: AppTransitionAnimation.Custom.NO_ANIMATION
            AppTransitionAnimation.Custom(enterAnim, exitAnim)
        }
        else -> throw TerminalException(TerminalErrorCode.INVALID_REQUIRED_PARAMETER, "Unknown AppTransitionAnimation type: $type")
    }
}
