package com.stripeterminalreactnative

import android.app.Application
import android.content.ComponentCallbacks2
import android.content.res.Configuration
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.stripe.stripeterminal.Terminal
import com.stripe.stripeterminal.TerminalApplicationDelegate.onCreate
import com.stripe.stripeterminal.TerminalApplicationDelegate.onTrimMemory
import com.stripe.stripeterminal.external.UsbConnectivity
import com.stripe.stripeterminal.external.callable.BluetoothReaderListener
import com.stripe.stripeterminal.external.callable.Callback
import com.stripe.stripeterminal.external.callable.Cancelable
import com.stripe.stripeterminal.external.callable.DiscoveryListener
import com.stripe.stripeterminal.external.callable.LocationListCallback
import com.stripe.stripeterminal.external.callable.PaymentIntentCallback
import com.stripe.stripeterminal.external.callable.PaymentMethodCallback
import com.stripe.stripeterminal.external.callable.ReaderCallback
import com.stripe.stripeterminal.external.callable.RefundCallback
import com.stripe.stripeterminal.external.callable.SetupIntentCallback
import com.stripe.stripeterminal.external.callable.TerminalListener
import com.stripe.stripeterminal.external.callable.UsbReaderListener
import com.stripe.stripeterminal.external.models.Cart
import com.stripe.stripeterminal.external.models.ConnectionConfiguration
import com.stripe.stripeterminal.external.models.ConnectionStatus
import com.stripe.stripeterminal.external.models.DiscoveryConfiguration
import com.stripe.stripeterminal.external.models.ListLocationsParameters
import com.stripe.stripeterminal.external.models.Location
import com.stripe.stripeterminal.external.models.PaymentIntent
import com.stripe.stripeterminal.external.models.PaymentIntentParameters
import com.stripe.stripeterminal.external.models.PaymentMethod
import com.stripe.stripeterminal.external.models.PaymentStatus
import com.stripe.stripeterminal.external.models.ReadReusableCardParameters
import com.stripe.stripeterminal.external.models.Reader
import com.stripe.stripeterminal.external.models.ReaderDisplayMessage
import com.stripe.stripeterminal.external.models.ReaderInputOptions
import com.stripe.stripeterminal.external.models.ReaderSoftwareUpdate
import com.stripe.stripeterminal.external.models.Refund
import com.stripe.stripeterminal.external.models.RefundParameters
import com.stripe.stripeterminal.external.models.SetupIntent
import com.stripe.stripeterminal.external.models.SetupIntentCancellationParameters
import com.stripe.stripeterminal.external.models.SetupIntentParameters
import com.stripe.stripeterminal.external.models.SimulatorConfiguration
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripeterminalreactnative.ReactNativeConstants.CHANGE_CONNECTION_STATUS
import com.stripeterminalreactnative.ReactNativeConstants.CHANGE_PAYMENT_STATUS
import com.stripeterminalreactnative.ReactNativeConstants.FETCH_TOKEN_PROVIDER
import com.stripeterminalreactnative.ReactNativeConstants.FINISH_DISCOVERING_READERS
import com.stripeterminalreactnative.ReactNativeConstants.FINISH_INSTALLING_UPDATE
import com.stripeterminalreactnative.ReactNativeConstants.REPORT_AVAILABLE_UPDATE
import com.stripeterminalreactnative.ReactNativeConstants.REPORT_UNEXPECTED_READER_DISCONNECT
import com.stripeterminalreactnative.ReactNativeConstants.REPORT_UPDATE_PROGRESS
import com.stripeterminalreactnative.ReactNativeConstants.REQUEST_READER_DISPLAY_MESSAGE
import com.stripeterminalreactnative.ReactNativeConstants.REQUEST_READER_INPUT
import com.stripeterminalreactnative.ReactNativeConstants.START_INSTALLING_UPDATE
import com.stripeterminalreactnative.ReactNativeConstants.UPDATE_DISCOVERED_READERS


class StripeTerminalReactNativeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
    private var discoveredReadersList: List<Reader> = listOf()
    private var discoverCancelable: Cancelable? = null
    private var collectPaymentMethodCancelable: Cancelable? = null
    private var collectSetupIntentCancelable: Cancelable? = null
    private var installUpdateCancelable: Cancelable? = null
    private var readReusableCardCancelable: Cancelable? = null

    private var paymentIntents: HashMap<String, PaymentIntent?> = HashMap()
    private var setupIntents: HashMap<String, SetupIntent?> = HashMap()

    private val terminal: Terminal
        get() = Terminal.getInstance()

    init {
        TokenProvider.tokenProviderCallback = object : TokenProviderCallback {
            override fun invoke() {
                reactApplicationContext
                    .getJSModule(RCTDeviceEventEmitter::class.java)
                    .emit(FETCH_TOKEN_PROVIDER.listenerName, null)
            }
        }

        reactApplicationContext.registerComponentCallbacks(
            object : ComponentCallbacks2 {
                override fun onTrimMemory(level: Int) {
                    onTrimMemory(reactApplicationContext.applicationContext as Application, level)
                }

                override fun onLowMemory() {}
                override fun onConfigurationChanged(p0: Configuration) {}
            })
    }

    override fun getConstants(): MutableMap<String, Any> =
        ReactNativeConstants.values().associate { it.name to it.listenerName }.toMutableMap()

    override fun getName(): String = "StripeTerminalReactNative"

    override fun hasConstants(): Boolean = true

    @ReactMethod
    @Suppress("unused")
    fun initialize(params: ReadableMap, promise: Promise) {
        UiThreadUtil.runOnUiThread {
            onCreate(reactApplicationContext.applicationContext as Application)
        }

        val listener: TerminalListener = object : TerminalListener {
            override fun onUnexpectedReaderDisconnect(reader: Reader) {
                val error = createError(
                    TerminalException(
                        TerminalException.TerminalErrorCode.UNEXPECTED_SDK_ERROR,
                        "Reader has been disconnected unexpectedly"
                    )
                )
                sendEvent(REPORT_UNEXPECTED_READER_DISCONNECT.listenerName, error)
            }

            override fun onConnectionStatusChange(status: ConnectionStatus) {
                sendEvent(CHANGE_CONNECTION_STATUS.listenerName) {
                    putString("result", mapFromConnectionStatus(status))
                }
            }

            override fun onPaymentStatusChange(status: PaymentStatus) {
                sendEvent(CHANGE_PAYMENT_STATUS.listenerName) {
                    putString("result", mapFromPaymentStatus(status))
                }
            }
        }
        val result = WritableNativeMap()

        if (!Terminal.isInitialized()) {
            val logLevel = mapToLogLevel(params.getString("logLevel"))

            Terminal.initTerminal(
                this.reactApplicationContext.applicationContext,
                logLevel,
                TokenProvider.Companion,
                listener
            )
        } else {
            terminal.connectedReader?.let {
                result.putMap("reader", mapFromReader(it))
            }
        }

        promise.resolve(result)
    }

    @ReactMethod
    @Suppress("unused")
    fun cancelCollectPaymentMethod(promise: Promise) = withExceptionResolver(promise) {
        val cancelable = requireCancelable(collectPaymentMethodCancelable) {
            "collectPaymentMethod could not be canceled because the command has already been canceled or has completed."
        }
        cancelable.cancel(object : Callback {
            override fun onSuccess() {
                promise.resolve(WritableNativeMap())
            }

            override fun onFailure(e: TerminalException) {
                promise.resolve(createError(e))
            }
        })
    }

    @ReactMethod
    @Suppress("unused")
    fun cancelCollectSetupIntent(promise: Promise) = withExceptionResolver(promise) {
        val cancelable = requireCancelable(collectSetupIntentCancelable) {
            "collectSetupIntent could not be canceled because the command has already been canceled or has completed."
        }
        cancelable.cancel(object : Callback {
            override fun onSuccess() {
                promise.resolve(WritableNativeMap())
            }

            override fun onFailure(e: TerminalException) {
                promise.resolve(createError(e))
            }
        })
    }

    @ReactMethod
    @Suppress("unused")
    fun simulateReaderUpdate(update: String, promise: Promise) {
        val updateMapped = mapFromSimulateReaderUpdate(update)
        terminal.simulatorConfiguration = SimulatorConfiguration(updateMapped)
        promise.resolve(WritableNativeMap())
    }

    @ReactMethod
    @Suppress("unused")
    fun setConnectionToken(params: ReadableMap, promise: Promise) {
        val token = params.getString("token")
        val error = params.getString("error")
        TokenProvider.setConnectionToken(token, error)
        promise.resolve(null)
    }

    @ReactMethod
    @Suppress("unused")
    fun discoverReaders(params: ReadableMap, promise: Promise) = withExceptionResolver(promise) {
        val discoveryMethodParam = requireParam(params.getString("discoveryMethod")) {
            "You must provide a discoveryMethod"
        }
        val discoveryMethod = requireParam(mapToDiscoveryMethod(discoveryMethodParam)) {
            "Unknown discoveryMethod: $discoveryMethodParam"
        }

        val simulated = getBoolean(params, "simulated")
        val config = DiscoveryConfiguration(0, discoveryMethod, simulated)

        discoverCancelable = terminal.discoverReaders(
            config,
            object : DiscoveryListener {
                override fun onUpdateDiscoveredReaders(readers: List<Reader>) {
                    discoveredReadersList = readers
                    sendEvent(UPDATE_DISCOVERED_READERS.listenerName) {
                        putArray("readers", mapFromReaders(readers))
                    }
                }
            },
            object : Callback {
                override fun onSuccess() {
                    sendEvent(FINISH_DISCOVERING_READERS.listenerName) {
                        putMap("result", WritableNativeMap())
                    }
                }

                override fun onFailure(e: TerminalException) {
                    sendEvent(FINISH_DISCOVERING_READERS.listenerName) {
                        putMap("result", createError(e))
                    }
                }
            }
        )
    }

    @ReactMethod
    @Suppress("unused")
    fun cancelDiscovering(promise: Promise) = withExceptionResolver(promise) {
        val cancelable = requireCancelable(discoverCancelable) {
            "discoverReaders could not be canceled because the command has already been canceled or has completed."
        }
        cancelable.cancel(object : Callback {
            override fun onSuccess() {
                promise.resolve(WritableNativeMap())
            }

            override fun onFailure(e: TerminalException) {
                promise.resolve(createError(e))
            }
        })
    }

    @ReactMethod
    @Suppress("unused")
    fun connectBluetoothReader(params: ReadableMap, promise: Promise) =
        withExceptionResolver(promise) {
            val reader = requireParam(params.getMap("reader")) {
                "You must provide a reader object"
            }
            val readerId = reader.getString("serialNumber") as String

            val selectedReader = requireParam(discoveredReadersList.find {
                it.serialNumber == readerId
            }) {
                "Could not find reader with id $readerId"
            }

            val locationId =
                requireParam(params.getString("locationId") ?: selectedReader.location?.id) {
                    "You must provide a locationId"
                }

            val connectionConfig = ConnectionConfiguration.BluetoothConnectionConfiguration(
                locationId
            )

            val listener: BluetoothReaderListener = object : BluetoothReaderListener {
                override fun onReportAvailableUpdate(update: ReaderSoftwareUpdate) {
                    sendEvent(REPORT_AVAILABLE_UPDATE.listenerName) {
                        putMap("result", mapFromReaderSoftwareUpdate(update))
                    }
                }

                override fun onStartInstallingUpdate(
                    update: ReaderSoftwareUpdate,
                    cancelable: Cancelable?
                ) {
                    installUpdateCancelable = cancelable
                    sendEvent(START_INSTALLING_UPDATE.listenerName) {
                        putMap("result", mapFromReaderSoftwareUpdate(update))
                    }
                }

                override fun onReportReaderSoftwareUpdateProgress(progress: Float) {
                    sendEvent(REPORT_UPDATE_PROGRESS.listenerName) {
                        putMap("result", nativeMapOf {
                            putString("progress", progress.toString())
                        })
                    }
                }

                override fun onFinishInstallingUpdate(
                    update: ReaderSoftwareUpdate?,
                    e: TerminalException?
                ) {
                    sendEvent(FINISH_INSTALLING_UPDATE.listenerName) {
                        update?.let {
                            putMap("result", mapFromReaderSoftwareUpdate(update))
                        } ?: run {
                            putMap("result", WritableNativeMap())
                        }
                    }
                }

                override fun onRequestReaderInput(options: ReaderInputOptions) {
                    sendEvent(REQUEST_READER_INPUT.listenerName) {
                        putArray("result", mapFromReaderInputOptions(options))
                    }
                }

                override fun onRequestReaderDisplayMessage(message: ReaderDisplayMessage) {
                    sendEvent(REQUEST_READER_DISPLAY_MESSAGE.listenerName) {
                        putString("result", mapFromReaderDisplayMessage(message))
                    }
                }
            }

            terminal.connectBluetoothReader(
                selectedReader,
                connectionConfig,
                listener,
                object : ReaderCallback {
                    override fun onSuccess(reader: Reader) {
                        promise.resolve(nativeMapOf {
                            putMap("reader", mapFromReader(reader))
                        })
                    }

                    override fun onFailure(e: TerminalException) {
                        promise.resolve(createError(e))
                    }
                }
            )
        }

    @ReactMethod
    @Suppress("unused")
    fun connectInternetReader(params: ReadableMap, promise: Promise) =
        withExceptionResolver(promise) {
            val reader = requireParam(params.getMap("reader")) {
                "You must provide a reader object"
            }
            val readerId = reader.getString("serialNumber") as String

            val selectedReader = requireParam(discoveredReadersList.find {
                it.serialNumber == readerId
            }) {
                "Could not find reader with id $readerId"
            }

            val connectionConfig = ConnectionConfiguration.InternetConnectionConfiguration(
                failIfInUse = getBoolean(params, "failIfInUse")
            )

            terminal.connectInternetReader(
                selectedReader,
                connectionConfig,
                object : ReaderCallback {
                    override fun onSuccess(reader: Reader) {
                        promise.resolve(nativeMapOf {
                            putMap("reader", mapFromReader(reader))
                        })
                    }

                    override fun onFailure(e: TerminalException) {
                        promise.resolve(createError(e))
                    }
                }
            )
        }

    @OptIn(UsbConnectivity::class)
    @ReactMethod
    @Suppress("unused")
    fun connectUsbReader(params: ReadableMap, promise: Promise) = withExceptionResolver(promise) {
        val reader = requireParam(params.getMap("reader")) {
            "You must provide a reader object"
        }
        val readerId = reader.getString("serialNumber")

        val selectedReader = requireParam(
            discoveredReadersList.find { it.serialNumber == readerId }
        ) {
            "Could not find reader with id $readerId"
        }

        val locationId = requireParam(
            params.getString("locationId") ?: selectedReader.location?.id
        ) {
            "You must provide a locationId"
        }

        val listener: UsbReaderListener = object : UsbReaderListener {
            override fun onReportAvailableUpdate(update: ReaderSoftwareUpdate) {
                sendEvent(REPORT_AVAILABLE_UPDATE.listenerName) {
                    putMap("result", mapFromReaderSoftwareUpdate(update))
                }
            }

            override fun onStartInstallingUpdate(
                update: ReaderSoftwareUpdate,
                cancelable: Cancelable?
            ) {
                installUpdateCancelable = cancelable
                sendEvent(START_INSTALLING_UPDATE.listenerName) {
                    putMap("result", mapFromReaderSoftwareUpdate(update))
                }
            }

            override fun onReportReaderSoftwareUpdateProgress(progress: Float) {
                sendEvent(REPORT_UPDATE_PROGRESS.listenerName) {
                    putMap("result", nativeMapOf {
                        putString("progress", progress.toString())
                    })
                }
            }

            override fun onFinishInstallingUpdate(
                update: ReaderSoftwareUpdate?,
                e: TerminalException?
            ) {
                sendEvent(FINISH_INSTALLING_UPDATE.listenerName) {
                    update?.let {
                        putMap("result", mapFromReaderSoftwareUpdate(update))
                    } ?: run {
                        putMap("result", WritableNativeMap())
                    }
                }
            }

            override fun onRequestReaderInput(options: ReaderInputOptions) {
                sendEvent(REQUEST_READER_INPUT.listenerName) {
                    putArray("result", mapFromReaderInputOptions(options))
                }
            }

            override fun onRequestReaderDisplayMessage(message: ReaderDisplayMessage) {
                sendEvent(REQUEST_READER_DISPLAY_MESSAGE.listenerName) {
                    putString("result", mapFromReaderDisplayMessage(message))
                }
                sendEvent(REQUEST_READER_DISPLAY_MESSAGE.listenerName) {
                    putString("result", mapFromReaderDisplayMessage(message))
                }
            }
        }

        terminal.connectUsbReader(
            selectedReader,
            ConnectionConfiguration.UsbConnectionConfiguration(locationId),
            listener,
            object : ReaderCallback {
                override fun onSuccess(reader: Reader) {
                    promise.resolve(nativeMapOf {
                        putMap("reader", mapFromReader(reader))
                    })
                }

                override fun onFailure(e: TerminalException) {
                    promise.resolve(createError(e))
                }
            }
        )
    }

    @ReactMethod
    @Suppress("unused")
    fun disconnectReader(promise: Promise) {
        terminal.disconnectReader(object : Callback {
            override fun onSuccess() {
                promise.resolve(WritableNativeMap())
            }

            override fun onFailure(e: TerminalException) {
                promise.resolve(createError(e))
            }
        })
    }

    @ReactMethod
    @Suppress("unused")
    fun createPaymentIntent(params: ReadableMap, promise: Promise) {
        val amount = getInt(params, "amount") ?: 0
        val currency = params.getString("currency") ?: ""
        val setupFutureUsage = params.getString("currency")

        val intentParams = PaymentIntentParameters.Builder()
            .setAmount(amount.toLong())
            .setCurrency(currency)

        setupFutureUsage?.let {
            intentParams.setSetupFutureUsage(it)
        }

        terminal.createPaymentIntent(intentParams.build(), object : PaymentIntentCallback {
            override fun onSuccess(paymentIntent: PaymentIntent) {
                paymentIntents[paymentIntent.id] = paymentIntent
                onPaymentIntentCallback(paymentIntent, promise)
            }

            override fun onFailure(e: TerminalException) {
                promise.resolve(createError(e))
            }
        })
    }

    @ReactMethod
    @Suppress("unused")
    fun collectPaymentMethod(paymentIntentId: String, promise: Promise) =
        withExceptionResolver(promise) {
            val paymentIntent = requireParam(paymentIntents[paymentIntentId]) {
                "There is no associated paymentIntent with id $paymentIntentId"
            }
            collectPaymentMethodCancelable = terminal
                .collectPaymentMethod(paymentIntent, object : PaymentIntentCallback {
                    override fun onSuccess(paymentIntent: PaymentIntent) {
                        paymentIntents[paymentIntent.id] = paymentIntent
                        onPaymentIntentCallback(paymentIntent, promise)
                    }

                    override fun onFailure(e: TerminalException) {
                        promise.resolve(createError(e))
                    }
                })
        }

    @ReactMethod
    @Suppress("unused")
    fun retrievePaymentIntent(clientSecret: String, promise: Promise) {
        terminal.retrievePaymentIntent(clientSecret, object : PaymentIntentCallback {
            override fun onSuccess(paymentIntent: PaymentIntent) {
                paymentIntents[paymentIntent.id] = paymentIntent
                onPaymentIntentCallback(paymentIntent, promise)
            }

            override fun onFailure(e: TerminalException) {
                promise.resolve(createError(e))
            }
        })
    }


    @ReactMethod
    @Suppress("unused")
    fun processPayment(paymentIntentId: String, promise: Promise) = withExceptionResolver(promise) {
        val paymentIntent = requireParam(paymentIntents[paymentIntentId]) {
            "There is no associated paymentIntent with id $paymentIntentId"
        }

        terminal.processPayment(paymentIntent, object : PaymentIntentCallback {
            override fun onSuccess(paymentIntent: PaymentIntent) {
                paymentIntents[paymentIntent.id] = paymentIntent
                onPaymentIntentCallback(paymentIntent, promise)
            }

            override fun onFailure(e: TerminalException) {
                promise.resolve(createError(e))
            }
        })
    }

    @ReactMethod
    @Suppress("unused")
    fun getLocations(params: ReadableMap, promise: Promise) {
        val listParameters = ListLocationsParameters.Builder()
        listParameters.endingBefore = params.getString("endingBefore")
        listParameters.startingAfter = params.getString("startingAfter")
        listParameters.limit = getInt(params, "endingBefore")

        terminal.listLocations(listParameters.build(), object : LocationListCallback {
            override fun onSuccess(locations: List<Location>, hasMore: Boolean) {
                promise.resolve(nativeMapOf {
                    putArray("locations", mapFromListLocations(locations))
                    putBoolean("hasMore", hasMore)
                })
            }

            override fun onFailure(e: TerminalException) {
                promise.resolve(createError(e))
            }
        })
    }

    @ReactMethod
    @Suppress("unused")
    fun createSetupIntent(params: ReadableMap, promise: Promise) {
        val intentParams = params.getString("customer")?.let { customerId ->
            SetupIntentParameters.Builder().setCustomer(customerId).build()
        } ?: SetupIntentParameters.NULL

        terminal.createSetupIntent(intentParams, object : SetupIntentCallback {
            override fun onSuccess(setupIntent: SetupIntent) {
                setupIntents[setupIntent.id] = setupIntent
                onSetupIntentCallback(setupIntent, promise)
            }

            override fun onFailure(e: TerminalException) {
                promise.resolve(createError(e))
            }
        })
    }

    @ReactMethod
    @Suppress("unused")
    fun retrieveSetupIntent(clientSecret: String, promise: Promise) {
        terminal.retrieveSetupIntent(clientSecret, object : SetupIntentCallback {
            override fun onSuccess(setupIntent: SetupIntent) {
                setupIntents[setupIntent.id] = setupIntent
                onSetupIntentCallback(setupIntent, promise)
            }

            override fun onFailure(e: TerminalException) {
                promise.resolve(createError(e))
            }
        })
    }

    @ReactMethod
    @Suppress("unused")
    fun cancelPaymentIntent(paymentIntentId: String, promise: Promise) =
        withExceptionResolver(promise) {
            val paymentIntent = requireParam(paymentIntents[paymentIntentId]) {
                "There is no associated paymentIntent with id $paymentIntentId"
            }
            terminal.cancelPaymentIntent(paymentIntent, object : PaymentIntentCallback {
                override fun onSuccess(paymentIntent: PaymentIntent) {
                    onPaymentIntentCallback(paymentIntent, promise)
                }

                override fun onFailure(e: TerminalException) {
                    promise.resolve(createError(e))
                }
            })
        }

    @ReactMethod
    @Suppress("unused")
    fun cancelReadReusableCard(promise: Promise) = withExceptionResolver(promise) {
        val cancelable = requireCancelable(readReusableCardCancelable) {
            "readReusableCard could not be canceled because the command has already been canceled or has completed."
        }
        cancelable.cancel(object : Callback {
            override fun onSuccess() {
                promise.resolve(WritableNativeMap())
            }

            override fun onFailure(e: TerminalException) {
                promise.resolve(createError(e))
            }
        })
    }

    @ReactMethod
    @Suppress("unused")
    fun collectSetupIntentPaymentMethod(params: ReadableMap, promise: Promise) =
        withExceptionResolver(promise) {
            val setupIntentId = params.getString("setupIntentId")
            val customerConsentCollected = getBoolean(params, "customerConsentCollected")

            val setupIntent = requireParam(setupIntents[setupIntentId]) {
                "There is no created paymentIntent with id $setupIntentId"
            }
            collectSetupIntentCancelable = terminal.collectSetupIntentPaymentMethod(
                setupIntent,
                customerConsentCollected,
                object : SetupIntentCallback {
                    override fun onSuccess(setupIntent: SetupIntent) {
                        onSetupIntentCallback(setupIntent, promise)
                    }

                    override fun onFailure(e: TerminalException) {
                        promise.resolve(createError(e))
                    }
                })
        }

    @ReactMethod
    @Suppress("unused")
    fun installAvailableUpdate(promise: Promise) {
        terminal.installAvailableUpdate()
        promise.resolve(WritableNativeMap())
    }

    @ReactMethod
    @Suppress("unused")
    fun cancelInstallingUpdate(promise: Promise) {
        installUpdateCancelable?.cancel(object : Callback {
            override fun onSuccess() {
                promise.resolve(WritableNativeMap())
            }

            override fun onFailure(e: TerminalException) {
                promise.resolve(createError(e))
            }
        })
    }

    @ReactMethod
    @Suppress("unused")
    fun setReaderDisplay(params: ReadableMap, promise: Promise) = withExceptionResolver(promise) {
        val currency = requireParam(params.getString("currency")) {
            "You must provide a currency value"
        }
        val tax = requireParam(getInt(params, "total")?.toLong()) {
            "You must provide a tax value"
        }
        val total = requireParam(getInt(params, "total")?.toLong()) {
            "You must provide a total value"
        }

        val cartLineItems =
            mapToCartLineItems(params.getArray("lineItems") ?: WritableNativeArray())

        val cart = Cart.Builder(
            currency = currency,
            tax = tax,
            total = total,
            lineItems = cartLineItems
        ).build()

        terminal.setReaderDisplay(cart, object : Callback {
            override fun onSuccess() {
                promise.resolve(WritableNativeMap())
            }

            override fun onFailure(e: TerminalException) {
                promise.resolve(createError(e))
            }
        })
    }

    @ReactMethod
    @Suppress("unused")
    fun cancelSetupIntent(setupIntentId: String, promise: Promise) =
        withExceptionResolver(promise) {
            val setupIntent = requireParam(setupIntents[setupIntentId]) {
                "There is no associated setupIntent with id $setupIntentId"
            }

            val params = SetupIntentCancellationParameters.Builder().build()

            terminal.cancelSetupIntent(setupIntent, params, object : SetupIntentCallback {
                override fun onSuccess(setupIntent: SetupIntent) {
                    setupIntents[setupIntent.id] = null
                    onSetupIntentCallback(setupIntent, promise)
                }

                override fun onFailure(e: TerminalException) {
                    promise.resolve(createError(e))
                }
            })
        }

    @ReactMethod
    @Suppress("unused")
    fun confirmSetupIntent(setupIntentId: String, promise: Promise) =
        withExceptionResolver(promise) {
            val setupIntent = requireParam(setupIntents[setupIntentId]) {
                "There is no associated setupIntent with id $setupIntentId"
            }

            terminal.confirmSetupIntent(setupIntent, object : SetupIntentCallback {
                override fun onSuccess(setupIntent: SetupIntent) {
                    setupIntents[setupIntent.id] = null
                    onSetupIntentCallback(setupIntent, promise)
                }

                override fun onFailure(e: TerminalException) {
                    promise.resolve(createError(e))
                }
            })
        }

    @ReactMethod
    @Suppress("unused")
    fun clearReaderDisplay(promise: Promise) {
        terminal.clearReaderDisplay(object : Callback {
            override fun onSuccess() {
                promise.resolve(WritableNativeMap())
            }

            override fun onFailure(e: TerminalException) {
                promise.resolve(createError(e))
            }
        })
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

            val intentParams = RefundParameters.Builder(chargeId, amount, currency).build()

            terminal.collectRefundPaymentMethod(intentParams, object : Callback {
                override fun onSuccess() {
                    promise.resolve(WritableNativeMap())
                }

                override fun onFailure(e: TerminalException) {
                    promise.resolve(createError(e))
                }
            })
        }

    @ReactMethod
    @Suppress("unused")
    fun clearCachedCredentials(promise: Promise) {
        terminal.clearCachedCredentials()
        promise.resolve(WritableNativeMap())
    }

    @ReactMethod
    @Suppress("unused")
    fun processRefund(promise: Promise) {
        terminal.processRefund(object : RefundCallback {
            override fun onSuccess(refund: Refund) {
                promise.resolve(nativeMapOf {
                    putMap("refund", mapFromRefund(refund))
                })
            }

            override fun onFailure(e: TerminalException) {
                promise.resolve(createError(e))
            }
        })
    }

    @ReactMethod
    @Suppress("unused")
    fun readReusableCard(params: ReadableMap, promise: Promise) {
        val reusableCardParams = params.getString("customer")?.let { customerId ->
            ReadReusableCardParameters.Builder().setCustomer(customerId).build()
        } ?: ReadReusableCardParameters.NULL

        readReusableCardCancelable = terminal
            .readReusableCard(reusableCardParams, object : PaymentMethodCallback {
                override fun onSuccess(paymentMethod: PaymentMethod) {
                    promise.resolve(nativeMapOf {
                        putMap("paymentMethod", mapFromPaymentMethod(paymentMethod))
                    })
                }

                override fun onFailure(e: TerminalException) {
                    promise.resolve(createError(e))
                }
            })
    }

    private fun sendEvent(eventName: String, result: ReadableMap) {
        reactApplicationContext
            .getJSModule(RCTDeviceEventEmitter::class.java)
            .emit(eventName, result)
    }

    private fun sendEvent(eventName: String, resultBuilder: WritableNativeMap.() -> Unit) {
        reactApplicationContext
            .getJSModule(RCTDeviceEventEmitter::class.java)
            .emit(eventName, nativeMapOf {
                resultBuilder()
            })
    }

    private fun onPaymentIntentCallback(paymentIntent: PaymentIntent, promise: Promise) {
        promise.resolve(nativeMapOf {
            putMap("paymentIntent", mapFromPaymentIntent(paymentIntent))
        })
    }

    private fun onSetupIntentCallback(setupIntent: SetupIntent, promise: Promise) {
        promise.resolve(nativeMapOf {
            putMap("setupIntent", mapFromSetupIntent(setupIntent))
        })
    }
}
