package com.stripeterminalreactnative

import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.stripe.stripeterminal.Terminal
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.slot
import io.mockk.unmockkObject
import io.mockk.verify
import org.junit.After
import org.junit.Before
import org.junit.ClassRule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import kotlin.test.assertEquals
import kotlin.test.assertSame

@RunWith(JUnit4::class)
class PaymentIntentErrorSourceTest {
    companion object {
        @ClassRule
        @JvmField
        val typeReplacer = ReactNativeTypeReplacementRule()
    }

    private val context = mockk<ReactApplicationContext>(relaxed = true)
    private val terminal = mockk<Terminal>()
    private lateinit var module: StripeTerminalReactNativeModule

    @Before
    fun setUp() {
        mockkObject(Terminal.Companion)
        every { Terminal.getInstance() } returns terminal
        module = StripeTerminalReactNativeModule(context)
    }

    @After
    fun tearDown() {
        unmockkObject(Terminal.Companion)
    }

    @Test
    fun `confirmPaymentIntent resolves SDK surcharge builder error as native`() {
        assertSurchargeBuilderFailure(module::confirmPaymentIntent)
    }

    @Test
    fun `processPaymentIntent resolves SDK surcharge builder error as native`() {
        assertSurchargeBuilderFailure(module::processPaymentIntent)
    }

    @Test
    fun `confirmPaymentIntent preserves RN payment intent validation before SDK surcharge builder`() {
        assertPaymentIntentValidationFailure(module::confirmPaymentIntent)
    }

    @Test
    fun `processPaymentIntent preserves RN payment intent validation before SDK surcharge builder`() {
        assertPaymentIntentValidationFailure(module::processPaymentIntent)
    }

    private fun assertSurchargeBuilderFailure(operation: (ReadableMap, Promise) -> Unit) {
        val paymentIntent = mockPaymentIntent()
        module.paymentIntents["pi_uuid"] = paymentIntent
        val params = zeroSurchargeParams().apply {
            putMap("paymentIntent", JavaOnlyMap().apply {
                putString("sdkUuid", "pi_uuid")
            })
        }

        val error = resolveError(operation, params)

        assertEquals("native", error.getString("error_source"))
        assertEquals("INVALID_SURCHARGE_PARAMETER", error.getString("code"))
        assertEquals("Surcharge amount must be a positive non-zero number", error.getString("message"))
        assertSame(paymentIntent, module.paymentIntents["pi_uuid"])
    }

    private fun assertPaymentIntentValidationFailure(operation: (ReadableMap, Promise) -> Unit) {
        val error = resolveError(operation, zeroSurchargeParams())

        assertEquals("rn", error.getString("error_source"))
        assertEquals("INVALID_REQUIRED_PARAMETER", error.getString("code"))
        assertEquals("You must provide a paymentIntent", error.getString("message"))
    }

    private fun resolveError(operation: (ReadableMap, Promise) -> Unit, params: ReadableMap): ReadableMap {
        val promise = mockk<Promise>(relaxed = true)

        operation(params, promise)

        val resolved = slot<ReadableMap>()
        verify(exactly = 1) { promise.resolve(capture(resolved)) }
        verify(exactly = 0) { terminal.confirmPaymentIntent(any(), any(), any()) }
        verify(exactly = 0) { terminal.processPaymentIntent(any(), any(), any(), any()) }
        return requireNotNull(resolved.captured.getMap("error"))
    }

    private fun zeroSurchargeParams() = JavaOnlyMap().apply {
        putMap("surcharge", JavaOnlyMap().apply { putInt("amount", 0) })
    }
}
