package com.stripeterminalreactnative

import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.Promise
import com.stripe.stripeterminal.external.models.SetupIntent
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripeterminalreactnative.callback.RNSetupIntentCallback
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
class RNSetupIntentCallbackTest {

    companion object {
        @ClassRule
        @JvmField
        val typeReplacer = ReactNativeTypeReplacementRule()
    }

    private val promise = mockk<Promise>(relaxed = true)
    private val uuid = "test-uuid"

    @Test
    fun `onSuccess invokes onSetupIntentSuccess lambda with the intent`() {
        val si = mockSetupIntent()
        var captured: SetupIntent? = null
        val callback = RNSetupIntentCallback(promise, uuid, onSetupIntentSuccess = { captured = it })
        callback.onSuccess(si)
        assertSame(si, captured)
    }

    @Test
    fun `onSuccess resolves promise with setupIntent map`() {
        val si = mockSetupIntent()
        val resolvedSlot = slot<Any>()
        val callback = RNSetupIntentCallback(promise, uuid)
        callback.onSuccess(si)
        verify(exactly = 1) { promise.resolve(capture(resolvedSlot)) }
        val result = resolvedSlot.captured as JavaOnlyMap
        assertTrue(result.hasKey("setupIntent"))
    }

    @Test
    fun `onSuccess does not invoke onSetupIntentFailure`() {
        val si = mockSetupIntent()
        var failureCalled = false
        val callback = RNSetupIntentCallback(promise, uuid, onSetupIntentFailure = { failureCalled = true })
        callback.onSuccess(si)
        assertTrue(!failureCalled)
    }

    @Test
    fun `onFailure invokes onSetupIntentFailure when exception has setupIntent`() {
        val si = mockSetupIntent()
        val exception = mockTerminalException(si = si)
        var captured: SetupIntent? = null
        val callback = RNSetupIntentCallback(promise, uuid, onSetupIntentFailure = { captured = it })
        callback.onFailure(exception)
        assertSame(si, captured)
    }

    @Test
    fun `onFailure does not invoke onSetupIntentFailure when exception has no setupIntent`() {
        val exception = mockTerminalException()
        var failureCalled = false
        val callback = RNSetupIntentCallback(promise, uuid, onSetupIntentFailure = { failureCalled = true })
        callback.onFailure(exception)
        assertTrue(!failureCalled)
    }

    @Test
    fun `onFailure resolves promise with error`() {
        val exception = mockTerminalException()
        val callback = RNSetupIntentCallback(promise, uuid)
        callback.onFailure(exception)
        verify(exactly = 1) { promise.resolve(any()) }
    }

    @Test
    fun `onFailure does not invoke onSetupIntentSuccess`() {
        val exception = mockTerminalException(si = mockSetupIntent())
        var successCalled = false
        val callback = RNSetupIntentCallback(promise, uuid, onSetupIntentSuccess = { successCalled = true })
        callback.onFailure(exception)
        assertTrue(!successCalled)
    }

    private fun mockTerminalException(si: SetupIntent? = null): TerminalException = mockk(relaxed = true) {
        every { errorCode } returns com.stripe.stripeterminal.external.models.TerminalErrorCode.UNEXPECTED_SDK_ERROR
        every { errorMessage } returns "test error"
        every { message } returns "test error"
        every { cause } returns null
        every { apiError } returns null
        every { paymentIntent } returns null
        every { setupIntent } returns si
        every { refund } returns null
    }
}
