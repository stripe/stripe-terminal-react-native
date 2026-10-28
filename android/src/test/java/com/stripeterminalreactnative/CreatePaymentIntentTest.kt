package com.stripeterminalreactnative

import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.Terminal
import com.stripe.stripeterminal.external.callable.PaymentIntentCallback
import com.stripe.stripeterminal.external.models.CardPresentCaptureMethod
import com.stripe.stripeterminal.external.models.CardPresentParameters
import com.stripe.stripeterminal.external.models.CaptureMethod
import com.stripe.stripeterminal.external.models.PaymentIntentParameters
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
import kotlin.test.assertNull

@RunWith(JUnit4::class)
class CreatePaymentIntentTest {

    companion object {
        @ClassRule
        @JvmField
        val typeReplacer = ReactNativeTypeReplacementRule()
    }

    private val context = mockk<ReactApplicationContext>(relaxed = true)
    private val terminal = mockk<Terminal>(relaxed = true)
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
    fun `createPaymentIntent does not throw when captureDelayDays is omitted`() {
        val params = JavaOnlyMap().apply {
            putInt("amount", 5000)
            putString("currency", "usd")
            putArray("paymentMethodTypes", JavaOnlyArray())
            putMap("paymentMethodOptions", JavaOnlyMap().apply {
                putString("captureMethod", "manual")
            })
        }

        val cbSlot = slot<PaymentIntentCallback>()
        every { terminal.createPaymentIntent(any(), capture(cbSlot), any()) } answers {
            cbSlot.captured.onSuccess(mockPaymentIntent())
        }

        module.createPaymentIntent(params, mockk(relaxed = true))
        assertEquals(1, module.paymentIntents.size)
    }

    @Test
    fun `createPaymentIntent treats null optional primitives as omitted`() {
        val params = JavaOnlyMap().apply {
            putInt("amount", 5000)
            putString("currency", "usd")
            putArray("paymentMethodTypes", JavaOnlyArray())
            putNull("applicationFeeAmount")
            putMap("paymentMethodOptions", JavaOnlyMap().apply {
                putNull("requestExtendedAuthorization")
                putNull("requestIncrementalAuthorizationSupport")
                putNull("captureDelayDays")
                putMap("installments", JavaOnlyMap().apply {
                    putNull("enabled")
                })
            })
        }

        val cbSlot = slot<PaymentIntentCallback>()
        every { terminal.createPaymentIntent(any(), capture(cbSlot), any()) } answers {
            cbSlot.captured.onSuccess(mockPaymentIntent())
        }

        module.createPaymentIntent(params, mockk(relaxed = true))

        assertEquals(1, module.paymentIntents.size)
    }

    @Test
    fun `createPaymentIntent maps automatic_async capture method`() {
        val capturedParams = capturePaymentIntentParameters("automatic_async")

        assertEquals(CaptureMethod.AutomaticAsync, capturedParams.captureMethod)
    }

    @Test
    fun `createPaymentIntent preserves automatic_async default when capture method is omitted`() {
        val capturedParams = capturePaymentIntentParameters(null)

        assertEquals(CaptureMethod.AutomaticAsync, capturedParams.captureMethod)
    }

    @Test
    fun `createPaymentIntent maps automatic_delayed to CardPresentCaptureMethod AutomaticDelayed with captureDelayDays`() {
        val params = JavaOnlyMap().apply {
            putInt("amount", 5000)
            putString("currency", "usd")
            putArray("paymentMethodTypes", JavaOnlyArray())
            putMap("paymentMethodOptions", JavaOnlyMap().apply {
                putString("captureMethod", "automatic_delayed")
                putInt("captureDelayDays", 2)
            })
        }

        val intentParamsSlot = slot<PaymentIntentParameters>()
        val cbSlot = slot<PaymentIntentCallback>()
        every { terminal.createPaymentIntent(capture(intentParamsSlot), capture(cbSlot), any()) } answers {
            cbSlot.captured.onSuccess(mockPaymentIntent())
        }

        module.createPaymentIntent(params, mockk(relaxed = true))

        val capturedParams = intentParamsSlot.captured
        val cardPresentParams = capturedParams.paymentMethodOptionsParameters?.cardPresentParameters
        assertEquals(CardPresentCaptureMethod.AutomaticDelayed, cardPresentParams?.captureMethod)
        assertEquals(2, cardPresentParams?.captureDelayDays)
    }

    @Test
    fun `createPaymentIntent captureDelayDays is null when not provided`() {
        val params = JavaOnlyMap().apply {
            putInt("amount", 5000)
            putString("currency", "usd")
            putArray("paymentMethodTypes", JavaOnlyArray())
            putMap("paymentMethodOptions", JavaOnlyMap().apply {
                putString("captureMethod", "automatic_delayed")
            })
        }

        val intentParamsSlot = slot<PaymentIntentParameters>()
        val cbSlot = slot<PaymentIntentCallback>()
        every { terminal.createPaymentIntent(capture(intentParamsSlot), capture(cbSlot), any()) } answers {
            cbSlot.captured.onSuccess(mockPaymentIntent())
        }

        module.createPaymentIntent(params, mockk(relaxed = true))

        val capturedParams = intentParamsSlot.captured
        val cardPresentParams = capturedParams.paymentMethodOptionsParameters?.cardPresentParameters
        assertEquals(CardPresentCaptureMethod.AutomaticDelayed, cardPresentParams?.captureMethod)
        assertNull(cardPresentParams?.captureDelayDays)
    }

    @Test
    fun `createPaymentIntent omits installments when paymentMethodOptions is absent`() {
        val cardPresentParams = createPaymentIntentWithInstallments()

        assertNull(cardPresentParams?.installments)
    }

    @Test
    fun `createPaymentIntent omits installments when paymentMethodOptions is empty`() {
        val cardPresentParams = createPaymentIntentWithInstallments(
            includeEmptyPaymentMethodOptions = true,
        )

        assertNull(cardPresentParams?.installments)
    }

    @Test
    fun `createPaymentIntent maps enabled installments`() {
        val cardPresentParams = createPaymentIntentWithInstallments(enabled = true)

        assertEquals(true, cardPresentParams?.installments?.enabled)
    }

    @Test
    fun `createPaymentIntent preserves explicitly disabled installments`() {
        val cardPresentParams = createPaymentIntentWithInstallments(enabled = false)

        assertEquals(false, cardPresentParams?.installments?.enabled)
    }

    private fun capturePaymentIntentParameters(captureMethod: String?): PaymentIntentParameters {
        val params = JavaOnlyMap().apply {
            putInt("amount", 5000)
            putString("currency", "usd")
            putArray("paymentMethodTypes", JavaOnlyArray())
            captureMethod?.let { putString("captureMethod", it) }
        }

        val intentParamsSlot = slot<PaymentIntentParameters>()
        val cbSlot = slot<PaymentIntentCallback>()
        every { terminal.createPaymentIntent(capture(intentParamsSlot), capture(cbSlot), any()) } answers {
            cbSlot.captured.onSuccess(mockPaymentIntent())
        }

        module.createPaymentIntent(params, mockk(relaxed = true))
        return intentParamsSlot.captured
    }

    private fun createPaymentIntentWithInstallments(
        enabled: Boolean? = null,
        includeEmptyPaymentMethodOptions: Boolean = false,
    ): CardPresentParameters? {
        val params = JavaOnlyMap().apply {
            putInt("amount", 5000)
            putString("currency", "mxn")
            putArray("paymentMethodTypes", JavaOnlyArray())
            when {
                enabled != null -> putMap("paymentMethodOptions", JavaOnlyMap().apply {
                    putMap("installments", JavaOnlyMap().apply {
                        putBoolean("enabled", enabled)
                    })
                })
                includeEmptyPaymentMethodOptions -> putMap("paymentMethodOptions", JavaOnlyMap())
            }
        }

        val intentParamsSlot = slot<PaymentIntentParameters>()
        val cbSlot = slot<PaymentIntentCallback>()
        every { terminal.createPaymentIntent(capture(intentParamsSlot), capture(cbSlot), any()) } answers {
            cbSlot.captured.onSuccess(mockPaymentIntent())
        }

        module.createPaymentIntent(params, mockk(relaxed = true))

        return intentParamsSlot.captured.paymentMethodOptionsParameters?.cardPresentParameters
    }
}
