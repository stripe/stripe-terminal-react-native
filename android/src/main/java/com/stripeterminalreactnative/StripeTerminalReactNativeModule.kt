package com.stripeterminalreactnative

import android.annotation.SuppressLint
import android.app.Application
import android.content.ComponentCallbacks2
import android.content.res.Configuration
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.stripe.stripeterminal.Terminal
import com.stripe.stripeterminal.TerminalApplicationDelegate.onCreate
import com.stripe.stripeterminal.external.OfflineMode
import com.stripe.stripeterminal.external.callable.Cancelable
import com.stripe.stripeterminal.external.callable.ReaderListenable
import com.stripe.stripeterminal.external.models.CaptureMethod
import com.stripe.stripeterminal.external.models.CardPresentParameters
import com.stripe.stripeterminal.external.models.CardPresentRoutingOptionParameters
import com.stripe.stripeterminal.external.models.Cart
import com.stripe.stripeterminal.external.models.CollectConfiguration
import com.stripe.stripeterminal.external.models.CreateConfiguration
import com.stripe.stripeterminal.external.models.DiscoveryConfiguration
import com.stripe.stripeterminal.external.models.ListLocationsParameters
import com.stripe.stripeterminal.external.models.OfflineBehavior
import com.stripe.stripeterminal.external.models.PaymentIntent
import com.stripe.stripeterminal.external.models.PaymentIntentParameters
import com.stripe.stripeterminal.external.models.PaymentMethodOptionsParameters
import com.stripe.stripeterminal.external.models.PaymentMethodType
import com.stripe.stripeterminal.external.models.Reader
import com.stripe.stripeterminal.external.models.RefundConfiguration
import com.stripe.stripeterminal.external.models.RefundParameters
import com.stripe.stripeterminal.external.models.RoutingPriority
import com.stripe.stripeterminal.external.models.SetupIntent
import com.stripe.stripeterminal.external.models.SetupIntentCancellationParameters
import com.stripe.stripeterminal.external.models.SetupIntentConfiguration
import com.stripe.stripeterminal.external.models.SetupIntentParameters
import com.stripe.stripeterminal.external.models.SimulatedCard
import com.stripe.stripeterminal.external.models.SimulatorConfiguration
import com.stripe.stripeterminal.external.models.TippingConfiguration
import com.stripeterminalreactnative.callback.NoOpCallback
import com.stripeterminalreactnative.callback.RNLocationListCallback
import com.stripeterminalreactnative.callback.RNPaymentIntentCallback
import com.stripeterminalreactnative.callback.RNRefundCallback
import com.stripeterminalreactnative.callback.RNSetupIntentCallback
import com.stripeterminalreactnative.ktx.connectReader
import com.stripeterminalreactnative.listener.RNBluetoothReaderListener
import com.stripeterminalreactnative.listener.RNDiscoveryListener
import com.stripeterminalreactnative.listener.RNHandoffReaderListener
import com.stripeterminalreactnative.listener.RNOfflineListener
import com.stripeterminalreactnative.listener.RNReaderReconnectionListener
import com.stripeterminalreactnative.listener.RNTerminalListener
import com.stripeterminalreactnative.listener.RNUsbReaderListener
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.UUID
import kotlin.collections.HashMap


class StripeTerminalReactNativeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
    private var discoveredReadersList: List<Reader> = listOf()
    private var discoverCancelable: Cancelable? = null
    private var collectPaymentMethodCancelable: Cancelable? = null
    private var collectRefundPaymentMethodCancelable: Cancelable? = null
    private var collectSetupIntentCancelable: Cancelable? = null
    private var installUpdateCancelable: Cancelable? = null
    private var cancelReaderConnectionCancellable: Cancelable? = null

    private var paymentIntents: HashMap<String, PaymentIntent?> = HashMap()
    private var setupIntents: HashMap<String, SetupIntent?> = HashMap()

    private val tokenProvider: TokenProvider = TokenProvider(context)

    private val terminal: Terminal
        get() = Terminal.getInstance()

    private val context: ReactApplicationContext
        get() = reactApplicationContext

    init {
        context.registerComponentCallbacks(
            object : ComponentCallbacks2 {
                override fun onTrimMemory(level: Int) {}
                override fun onLowMemory() {}
                override fun onConfigurationChanged(p0: Configuration) {}
            })
    }

    override fun getConstants(): MutableMap<String, Any> =
        ReactNativeConstants.values().associate { it.name to it.listenerName }.toMutableMap()

    override fun getName(): String = "StripeTerminalReactNative"

    @OptIn(OfflineMode::class)
    @ReactMethod
    @Suppress("unused")
    fun initialize(params: ReadableMap, promise: Promise) = withExceptionResolver(promise) {
        UiThreadUtil.runOnUiThread { onCreate(context.applicationContext as Application) }

        val result = if (!Terminal.isInitialized()) {
            Terminal.initTerminal(
                this.context.applicationContext,
                mapToLogLevel(params.getString("logLevel")),
                tokenProvider,
                RNTerminalListener(context),
                RNOfflineListener(context),
            )
            NativeTypeFactory.writableNativeMap()
        } else {
            nativeMapOf {
                terminal.connectedReader?.let {
                    putMap("reader", mapFromReader(it))
                }
            }
        }
        promise.resolve(result)
    }

    @ReactMethod
    @Suppress("unused")
    fun cancelCollectPaymentMethod(promise: Promise) {
        cancelOperation(promise, collectPaymentMethodCancelable, "collectPaymentMethod")
    }

    @ReactMethod
    @Suppress("unused")
    fun cancelCollectSetupIntent(promise: Promise) {
        cancelOperation(promise, collectSetupIntentCancelable, "collectSetupIntent")
    }

    @ReactMethod
    @Suppress("unused")
    fun cancelCollectRefundPaymentMethod(promise: Promise) {
        cancelOperation(promise, collectRefundPaymentMethodCancelable, "collectRefundPaymentMethod")
    }

    @ReactMethod
    @Suppress("unused")
    fun simulateReaderUpdate(update: String, promise: Promise) {
        val updateMapped = mapFromSimulateReaderUpdate(update)
        terminal.simulatorConfiguration = SimulatorConfiguration(updateMapped)
        promise.resolve(NativeTypeFactory.writableNativeMap())
    }

    @ReactMethod
    @Suppress("unused")
    fun setSimulatedCard(cardNumber: String, promise: Promise) {
        terminal.simulatorConfiguration = SimulatorConfiguration(
            terminal.simulatorConfiguration.update,
            SimulatedCard(testCardNumber = cardNumber)
        )
        promise.resolve(NativeTypeFactory.writableNativeMap())
    }

    @ReactMethod
    @Suppress("unused")
    fun setConnectionToken(params: ReadableMap, promise: Promise) {
        tokenProvider.setConnectionToken(
            token = params.getString("token"),
            error = params.getString("error"),
        )
        promise.resolve(null)
    }

    @SuppressLint("MissingPermission")
    @ReactMethod
    @Suppress("unused")
    fun discoverReaders(params: ReadableMap, promise: Promise) = withExceptionResolver(promise) {
        val discoveryMethodParam = requireParam(params.getString("discoveryMethod")) {
            "You must provide a discoveryMethod"
        }
        val discoveryMethod = requireParam(mapToDiscoveryMethod(discoveryMethodParam)) {
            "Unknown discoveryMethod: $discoveryMethodParam"
        }

        val listener = RNDiscoveryListener(
            context,
            promise,
            { discoveredReadersList = it },
            { discoverCancelable = null }
        )

        throwIfBusy(discoverCancelable) {
            busyMessage("discoverReaders", "discoverReaders")
        }

        discoverCancelable = terminal.discoverReaders(
            config = when(discoveryMethod) {
                DiscoveryMethod.BLUETOOTH_SCAN -> DiscoveryConfiguration.BluetoothDiscoveryConfiguration(0, getBoolean(params, "simulated"))
                DiscoveryMethod.INTERNET -> DiscoveryConfiguration.InternetDiscoveryConfiguration(isSimulated = getBoolean(params, "simulated"))
                DiscoveryMethod.USB -> DiscoveryConfiguration.UsbDiscoveryConfiguration(0, getBoolean(params, "simulated"))
                DiscoveryMethod.HANDOFF -> DiscoveryConfiguration.HandoffDiscoveryConfiguration()
                DiscoveryMethod.LOCAL_MOBILE -> DiscoveryConfiguration.LocalMobileDiscoveryConfiguration(getBoolean(params, "simulated")) },
            listener,
            listener
        )
    }

    @ReactMethod
    @Suppress("unused")
    fun cancelDiscovering(promise: Promise) {
        cancelOperation(promise, discoverCancelable, "discoverReaders") {
            discoverCancelable = null
        }
    }

    private fun connectReader(
        params: ReadableMap,
        promise: Promise,
        discoveryMethod: DiscoveryMethod,
        listener: ReaderListenable? = null
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            withSuspendExceptionResolver(promise) {
                val reader = requireParam(params.getMap("reader")) {
                    "You must provide a reader"
                }

                val serialNumber = reader.getString("serialNumber")

                val selectedReader = requireParam(discoveredReadersList.find {
                    it.serialNumber == serialNumber
                }) {
                    "Could not find a reader with serialNumber $serialNumber"
                }

                val locationId =
                    params.getString("locationId") ?: selectedReader.location?.id.orEmpty()

                val autoReconnectOnUnexpectedDisconnect = if (discoveryMethod == DiscoveryMethod.BLUETOOTH_SCAN || discoveryMethod == DiscoveryMethod.USB) {
                    getBoolean(params,"autoReconnectOnUnexpectedDisconnect")
                } else false

                val reconnectionListener = RNReaderReconnectionListener(context) {
                    cancelReaderConnectionCancellable = it
                }
                val connectedReader =
                    terminal.connectReader(
                        discoveryMethod,
                        selectedReader,
                        locationId,
                        autoReconnectOnUnexpectedDisconnect,
                        listener,
                        reconnectionListener
                    )
                promise.resolve(
                    nativeMapOf {
                        putMap("reader", mapFromReader(connectedReader))
                    }
                )
            }
        }
    }

    @ReactMethod
    @Suppress("unused")
    fun connectBluetoothReader(params: ReadableMap, promise: Promise) {
        val listener = RNBluetoothReaderListener(context) {
            installUpdateCancelable = it
        }
        connectReader(params, promise, DiscoveryMethod.BLUETOOTH_SCAN, listener)
    }

    @ReactMethod
    @Suppress("unused")
    fun connectHandoffReader(params: ReadableMap, promise: Promise) {
        val listener = RNHandoffReaderListener(context)
        connectReader(params, promise, DiscoveryMethod.HANDOFF, listener)
    }

    @ReactMethod
    @Suppress("unused")
    fun connectInternetReader(params: ReadableMap, promise: Promise) {
        connectReader(params, promise, DiscoveryMethod.INTERNET)
    }

    @ReactMethod
    @Suppress("unused")
    fun connectLocalMobileReader(params: ReadableMap, promise: Promise) {
        connectReader(params, promise, DiscoveryMethod.LOCAL_MOBILE)
    }

    @ReactMethod
    @Suppress("unused")
    fun connectUsbReader(params: ReadableMap, promise: Promise) {
        val listener = RNUsbReaderListener(context) {
            installUpdateCancelable = it
        }
        connectReader(params, promise, DiscoveryMethod.USB, listener)
    }

    @ReactMethod
    @Suppress("unused")
    fun disconnectReader(promise: Promise) {
        paymentIntents.clear()
        terminal.disconnectReader(NoOpCallback(promise))
    }

    @ReactMethod
    @Suppress("unused")
    fun cancelReaderReconnection(promise: Promise) {
        cancelOperation(promise, cancelReaderConnectionCancellable, "readerReconnection")
    }

    @OptIn(OfflineMode::class)
    @ReactMethod
    @Suppress("unused")
    fun createPaymentIntent(params: ReadableMap, promise: Promise) {
        val amount = getInt(params, "amount") ?: 0
        val currency = params.getString("currency") ?: ""
        val paymentMethods = params.getArray("paymentMethodTypes")
        val setupFutureUsage = params.getString("setupFutureUsage")
        val onBehalfOf = params.getString("onBehalfOf")
        val transferDataDestination = params.getString("transferDataDestination")
        val applicationFeeAmount = getInt(params, "applicationFeeAmount")
        val stripeDescription = params.getString("stripeDescription")
        val statementDescriptor = params.getString("statementDescriptor")
        val receiptEmail = params.getString("receiptEmail")
        val customer = params.getString("customer")
        val transferGroup = params.getString("transferGroup")
        val metadata = params.getMap("metadata")
        val paymentMethodOptions = params.getMap("paymentMethodOptions")
        val extendedAuth = getBoolean(paymentMethodOptions, "requestExtendedAuthorization")
        val incrementalAuth =
            getBoolean(paymentMethodOptions, "requestIncrementalAuthorizationSupport")
        val requestedPriority = paymentMethodOptions?.getString("requestedPriority")
        val captureMethod = params.getString("captureMethod")
        val offlineBehavior = params.getString("offlineBehavior")
        val offlineModeTransactionLimit = params.getInt("offlineModeTransactionLimit")
        val offlineModeStoredTransactionLimit = params.getInt("offlineModeStoredTransactionLimit")

        val paymentMethodTypes = paymentMethods?.toArrayList()?.mapNotNull {
            if (it is String) PaymentMethodType.valueOf(it.uppercase())
            else null
        }

        val intentParams = paymentMethodTypes?.let {
            PaymentIntentParameters.Builder(
                paymentMethodTypes
            )
        } ?: run {
            PaymentIntentParameters.Builder()
        }

        stripeDescription?.let {
            intentParams.setDescription(it)
        }
        statementDescriptor?.let {
            intentParams.setStatementDescriptor(it)
        }
        receiptEmail?.let {
            intentParams.setReceiptEmail(it)
        }
        customer?.let {
            intentParams.setCustomer(it)
        }
        transferGroup?.let {
            intentParams.setTransferGroup(it)
        }
        metadata?.let {
            val map = it.toHashMap().toMap() as Map<String, String>
            intentParams.setMetadata(map)
        }
        onBehalfOf?.let {
            intentParams.setOnBehalfOf(it)
        }
        transferDataDestination?.let {
            intentParams.setTransferDataDestination(it)
        }
        applicationFeeAmount?.let {
            intentParams.setApplicationFeeAmount(it.toLong())
        }

        intentParams.setAmount(amount.toLong())
        intentParams.setCurrency(currency)

        setupFutureUsage?.let {
            intentParams.setSetupFutureUsage(it)
        }

        val routingPriority = when (requestedPriority) {
            "domestic" -> CardPresentRoutingOptionParameters(RoutingPriority.DOMESTIC)
            "international" -> CardPresentRoutingOptionParameters(RoutingPriority.INTERNATIONAL)
            else -> CardPresentRoutingOptionParameters(null)
        }

        val cardPresentParams = CardPresentParameters.Builder()
            .setRequestExtendedAuthorization(extendedAuth)
            .setRequestIncrementalAuthorizationSupport(incrementalAuth)
            .setRouting(routingPriority)

        intentParams.setPaymentMethodOptionsParameters(
            PaymentMethodOptionsParameters.Builder()
                .setCardPresentParameters(cardPresentParams.build())
                .build()
        )

        captureMethod?.let {
            when (it) {
                "manual" -> intentParams.setCaptureMethod(CaptureMethod.Manual)
                else -> intentParams.setCaptureMethod(CaptureMethod.Automatic)
            }
        }

        val offlineBehaviorParam = if (amount > offlineModeTransactionLimit || (terminal.offlineStatus.sdk.offlinePaymentAmountsByCurrency[currency]?.toInt()
                ?: 0) > offlineModeStoredTransactionLimit) { OfflineBehavior.REQUIRE_ONLINE }
            else {
                offlineBehavior.let {
                    when (it) {
                        "prefer_online" -> OfflineBehavior.PREFER_ONLINE
                        "require_online" -> OfflineBehavior.REQUIRE_ONLINE
                        "force_offline" -> OfflineBehavior.FORCE_OFFLINE
                        else -> OfflineBehavior.PREFER_ONLINE
                }
            }
        }

        val uuid = UUID.randomUUID().toString()

        terminal.createPaymentIntent(intentParams.build(), RNPaymentIntentCallback(promise, uuid) { pi ->
            paymentIntents[uuid] = pi
        }, CreateConfiguration(offlineBehaviorParam))
    }

    @OptIn(OfflineMode::class)
    @ReactMethod
    @Suppress("unused")
    fun collectPaymentMethod(params: ReadableMap, promise: Promise) =
        withExceptionResolver(promise) {
            val paymentIntentJson = requireParam(params.getMap("paymentIntent")) {
                "You must provide a paymentIntent"
            }
            val uuid = requireParam(paymentIntentJson.getString("sdk_uuid")) {
                "The PaymentIntent is missing sdk_uuid field. This method requires you to use the PaymentIntent that was returned from either createPaymentIntent or retrievePaymentIntent."
            }
            val paymentIntent = requireParam(paymentIntents[uuid]) {
                "No PaymentIntent was found with the sdk_uuid $uuid. The PaymentIntent provided must be re-retrieved with retrievePaymentIntent or a new PaymentIntent must be created with createPaymentIntent."
            }

            val configBuilder = CollectConfiguration.Builder()
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
            if (params.hasKey("enableCustomerCancellation")) {
                configBuilder.setEnableCustomerCancellation(getBoolean(params, "enableCustomerCancellation"))
            }
            val config = configBuilder.build()

            collectPaymentMethodCancelable = terminal.collectPaymentMethod(
                paymentIntent,
                RNPaymentIntentCallback(promise, uuid) { pi ->
                    paymentIntents[uuid] = pi
                },
                config
            )
        }

    @OptIn(OfflineMode::class)
    @ReactMethod
    @Suppress("unused")
    fun retrievePaymentIntent(clientSecret: String, promise: Promise) {
        val uuid = UUID.randomUUID().toString()
        terminal.retrievePaymentIntent(clientSecret, RNPaymentIntentCallback(promise, uuid) { pi ->
            paymentIntents[uuid] = pi
        })
    }

    @ReactMethod
    @Suppress("unused")
    fun confirmPaymentIntent(paymentIntent: ReadableMap, promise: Promise) = withExceptionResolver(promise) {
        val uuid = requireParam(paymentIntent.getString("sdk_uuid")) {
            "The PaymentIntent is missing sdk_uuid field. This method requires you to use the PaymentIntent that was returned from either createPaymentIntent or retrievePaymentIntent."
        }
        val paymentIntent = requireParam(paymentIntents[uuid]) {
            "No PaymentIntent was found with the sdk_uuid $uuid. The PaymentIntent provided must be re-retrieved with retrievePaymentIntent or a new PaymentIntent must be created with createPaymentIntent."
        }

        terminal.confirmPaymentIntent(paymentIntent, RNPaymentIntentCallback(promise, uuid) {
            paymentIntents.clear()
        })
    }

    @ReactMethod
    @Suppress("unused")
    fun getLocations(params: ReadableMap, promise: Promise) {
        val listParameters = ListLocationsParameters.Builder().apply {
            endingBefore = params.getString("endingBefore")
            startingAfter = params.getString("startingAfter")
            limit = getInt(params, "endingBefore")
        }
        terminal.listLocations(listParameters.build(), RNLocationListCallback(promise))
    }

    @ReactMethod
    @Suppress("unused")
    fun createSetupIntent(params: ReadableMap, promise: Promise) {
        val intentParams = params.getString("customer")?.let { customerId ->
            SetupIntentParameters.Builder().setCustomer(customerId).build()
        } ?: SetupIntentParameters.NULL

        val uuid = UUID.randomUUID().toString()
        terminal.createSetupIntent(intentParams, RNSetupIntentCallback(promise, uuid) {
            setupIntents[uuid] = it
        })
    }

    @ReactMethod
    @Suppress("unused")
    fun retrieveSetupIntent(clientSecret: String, promise: Promise) {
        val uuid = UUID.randomUUID().toString()
        terminal.retrieveSetupIntent(clientSecret, RNSetupIntentCallback(promise, uuid) {
            setupIntents[uuid] = it
        })
    }

    @OptIn(OfflineMode::class)
    @ReactMethod
    @Suppress("unused")
    fun cancelPaymentIntent(paymentIntent: ReadableMap, promise: Promise) =
        withExceptionResolver(promise) {
            val uuid = requireParam(paymentIntent.getString("sdk_uuid")) {
                "The PaymentIntent is missing sdk_uuid field. This method requires you to use the PaymentIntent that was returned from either createPaymentIntent or retrievePaymentIntent."
            }
            val paymentIntent = requireParam(paymentIntents[uuid]) {
                "No PaymentIntent was found with the sdk_uuid $uuid. The PaymentIntent provided must be re-retrieved with retrievePaymentIntent or a new PaymentIntent must be created with createPaymentIntent."
            }

            terminal.cancelPaymentIntent(paymentIntent, RNPaymentIntentCallback(promise, uuid) {
                paymentIntents[uuid] = null
            })
        }

    @ReactMethod
    @Suppress("unused")
    fun collectSetupIntentPaymentMethod(params: ReadableMap, promise: Promise) =
        withExceptionResolver(promise) {
            val setupIntentJson = requireParam(params.getMap("setupIntent")) {
                "You must provide a setupIntent"
            }
            val uuid = requireParam(setupIntentJson.getString("sdk_uuid")) {
                "The SetupIntent is missing sdk_uuid field. This method requires you to use the SetupIntent that was returned from either createPaymentIntent or retrievePaymentIntent."
            }
            val setupIntent = requireParam(setupIntents[uuid]) {
                "No SetupIntent was found with the sdk_uuid $uuid. The SetupIntent provided must be re-retrieved with retrieveSetupIntent or a new SetupIntent must be created with createSetupIntent."
            }

            val customerConsentCollected = getBoolean(params, "customerConsentCollected")
            val enableCustomerCancellation = getBoolean(params, "enableCustomerCancellation")

            collectSetupIntentCancelable = terminal.collectSetupIntentPaymentMethod(
                setupIntent,
                customerConsentCollected,
                SetupIntentConfiguration.Builder()
                    .setEnableCustomerCancellation(enableCustomerCancellation)
                    .build(),
                RNSetupIntentCallback(promise, uuid) { setupIntents[uuid] = it }
            )
        }

    @ReactMethod
    @Suppress("unused")
    fun installAvailableUpdate(promise: Promise) {
        terminal.installAvailableUpdate()
        promise.resolve(NativeTypeFactory.writableNativeMap())
    }

    @ReactMethod
    @Suppress("unused")
    fun cancelInstallingUpdate(promise: Promise) {
        cancelOperation(promise, installUpdateCancelable, "installUpdate")
    }

    @ReactMethod
    @Suppress("unused")
    fun setReaderDisplay(params: ReadableMap, promise: Promise) = withExceptionResolver(promise) {
        val currency = requireParam(params.getString("currency")) {
            "You must provide a currency value"
        }
        val tax = requireParam(getInt(params, "tax")?.toLong()) {
            "You must provide a tax value"
        }
        val total = requireParam(getInt(params, "total")?.toLong()) {
            "You must provide a total value"
        }

        val cartLineItems =
            mapToCartLineItems(params.getArray("lineItems") ?: NativeTypeFactory.writableNativeArray())

        val cart = Cart.Builder(
            currency = currency,
            tax = tax,
            total = total,
            lineItems = cartLineItems
        ).build()

        terminal.setReaderDisplay(cart, NoOpCallback(promise))
    }

    @ReactMethod
    @Suppress("unused")
    fun cancelSetupIntent(setupIntent: ReadableMap, promise: Promise) =
        withExceptionResolver(promise) {
            val uuid = requireParam(setupIntent.getString("sdk_uuid")) {
                "The SetupIntent is missing sdk_uuid field. This method requires you to use the SetupIntent that was returned from either createPaymentIntent or retrievePaymentIntent."
            }
            val setupIntent = requireParam(setupIntents[uuid]) {
                "No SetupIntent was found with the sdk_uuid $uuid. The SetupIntent provided must be re-retrieved with retrieveSetupIntent or a new SetupIntent must be created with createSetupIntent."
            }

            val params = SetupIntentCancellationParameters.Builder().build()

            terminal.cancelSetupIntent(setupIntent, params, RNSetupIntentCallback(promise, uuid) {
                setupIntents[setupIntent.id] = null
            })
        }

    @ReactMethod
    @Suppress("unused")
    fun confirmSetupIntent(setupIntent: ReadableMap, promise: Promise) =
        withExceptionResolver(promise) {
            val uuid = requireParam(setupIntent.getString("sdk_uuid")) {
                "The SetupIntent is missing sdk_uuid field. This method requires you to use the SetupIntent that was returned from either createPaymentIntent or retrievePaymentIntent."
            }
            val setupIntent = requireParam(setupIntents[uuid]) {
                "No SetupIntent was found with the sdk_uuid $uuid. The SetupIntent provided must be re-retrieved with retrieveSetupIntent or a new SetupIntent must be created with createSetupIntent."
            }

            terminal.confirmSetupIntent(setupIntent, RNSetupIntentCallback(promise, uuid) {
                setupIntents[it.id] = null
            })
        }

    @ReactMethod
    @Suppress("unused")
    fun clearReaderDisplay(promise: Promise) {
        terminal.clearReaderDisplay(NoOpCallback(promise))
    }

    @ReactMethod
    @Suppress("unused")
    fun collectRefundPaymentMethod(params: ReadableMap, promise: Promise) =
        withExceptionResolver(promise) {
            val chargeId = requireParam(params.getString("chargeId")) {
                "You must provide a chargeId"
            }
            val amount = requireParam(getInt(params, "amount")?.toLong()) {
                "You must provide an amount"
            }
            val currency = requireParam(params.getString("currency")) {
                "You must provide a currency value"
            }
            val refundApplicationFee = params.getBoolean("refundApplicationFee")
            val reverseTransfer = params.getBoolean("reverseTransfer")

            val intentParamsBuild = RefundParameters.Builder(chargeId, amount, currency)
            intentParamsBuild.setRefundApplicationFee(refundApplicationFee)
                .setReverseTransfer(reverseTransfer)
            val intentParams = intentParamsBuild.build()

            val enableCustomerCancellation = getBoolean(params, "enableCustomerCancellation")

            collectRefundPaymentMethodCancelable = terminal.collectRefundPaymentMethod(
                intentParams,
                RefundConfiguration.Builder().setEnableCustomerCancellation(enableCustomerCancellation).build(),
                NoOpCallback(promise)
            )
        }

    @ReactMethod
    @Suppress("unused")
    fun clearCachedCredentials(promise: Promise) {
        terminal.clearCachedCredentials()
        paymentIntents.clear()
        promise.resolve(NativeTypeFactory.writableNativeMap())
    }

    @ReactMethod
    @Suppress("unused")
    fun confirmRefund(promise: Promise) {
        terminal.confirmRefund(RNRefundCallback(promise))
    }

    @OptIn(OfflineMode::class)
    fun getOfflineStatus(): ReadableMap = nativeMapOf {
        val mutableMap = terminal.offlineStatus.sdk.offlinePaymentAmountsByCurrency.toMutableMap()
        val sdkMap = mutableMapOf("offlinePaymentsCount" to terminal.offlineStatus.sdk.offlinePaymentsCount,
            "offlinePaymentAmountsByCurrency" to mutableMap)
        putString("sdk", sdkMap.toString())
    }

    private fun cancelOperation(
        promise: Promise,
        cancelable: Cancelable?,
        operationName: String,
        block: (() -> Unit)? = null
    ) = withExceptionResolver(promise) {
        val toCancel = requireCancelable(cancelable) {
            "$operationName could not be canceled because it has already been canceled or has completed."
        }
        toCancel.cancel(NoOpCallback(promise))
        block?.invoke()
    }

    private fun busyMessage(command: String, busyBy: String): String {
        return  "Could not execute $command because the SDK is busy with another command: $busyBy."
    }
}
