package com.stripeterminalreactnative

import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.stripe.stripeterminal.external.api.ApiError
import com.stripe.stripeterminal.external.models.TerminalErrorCode
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripeterminalreactnative.TestConstants.API_ERROR_KEY
import com.stripeterminalreactnative.TestConstants.EXCEPTION_CLASS_KEY
import com.stripeterminalreactnative.TestConstants.METADATA_KEY
import com.stripeterminalreactnative.TestConstants.NON_STRIPE_ERROR
import com.stripeterminalreactnative.TestConstants.PAYMENT_INTENT_KEY
import com.stripeterminalreactnative.TestConstants.STRIPE_ERROR
import com.stripeterminalreactnative.TestConstants.UNDERLYING_ERROR_KEY
import com.stripeterminalreactnative.mapFromPaymentIntent
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.runBlocking
import org.junit.ClassRule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertSame

@RunWith(JUnit4::class)
class ErrorsTest {

    private fun JavaOnlyMap.requireMap(key: String): JavaOnlyMap {
        val map = getMap(key)
        assertNotNull(map, "Expected map for key $key")
        return map as JavaOnlyMap
    }

    private fun mockTerminalException(
        code: TerminalErrorCode,
        message: String,
        apiError: ApiError? = null,
        cause: Throwable? = null
    ): TerminalException = mockk(relaxed = true) {
        every { errorCode } returns code
        every { errorMessage } returns message
        every { this@mockk.message } returns message
        every { this@mockk.apiError } returns apiError
        every { this@mockk.cause } returns cause
        every { paymentIntent } returns null
    }

    @Test
    fun `TerminalErrorCode toRnErrorCode returns enum name`() {
        // GIVEN no additional setup
        // WHEN mapping all TerminalErrorCode values
        // THEN each mapping should equal the enum name
        TerminalErrorCode.values().forEach { code ->
            assertEquals(code.name, code.toRnErrorCode(), "Mapping mismatch for $code")
        }
    }

    @Test
    fun `createError maps TerminalException to StripeError with metadata`() {
        // GIVEN a TerminalException with ApiError and cause
        val apiError = mockk<ApiError> {
            every { code } returns "api_code"
            every { message } returns "api_message"
            every { declineCode } returns "decline_code"
        }
        val cause = IllegalStateException("cause message")
        val terminalException = mockTerminalException(
            TerminalErrorCode.STRIPE_API_ERROR,
            "terminal failed",
            apiError,
            cause
        )

        // WHEN creating the error map
        val errorWrapper = createError(terminalException) as JavaOnlyMap
        val error = errorWrapper.requireMap("error")

        // THEN the output should be a StripeError with rich metadata
        assertEquals(STRIPE_ERROR, error.getString("name"))
        assertEquals("terminal failed", error.getString("message"))
        assertEquals(TerminalErrorCode.STRIPE_API_ERROR.toRnErrorCode(), error.getString("code"))
        assertEquals(TerminalErrorCode.STRIPE_API_ERROR.toString(), error.getString("nativeErrorCode"))

        val metadata = error.requireMap(METADATA_KEY)
        val apiErrorMap = metadata.requireMap(API_ERROR_KEY)
        assertEquals("api_code", apiErrorMap.getString("code"))
        assertEquals("api_message", apiErrorMap.getString("message"))
        assertEquals("decline_code", apiErrorMap.getString("declineCode"))

        val underlying = metadata.requireMap(UNDERLYING_ERROR_KEY)
        assertEquals("IllegalStateException", underlying.getString("code"))
        assertEquals("cause message", underlying.getString("message"))

        assertEquals("TerminalException", metadata.getString(EXCEPTION_CLASS_KEY))
    }

    @Test
    fun `createError with TerminalException without metadata omits optional fields`() {
        // GIVEN a TerminalException without ApiError or cause
        val terminalException = mockTerminalException(
            TerminalErrorCode.CARD_READ_TIMED_OUT,
            "Card timed out"
        )

        // WHEN creating the error map
        val errorWrapper = createError(terminalException) as JavaOnlyMap
        val metadata = errorWrapper.requireMap("error").requireMap(METADATA_KEY)

        // THEN metadata should only contain the exception class
        assertFalse(metadata.hasKey(API_ERROR_KEY))
        assertFalse(metadata.hasKey(UNDERLYING_ERROR_KEY))
        assertEquals("TerminalException", metadata.getString(EXCEPTION_CLASS_KEY))
    }

    @Test
    fun `stripeErrorMapFromThrowable mirrors StripeError structure`() {
        // GIVEN a TerminalException
        val terminalException = mockTerminalException(
            TerminalErrorCode.BLUETOOTH_ERROR,
            "Bluetooth error"
        )

        // WHEN mapping with stripeErrorMapFromThrowable
        val error = stripeErrorMapFromThrowable(terminalException) as JavaOnlyMap

        // THEN the structure should match StripeError expectations
        assertEquals(STRIPE_ERROR, error.getString("name"))
        assertEquals("Bluetooth error", error.getString("message"))
        assertEquals(TerminalErrorCode.BLUETOOTH_ERROR.toRnErrorCode(), error.getString("code"))
        assertEquals(TerminalErrorCode.BLUETOOTH_ERROR.toString(), error.getString("nativeErrorCode"))
        val metadata = error.requireMap(METADATA_KEY)
        assertEquals("TerminalException", metadata.getString(EXCEPTION_CLASS_KEY))
        assertFalse(metadata.hasKey(API_ERROR_KEY))
    }

    @Test
    fun `createError with generic Throwable returns NonStripeError`() {
        // GIVEN a RuntimeException with a cause
        val rootCause = IllegalArgumentException("root cause")
        val runtime = RuntimeException("top level", rootCause)

        // WHEN creating the error map
        val errorWrapper = createError(runtime) as JavaOnlyMap
        val error = errorWrapper.requireMap("error")

        // THEN the result should describe a NonStripeError with cause metadata
        assertEquals(NON_STRIPE_ERROR, error.getString("name"))
        assertEquals("top level", error.getString("message"))
        assertEquals(TerminalErrorCode.UNEXPECTED_SDK_ERROR.toRnErrorCode(), error.getString("code"))
        assertEquals(TerminalErrorCode.UNEXPECTED_SDK_ERROR.toString(), error.getString("nativeErrorCode"))

        val metadata = error.requireMap(METADATA_KEY)
        assertEquals("RuntimeException", metadata.getString(EXCEPTION_CLASS_KEY))
        val underlying = metadata.requireMap(UNDERLYING_ERROR_KEY)
        assertEquals("IllegalArgumentException", underlying.getString("code"))
        assertEquals("root cause", underlying.getString("message"))
    }

    @Test
    fun `createError with Throwable without cause omits underlyingError`() {
        // GIVEN a RuntimeException without cause
        val runtime = RuntimeException("message only")

        // WHEN creating the error map
        val metadata = (createError(runtime) as JavaOnlyMap)
            .requireMap("error")
            .requireMap(METADATA_KEY)

        // THEN the metadata should not contain underlyingError
        assertEquals("RuntimeException", metadata.getString(EXCEPTION_CLASS_KEY))
        assertFalse(metadata.hasKey(UNDERLYING_ERROR_KEY))
    }

    @Test
    fun `createError attaches paymentIntent when present`() {
        // GIVEN a TerminalException with paymentIntent data
        val paymentIntentMap = JavaOnlyMap().apply { putString("id", "pi_123") }
        every { mapFromPaymentIntent(any(), any()) } returns paymentIntentMap

        val terminalException = mockTerminalException(
            TerminalErrorCode.CANCELED,
            "cancelled"
        )
        every { terminalException.paymentIntent } returns mockk()

        // WHEN creating the error wrapper
        val result = createError(terminalException) as JavaOnlyMap
        val paymentIntent = result.getMap(PAYMENT_INTENT_KEY) as JavaOnlyMap?

        // THEN the wrapper should include paymentIntent data
        assertNotNull(paymentIntent)
        assertEquals("pi_123", paymentIntent.getString("id"))
    }

    @Test
    fun `createError without paymentIntent does not add field`() {
        // GIVEN a TerminalException with null paymentIntent
        val terminalException = mockTerminalException(
            TerminalErrorCode.CANCELED,
            "cancelled"
        )
        every { terminalException.paymentIntent } returns null

        // WHEN creating the error wrapper
        val result = createError(terminalException) as JavaOnlyMap

        // THEN paymentIntent key should be absent
        assertFalse(result.hasKey(PAYMENT_INTENT_KEY))
    }

    @Test
    fun `stripeErrorMapFromThrowable returns NonStripeError for generic Throwable`() {
        // GIVEN a generic RuntimeException
        val err = RuntimeException("boom")

        // WHEN mapping with stripeErrorMapFromThrowable
        val error = stripeErrorMapFromThrowable(err) as JavaOnlyMap

        // THEN the result should be a NonStripeError without underlying metadata
        assertEquals(NON_STRIPE_ERROR, error.getString("name"))
        assertEquals("boom", error.getString("message"))
        assertEquals(TerminalErrorCode.UNEXPECTED_SDK_ERROR.toRnErrorCode(), error.getString("code"))
        val metadata = error.requireMap(METADATA_KEY)
        assertEquals("RuntimeException", metadata.getString(EXCEPTION_CLASS_KEY))
        assertFalse(metadata.hasKey(UNDERLYING_ERROR_KEY))
    }

    @Test
    fun `stripeErrorMapFromThrowable handles CancellationException`() {
        // GIVEN a CancellationException with underlying cause
        val cause = RuntimeException("cancelled cause")
        val cancellation = CancellationException("cancelled").apply { initCause(cause) }

        // WHEN mapping the cancellation exception
        val error = stripeErrorMapFromThrowable(cancellation) as JavaOnlyMap

        // THEN metadata should describe the cancellation and its cause
        assertEquals(NON_STRIPE_ERROR, error.getString("name"))
        val metadata = error.requireMap(METADATA_KEY)
        assertEquals("CancellationException", metadata.getString(EXCEPTION_CLASS_KEY))
        val underlying = metadata.requireMap(UNDERLYING_ERROR_KEY)
        assertEquals("RuntimeException", underlying.getString("code"))
        assertEquals("cancelled cause", underlying.getString("message"))
    }

    @Test
    fun `requireCancelable returns value when present`() {
        // GIVEN a non-null cancelable resource
        val cancelable = Any()

        // WHEN invoking requireCancelable
        val result = requireCancelable(cancelable) { "should not throw" }

        // THEN the same instance is returned
        assertSame(cancelable, result)
    }

    @Test
    fun `requireCancelable throws TerminalException when null`() {
        // GIVEN a null cancelable

        // WHEN invoking requireCancelable
        val exception = assertFailsWith<TerminalException> {
            requireCancelable<Any>(null) { "missing cancelable" }
        }

        // THEN a CANCEL_FAILED error should be thrown
        assertEquals(TerminalErrorCode.CANCEL_FAILED, exception.errorCode)
    }

    @Test
    fun `throwIfBusy returns unit when no command in progress`() {
        // GIVEN a null command indicating idle state
        val result = throwIfBusy<Unit>(null) { "busy" }

        // WHEN invoking throwIfBusy with null command

        // THEN no exception should be thrown and result remains null
        assertNull(result)
    }

    @Test
    fun `throwIfBusy throws TerminalException when command in progress`() {
        // GIVEN a non-null command placeholder
        val command = Any()

        // WHEN invoking throwIfBusy with ongoing command
        val exception = assertFailsWith<TerminalException> {
            throwIfBusy(command) { "busy" }
        }

        // THEN READER_BUSY error should be raised
        assertEquals(TerminalErrorCode.READER_BUSY, exception.errorCode)
    }

    @Test
    fun `requireParam returns value when not null`() {
        // GIVEN a parameter value
        val value = "param"

        // WHEN invoking requireParam
        val result = requireParam(value) { "missing" }

        // THEN the same value is returned
        assertEquals(value, result)
    }

    @Test
    fun `requireParam throws TerminalException when null`() {
        // GIVEN a null parameter

        // WHEN invoking requireParam
        val exception = assertFailsWith<TerminalException> {
            requireParam<String>(null) { "missing" }
        }

        // THEN INVALID_REQUIRED_PARAMETER error should be raised
        assertEquals(TerminalErrorCode.INVALID_REQUIRED_PARAMETER, exception.errorCode)
    }

    @Test
    fun `withExceptionResolver resolves promise on TerminalException`() {
        // GIVEN a promise and a failing block
        val promise = mockk<Promise>(relaxed = true)
        val exception = mockTerminalException(
            TerminalErrorCode.READER_BUSY,
            "busy"
        )

        // WHEN executing withExceptionResolver
        withExceptionResolver(promise) {
            throw exception
        }

        // THEN promise.resolve should receive a StripeError map
        val captured = slot<ReadableMap>()
        verify { promise.resolve(capture(captured)) }
        val error = (captured.captured.getMap("error") as JavaOnlyMap)
        assertEquals(STRIPE_ERROR, error.getString("name"))
        assertEquals(TerminalErrorCode.READER_BUSY.toRnErrorCode(), error.getString("code"))
    }

    @Test
    fun `withExceptionResolver leaves promise untouched on success`() {
        // GIVEN a promise and a successful block
        val promise = mockk<Promise>(relaxed = true)

        // WHEN executing without throwing
        withExceptionResolver(promise) { /* no-op */ }

        // THEN promise.resolve must not be called
        verify(exactly = 0) { promise.resolve(any<ReadableMap>()) }
    }

    @Test
    fun `withSuspendExceptionResolver resolves promise on TerminalException`() {
        // GIVEN a promise and a failing suspend block
        val promise = mockk<Promise>(relaxed = true)
        val exception = mockTerminalException(
            TerminalErrorCode.STRIPE_API_ERROR,
            "api error"
        )

        runBlocking {
            // WHEN executing withSuspendExceptionResolver
            withSuspendExceptionResolver(promise) {
                throw exception
            }
        }

        // THEN promise.resolve should be called with a StripeError map
        val captured = slot<ReadableMap>()
        verify { promise.resolve(capture(captured)) }
        val error = (captured.captured.getMap("error") as JavaOnlyMap)
        assertEquals(STRIPE_ERROR, error.getString("name"))
        assertEquals(TerminalErrorCode.STRIPE_API_ERROR.toRnErrorCode(), error.getString("code"))
    }

    @Test
    fun `withSuspendExceptionResolver leaves promise untouched on success`() {
        // GIVEN a promise and a successful suspend block
        val promise = mockk<Promise>(relaxed = true)

        runBlocking {
            // WHEN executing without throwing
            withSuspendExceptionResolver(promise) { /* no-op */ }
        }

        // THEN promise.resolve must not be called
        verify(exactly = 0) { promise.resolve(any<ReadableMap>()) }
    }

    companion object {
        
        @ClassRule
        @JvmField
        val reactNativeMocks = ReactNativeTypeReplacementRule()
    }
}
