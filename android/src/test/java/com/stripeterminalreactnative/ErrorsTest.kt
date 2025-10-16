package com.stripeterminalreactnative

import com.facebook.react.bridge.JavaOnlyMap
import com.stripe.stripeterminal.external.api.ApiError
import com.stripe.stripeterminal.external.models.TerminalErrorCode
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripeterminalreactnative.mapFromPaymentIntent
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.CancellationException
import org.junit.ClassRule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull

@RunWith(JUnit4::class)
class ErrorsTest {

    companion object {
        @ClassRule
        @JvmField
        val reactNativeMocks = ReactNativeTypeReplacementRule()
    }

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
        assertEquals("StripeError", error.getString("name"))
        assertEquals("terminal failed", error.getString("message"))
        assertEquals(TerminalErrorCode.STRIPE_API_ERROR.toRnErrorCode(), error.getString("code"))
        assertEquals(TerminalErrorCode.STRIPE_API_ERROR.toString(), error.getString("nativeErrorCode"))

        val metadata = error.requireMap("metadata")
        val apiErrorMap = metadata.requireMap("apiError")
        assertEquals("api_code", apiErrorMap.getString("code"))
        assertEquals("api_message", apiErrorMap.getString("message"))
        assertEquals("decline_code", apiErrorMap.getString("declineCode"))

        val underlying = metadata.requireMap("underlyingError")
        assertEquals("IllegalStateException", underlying.getString("code"))
        assertEquals("cause message", underlying.getString("message"))

        assertEquals("TerminalException", metadata.getString("exceptionClass"))
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
        val metadata = errorWrapper.requireMap("error").requireMap("metadata")

        // THEN metadata should only contain the exception class
        assertFalse(metadata.hasKey("apiError"))
        assertFalse(metadata.hasKey("underlyingError"))
        assertEquals("TerminalException", metadata.getString("exceptionClass"))
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
        assertEquals("StripeError", error.getString("name"))
        assertEquals("Bluetooth error", error.getString("message"))
        assertEquals(TerminalErrorCode.BLUETOOTH_ERROR.toRnErrorCode(), error.getString("code"))
        assertEquals(TerminalErrorCode.BLUETOOTH_ERROR.toString(), error.getString("nativeErrorCode"))
        val metadata = error.requireMap("metadata")
        assertEquals("TerminalException", metadata.getString("exceptionClass"))
        assertFalse(metadata.hasKey("apiError"))
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
        assertEquals("NonStripeError", error.getString("name"))
        assertEquals("top level", error.getString("message"))
        assertEquals(TerminalErrorCode.UNEXPECTED_SDK_ERROR.toRnErrorCode(), error.getString("code"))
        assertEquals(TerminalErrorCode.UNEXPECTED_SDK_ERROR.toString(), error.getString("nativeErrorCode"))

        val metadata = error.requireMap("metadata")
        assertEquals("RuntimeException", metadata.getString("exceptionClass"))
        val underlying = metadata.requireMap("underlyingError")
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
            .requireMap("metadata")

        // THEN the metadata should not contain underlyingError
        assertEquals("RuntimeException", metadata.getString("exceptionClass"))
        assertFalse(metadata.hasKey("underlyingError"))
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
        val paymentIntent = result.getMap("paymentIntent") as JavaOnlyMap?

        // THEN the wrapper should include paymentIntent data
        assertNotNull(paymentIntent)
        assertEquals("pi_123", paymentIntent.getString("id"))
    }

    @Test
    fun `stripeErrorMapFromThrowable returns NonStripeError for generic Throwable`() {
        // GIVEN a generic RuntimeException
        val err = RuntimeException("boom")

        // WHEN mapping with stripeErrorMapFromThrowable
        val error = stripeErrorMapFromThrowable(err) as JavaOnlyMap

        // THEN the result should be a NonStripeError without underlying metadata
        assertEquals("NonStripeError", error.getString("name"))
        assertEquals("boom", error.getString("message"))
        assertEquals(TerminalErrorCode.UNEXPECTED_SDK_ERROR.toRnErrorCode(), error.getString("code"))
        val metadata = error.requireMap("metadata")
        assertEquals("RuntimeException", metadata.getString("exceptionClass"))
        assertFalse(metadata.hasKey("underlyingError"))
    }

    @Test
    fun `stripeErrorMapFromThrowable handles CancellationException`() {
        // GIVEN a CancellationException with underlying cause
        val cause = RuntimeException("cancelled cause")
        val cancellation = CancellationException("cancelled").apply { initCause(cause) }

        // WHEN mapping the cancellation exception
        val error = stripeErrorMapFromThrowable(cancellation) as JavaOnlyMap

        // THEN metadata should describe the cancellation and its cause
        assertEquals("NonStripeError", error.getString("name"))
        val metadata = error.requireMap("metadata")
        assertEquals("CancellationException", metadata.getString("exceptionClass"))
        val underlying = metadata.requireMap("underlyingError")
        assertEquals("RuntimeException", underlying.getString("code"))
        assertEquals("cancelled cause", underlying.getString("message"))
    }
}
