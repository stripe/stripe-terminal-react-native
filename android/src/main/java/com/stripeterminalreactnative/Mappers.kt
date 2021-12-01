package com.stripeterminalreactnative

import com.facebook.react.bridge.*
import com.stripe.stripeterminal.external.models.*
import com.stripe.stripeterminal.log.LogLevel

fun getStringOr(map: ReadableMap, key: String, default: String? = null): String? {
  return if (map.hasKey(key)) map.getString(key) else default
}

fun getIntOr(map: ReadableMap, key: String, default: Int? = null): Int? {
  return if (map.hasKey(key)) map.getInt(key) else default
}

fun getBoolean(map: ReadableMap, key: String): Boolean {
  return if (map.hasKey(key)) map.getBoolean(key) else false
}

fun getMapOr(map: ReadableMap, key: String, default: ReadableMap? = null): ReadableMap? {
  return if (map.hasKey(key)) map.getMap(key) else default
}

fun getArrayOr(map: ReadableMap, key: String, default: ReadableArray? = null): ReadableArray? {
  return if (map.hasKey(key)) map.getArray(key) else default
}

fun putDoubleOrNull(mapTarget: WritableMap, key: String, value: Double?) {
  value?.let {
    mapTarget.putDouble(key, it)
  } ?: run {
    mapTarget.putNull(key)
  }
}

fun putIntOrNull(mapTarget: WritableMap, key: String, value: Int?) {
  value?.let {
    mapTarget.putInt(key, it)
  } ?: run {
    mapTarget.putNull(key)
  }
}

internal fun mapFromReaders(readers: List<Reader>): WritableArray {
  val list: WritableArray = WritableNativeArray()

  readers.forEach {
    val reader = mapFromReader(it)
    list.pushMap(reader)
  }

  return list
}

internal fun mapFromReader(reader: Reader): WritableMap {
  val item: WritableMap = WritableNativeMap()
  item.putString("label", reader.label)
  item.putString("serialNumber", reader.serialNumber)
  item.putString("id", reader.id)
  item.putString("locationId", reader.location?.id)
  item.putString("deviceSoftwareVersion", reader.softwareVersion)
  item.putString("deviceType", mapFromDeviceType(reader.deviceType))
  item.putBoolean("simulated", reader.isSimulated)
  item.putString("locationStatus", mapFromLocationStatus(reader.locationStatus))
  item.putString("ipAddress", reader.ipAddress)
  item.putString("baseUrl", reader.baseUrl)
  item.putString("bootloaderVersion", reader.bootloaderVersion)
  item.putString("configVersion", reader.configVersion)
  item.putString("emvKeyProfileId", reader.emvKeyProfileId)
  item.putString("firmwareVersion", reader.firmwareVersion)
  item.putString("hardwareVersion", reader.hardwareVersion)
  item.putString("macKeyProfileId", reader.macKeyProfileId)
  item.putString("pinKeyProfileId", reader.pinKeyProfileId)
  item.putString("trackKeyProfileId", reader.trackKeyProfileId)
  item.putString("settingsVersion", reader.settingsVersion)
  item.putString("pinKeysetId", reader.pinKeysetId)

  item.putMap("availableUpdate", mapFromReaderSoftwareUpdate(reader.availableUpdate))
  item.putMap("location", mapFromLocation(reader.location))
  item.putString("status", mapFromNetworkStatus(reader.networkStatus))
  putDoubleOrNull(item, "batteryLevel", reader.batteryLevel?.toDouble())

  return item
}

internal fun mapFromNetworkStatus(status: Reader.NetworkStatus?): String? {
  return when (status) {
    Reader.NetworkStatus.OFFLINE -> "offline"
    Reader.NetworkStatus.ONLINE -> "online"
    else -> "unknown"
  }
}

internal fun mapFromDeviceType(type: DeviceType): String {
  return when (type) {
    DeviceType.CHIPPER_2X -> "chipper2X"
    DeviceType.COTS_DEVICE -> "cotsDevice"
    DeviceType.STRIPE_M2 -> "stripeM2"
    DeviceType.UNKNOWN -> "unknown"
    DeviceType.VERIFONE_P400 -> "verifoneP400"
    DeviceType.WISEPAD_3 -> "wisePad3"
    DeviceType.WISEPOS_E -> "wisePosE"
    else -> "unknown"
  }
}

internal fun mapFromLocationStatus(status: LocationStatus): String {
  return when (status) {
    LocationStatus.NOT_SET -> "notSet"
    LocationStatus.SET -> "set"
    LocationStatus.UNKNOWN -> "unknown"
    else -> "unknown"
  }
}
internal fun mapToDiscoveryMethod(method: String?): DiscoveryMethod {
  return when (method) {
    "bluetoothScan" -> DiscoveryMethod.BLUETOOTH_SCAN
    "internet" -> DiscoveryMethod.INTERNET
    "embedded" -> DiscoveryMethod.EMBEDDED
    "localMobile" -> DiscoveryMethod.LOCAL_MOBILE
    "handoff" -> DiscoveryMethod.HANDOFF
    else -> DiscoveryMethod.INTERNET
  }
}

internal fun createResult(key: String, value: WritableMap): WritableMap {
  val map = WritableNativeMap()
  map.putMap(key, value)
  return map
}

internal fun mapFromPaymentIntent(paymentIntent: PaymentIntent): WritableMap {
  val item: WritableMap = WritableNativeMap()
  item.putInt("amount", paymentIntent.amount.toInt())
  item.putString("currency", paymentIntent.currency)
  item.putString("id", paymentIntent.id)
  item.putString("description", paymentIntent.description)
  item.putString("status", mapFromPaymentIntentStatus(paymentIntent.status))
  item.putArray("charges", mapFromChargesList(paymentIntent.getCharges()))
  item.putString("created", convertToUnixTimestamp(paymentIntent.created))

  return item
}

internal fun mapFromSetupIntent(setupIntent: SetupIntent): WritableMap {
  val item: WritableMap = WritableNativeMap()
  item.putString("created", convertToUnixTimestamp(setupIntent.created))
  item.putString("id", setupIntent.id)
  item.putString("status", mapFromSetupIntentStatus(setupIntent.status))
  item.putMap("latestAttempt", mapFromSetupAttempt(setupIntent.latestAttempt))
  item.putString("usage", mapFromSetupIntentUsage(setupIntent.usage))
  item.putString("applicationId", setupIntent.applicationId)
  item.putString("clientSecret", setupIntent.clientSecret)
  item.putString("description", setupIntent.description)
  item.putString("mandateId", setupIntent.mandateId)
  item.putString("onBehalfOfId", setupIntent.onBehalfOfId)
  item.putString("paymentMethodId", setupIntent.paymentMethodId)
  item.putString("singleUseMandateId", setupIntent.singleUseMandateId)

  return item
}

internal fun mapFromSetupAttempt(attempt: SetupAttempt?): WritableMap? {
  val unwrappedAttempt = attempt ?: run {
    return null
  }
  val item: WritableMap = WritableNativeMap()
  item.putString("created", convertToUnixTimestamp(unwrappedAttempt.created))
  item.putString("id", unwrappedAttempt.id)
  item.putString("status", mapFromSetupAttemptStatus(unwrappedAttempt.status))
  item.putString("usage", mapFromSetupIntentUsage(unwrappedAttempt.usage))
  item.putBoolean("isLiveMode", unwrappedAttempt.isLiveMode)
  item.putMap("paymentMethodDetails", mapFromSetupIntentPaymentMethodDetails(unwrappedAttempt.paymentMethodDetails))
  item.putString("customer", unwrappedAttempt.customerId)
  item.putString("setupIntentId", unwrappedAttempt.setupIntentId)
  item.putString("onBehalfOfId", unwrappedAttempt.onBehalfOfId)
  item.putString("applicationId", unwrappedAttempt.applicationId)
  item.putString("paymentMethodId", unwrappedAttempt.paymentMethodId)

  return item
}

internal fun mapFromSetupIntentPaymentMethodDetails(details: SetupIntentPaymentMethodDetails): WritableMap {
  val item: WritableMap = WritableNativeMap()
  item.putMap("cardPresent", mapFromSetupIntentCardPresentDetails(details.cardPresentDetails))
  item.putMap("interacPresent", mapFromSetupIntentCardPresentDetails(details.interacPresentDetails))

  return item
}

internal fun mapFromSetupIntentCardPresentDetails(details: SetupIntentCardPresentDetails?): WritableMap? {
  val unwrappedDetails = details ?: run {
    return null
  }
  val item: WritableMap = WritableNativeMap()
  item.putString("emvAuthData", unwrappedDetails.emvAuthData)
  item.putString("generatedCard", unwrappedDetails.generatedCard)

  return item
}

internal fun mapFromSetupIntentUsage(usage: SetupIntentUsage?): String? {
  val unwrappedUsage = usage ?: run {
    return null
  }
  return when (unwrappedUsage) {
    SetupIntentUsage.OFF_SESSION -> "offSession"
    SetupIntentUsage.ON_SESSION -> "onSession"
    else -> "unknown"
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
    else -> "unknown"
  }
}

internal fun mapFromChargesList(charges: List<Charge>): WritableArray {
  val list: WritableArray = WritableNativeArray()

  charges.forEach {
    val reader = mapFromCharge(it)
    list.pushMap(reader)
  }

  return list
}

internal fun mapFromListLocations(locations: List<Location>): WritableArray {
  val list: WritableArray = WritableNativeArray()

  locations.forEach {
    mapFromLocation(it)?.let { location ->
      list.pushMap(location)
    }
  }

  return list
}

internal fun mapFromReaderInputOptions(options: ReaderInputOptions): WritableArray {
  val mappedOptions: WritableArray = WritableNativeArray()
  val optionsArray = options.toString().split('/')
  optionsArray.forEach {
    when (it.trim()) {
      "Insert" -> mappedOptions.pushString("insertCard")
      "Swipe" -> mappedOptions.pushString("swipeCard")
      "Tap" -> mappedOptions.pushString("tapCard")
    }
  }
  return mappedOptions
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
    else -> "unknown"
  }
}

internal fun mapFromCharge(reader: Charge): WritableMap {
  val item: WritableMap = WritableNativeMap()
  item.putString("id", reader.id)
  item.putString("status", reader.status)
  item.putString("currency", reader.currency)
  item.putInt("amount", reader.amount.toInt())
  item.putString("description", reader.description)

  return item
}

internal fun mapFromLocation(location: Location?): WritableMap? {
  val unwrappedLocation = location ?: run {
    return null
  }
  val item: WritableMap = WritableNativeMap()
  item.putString("id", unwrappedLocation.id)
  item.putString("displayName", unwrappedLocation.displayName)

  mapFromAddress(unwrappedLocation.address)?.let {
    item.putMap("address", it)
  } ?: run {
    item.putNull("address")
  }

  unwrappedLocation.livemode?.let {
    item.putBoolean("livemode", it)
  } ?: run {
    item.putNull("livemode")
  }

  return item
}

internal fun mapFromAddress(address: Address?): WritableMap? {
  if (address == null) {
    return null
  }
  val item: WritableMap = WritableNativeMap()
  item.putString("country", address.country)
  item.putString("city", address.city)
  item.putString("postalCode", address.postalCode)
  item.putString("line1", address.line1)
  item.putString("line2", address.line2)
  item.putString("state", address.state)

  return item
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
    else -> "unknown"
  }
}

internal fun mapFromPaymentStatus(status: PaymentStatus): String {
  return when (status) {
    PaymentStatus.NOT_READY -> "notReady"
    PaymentStatus.PROCESSING -> "processing"
    PaymentStatus.READY -> "ready"
    PaymentStatus.WAITING_FOR_INPUT -> "waitingForInput"
    else -> "unknown"
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
    else -> SimulateReaderUpdate.NONE
  }
}


private fun convertToUnixTimestamp(timestamp: Long): String {
  return (timestamp * 1000).toString()
}

internal fun mapFromReaderSoftwareUpdate(update: ReaderSoftwareUpdate?): ReadableMap? {
  val unwrappedUpdate = update ?: run {
    return null
  }
  val result = WritableNativeMap()
  result.putString("deviceSoftwareVersion", unwrappedUpdate.version)
  result.putString("estimatedUpdateTime", mapFromUpdateTimeEstimate(unwrappedUpdate.timeEstimate))
  result.putString("requiredAt", convertToUnixTimestamp(unwrappedUpdate.requiredAt.time))
  return result
}

internal fun mapFromUpdateTimeEstimate(time: ReaderSoftwareUpdate.UpdateTimeEstimate): String {
  return when (time) {
    ReaderSoftwareUpdate.UpdateTimeEstimate.FIVE_TO_FIFTEEN_MINUTES -> "estimate5To15Minutes"
    ReaderSoftwareUpdate.UpdateTimeEstimate.LESS_THAN_ONE_MINUTE -> "estimateLessThan1Minute"
    ReaderSoftwareUpdate.UpdateTimeEstimate.ONE_TO_TWO_MINUTES -> "estimate1To2Minutes"
    ReaderSoftwareUpdate.UpdateTimeEstimate.TWO_TO_FIVE_MINUTES -> "estimate2To5Minutes"
    else -> "unknown"
  }
}

internal fun mapToCartLineItems(cartLineItems: ReadableArray): List<CartLineItem> {
  val items: MutableList<CartLineItem> = mutableListOf()

  cartLineItems.toArrayList().forEach {
    (it as HashMap<*, *>?)?.let { item ->
      mapToCartLineItem(item)?.let { cartLineItem ->
        items.add(cartLineItem)
      }
    }
  }

  return items
}

internal fun mapToCartLineItem(cartLineItem: HashMap<*, *>): CartLineItem? {
  val displayName = cartLineItem["displayName"] as String? ?: run { return null }
  val quantity = cartLineItem["quantity"] as Double? ?: run { return null }
  val amount = cartLineItem["amount"] as Double? ?: run { return null }

  return CartLineItem.Builder(displayName, amount.toInt(), quantity.toLong()).build()
}

internal fun mapFromRefund(refund: Refund): WritableMap {
  val item: WritableMap = WritableNativeMap()

  putIntOrNull(item, "amount", refund.amount?.toInt())
  item.putString("balanceTransaction", refund.balanceTransaction)
  item.putString("chargeId", refund.chargeId)
  item.putString("currency", refund.currency)
  item.putString("paymentIntentId", refund.paymentIntentId)
  item.putString("description", refund.description)
  item.putString("failureBalanceTransaction", refund.failureBalanceTransaction)
  item.putString("failureReason", refund.failureReason)
  item.putString("id", refund.id)
  item.putString("reason", refund.reason)
  item.putString("receiptNumber", refund.receiptNumber)
  item.putString("status", refund.status)
  item.putString("sourceTransferReversal", refund.sourceTransferReversal)
  item.putString("transferReversal", refund.transferReversal)

  return item
}

internal fun mapFromCardDetails(cardDetails: CardDetails?): WritableMap {
  val item: WritableMap = WritableNativeMap()
  item.putString("brand", cardDetails?.brand)
  item.putString("country", cardDetails?.country)
  item.putInt("expMonth", cardDetails?.expMonth ?: 0)
  item.putInt("expYear", cardDetails?.expYear ?: 0)
  item.putString("fingerprint", cardDetails?.fingerprint)
  item.putString("funding", cardDetails?.funding)
  item.putString("last4", cardDetails?.last4)
  return item
}

internal fun mapFromPaymentMethod(paymentMethod: PaymentMethod): WritableMap {
  val item: WritableMap = WritableNativeMap()
  item.putString("id", paymentMethod.id)
  item.putString("customer", paymentMethod.customer)
  item.putBoolean("livemode", paymentMethod.livemode)
  item.putMap("cardDetails", mapFromCardDetails(paymentMethod.cardDetails))

  return item
}
