package com.stripeterminalreactnative

import android.annotation.SuppressLint
import android.app.Application
import android.content.ComponentCallbacks2
import android.content.res.Configuration
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.stripe.stripeterminal.BuildConfig
import com.stripe.stripeterminal.Terminal
import com.stripe.stripeterminal.TerminalApplicationDelegate.onCreate
import com.stripe.stripeterminal.external.CollectData
import com.stripe.stripeterminal.external.InternalApi
import com.stripe.stripeterminal.external.OfflineMode
import com.stripe.stripeterminal.external.PrintApi
import com.stripe.stripeterminal.external.Surcharging
import com.stripe.stripeterminal.external.callable.Cancelable
import com.stripe.stripeterminal.external.models.CaptureMethod
import com.stripe.stripeterminal.external.models.CardPresentCaptureMethod
import com.stripe.stripeterminal.external.models.CardPresentParameters
import com.stripe.stripeterminal.external.models.CardPresentRequestPartialAuthorization
import com.stripe.stripeterminal.external.models.CardPresentRoutingOptionParameters
import com.stripe.stripeterminal.external.models.Cart
import com.stripe.stripeterminal.external.models.CollectConfiguration
import com.stripe.stripeterminal.external.models.CollectDataConfiguration
import com.stripe.stripeterminal.external.models.CollectInputsParameters
import com.stripe.stripeterminal.external.models.ConfirmConfiguration
import com.stripe.stripeterminal.external.models.ConnectionConfiguration
import com.stripe.stripeterminal.external.models.CreateConfiguration
import com.stripe.stripeterminal.external.models.DiscoveryConfiguration
import com.stripe.stripeterminal.external.models.EmailInput
import com.stripe.stripeterminal.external.models.Input
import com.stripe.stripeterminal.external.models.ListLocationsParameters
import com.stripe.stripeterminal.external.models.NumericInput
import com.stripe.stripeterminal.external.models.OfflineBehavior
import com.stripe.stripeterminal.external.models.PaymentIntent
import com.stripe.stripeterminal.external.models.PaymentIntentParameters
import com.stripe.stripeterminal.external.models.PaymentMethodOptionsParameters
import com.stripe.stripeterminal.external.models.PaymentMethodType
import com.stripe.stripeterminal.external.models.PhoneInput
import com.stripe.stripeterminal.external.models.PrintContent
import com.stripe.stripeterminal.external.models.Reader
import com.stripe.stripeterminal.external.models.ReaderSettingsParameters
import com.stripe.stripeterminal.external.models.RefundConfiguration
import com.stripe.stripeterminal.external.models.RefundParameters
import com.stripe.stripeterminal.external.models.RoutingPriority
import com.stripe.stripeterminal.external.models.SelectionButton
import com.stripe.stripeterminal.external.models.SelectionButtonStyle
import com.stripe.stripeterminal.external.models.SelectionInput
import com.stripe.stripeterminal.external.models.SetupIntent
import com.stripe.stripeterminal.external.models.SetupIntentCancellationParameters
import com.stripe.stripeterminal.external.models.SetupIntentConfiguration
import com.stripe.stripeterminal.external.models.SignatureInput
import com.stripe.stripeterminal.external.models.SimulatedCard
import com.stripe.stripeterminal.external.models.SimulatorConfiguration
import com.stripe.stripeterminal.external.models.TapToPayUxConfiguration
import com.stripe.stripeterminal.external.models.TerminalErrorCode
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripe.stripeterminal.external.models.TextInput
import com.stripe.stripeterminal.external.models.TippingConfiguration
import com.stripe.stripeterminal.external.models.Toggle
import com.stripe.stripeterminal.external.models.ToggleValue
import com.stripeterminalreactnative.callback.NoOpCallback
import com.stripeterminalreactnative.callback.RNCollectInputResultCallback
import com.stripeterminalreactnative.callback.RNCollectedDataCallback
import com.stripeterminalreactnative.callback.RNLocationListCallback
import com.stripeterminalreactnative.callback.RNPaymentIntentCallback
import com.stripeterminalreactnative.callback.RNReadSettingsCallback
import com.stripeterminalreactnative.callback.RNRefundCallback
import com.stripeterminalreactnative.callback.RNSetupIntentCallback
import com.stripeterminalreactnative.ktx.connectReader
import com.stripeterminalreactnative.listener.RNDiscoveryListener
import com.stripeterminalreactnative.listener.RNHandoffReaderListener
import com.stripeterminalreactnative.listener.RNInternetReaderListener
import com.stripeterminalreactnative.listener.RNMobileReaderListener
import com.stripeterminalreactnative.listener.RNOfflineListener
import com.stripeterminalreactnative.listener.RNReaderDisconnectListener
import com.stripeterminalreactnative.listener.RNReaderReconnectionListener
import com.stripeterminalreactnative.listener.RNTapToPayReaderListener
import com.stripeterminalreactnative.listener.RNTerminalListener
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.UUID

class StripeTerminalReactNativeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
    private var discoveredReadersList: List<Reader> = listOf()
    private var discoverCancelable: Cancelable? = null
    private var collectPaymentMethodCancelable: Cancelable? = null
    private var collectRefundPaymentMethodCancelable: Cancelable? = null
    private var collectSetupIntentCancelable: Cancelable? = null
    private var installUpdateCancelable: Cancelable? = null
    private var cancelReaderConnectionCancellable: Cancelable? = null
    private var collectInputsCancelable: Cancelable? = null
    private var collectDataCancelable: Cancelable? = null
    private var confirmPaymentIntentCancelable: Cancelable? = null
    private var confirmSetupIntentCancelable: Cancelable? = null
    private var confirmRefundCancelable: Cancelable? = null

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
            }
        )
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
                RNOfflineListener(context)
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
        cancelOperation(promise, collectPaymentMethodCancelable, "collectPaymentMethod") {
            collectPaymentMethodCancelable = null
        }
    }

    @ReactMethod
    @Suppress("unused")
    fun cancelCollectSetupIntent(promise: Promise) {
        cancelOperation(promise, collectSetupIntentCancelable, "collectSetupIntent") {
            collectSetupIntentCancelable = null
        }
    }

    @ReactMethod
    @Suppress("unused")
    fun cancelCollectRefundPaymentMethod(promise: Promise) {
        cancelOperation(
            promise,
            collectRefundPaymentMethodCancelable,
            "collectRefundPaymentMethod"
        ) {
            collectRefundPaymentMethodCancelable = null
        }
    }

    @ReactMethod
    @Suppress("unused")
    fun cancelConfirmPaymentIntent(promise: Promise) {
        cancelOperation(promise, confirmPaymentIntentCancelable, "confirmPaymentIntent") {
            confirmPaymentIntentCancelable = null
        }
    }

    @ReactMethod
    @Suppress("unused")
    fun cancelConfirmSetupIntent(promise: Promise) {
        cancelOperation(promise, confirmSetupIntentCancelable, "confirmSetupIntent") {
            confirmSetupIntentCancelable = null
        }
    }

    @ReactMethod
    @Suppress("unused")
    fun cancelConfirmRefund(promise: Promise) {
        cancelOperation(promise, confirmRefundCancelable, "confirmRefund") {
            confirmRefundCancelable = null
        }
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
    fun setSimulatedOfflineMode(simulatedOffline: Boolean, promise: Promise) {
        terminal.simulatorConfiguration = SimulatorConfiguration(
            update = terminal.simulatorConfiguration.update,
            offlineEnabled = simulatedOffline
        )
        promise.resolve(NativeTypeFactory.writableNativeMap())
    }

    @ReactMethod
    @Suppress("unused")
    fun setSimulatedCollectInputsResult(simulatedCollectInputsBehavior: String, promise: Promise) {
        val validBehavior = setOf("all", "none", "timeout")
        if (simulatedCollectInputsBehavior !in validBehavior) {
            promise.reject(
                "Failed",
                "The simulatedCollectInputsBehavior must be \"all\", \"none\", or \"timeout\"."
            )
        }

        terminal.simulatorConfiguration = SimulatorConfiguration(
            simulatedCollectInputsResult = mapFromSimulatedCollectInputsBehavior(
                simulatedCollectInputsBehavior
            )
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
        val discoveryMethodParam = requireNonNullParameter(params.getString("discoveryMethod")) {
            "You must provide a discoveryMethod"
        }
        val discoveryMethod = requireNonNullParameter(mapToDiscoveryMethod(discoveryMethodParam)) {
            "Unknown discoveryMethod: $discoveryMethodParam"
        }
        val locationId = params.getString("locationId")

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
            config = when (discoveryMethod) {
                DiscoveryMethod.BLUETOOTH_SCAN -> DiscoveryConfiguration.BluetoothDiscoveryConfiguration(
                    getInt(params, "timeout") ?: 0,
                    getBoolean(params, "simulated")
                )

                DiscoveryMethod.INTERNET -> DiscoveryConfiguration.InternetDiscoveryConfiguration(
                    isSimulated = getBoolean(params, "simulated"),
                    location = locationId
                )

                DiscoveryMethod.USB -> DiscoveryConfiguration.UsbDiscoveryConfiguration(
                    getInt(params, "timeout") ?: 0,
                    getBoolean(params, "simulated")
                )

                DiscoveryMethod.HANDOFF -> DiscoveryConfiguration.HandoffDiscoveryConfiguration()
                DiscoveryMethod.TAP_TO_PAY -> DiscoveryConfiguration.TapToPayDiscoveryConfiguration(
                    getBoolean(params, "simulated")
                )
            },
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

    private fun getConnectionConfig(
        discoveryMethod: DiscoveryMethod,
        locationId: String,
        autoReconnectOnUnexpectedDisconnect: Boolean
    ): ConnectionConfiguration {
        val disconnectListener = RNReaderDisconnectListener(context)
        return when (discoveryMethod) {
            DiscoveryMethod.BLUETOOTH_SCAN -> {
                val reconnectionListener = RNReaderReconnectionListener(context) {
                    cancelReaderConnectionCancellable = it
                }
                val listener =
                    RNMobileReaderListener(context, reconnectionListener, disconnectListener) {
                        installUpdateCancelable = it
                    }
                ConnectionConfiguration.BluetoothConnectionConfiguration(
                    locationId,
                    autoReconnectOnUnexpectedDisconnect,
                    listener
                )
            }

            DiscoveryMethod.TAP_TO_PAY -> {
                val reconnectionListener = RNReaderReconnectionListener(context) {
                    cancelReaderConnectionCancellable = it
                }
                val listener = RNTapToPayReaderListener(disconnectListener, reconnectionListener)
                ConnectionConfiguration.TapToPayConnectionConfiguration(
                    locationId,
                    autoReconnectOnUnexpectedDisconnect,
                    listener
                )
            }

            DiscoveryMethod.INTERNET -> {
                val listener = RNInternetReaderListener(disconnectListener)
                ConnectionConfiguration.InternetConnectionConfiguration(
                    internetReaderListener = listener
                )
            }

            DiscoveryMethod.HANDOFF -> {
                ConnectionConfiguration.HandoffConnectionConfiguration(
                    RNHandoffReaderListener(context, disconnectListener)
                )
            }

            DiscoveryMethod.USB -> {
                val reconnectionListener = RNReaderReconnectionListener(context) {
                    cancelReaderConnectionCancellable = it
                }
                val listener =
                    RNMobileReaderListener(context, reconnectionListener, disconnectListener) {
                        installUpdateCancelable = it
                    }
                ConnectionConfiguration.UsbConnectionConfiguration(
                    locationId,
                    autoReconnectOnUnexpectedDisconnect,
                    listener
                )
            }
        }
    }

    private fun innerConnectReader(
        params: ReadableMap,
        discoveryMethod: DiscoveryMethod,
        promise: Promise
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            withSuspendExceptionResolver(promise) {
                val reader = requireNonNullParameter(params.getMap("reader")) {
                    "You must provide a reader"
                }

                val serialNumber = reader.getString("serialNumber")

                val selectedReader = requireNonNullParameter(
                    discoveredReadersList.find {
                        it.serialNumber == serialNumber
                    }
                ) {
                    "Could not find a reader with serialNumber $serialNumber"
                }

                val locationId =
                    params.getString("locationId") ?: selectedReader.location?.id.orEmpty()

                val autoReconnectOnUnexpectedDisconnect =
                    when (discoveryMethod) {
                        DiscoveryMethod.TAP_TO_PAY -> {
                            getBoolean(params, "autoReconnectOnUnexpectedDisconnect", true)
                        }

                        DiscoveryMethod.BLUETOOTH_SCAN, DiscoveryMethod.USB -> {
                            getBoolean(params, "autoReconnectOnUnexpectedDisconnect")
                        }

                        else -> {
                            false
                        }
                    }

                val connConfig = getConnectionConfig(
                    discoveryMethod,
                    locationId,
                    autoReconnectOnUnexpectedDisconnect
                )
                val connectedReader = terminal.connectReader(selectedReader, connConfig)
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
    fun connectReader(params: ReadableMap, discoveryMethod: String, promise: Promise) {
        mapToDiscoveryMethod(discoveryMethod)?.let {
            innerConnectReader(params, it, promise)
        }
            ?: promise.resolve(createError(RuntimeException("Unknown discovery method: $discoveryMethod")))
    }

    @ReactMethod
    @Suppress("unused")
    fun disconnectReader(promise: Promise) {
        paymentIntents.clear()
        terminal.disconnectReader(NoOpCallback(promise))
    }

    @ReactMethod
    @Suppress("unused")
    fun rebootReader(promise: Promise) {
        paymentIntents.clear()
        terminal.rebootReader(NoOpCallback(promise))
    }

    @ReactMethod
    @Suppress("unused")
    fun cancelReaderReconnection(promise: Promise) {
        cancelOperation(promise, cancelReaderConnectionCancellable, "readerReconnection") {
            cancelReaderConnectionCancellable = null
        }
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
        val statementDescriptorSuffix = params.getString("statementDescriptorSuffix")
        val receiptEmail = params.getString("receiptEmail")
        val customer = params.getString("customer")
        val transferGroup = params.getString("transferGroup")
        val metadata = params.getMap("metadata")
        val paymentMethodOptions = params.getMap("paymentMethodOptions")
        val extendedAuth = getBoolean(paymentMethodOptions, "requestExtendedAuthorization")
        val incrementalAuth =
            getBoolean(paymentMethodOptions, "requestIncrementalAuthorizationSupport")
        val requestedPriority = paymentMethodOptions?.getString("requestedPriority")
        val requestPartialAuthorization = paymentMethodOptions?.getString("requestPartialAuthorization")
        val cardPresentCaptureMethod = paymentMethodOptions?.getString("captureMethod")
        val captureMethod = params.getString("captureMethod")
        val offlineBehavior = params.getString("offlineBehavior")

        val paymentMethodTypes = paymentMethods?.toArrayList()?.mapNotNull {
            it as? String
        }?.mapNotNull {
            try {
                PaymentMethodType.valueOf(it.uppercase())
            } catch (e: IllegalArgumentException) {
                null
            }
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
        statementDescriptorSuffix?.let {
            intentParams.setStatementDescriptorSuffix(it)
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

        val partialAuthorization = when (requestPartialAuthorization) {
            "if_available" -> CardPresentRequestPartialAuthorization.IF_AVAILABLE
            "never" -> CardPresentRequestPartialAuthorization.NEVER
            else -> null
        }

        val cardPresentParams = CardPresentParameters.Builder()
            .setRequestExtendedAuthorization(extendedAuth)
            .setRequestIncrementalAuthorizationSupport(incrementalAuth)
            .setRouting(routingPriority)
        if (partialAuthorization != null) {
            cardPresentParams.setRequestPartialAuthorization(partialAuthorization)
        }

        cardPresentCaptureMethod?.let {
            when (it) {
                "manual" -> cardPresentParams.setCaptureMethod(CardPresentCaptureMethod.Manual)
                "manual_preferred" -> cardPresentParams.setCaptureMethod(CardPresentCaptureMethod.ManualPreferred)
                else -> { }
            }
        }

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

        val offlineBehaviorParam = offlineBehavior?.let {
            when (it) {
                "prefer_online" -> OfflineBehavior.PREFER_ONLINE
                "require_online" -> OfflineBehavior.REQUIRE_ONLINE
                "force_offline" -> OfflineBehavior.FORCE_OFFLINE
                else -> OfflineBehavior.PREFER_ONLINE
            }
        } ?: OfflineBehavior.PREFER_ONLINE

        val uuid = UUID.randomUUID().toString()

        terminal.createPaymentIntent(
            intentParams.build(),
            RNPaymentIntentCallback(promise, uuid) { pi ->
                paymentIntents[uuid] = pi
            },
            CreateConfiguration(offlineBehaviorParam)
        )
    }

    @OptIn(InternalApi::class)
    @ReactMethod
    @Suppress("unused")
    fun collectPaymentMethod(params: ReadableMap, promise: Promise) =
        withExceptionResolver(promise) {
            val paymentIntentJson = requireNonNullParameter(params.getMap("paymentIntent")) {
                "You must provide a paymentIntent"
            }
            val uuid = requireNonNullParameter(paymentIntentJson.getString("sdkUuid")) {
                "The PaymentIntent is missing sdkUuid field. This method requires you to use the PaymentIntent that was returned from either createPaymentIntent or retrievePaymentIntent."
            }
            val paymentIntent = requireNonNullParameter(paymentIntents[uuid]) {
                "No PaymentIntent was found with the sdkUuid $uuid. The PaymentIntent provided must be re-retrieved with retrievePaymentIntent or a new PaymentIntent must be created with createPaymentIntent."
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
                configBuilder.setEnableCustomerCancellation(
                    getBoolean(params, "enableCustomerCancellation")
                )
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
            if (params.hasKey("moto")) {
                configBuilder.setMoto(params.getBoolean("moto"))
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
        terminal.retrievePaymentIntent(
            clientSecret,
            RNPaymentIntentCallback(promise, uuid) { pi ->
                paymentIntents[uuid] = pi
            }
        )
    }

    @OptIn(Surcharging::class)
    @ReactMethod
    @Suppress("unused")
    fun confirmPaymentIntent(params: ReadableMap, promise: Promise) = withExceptionResolver(
        promise
    ) {
        val paymentIntentJson = requireNonNullParameter(params.getMap("paymentIntent")) {
            "You must provide a paymentIntent that was returned from either createPaymentIntent or retrievePaymentIntent."
        }
        val uuid = requireNonNullParameter(paymentIntentJson.getString("sdkUuid")) {
            "The PaymentIntent is missing sdkUuid field. This method requires you to use the PaymentIntent that was returned from either createPaymentIntent or retrievePaymentIntent."
        }
        val paymentIntent = requireNonNullParameter(paymentIntents[uuid]) {
            "No PaymentIntent was found with the sdkUuid $uuid. The PaymentIntent provided must be re-retrieved with retrievePaymentIntent or a new PaymentIntent must be created with createPaymentIntent."
        }

        val configBuilder = ConfirmConfiguration.Builder()

        val surchargeConfiguration = params.getMap("surcharge")?.let {
            mapToSurchargeConfiguration(it)
        }
        configBuilder.setSurcharge(surchargeConfiguration)

        if (params.hasKey("returnUrl")) {
            val returnUrl = params.getString("returnUrl")
            configBuilder.setReturnUrl(returnUrl)
        }

        confirmPaymentIntentCancelable = terminal.confirmPaymentIntent(
            paymentIntent,
            RNPaymentIntentCallback(promise, uuid) {
                paymentIntents.clear()
            },
            configBuilder.build()
        )
    }

    @ReactMethod
    @Suppress("unused")
    fun getLocations(params: ReadableMap, promise: Promise) {
        val listParameters = ListLocationsParameters.Builder().apply {
            endingBefore = params.getString("endingBefore")
            startingAfter = params.getString("startingAfter")
            limit = getInt(params, "limit")
        }
        terminal.listLocations(listParameters.build(), RNLocationListCallback(promise))
    }

    @ReactMethod
    @Suppress("unused")
    fun createSetupIntent(params: ReadableMap, promise: Promise) {
        val uuid = UUID.randomUUID().toString()
        terminal.createSetupIntent(
            mapToSetupIntentParameters(params),
            RNSetupIntentCallback(promise, uuid) {
                setupIntents[uuid] = it
            }
        )
    }

    @ReactMethod
    @Suppress("unused")
    fun retrieveSetupIntent(clientSecret: String, promise: Promise) {
        val uuid = UUID.randomUUID().toString()
        terminal.retrieveSetupIntent(
            clientSecret,
            RNSetupIntentCallback(promise, uuid) {
                setupIntents[uuid] = it
            }
        )
    }

    @OptIn(OfflineMode::class)
    @ReactMethod
    @Suppress("unused")
    fun cancelPaymentIntent(params: ReadableMap, promise: Promise) =
        withExceptionResolver(promise) {
            val paymentIntentJson = requireNonNullParameter(params.getMap("paymentIntent")) {
                "You must provide paymentIntent that was returned from either createPaymentIntent or retrievePaymentIntent."
            }
            val uuid = requireNonNullParameter(paymentIntentJson.getString("sdkUuid")) {
                "The PaymentIntent is missing sdkUuid field. This method requires you to use the PaymentIntent that was returned from either createPaymentIntent or retrievePaymentIntent."
            }
            val paymentIntent = requireNonNullParameter(paymentIntents[uuid]) {
                "No PaymentIntent was found with the sdkUuid $uuid. The PaymentIntent provided must be re-retrieved with retrievePaymentIntent or a new PaymentIntent must be created with createPaymentIntent."
            }

            terminal.cancelPaymentIntent(
                paymentIntent,
                RNPaymentIntentCallback(promise, uuid) {
                    paymentIntents[uuid] = null
                }
            )
        }

    @OptIn(InternalApi::class)
    @ReactMethod
    @Suppress("unused")
    fun collectSetupIntentPaymentMethod(params: ReadableMap, promise: Promise) =
        withExceptionResolver(promise) {
            val setupIntentJson = requireNonNullParameter(params.getMap("setupIntent")) {
                "You must provide a setupIntent"
            }
            val uuid = requireNonNullParameter(setupIntentJson.getString("sdkUuid")) {
                "The SetupIntent is missing sdkUuid field. This method requires you to use the SetupIntent that was returned from either createPaymentIntent or retrievePaymentIntent."
            }
            val setupIntent = requireNonNullParameter(setupIntents[uuid]) {
                "No SetupIntent was found with the sdkUuid $uuid. The SetupIntent provided must be re-retrieved with retrieveSetupIntent or a new SetupIntent must be created with createSetupIntent."
            }
            val allowRedisplay = mapToAllowRedisplay(params.getString("allowRedisplay"))
            val enableCustomerCancellation = getBoolean(params, "enableCustomerCancellation")
            val moto = getBoolean(params, "moto")
            val collectionReason =
                mapToSetupIntentCollectionReason(params.getString("collectionReason"))

            collectSetupIntentCancelable = terminal.collectSetupIntentPaymentMethod(
                setupIntent,
                allowRedisplay,
                SetupIntentConfiguration.Builder()
                    .setEnableCustomerCancellation(enableCustomerCancellation)
                    .setMoto(moto)
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
        cancelOperation(promise, installUpdateCancelable, "installUpdate") {
            installUpdateCancelable = null
        }
    }

    @ReactMethod
    @Suppress("unused")
    fun setReaderDisplay(params: ReadableMap, promise: Promise) = withExceptionResolver(promise) {
        val currency = requireNonNullParameter(params.getString("currency")) {
            "You must provide a currency value"
        }
        val tax = requireNonNullParameter(getInt(params, "tax")?.toLong()) {
            "You must provide a tax value"
        }
        val total = requireNonNullParameter(getInt(params, "total")?.toLong()) {
            "You must provide a total value"
        }

        val cartLineItems =
            mapToCartLineItems(
                params.getArray("lineItems") ?: NativeTypeFactory.writableNativeArray()
            )

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
    fun cancelSetupIntent(params: ReadableMap, promise: Promise) =
        withExceptionResolver(promise) {
            val setupIntentJson = requireNonNullParameter(params.getMap("setupIntent")) {
                "You must provide a setupIntent."
            }
            val uuid = requireNonNullParameter(setupIntentJson.getString("sdkUuid")) {
                "The SetupIntent is missing sdkUuid field. This method requires you to use the SetupIntent that was returned from either createPaymentIntent or retrievePaymentIntent."
            }
            val setupIntent = requireNonNullParameter(setupIntents[uuid]) {
                "No SetupIntent was found with the sdkUuid $uuid. The SetupIntent provided must be re-retrieved with retrieveSetupIntent or a new SetupIntent must be created with createSetupIntent."
            }

            val params = SetupIntentCancellationParameters.Builder().build()

            terminal.cancelSetupIntent(
                setupIntent,
                params,
                RNSetupIntentCallback(promise, uuid) {
                    setupIntents[uuid] = null
                }
            )
        }

    @ReactMethod
    @Suppress("unused")
    fun confirmSetupIntent(params: ReadableMap, promise: Promise) =
        withExceptionResolver(promise) {
            val setupIntentJson = requireNonNullParameter(params.getMap("setupIntent")) {
                "You must provide a setupIntent."
            }
            val uuid = requireNonNullParameter(setupIntentJson.getString("sdkUuid")) {
                "The SetupIntent is missing sdkUuid field. This method requires you to use the SetupIntent that was returned from either createPaymentIntent or retrievePaymentIntent."
            }
            val setupIntent = requireNonNullParameter(setupIntents[uuid]) {
                "No SetupIntent was found with the sdkUuid $uuid. The SetupIntent provided must be re-retrieved with retrieveSetupIntent or a new SetupIntent must be created with createSetupIntent."
            }
            confirmSetupIntentCancelable = terminal.confirmSetupIntent(
                setupIntent,
                RNSetupIntentCallback(promise, uuid) {
                    setupIntents.clear()
                }
            )
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
            val chargeId = params.getString("chargeId")
            val paymentIntentId = params.getString("paymentIntentId")

            if (chargeId.isNullOrBlank() == paymentIntentId.isNullOrBlank()) {
                throw TerminalException(
                    TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
                    "You must provide either a charge ID or a payment intent ID."
                )
            }
            val amount = requireNonNullParameter(getInt(params, "amount")?.toLong()) {
                "You must provide an amount"
            }
            val currency = requireNonNullParameter(params.getString("currency")) {
                "You must provide a currency value"
            }
            val refundApplicationFee = params.getBoolean("refundApplicationFee")
            val reverseTransfer = params.getBoolean("reverseTransfer")
            val metadata = params.getMap("metadata")?.toHashMap()?.toMap() as? Map<String, String>
            val intentParamsBuild = if (!paymentIntentId.isNullOrBlank()) {
                RefundParameters.Builder(
                    RefundParameters.Id.PaymentIntent(paymentIntentId),
                    amount,
                    currency
                )
            } else {
                RefundParameters.Builder(RefundParameters.Id.Charge(chargeId!!), amount, currency)
            }

            intentParamsBuild.setRefundApplicationFee(refundApplicationFee)
                .setReverseTransfer(reverseTransfer)
            if (metadata != null) {
                intentParamsBuild.setMetadata(metadata)
            }
            val intentParams = intentParamsBuild.build()

            val enableCustomerCancellation = getBoolean(params, "enableCustomerCancellation")

            collectRefundPaymentMethodCancelable = terminal.collectRefundPaymentMethod(
                intentParams,
                RefundConfiguration.Builder().setEnableCustomerCancellation(
                    enableCustomerCancellation
                ).build(),
                NoOpCallback(promise)
            )
        }

    @OptIn(CollectData::class)
    @ReactMethod
    @Suppress("unused")
    fun collectData(params: ReadableMap, promise: Promise) =
        withExceptionResolver(promise) {
            val collectDataTypeParam = requireNonNullParameter(params.getString("collectDataType")) {
                "You must provide a collectDataType"
            }
            val collectDataType = requireNonNullParameter(mapFromCollectDataType(collectDataTypeParam)) {
                "Unknown collectDataType: $collectDataTypeParam"
            }
            val enableCustomerCancellation = getBoolean(params, "enableCustomerCancellation")

            val configBuilder = CollectDataConfiguration.Builder()
                .setEnableCustomerCancellation(enableCustomerCancellation)
                .setType(collectDataType)
            val config = configBuilder.build()

            collectDataCancelable = terminal.collectData(config, RNCollectedDataCallback(promise))
        }

    @ReactMethod
    @Suppress("unused")
    fun cancelCollectData(promise: Promise) {
        cancelOperation(promise, collectDataCancelable, "Collect Data") {
            collectDataCancelable = null
        }
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
        confirmRefundCancelable = terminal.confirmRefund(RNRefundCallback(promise))
    }

    @OptIn(OfflineMode::class)
    @ReactMethod
    @Suppress("unused")
    fun getOfflineStatus(promise: Promise) {
        promise.resolve(mapFromOfflineStatus(terminal.offlineStatus))
    }

    @ReactMethod
    @Suppress("unused")
    fun getPaymentStatus(promise: Promise) {
        promise.resolve(mapFromPaymentStatus(terminal.paymentStatus))
    }

    @ReactMethod
    @Suppress("unused")
    fun getConnectionStatus(promise: Promise) {
        promise.resolve(mapFromConnectionStatus(terminal.connectionStatus))
    }

    @ReactMethod
    @Suppress("unused")
    fun getConnectedReader(promise: Promise) {
        promise.resolve(terminal.connectedReader?.let { mapFromReader(it) })
    }

    @ReactMethod
    @Suppress("unused")
    fun getReaderSettings(promise: Promise) {
        terminal.getReaderSettings(RNReadSettingsCallback(promise))
    }

    @ReactMethod
    @Suppress("unused")
    fun setReaderSettings(params: ReadableMap, promise: Promise) {
        val textToSpeechViaSpeakers = requireNonNullParameter(getBoolean(params, "textToSpeechViaSpeakers")) {
            "You must provide textToSpeechViaSpeakers parameters."
        }
        val readerSettingsParameters = ReaderSettingsParameters.AccessibilityParameters(
            textToSpeechViaSpeakers
        )
        terminal.setReaderSettings(readerSettingsParameters, RNReadSettingsCallback(promise))
    }

    private fun getTogglesFromParam(toggleList: ReadableArray): ArrayList<Toggle> {
        val toggles = ArrayList<Toggle>()
        toggleList.let { array ->
            for (i in 0 until array.size()) {
                val toggle = array.getMap(i)
                toggles.add(
                    Toggle(
                        toggle?.getString("title"),
                        toggle?.getString("description"),
                        if (toggle?.getString("defaultValue") == "enabled") {
                            ToggleValue.ENABLED
                        } else {
                            ToggleValue.DISABLED
                        }
                    )
                )
            }
        }
        return toggles
    }

    @OptIn(PrintApi::class)
    @ReactMethod
    @Suppress("unused")
    fun print(contentUri: String, promise: Promise) = withExceptionResolver(promise) {
        val bitmap = requireNonNullParameter(mapToBitmap(contentUri)) {
            "You must provide a valid base64 string or a 'data:' URI scheme"
        }
        val printContent = PrintContent.Bitmap.create(bitmap)
        terminal.print(printContent, NoOpCallback(promise))
    }

    @ReactMethod
    @Suppress("unused")
    fun collectInputs(params: ReadableMap, promise: Promise) = withExceptionResolver(promise) {
        val collectInputs = requireNonNullParameter(params.getArray("inputs")) {
            "You must provide an inputs value"
        }
        val listInput = ArrayList<Input>()
        for (i in 0 until collectInputs.size()) {
            val collectInput = collectInputs.getMap(i)
            when (collectInput?.getString("formType")) {
                "text" -> {
                    collectInput.let {
                        var toggles = ArrayList<Toggle>()
                        it.getArray("toggles")
                            ?.let { itToggle -> toggles = getTogglesFromParam(itToggle) }
                        listInput.add(
                            TextInput.Builder(it.getString("title") ?: "")
                                .setDescription(it.getString("description") ?: "")
                                .setRequired(it.getBoolean("required"))
                                .setSkipButtonText(it.getString("skipButtonText"))
                                .setSubmitButtonText(it.getString("submitButtonText"))
                                .setToggles(toggles)
                                .build()
                        )
                    }
                }

                "numeric" -> {
                    collectInput.let {
                        var toggles = ArrayList<Toggle>()
                        it.getArray("toggles")
                            ?.let { itToggle -> toggles = getTogglesFromParam(itToggle) }
                        listInput.add(
                            NumericInput.Builder(it.getString("title") ?: "")
                                .setDescription(it.getString("description"))
                                .setRequired(it.getBoolean("required"))
                                .setSkipButtonText(it.getString("skipButtonText"))
                                .setSubmitButtonText(it.getString("submitButtonText"))
                                .setToggles(toggles)
                                .build()
                        )
                    }
                }

                "email" -> {
                    collectInput.let {
                        var toggles = ArrayList<Toggle>()
                        it.getArray("toggles")
                            ?.let { itToggle -> toggles = getTogglesFromParam(itToggle) }
                        listInput.add(
                            EmailInput.Builder(it.getString("title") ?: "")
                                .setDescription(it.getString("description"))
                                .setRequired(it.getBoolean("required"))
                                .setSkipButtonText(it.getString("skipButtonText"))
                                .setSubmitButtonText(it.getString("submitButtonText"))
                                .setToggles(toggles)
                                .build()
                        )
                    }
                }

                "phone" -> {
                    collectInput.let {
                        var toggles = ArrayList<Toggle>()
                        it.getArray("toggles")
                            ?.let { itToggle -> toggles = getTogglesFromParam(itToggle) }
                        listInput.add(
                            PhoneInput.Builder(it.getString("title") ?: "")
                                .setDescription(it.getString("description"))
                                .setRequired(it.getBoolean("required"))
                                .setSkipButtonText(it.getString("skipButtonText"))
                                .setSubmitButtonText(it.getString("submitButtonText"))
                                .setToggles(toggles)
                                .build()
                        )
                    }
                }

                "signature" -> {
                    collectInput.let {
                        var toggles = ArrayList<Toggle>()
                        it.getArray("toggles")
                            ?.let { itToggle -> toggles = getTogglesFromParam(itToggle) }
                        listInput.add(
                            SignatureInput.Builder(it.getString("title") ?: "")
                                .setDescription(it.getString("description"))
                                .setRequired(it.getBoolean("required"))
                                .setSkipButtonText(it.getString("skipButtonText"))
                                .setSubmitButtonText(it.getString("submitButtonText"))
                                .setToggles(toggles)
                                .build()
                        )
                    }
                }

                "selection" -> {
                    collectInput.let {
                        var toggles = ArrayList<Toggle>()
                        it.getArray("toggles")
                            ?.let { itToggle -> toggles = getTogglesFromParam(itToggle) }
                        val selectionButtons = it.getArray("selectionButtons")
                        val listSelectionButtons = ArrayList<SelectionButton>()
                        selectionButtons?.let { array ->
                            for (i in 0 until array.size()) {
                                val button = array.getMap(i)
                                listSelectionButtons.add(
                                    SelectionButton(
                                        if (button?.getString("style") == "primary") {
                                            SelectionButtonStyle.PRIMARY
                                        } else {
                                            SelectionButtonStyle.SECONDARY
                                        },
                                        button?.getString("text") ?: "",
                                        button?.getString("id") ?: "",
                                    )
                                )
                            }
                        }
                        listInput.add(
                            SelectionInput.Builder(it.getString("title") ?: "")
                                .setDescription(it.getString("description") ?: "")
                                .setRequired(it.getBoolean("required"))
                                .setSkipButtonText(it.getString("skipButtonText") ?: "")
                                .setSelectionButtons(listSelectionButtons)
                                .setToggles(toggles)
                                .build()
                        )
                    }
                }
            }
        }

        val collectInputsParameters = CollectInputsParameters(listInput)
        collectInputsCancelable = terminal.collectInputs(
            collectInputsParameters,
            RNCollectInputResultCallback(promise)
        )
    }

    @ReactMethod
    @Suppress("unused")
    fun cancelCollectInputs(promise: Promise) {
        cancelOperation(promise, collectInputsCancelable, "collectInputs") {
            collectInputsCancelable = null
        }
    }

    @ReactMethod
    @Suppress("unused")
    fun supportsReadersOfType(params: ReadableMap, promise: Promise) {
        val deviceTypeParams = requireNonNullParameter(params.getString("deviceType")) {
            "You must provide a deviceType"
        }
        val deviceType = requireNonNullParameter(mapToDeviceType(deviceTypeParams)) {
            "Unknown readerType: $deviceTypeParams"
        }
        val discoveryMethodParam = requireNonNullParameter(params.getString("discoveryMethod")) {
            "You must provide a discoveryMethod"
        }
        val discoveryMethod = requireNonNullParameter(mapToDiscoveryMethod(discoveryMethodParam)) {
            "Unknown discoveryMethod: $discoveryMethodParam"
        }

        val readerSupportResult = terminal.supportsReadersOfType(
            deviceType,
            when (discoveryMethod) {
                DiscoveryMethod.BLUETOOTH_SCAN -> DiscoveryConfiguration.BluetoothDiscoveryConfiguration(
                    getInt(params, "timeout") ?: 0,
                    getBoolean(params, "simulated")
                )

                DiscoveryMethod.INTERNET -> DiscoveryConfiguration.InternetDiscoveryConfiguration(
                    isSimulated = getBoolean(params, "simulated")
                )

                DiscoveryMethod.USB -> DiscoveryConfiguration.UsbDiscoveryConfiguration(
                    getInt(params, "timeout") ?: 0,
                    getBoolean(params, "simulated")
                )

                DiscoveryMethod.HANDOFF -> DiscoveryConfiguration.HandoffDiscoveryConfiguration()
                DiscoveryMethod.TAP_TO_PAY -> DiscoveryConfiguration.TapToPayDiscoveryConfiguration(
                    getBoolean(params, "simulated")
                )

            }
        )

        promise.resolve(mapFromReaderSupportResult(readerSupportResult))
    }

    @ReactMethod
    @Suppress("unused")
    fun setTapToPayUxConfiguration(params: ReadableMap, promise: Promise) =
        withExceptionResolver(promise) {
            val tapToPayUxConfigurationBuilder = TapToPayUxConfiguration.Builder()

            var tapZone: TapToPayUxConfiguration.TapZone? = null
            val tapZoneParam = params.getMap("tapZone")
            tapZoneParam?.let {
                val tapZoneIndicator =
                    mapToTapZoneIndicator(tapZoneParam.getString("tapZoneIndicator"))

                val tapZonePosition = tapZoneParam.getMap("tapZonePosition")?.let {
                    TapToPayUxConfiguration.TapZonePosition.Manual(
                        it.getDouble("xBias").toFloat(),
                        it.getDouble("yBias").toFloat()
                    )
                } ?: TapToPayUxConfiguration.TapZonePosition.Default

                tapZone = TapToPayUxConfiguration.TapZone.Manual.Builder()
                    .indicator(tapZoneIndicator)
                    .position(tapZonePosition)
                    .build()
            }
            tapToPayUxConfigurationBuilder.tapZone(
                tapZone ?: TapToPayUxConfiguration.TapZone.Default
            )

            val colorsParam = params.getMap("colors")
            colorsParam?.let {
                val colorSchemeBuilder = TapToPayUxConfiguration.ColorScheme.Builder()
                colorSchemeBuilder.apply {
                    primary(it.getString("primary").toTapToPayColor())
                    success(it.getString("success").toTapToPayColor())
                    error(it.getString("error").toTapToPayColor())
                }
                tapToPayUxConfigurationBuilder.colors(colorSchemeBuilder.build())
            }

            tapToPayUxConfigurationBuilder.darkMode(mapToDarkMode(params.getString("darkMode")))

            terminal.setTapToPayUxConfiguration(tapToPayUxConfigurationBuilder.build())
            promise.resolve(NativeTypeFactory.writableNativeMap())
        }

    @ReactMethod
    @Suppress("unused")
    fun getNativeSdkVersion(promise: Promise) {
        promise.resolve(BuildConfig.SDK_VERSION_NAME)
    }

    private fun String?.toTapToPayColor(): TapToPayUxConfiguration.Color {
        return this
            ?.let { TapToPayUxConfiguration.Color.Value(hexToArgb(it)) }
            ?: TapToPayUxConfiguration.Color.Default
    }

    @ReactMethod
    fun addListener(eventName: String?) {
        // Set up any upstream listeners or background tasks as necessary
    }

    @ReactMethod
    fun removeListeners(count: Int?) {
        // Remove upstream listeners, stop unnecessary background tasks
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
        return "Could not execute $command because the SDK is busy with another command: $busyBy."
    }
}
