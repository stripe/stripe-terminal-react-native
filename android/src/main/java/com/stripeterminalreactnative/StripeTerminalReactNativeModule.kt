package com.stripeterminalreactnative

import android.app.Application
import android.content.ComponentCallbacks2
import android.content.res.Configuration
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter
import com.stripe.stripeterminal.Terminal
import com.stripe.stripeterminal.TerminalApplicationDelegate.onCreate
import com.stripe.stripeterminal.TerminalApplicationDelegate.onTrimMemory
import com.stripe.stripeterminal.external.callable.*
import com.stripe.stripeterminal.external.callable.Callback
import com.stripe.stripeterminal.external.models.*


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

    override fun getName(): String {
        return "StripeTerminalReactNative"
    }

    init {
        TokenProvider.tokenProviderCallback = object : TokenProviderCallback {
            override fun invoke() {
                reactApplicationContext
                    .getJSModule(RCTDeviceEventEmitter::class.java)
                    .emit("onFetchTokenProviderListener", null)
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
                val result = WritableNativeMap().apply {
                    putMap("result", error)
                }
                sendEvent("didFinishDiscoveringReaders", result)
            }

            override fun onConnectionStatusChange(status: ConnectionStatus) {
                super.onConnectionStatusChange(status)

                val result = WritableNativeMap()
                result.putString("result", mapFromConnectionStatus(status))

                sendEvent("didChangeConnectionStatus", result)
            }

            override fun onPaymentStatusChange(status: PaymentStatus) {
                super.onPaymentStatusChange(status)

                val result = WritableNativeMap()
                result.putString("result", mapFromPaymentStatus(status))

                sendEvent("didChangePaymentStatus", result)
            }
        }
        val result = WritableNativeMap()

        if (!Terminal.isInitialized()) {
            val logLevel = mapToLogLevel(getStringOr(params, "logLevel"))

            Terminal.initTerminal(
                this.reactApplicationContext.applicationContext,
                logLevel,
                TokenProvider.Companion,
                listener
            )
        } else {
            Terminal.getInstance().connectedReader?.let {
                result.putMap("reader", mapFromReader(it))
            }
        }

        promise.resolve(result)
    }

    @ReactMethod
    @Suppress("unused")
    fun cancelCollectPaymentMethod(promise: Promise) {
        val cancelable = collectPaymentMethodCancelable ?: run {
            promise.resolve(
                createError(
                    TerminalException(
                        TerminalException.TerminalErrorCode.CANCELED,
                        "collectPaymentMethod could not be canceled because the command has already been canceled or has completed."
                    )
                )
            )
            return
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
    fun cancelCollectSetupIntent(promise: Promise) {
        val cancelable = collectSetupIntentCancelable ?: run {
            promise.resolve(
                createError(
                    TerminalException(
                        TerminalException.TerminalErrorCode.CANCELED,
                        "collectSetupIntent could not be canceled because the command has already been canceled or has completed."
                    )
                )
            )
            return
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
        Terminal.getInstance().simulatorConfiguration = SimulatorConfiguration(updateMapped)
        promise.resolve(WritableNativeMap())
    }

    @ReactMethod
    @Suppress("unused")
    fun setConnectionToken(params: ReadableMap, promise: Promise) {
        val token = getStringOr(params, "token")
        val error = getStringOr(params, "error")
        TokenProvider.setConnectionToken(token, error)
        promise.resolve(null)
    }

    @ReactMethod
    @Suppress("unused")
    fun discoverReaders(params: ReadableMap, promise: Promise) {
        val discoveryMethodParam = getStringOr(params, "discoveryMethod") ?: run {
            promise.resolve(
                createError(
                    CommonErrorType.Failed.toString(),
                    "You must provide a discoveryMethod"
                )
            )
            return
        }

        val discoveryMethod = mapToDiscoveryMethod(discoveryMethodParam) ?: run {
            promise.resolve(
                createError(
                    CommonErrorType.Failed.toString(),
                    "Unknown discoveryMethod: $discoveryMethodParam"
                )
            )
            return
        }


        val simulated = getBoolean(params, "simulated")

        val config = DiscoveryConfiguration(0, discoveryMethod, simulated)

        discoverCancelable = Terminal.getInstance().discoverReaders(
            config,
            object : DiscoveryListener {
                override fun onUpdateDiscoveredReaders(readers: List<Reader>) {
                    discoveredReadersList = readers

                    val readersArray = mapFromReaders(readers)
                    val result = WritableNativeMap()
                    result.putArray("readers", readersArray)

                    sendEvent("didUpdateDiscoveredReaders", result)
                }
            },
            object : Callback {
                override fun onSuccess() {
                    val result = WritableNativeMap().apply {
                        putMap("result", WritableNativeMap())
                    }
                    sendEvent("didFinishDiscoveringReaders", result)
                }

                override fun onFailure(e: TerminalException) {
                    val result = WritableNativeMap().apply {
                        putMap("result", createError(e))
                    }
                    sendEvent("didFinishDiscoveringReaders", result)
                }
            }
        )
    }

    @ReactMethod
    @Suppress("unused")
    fun cancelDiscovering(promise: Promise) {
        val cancelable = discoverCancelable ?: run {
            promise.resolve(
                createError(
                    TerminalException(
                        TerminalException.TerminalErrorCode.CANCELED,
                        "discoverReaders could not be canceled because the command has already been canceled or has completed."
                    )
                )
            )
            return
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
    fun connectBluetoothReader(params: ReadableMap, promise: Promise) {
        val reader = getMapOr(params, "reader") ?: run {
            promise.resolve(
                createError(
                    TerminalException(
                        TerminalException.TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
                        "You must provide a reader object"
                    )
                )
            )
            return
        }
        val readerId = getStringOr(reader, "serialNumber") as String

        val selectedReader = discoveredReadersList.find {
            it.serialNumber == readerId
        } ?: run {
            promise.resolve(
                createError(
                    TerminalException(
                        TerminalException.TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
                        "Could not find reader with id $readerId"
                    )
                )
            )
            return
        }

        val locationId = getStringOr(params, "locationId") ?: selectedReader.location?.id ?: run {
            promise.resolve(
                createError(
                    TerminalException(
                        TerminalException.TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
                        "You must provide a locationId"
                    )
                )
            )
            return
        }

        val connectionConfig = ConnectionConfiguration.BluetoothConnectionConfiguration(
            locationId
        )

        val listener: BluetoothReaderListener = object : BluetoothReaderListener {
            override fun onReportAvailableUpdate(update: ReaderSoftwareUpdate) {
                super.onReportAvailableUpdate(update)
                val result = WritableNativeMap()
                result.putMap("result", mapFromReaderSoftwareUpdate(update))
                sendEvent("didReportAvailableUpdate", result)
            }

            override fun onStartInstallingUpdate(
                update: ReaderSoftwareUpdate,
                cancelable: Cancelable?
            ) {
                super.onStartInstallingUpdate(update, cancelable)

                installUpdateCancelable = cancelable

                val result = WritableNativeMap()
                result.putMap("result", mapFromReaderSoftwareUpdate(update))
                sendEvent("didStartInstallingUpdate", result)
            }

            override fun onReportReaderSoftwareUpdateProgress(progress: Float) {
                super.onReportReaderSoftwareUpdateProgress(progress)
                val result = WritableNativeMap()
                val map = WritableNativeMap()
                map.putString("progress", progress.toString())
                result.putMap("result", map)
                sendEvent("didReportReaderSoftwareUpdateProgress", result)
            }

            override fun onFinishInstallingUpdate(
                update: ReaderSoftwareUpdate?,
                e: TerminalException?
            ) {
                super.onFinishInstallingUpdate(update, e)
                val result = WritableNativeMap()
                update?.let {
                    result.putMap("result", mapFromReaderSoftwareUpdate(update))
                } ?: run {
                    result.putMap("result", WritableNativeMap())
                }
                sendEvent("didFinishInstallingUpdate", result)
            }

            override fun onRequestReaderInput(options: ReaderInputOptions) {
                super.onRequestReaderInput(options)

                val result = WritableNativeMap()
                result.putArray("result", mapFromReaderInputOptions(options))
                sendEvent("didRequestReaderInput", result)
            }

            override fun onRequestReaderDisplayMessage(message: ReaderDisplayMessage) {
                super.onRequestReaderDisplayMessage(message)

                val result = WritableNativeMap()
                result.putString("result", mapFromReaderDisplayMessage(message))
                sendEvent("didRequestReaderDisplayMessage", result)
            }
        }

        Terminal.getInstance().connectBluetoothReader(
            selectedReader,
            connectionConfig,
            listener,
            object : ReaderCallback {
                override fun onSuccess(reader: Reader) {
                    val result = WritableNativeMap()
                    result.putMap("reader", mapFromReader(reader))
                    promise.resolve(result)
                }

                override fun onFailure(e: TerminalException) {
                    promise.resolve(createError(e))
                }
            }
        )
    }

    @ReactMethod
    @Suppress("unused")
    fun connectInternetReader(params: ReadableMap, promise: Promise) {
        val reader = getMapOr(params, "reader") ?: run {
            promise.resolve(
                createError(
                    TerminalException(
                        TerminalException.TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
                        "You must provide a reader object"
                    )
                )
            )
            return
        }
        val readerId = getStringOr(reader, "serialNumber") as String

        val selectedReader = discoveredReadersList.find {
            it.serialNumber == readerId
        } ?: run {
            promise.resolve(
                createError(
                    TerminalException(
                        TerminalException.TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
                        "Could not find reader with id $readerId"
                    )
                )
            )
            return
        }

        val connectionConfig = ConnectionConfiguration.InternetConnectionConfiguration(
            failIfInUse = getBoolean(params, "failIfInUse")
        )

        Terminal.getInstance().connectInternetReader(
            selectedReader,
            connectionConfig,
            object : ReaderCallback {
                override fun onSuccess(reader: Reader) {
                    val result = WritableNativeMap()
                    result.putMap("reader", mapFromReader(reader))
                    promise.resolve(result)
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
        Terminal.getInstance().disconnectReader(object : Callback {
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
        val amount = getIntOr(params, "amount") ?: 0
        val currency = getStringOr(params, "currency") ?: ""
        val setupFutureUsage = getStringOr(params, "currency")

        val intentParams = PaymentIntentParameters.Builder()
            .setAmount(amount.toLong())
            .setCurrency(currency)

        setupFutureUsage?.let {
            intentParams.setSetupFutureUsage(it)
        }

        Terminal.getInstance()
            .createPaymentIntent(intentParams.build(), object : PaymentIntentCallback {
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
    fun collectPaymentMethod(paymentIntentId: String, promise: Promise) {
        val paymentIntent = paymentIntents[paymentIntentId] ?: run {
            promise.resolve(
                createError(
                    TerminalException(
                        TerminalException.TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
                        "There is no associated paymentIntent with id $paymentIntentId"
                    )
                )
            )
            return
        }
        collectPaymentMethodCancelable = Terminal.getInstance()
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
        Terminal.getInstance().retrievePaymentIntent(clientSecret, object : PaymentIntentCallback {
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
    fun processPayment(paymentIntentId: String, promise: Promise) {
        val paymentIntent = paymentIntents[paymentIntentId] ?: run {
            promise.resolve(
                createError(
                    TerminalException(
                        TerminalException.TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
                        "There is no associated paymentIntent with id $paymentIntentId"
                    )
                )
            )
            return
        }
        Terminal.getInstance().processPayment(paymentIntent, object : PaymentIntentCallback {
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
    fun getListLocations(params: ReadableMap, promise: Promise) {
        val listParameters = ListLocationsParameters.Builder()
        listParameters.endingBefore = getStringOr(params, "endingBefore")
        listParameters.startingAfter = getStringOr(params, "startingAfter")
        listParameters.limit = getIntOr(params, "endingBefore")

        Terminal.getInstance().listLocations(listParameters.build(), object : LocationListCallback {
            override fun onSuccess(locations: List<Location>, hasMore: Boolean) {
                val list = mapFromListLocations(locations)
                val result = WritableNativeMap()
                result.putArray("locationsList", list)
                result.putBoolean("hasMore", hasMore)
                promise.resolve(result)
            }

            override fun onFailure(e: TerminalException) {
                promise.resolve(createError(e))
            }
        })
    }

    @ReactMethod
    @Suppress("unused")
    fun createSetupIntent(params: ReadableMap, promise: Promise) {
        val intentParams = getStringOr(params, "customer")?.let { customerId ->
            SetupIntentParameters.Builder().setCustomer(customerId).build()
        } ?: SetupIntentParameters.NULL

        Terminal.getInstance().createSetupIntent(intentParams, object : SetupIntentCallback {
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
        Terminal.getInstance().retrieveSetupIntent(clientSecret, object : SetupIntentCallback {
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
    fun cancelPaymentIntent(paymentIntentId: String, promise: Promise) {
        val paymentIntent = paymentIntents[paymentIntentId] ?: run {
            promise.resolve(
                createError(
                    TerminalException(
                        TerminalException.TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
                        "There is no associated paymentIntent with id $paymentIntentId"
                    )
                )
            )
            return
        }
        Terminal.getInstance().cancelPaymentIntent(paymentIntent, object : PaymentIntentCallback {
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
    fun cancelReadReusableCard(promise: Promise) {
        val cancelable = readReusableCardCancelable ?: run {
            promise.resolve(
                createError(
                    TerminalException(
                        TerminalException.TerminalErrorCode.CANCELED,
                        "readReusableCard could not be canceled because the command has already been canceled or has completed."
                    )
                )
            )
            return
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
    fun collectSetupIntentPaymentMethod(params: ReadableMap, promise: Promise) {
        val setupIntentId = getStringOr(params, "setupIntentId")
        val customerConsentCollected = getBoolean(params, "customerConsentCollected")

        val setupIntent = setupIntents[setupIntentId] ?: run {
            promise.resolve(
                createError(
                    TerminalException(
                        TerminalException.TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
                        "There is no created paymentIntent with id $setupIntentId"
                    )
                )
            )
            return
        }
        collectSetupIntentCancelable = Terminal.getInstance().collectSetupIntentPaymentMethod(
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
        Terminal.getInstance().installAvailableUpdate()
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
    fun setReaderDisplay(params: ReadableMap, promise: Promise) {
        validateRequiredParameters(params, listOf("currency", "tax", "total"))?.let {
            promise.resolve(
                TerminalException(
                    TerminalException.TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
                    "You must provide $it parameters."
                )
            )
            return
        }

        val currency = getStringOr(params, "currency")
        val tax = getIntOr(params, "total")?.toLong()
        val total = getIntOr(params, "total")?.toLong()

        val cartLineItems =
            mapToCartLineItems(getArrayOr(params, "lineItems") ?: WritableNativeArray())

        val cart = Cart.Builder(
            currency = currency!!,
            tax = tax!!,
            total = total!!,
            lineItems = cartLineItems
        ).build()

        Terminal.getInstance().setReaderDisplay(cart, object : Callback {
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
    fun cancelSetupIntent(setupIntentId: String, promise: Promise) {
        val setupIntent = setupIntents[setupIntentId] ?: run {
            promise.resolve(
                createError(
                    TerminalException(
                        TerminalException.TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
                        "There is no associated setupIntent with id $setupIntentId"
                    )
                )
            )
            return
        }

        val params = SetupIntentCancellationParameters.Builder()
            .build()

        Terminal.getInstance().cancelSetupIntent(setupIntent, params, object : SetupIntentCallback {
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
    fun confirmSetupIntent(setupIntentId: String, promise: Promise) {
        val setupIntent = setupIntents[setupIntentId] ?: run {
            promise.resolve(
                createError(
                    TerminalException(
                        TerminalException.TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
                        "There is no associated setupIntent with id $setupIntentId"
                    )
                )
            )
            return
        }

        Terminal.getInstance().confirmSetupIntent(setupIntent, object : SetupIntentCallback {
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
        Terminal.getInstance().clearReaderDisplay(object : Callback {
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
    fun collectRefundPaymentMethod(params: ReadableMap, promise: Promise) {
        validateRequiredParameters(params, listOf("chargeId", "amount", "currency"))?.let {
            promise.resolve(
                createError(
                    TerminalException(
                        TerminalException.TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
                        "You must provide $it parameters."
                    )
                )
            )
            return
        }
        val chargeId = getStringOr(params, "chargeId") ?: ""
        val amount = getIntOr(params, "amount")?.toLong() ?: 0
        val currency = getStringOr(params, "currency") ?: ""

        val intentParams = RefundParameters.Builder(chargeId, amount, currency).build()

        Terminal.getInstance().collectRefundPaymentMethod(intentParams, object : Callback {
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
        Terminal.getInstance().clearCachedCredentials()
        promise.resolve(WritableNativeMap())
    }

    @ReactMethod
    @Suppress("unused")
    fun processRefund(promise: Promise) {
        Terminal.getInstance().processRefund(object : RefundCallback {
            override fun onSuccess(refund: Refund) {
                val rf = mapFromRefund(refund)
                val result = WritableNativeMap().apply {
                    putMap("refund", rf)
                }

                promise.resolve(result)

            }

            override fun onFailure(e: TerminalException) {
                promise.resolve(createError(e))
            }
        })
    }

    @ReactMethod
    @Suppress("unused")
    fun readReusableCard(params: ReadableMap, promise: Promise) {
        val reusableCardParams = getStringOr(params, "customer")?.let { customerId ->
            ReadReusableCardParameters.Builder().setCustomer(customerId).build()
        } ?: ReadReusableCardParameters.NULL

        readReusableCardCancelable = Terminal.getInstance()
            .readReusableCard(reusableCardParams, object : PaymentMethodCallback {
                override fun onSuccess(paymentMethod: PaymentMethod) {
                    val pm = mapFromPaymentMethod(paymentMethod)
                    val result = WritableNativeMap().apply {
                        putMap("paymentMethod", pm)
                    }

                    promise.resolve(result)
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

    private fun onPaymentIntentCallback(paymentIntent: PaymentIntent, promise: Promise) {
        val pi = mapFromPaymentIntent(paymentIntent)
        val result = WritableNativeMap().apply {
            putMap("paymentIntent", pi)
        }

        promise.resolve(result)
    }

    private fun onSetupIntentCallback(setupIntent: SetupIntent, promise: Promise) {
        val si = mapFromSetupIntent(setupIntent)
        val result = WritableNativeMap().apply {
            putMap("setupIntent", si)
        }

        promise.resolve(result)
    }
}
