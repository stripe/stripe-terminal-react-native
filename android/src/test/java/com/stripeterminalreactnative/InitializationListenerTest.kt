package com.stripeterminalreactnative

import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.stripe.stripeterminal.Terminal
import com.stripe.stripeterminal.external.OfflineMode
import com.stripe.stripeterminal.external.callable.OfflineListener
import com.stripe.stripeterminal.external.callable.TerminalListener
import com.stripe.stripeterminal.external.models.ConnectionStatus
import com.stripe.stripeterminal.external.models.OfflineStatus
import com.stripe.stripeterminal.external.models.PaymentStatus
import com.stripe.stripeterminal.external.models.Reader
import com.stripe.stripeterminal.external.models.TerminalErrorCode
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants.CHANGE_CONNECTION_STATUS
import com.stripeterminalreactnative.ReactNativeConstants.CHANGE_OFFLINE_STATUS
import com.stripeterminalreactnative.ReactNativeConstants.CHANGE_PAYMENT_STATUS
import com.stripeterminalreactnative.ReactNativeConstants.FORWARD_PAYMENT_INTENT
import com.stripeterminalreactnative.ReactNativeConstants.FORWARD_SETUP_INTENT
import com.stripeterminalreactnative.ReactNativeConstants.REPORT_FORWARDING_ERROR
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.mockkStatic
import io.mockk.slot
import io.mockk.unmockkObject
import io.mockk.unmockkStatic
import io.mockk.verify
import org.junit.After
import org.junit.Before
import org.junit.ClassRule
import org.junit.Test
import kotlin.test.assertEquals

@OptIn(OfflineMode::class)
class InitializationListenerTest {
    companion object {
        @ClassRule
        @JvmField
        val typeReplacer = ReactNativeTypeReplacementRule()
    }

    private val terminal = mockk<Terminal>()
    private var initialized = false
    private lateinit var terminalListener: TerminalListener
    private lateinit var offlineListener: OfflineListener
    private val params = JavaOnlyMap().apply {
        putMap("localeConfig", JavaOnlyMap.of("type", "cardLanguagePreferenceIfAvailable"))
    }

    @Before
    fun setUp() {
        mockkObject(Terminal.Companion)
        mockkStatic(UiThreadUtil::class)
        every { UiThreadUtil.runOnUiThread(any<Runnable>()) } returns true
        every { Terminal.getInstance() } returns terminal
        every { Terminal.isInitialized() } answers { initialized }
        every { terminal.connectedReader } returns null
        every { Terminal.init(any(), any(), any(), any(), any(), any()) } answers {
            terminalListener = arg(3)
            offlineListener = arg(4)
            initialized = true
        }
        every { terminal.setTerminalListener(any()) } answers { terminalListener = firstArg() }
        every { terminal.setOfflineListener(any()) } answers { offlineListener = firstArg() }
    }

    @After
    fun tearDown() {
        unmockkObject(Terminal.Companion)
        unmockkStatic(UiThreadUtil::class)
    }

    @Test
    fun `native global events reach each replacement context after repeated reloads`() {
        val originalContext = mockk<ReactApplicationContext>(relaxed = true)
        var previous = StripeTerminalReactNativeModule(originalContext)
        previous.initialize(params, mockk<Promise>(relaxed = true))
        val replacementContexts = mutableListOf<ReactApplicationContext>()

        repeat(3) {
            val context = mockk<ReactApplicationContext>(relaxed = true)
            val replacement = StripeTerminalReactNativeModule(context)
            replacement.initialize(params, mockk<Promise>(relaxed = true))
            previous.invalidate()
            replacementContexts.add(context)

            // Use the listeners held by the native singleton, not listeners
            // obtained directly from the replacement module.
            terminalListener.onConnectionStatusChange(ConnectionStatus.CONNECTED)
            terminalListener.onPaymentStatusChange(PaymentStatus.READY)
            offlineListener.onOfflineStatusChange(mockk<OfflineStatus>())
            offlineListener.onPaymentIntentForwarded(mockPaymentIntent(), null)
            offlineListener.onSetupIntentForwarded(mockSetupIntent(), null)
            offlineListener.onForwardingFailure(
                TerminalException(TerminalErrorCode.UNEXPECTED_SDK_ERROR, "Forwarding failed")
            )
            previous = replacement
        }

        verify(exactly = 0) { originalContext.sendEvent(any(), any()) }
        replacementContexts.forEach { context ->
            listOf(
                CHANGE_CONNECTION_STATUS, CHANGE_PAYMENT_STATUS, CHANGE_OFFLINE_STATUS,
                FORWARD_PAYMENT_INTENT, FORWARD_SETUP_INTENT, REPORT_FORWARDING_ERROR
            ).forEach { event ->
                verify(exactly = 1) { context.sendEvent(event.listenerName, any()) }
            }
        }
        verify(exactly = 1) { Terminal.init(any(), any(), any(), any(), any(), any()) }
        verify(exactly = 0) { terminal.disconnectReader(any()) }
    }

    @Test
    fun `reinitializing the same module preserves its connected reader without resetting Terminal`() {
        val context = mockk<ReactApplicationContext>(relaxed = true)
        val module = StripeTerminalReactNativeModule(context)
        module.initialize(params, mockk<Promise>(relaxed = true))
        val reader = mockk<Reader>()
        every { terminal.connectedReader } returns reader
        every { mapFromReader(reader) } returns JavaOnlyMap.of("serialNumber", "reader-123")

        repeat(2) {
            val promise = mockk<Promise>(relaxed = true)
            module.initialize(params, promise)

            val response = slot<ReadableMap>()
            verify(exactly = 1) { promise.resolve(capture(response)) }
            assertEquals("reader-123", response.captured.getMap("reader")?.getString("serialNumber"))
        }

        verify(exactly = 2) { terminal.setTerminalListener(any()) }
        verify(exactly = 2) { terminal.setOfflineListener(any()) }
        verify(exactly = 1) { Terminal.init(any(), any(), any(), any(), any(), any()) }
        verify(exactly = 0) { terminal.disconnectReader(any()) }
        verify(exactly = 0) { terminal.clearCachedCredentials() }
    }
}
