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
import com.stripeterminalreactnative.TestConstants.SETUP_INTENT_KEY
import com.stripeterminalreactnative.TestConstants.STRIPE_ERROR
import com.stripeterminalreactnative.TestConstants.UNDERLYING_ERROR_KEY
import com.stripeterminalreactnative.mapFromPaymentIntent
import com.stripeterminalreactnative.mapFromSetupIntent
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
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
import kotlin.test.assertTrue

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
        every { setupIntent } returns null
    }

    @Test
    fun `TerminalErrorCode convertToReactNativeErrorCode returns enum name`() {
        // GIVEN no additional setup
        // WHEN mapping all TerminalErrorCode values
        // THEN each mapping should equal the enum name
        TerminalErrorCode.values().forEach { code ->
            assertEquals(code.name, code.convertToReactNativeErrorCode(), "Mapping mismatch for $code")
        }
    }

    @Test
    fun `createError maps TerminalException to StripeError with apiError at top-level`() {
        // GIVEN a TerminalException with ApiError and cause
        // Note: type is optional and tested separately due to ApiErrorType enum complexity
        val apiError = mockk<ApiError> {
            every { code } returns "api_code"
            every { message } returns "api_message"
            every { declineCode } returns "decline_code"
            every { type } returns null // Optional field, tested in separate test
            every { charge } returns "ch_123"
            every { docUrl } returns "https://stripe.com/docs/error"
            every { param } returns "amount"
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

        // THEN the output should be a StripeError with apiError and underlyingError at top-level
        assertEquals(STRIPE_ERROR, error.getString("name"))
        assertEquals("terminal failed", error.getString("message"))
        assertEquals(TerminalErrorCode.STRIPE_API_ERROR.convertToReactNativeErrorCode(), error.getString("code"))
        assertEquals(TerminalErrorCode.STRIPE_API_ERROR.toString(), error.getString("nativeErrorCode"))

        // apiError should be at top-level (not in metadata)
        val apiErrorMap = error.requireMap(API_ERROR_KEY)
        assertEquals("api_code", apiErrorMap.getString("code"))
        assertEquals("api_message", apiErrorMap.getString("message"))
        assertEquals("decline_code", apiErrorMap.getString("declineCode"))
        // type is optional and null in this test
        assertFalse(apiErrorMap.hasKey("type"), "type should not be present when null")
        assertEquals("ch_123", apiErrorMap.getString("charge"))
        assertEquals("https://stripe.com/docs/error", apiErrorMap.getString("docUrl"))
        assertEquals("amount", apiErrorMap.getString("param"))

        // underlyingError should be at top-level (not in metadata)
        val underlying = error.requireMap(UNDERLYING_ERROR_KEY)
        assertEquals("IllegalStateException", underlying.getString("code"))
        assertEquals("cause message", underlying.getString("message"))

        // metadata should be empty for Android
        val metadata = error.requireMap(METADATA_KEY)
        assertTrue(metadata.toHashMap().isEmpty(), "Android metadata should be empty")
    }

    @Test
    fun `createError includes ApiError type when present`() {
        // GIVEN a TerminalException with ApiError containing type
        // Note: We use relaxed mocking for ApiErrorType to avoid enum complexity
        val mockType = mockk<com.stripe.stripeterminal.external.api.ApiErrorType>(relaxed = true)
        every { mockType.toString() } returns "card_error"
        
        val apiError = mockk<ApiError>(relaxed = true) {
            every { code } returns "card_declined"
            every { message } returns "Card was declined"
            every { declineCode } returns "generic_decline"
            every { type } returns mockType
            every { charge } returns null
            every { docUrl } returns null
            every { param } returns null
        }
        val terminalException = mockTerminalException(
            TerminalErrorCode.STRIPE_API_ERROR,
            "Card declined",
            apiError,
            null
        )

        // WHEN creating the error map
        val errorWrapper = createError(terminalException) as JavaOnlyMap
        val error = errorWrapper.requireMap("error")

        // THEN apiError should include the type field converted to string
        val apiErrorMap = error.requireMap(API_ERROR_KEY)
        assertEquals("card_error", apiErrorMap.getString("type"))
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
        val error = errorWrapper.requireMap("error")

        // THEN apiError and underlyingError should not be present
        assertFalse(error.hasKey(API_ERROR_KEY), "apiError should not be present")
        assertFalse(error.hasKey(UNDERLYING_ERROR_KEY), "underlyingError should not be present")
        
        // AND metadata should be empty
        val metadata = error.requireMap(METADATA_KEY)
        assertTrue(metadata.toHashMap().isEmpty(), "Android metadata should be empty")
    }

    @Test
    fun `createError with generic Throwable returns NonStripeError`() {
        // GIVEN a RuntimeException with a cause
        val rootCause = IllegalArgumentException("root cause")
        val runtime = RuntimeException("top level", rootCause)

        // WHEN creating the error map
        val errorWrapper = createError(runtime) as JavaOnlyMap
        val error = errorWrapper.requireMap("error")

        // THEN the result should describe a NonStripeError with underlyingError at top-level
        assertEquals(NON_STRIPE_ERROR, error.getString("name"))
        assertEquals("top level", error.getString("message"))
        assertEquals(TerminalErrorCode.UNEXPECTED_SDK_ERROR.convertToReactNativeErrorCode(), error.getString("code"))
        assertEquals(TerminalErrorCode.UNEXPECTED_SDK_ERROR.toString(), error.getString("nativeErrorCode"))

        // underlyingError should be at top-level
        val underlying = error.requireMap(UNDERLYING_ERROR_KEY)
        assertEquals("IllegalArgumentException", underlying.getString("code"))
        assertEquals("root cause", underlying.getString("message"))
        
        // metadata should be empty
        val metadata = error.requireMap(METADATA_KEY)
        assertTrue(metadata.toHashMap().isEmpty(), "Android metadata should be empty")
    }

    @Test
    fun `createError with Throwable without cause omits underlyingError`() {
        // GIVEN a RuntimeException without cause
        val runtime = RuntimeException("message only")

        // WHEN creating the error map
        val error = (createError(runtime) as JavaOnlyMap).requireMap("error")

        // THEN underlyingError should not be present
        assertFalse(error.hasKey(UNDERLYING_ERROR_KEY), "underlyingError should not be present")
        
        // AND metadata should be empty
        val metadata = error.requireMap(METADATA_KEY)
        assertTrue(metadata.toHashMap().isEmpty(), "Android metadata should be empty")
    }

    @Test
    fun `createError includes paymentIntent at top-level when present`() {
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
        
        // THEN paymentIntent should be present at top-level (outside error object)
        val topLevelPaymentIntent = result.getMap(PAYMENT_INTENT_KEY) as JavaOnlyMap?
        assertNotNull(topLevelPaymentIntent)
        assertEquals("pi_123", topLevelPaymentIntent.getString("id"))
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

        // THEN paymentIntent key should be absent from top-level
        assertFalse(result.hasKey(PAYMENT_INTENT_KEY))
    }

    @Test
    fun `createError with uuid passes uuid to mapper functions`() {
        // GIVEN a TerminalException with paymentIntent and setupIntent
        val testUuid = "test-uuid-123"
        val paymentIntentMap = JavaOnlyMap().apply { 
            putString("id", "pi_test")
            putString("sdkUuid", testUuid)
        }
        val setupIntentMap = JavaOnlyMap().apply { 
            putString("id", "seti_test")
            putString("sdkUuid", testUuid)
        }
        
        val paymentIntentSlot = slot<String>()
        val setupIntentSlot = slot<String>()
        
        every { mapFromPaymentIntent(any(), capture(paymentIntentSlot)) } returns paymentIntentMap
        every { mapFromSetupIntent(any(), capture(setupIntentSlot)) } returns setupIntentMap

        val terminalException = mockTerminalException(
            TerminalErrorCode.DECLINED_BY_STRIPE_API,
            "Payment declined"
        )
        every { terminalException.paymentIntent } returns mockk()
        every { terminalException.setupIntent } returns mockk()

        // WHEN creating error with uuid
        val result = createError(terminalException, testUuid) as JavaOnlyMap
        
        // THEN uuid should be passed to both mapper functions
        assertEquals(testUuid, paymentIntentSlot.captured)
        assertEquals(testUuid, setupIntentSlot.captured)
        
        // AND paymentIntent and setupIntent should be at top-level with correct uuid
        val topLevelPaymentIntent = result.getMap(PAYMENT_INTENT_KEY) as JavaOnlyMap?
        assertNotNull(topLevelPaymentIntent)
        assertEquals("pi_test", topLevelPaymentIntent.getString("id"))
        assertEquals(testUuid, topLevelPaymentIntent.getString("sdkUuid"))
        
        val topLevelSetupIntent = result.getMap(SETUP_INTENT_KEY) as JavaOnlyMap?
        assertNotNull(topLevelSetupIntent)
        assertEquals("seti_test", topLevelSetupIntent.getString("id"))
        assertEquals(testUuid, topLevelSetupIntent.getString("sdkUuid"))
    }

    @Test
    fun `createError without uuid uses empty string as default`() {
        // GIVEN a TerminalException with paymentIntent
        val paymentIntentMap = JavaOnlyMap().apply { 
            putString("id", "pi_test")
            putString("sdkUuid", "")
        }
        
        val uuidSlot = slot<String>()
        every { mapFromPaymentIntent(any(), capture(uuidSlot)) } returns paymentIntentMap

        val terminalException = mockTerminalException(
            TerminalErrorCode.DECLINED_BY_STRIPE_API,
            "Payment declined"
        )
        every { terminalException.paymentIntent } returns mockk()

        // WHEN creating error without uuid
        val result = createError(terminalException) as JavaOnlyMap
        
        // THEN empty string should be passed to mapper function
        assertEquals("", uuidSlot.captured)
        
        // AND paymentIntent should be at top-level with empty uuid
        val topLevelPaymentIntent = result.getMap(PAYMENT_INTENT_KEY) as JavaOnlyMap?
        assertNotNull(topLevelPaymentIntent)
        assertEquals("", topLevelPaymentIntent.getString("sdkUuid"))
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
    fun `requireNonNullParameter returns value when not null`() {
        // GIVEN a parameter value
        val value = "param"

        // WHEN invoking requireNonNullParameter
        val result = requireNonNullParameter(value) { "missing" }

        // THEN the same value is returned
        assertEquals(value, result)
    }

    @Test
    fun `requireNonNullParameter throws TerminalException when null`() {
        // GIVEN a null parameter

        // WHEN invoking requireNonNullParameter
        val exception = assertFailsWith<TerminalException> {
            requireNonNullParameter<String>(null) { "missing" }
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
        assertEquals(TerminalErrorCode.READER_BUSY.convertToReactNativeErrorCode(), error.getString("code"))
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
        assertEquals(TerminalErrorCode.STRIPE_API_ERROR.convertToReactNativeErrorCode(), error.getString("code"))
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


    @Test
    fun `TerminalErrorCode mapping completeness test`() {
        // GIVEN all TerminalErrorCode enum values
        val allErrorCodes = TerminalErrorCode.values()
        
        // WHEN mapping each code to RN error code
        // THEN each should have a valid non-empty mapping
        allErrorCodes.forEach { code ->
            val rnCode = code.convertToReactNativeErrorCode()
            assertFalse(rnCode.isEmpty(), "TerminalErrorCode.$code should not map to empty string")
            assertTrue(rnCode.matches(Regex("^[A-Z][A-Z0-9_]*$")), 
                      "TerminalErrorCode.$code should map to UPPER_SNAKE_CASE format, got: $rnCode")
            assertEquals(code.name, rnCode, "TerminalErrorCode.$code should map to its enum name")
        }
    }

    @Test
    fun `nested exception chain handling`() {
        // GIVEN a deep exception chain
        val rootCause = IllegalStateException("root cause")
        val midCause = RuntimeException("middle cause", rootCause)
        val terminalException = mockTerminalException(
            TerminalErrorCode.BLUETOOTH_ERROR,
            "bluetooth failed",
            cause = midCause
        )
        
        // WHEN creating the error map
        val errorWrapper = createError(terminalException) as JavaOnlyMap
        val error = errorWrapper.requireMap("error")
        
        // THEN should be StripeError with immediate cause at top-level underlyingError
        assertEquals(STRIPE_ERROR, error.getString("name"))
        assertEquals("bluetooth failed", error.getString("message"))
        assertEquals(TerminalErrorCode.BLUETOOTH_ERROR.convertToReactNativeErrorCode(), error.getString("code"))
        
        val underlying = error.requireMap(UNDERLYING_ERROR_KEY)
        assertEquals("RuntimeException", underlying.getString("code"))
        assertEquals("middle cause", underlying.getString("message"))
        
        // NOTE: Only immediate cause is captured, not the full chain
    }

    companion object {
        
        @ClassRule
        @JvmField
        val reactNativeMocks = ReactNativeTypeReplacementRule()
    }
}
