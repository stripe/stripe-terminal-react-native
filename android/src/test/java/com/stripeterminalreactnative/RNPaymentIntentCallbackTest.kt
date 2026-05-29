package com.stripeterminalreactnative

import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.Promise
import com.stripe.stripeterminal.external.models.PaymentIntent
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripeterminalreactnative.callback.RNPaymentIntentCallback
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.ClassRule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import kotlin.test.assertSame
import kotlin.test.assertTrue

@RunWith(JUnit4::class)
class RNPaymentIntentCallbackTest {

    companion object {
        @ClassRule
        @JvmField
        val typeReplacer = ReactNativeTypeReplacementRule()
    }

    private val promise = mockk<Promise>(relaxed = true)
    private val uuid = "test-uuid"

    @Test
    fun `onSuccess invokes onPaymentIntentSuccess lambda with the intent`() {
        val pi = mockPaymentIntent()
        var captured: PaymentIntent? = null
        val callback = RNPaymentIntentCallback(promise, uuid, onPaymentIntentSuccess = { captured = it })
        callback.onSuccess(pi)
        assertSame(pi, captured)
    }

    @Test
    fun `onSuccess resolves promise with paymentIntent map`() {
        val pi = mockPaymentIntent()
        val resolvedSlot = slot<Any>()
        val callback = RNPaymentIntentCallback(promise, uuid)
        callback.onSuccess(pi)
        verify(exactly = 1) { promise.resolve(capture(resolvedSlot)) }
        val result = resolvedSlot.captured as JavaOnlyMap
        assertTrue(result.hasKey("paymentIntent"))
    }

    @Test
    fun `onSuccess does not invoke onPaymentIntentFailure`() {
        val pi = mockPaymentIntent()
        var failureCalled = false
        val callback = RNPaymentIntentCallback(promise, uuid, onPaymentIntentFailure = { failureCalled = true })
        callback.onSuccess(pi)
        assertTrue(!failureCalled)
    }

    @Test
    fun `onFailure invokes onPaymentIntentFailure when exception has paymentIntent`() {
        val pi = mockPaymentIntent()
        val exception = mockTerminalException(pi = pi)
        var captured: PaymentIntent? = null
        val callback = RNPaymentIntentCallback(promise, uuid, onPaymentIntentFailure = { captured = it })
        callback.onFailure(exception)
        assertSame(pi, captured)
    }

    @Test
    fun `onFailure does not invoke onPaymentIntentFailure when exception has no paymentIntent`() {
        val exception = mockTerminalException()
        var failureCalled = false
        val callback = RNPaymentIntentCallback(promise, uuid, onPaymentIntentFailure = { failureCalled = true })
        callback.onFailure(exception)
        assertTrue(!failureCalled)
    }

    @Test
    fun `onFailure resolves promise with error`() {
        val exception = mockTerminalException()
        val callback = RNPaymentIntentCallback(promise, uuid)
        callback.onFailure(exception)
        verify(exactly = 1) { promise.resolve(any()) }
    }

    @Test
    fun `onFailure does not invoke onPaymentIntentSuccess`() {
        val exception = mockTerminalException(pi = mockPaymentIntent())
        var successCalled = false
        val callback = RNPaymentIntentCallback(promise, uuid, onPaymentIntentSuccess = { successCalled = true })
        callback.onFailure(exception)
        assertTrue(!successCalled)
    }

    private fun mockTerminalException(pi: PaymentIntent? = null): TerminalException = mockk(relaxed = true) {
        every { errorCode } returns com.stripe.stripeterminal.external.models.TerminalErrorCode.UNEXPECTED_SDK_ERROR
        every { errorMessage } returns "test error"
        every { message } returns "test error"
        every { cause } returns null
        every { apiError } returns null
        every { paymentIntent } returns pi
        every { setupIntent } returns null
        every { refund } returns null
    }
}
