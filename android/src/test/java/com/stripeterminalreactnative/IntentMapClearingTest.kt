package com.stripeterminalreactnative

import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.Terminal
import com.stripe.stripeterminal.external.callable.Callback
import com.stripe.stripeterminal.external.callable.Cancelable
import com.stripe.stripeterminal.external.callable.PaymentIntentCallback
import com.stripe.stripeterminal.external.callable.SetupIntentCallback
import com.stripe.stripeterminal.external.models.PaymentIntent
import com.stripe.stripeterminal.external.models.SetupIntent
import com.stripe.stripeterminal.external.models.TerminalException
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.slot
import io.mockk.unmockkObject
import org.junit.After
import org.junit.Before
import org.junit.ClassRule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertSame
import kotlin.test.assertTrue

@RunWith(JUnit4::class)
class IntentMapClearingTest {

    companion object {
        @ClassRule
        @JvmField
        val typeReplacer = ReactNativeTypeReplacementRule()
    }

    private val context = mockk<ReactApplicationContext>(relaxed = true)
    private val terminal = mockk<Terminal>(relaxed = true)
    private val mockCancelable = mockk<Cancelable>(relaxed = true)
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

    private fun populateMaps() {
        module.paymentIntents["pi_uuid"] = mockPaymentIntent()
        module.setupIntents["si_uuid"] = mockSetupIntent()
    }

    // =====================================================================
    // Full Clear: disconnectReader, rebootReader, clearCachedCredentials
    // Maps are cleared on-success only (matching iOS semantics).
    // =====================================================================

    @Test
    fun `disconnectReader clears both maps on success`() {
        populateMaps()
        val callbackSlot = slot<Callback>()
        every { terminal.disconnectReader(capture(callbackSlot)) } answers {
            callbackSlot.captured.onSuccess()
        }
        module.disconnectReader(mockk(relaxed = true))
        assertTrue(module.paymentIntents.isEmpty())
        assertTrue(module.setupIntents.isEmpty())
    }

    @Test
    fun `disconnectReader preserves maps on failure`() {
        populateMaps()
        val callbackSlot = slot<Callback>()
        every { terminal.disconnectReader(capture(callbackSlot)) } answers {
            callbackSlot.captured.onFailure(mockTerminalException())
        }
        module.disconnectReader(mockk(relaxed = true))
        assertTrue(module.paymentIntents.isNotEmpty(), "paymentIntents should be preserved on failure")
        assertTrue(module.setupIntents.isNotEmpty(), "setupIntents should be preserved on failure")
    }

    @Test
    fun `disconnectReader clears maps on success not before callback`() {
        populateMaps()
        val callbackSlot = slot<Callback>()
        every { terminal.disconnectReader(capture(callbackSlot)) } answers {
            // Maps should NOT be cleared yet — clearing happens inside onSuccess
            assertTrue(module.paymentIntents.isNotEmpty(), "paymentIntents should not be cleared before callback")
            assertTrue(module.setupIntents.isNotEmpty(), "setupIntents should not be cleared before callback")
            callbackSlot.captured.onSuccess()
        }
        module.disconnectReader(mockk(relaxed = true))
        assertTrue(module.paymentIntents.isEmpty(), "paymentIntents should be cleared after onSuccess")
        assertTrue(module.setupIntents.isEmpty(), "setupIntents should be cleared after onSuccess")
    }

    @Test
    fun `rebootReader clears both maps on success`() {
        populateMaps()
        val callbackSlot = slot<Callback>()
        every { terminal.rebootReader(capture(callbackSlot)) } answers {
            callbackSlot.captured.onSuccess()
        }
        module.rebootReader(mockk(relaxed = true))
        assertTrue(module.paymentIntents.isEmpty())
        assertTrue(module.setupIntents.isEmpty())
    }

    @Test
    fun `rebootReader preserves maps on failure`() {
        populateMaps()
        val callbackSlot = slot<Callback>()
        every { terminal.rebootReader(capture(callbackSlot)) } answers {
            callbackSlot.captured.onFailure(mockTerminalException())
        }
        module.rebootReader(mockk(relaxed = true))
        assertTrue(module.paymentIntents.isNotEmpty(), "paymentIntents should be preserved on failure")
        assertTrue(module.setupIntents.isNotEmpty(), "setupIntents should be preserved on failure")
    }

    @Test
    fun `clearCachedCredentials clears both paymentIntents and setupIntents`() {
        populateMaps()
        module.clearCachedCredentials(mockk(relaxed = true))
        assertTrue(module.paymentIntents.isEmpty())
        assertTrue(module.setupIntents.isEmpty())
    }

    // =====================================================================
    // Create/Retrieve Success: stores intent under new uuid
    // =====================================================================

    @Test
    fun `createPaymentIntent stores intent in map on success`() {
        val returnedPi = mockPaymentIntent()
        val cbSlot = slot<PaymentIntentCallback>()
        every { terminal.createPaymentIntent(any(), capture(cbSlot), any()) } answers {
            cbSlot.captured.onSuccess(returnedPi)
        }
        module.createPaymentIntent(buildMinimalPaymentIntentParams(), mockk(relaxed = true))
        assertEquals(1, module.paymentIntents.size)
        assertTrue(module.paymentIntents.values.contains(returnedPi))
    }

    @Test
    fun `retrievePaymentIntent stores intent in map on success`() {
        val returnedPi = mockPaymentIntent()
        val cbSlot = slot<PaymentIntentCallback>()
        every { terminal.retrievePaymentIntent(any(), capture(cbSlot)) } answers {
            cbSlot.captured.onSuccess(returnedPi)
        }
        module.retrievePaymentIntent("secret_123", mockk(relaxed = true))
        assertEquals(1, module.paymentIntents.size)
        assertTrue(module.paymentIntents.values.contains(returnedPi))
    }

    @Test
    fun `createSetupIntent stores intent in map on success`() {
        val returnedSi = mockSetupIntent()
        val cbSlot = slot<SetupIntentCallback>()
        every { terminal.createSetupIntent(any(), capture(cbSlot)) } answers {
            cbSlot.captured.onSuccess(returnedSi)
        }
        module.createSetupIntent(buildMinimalSetupIntentParams(), mockk(relaxed = true))
        assertEquals(1, module.setupIntents.size)
        assertTrue(module.setupIntents.values.contains(returnedSi))
    }

    @Test
    fun `retrieveSetupIntent stores intent in map on success`() {
        val returnedSi = mockSetupIntent()
        val cbSlot = slot<SetupIntentCallback>()
        every { terminal.retrieveSetupIntent(any(), capture(cbSlot)) } answers {
            cbSlot.captured.onSuccess(returnedSi)
        }
        module.retrieveSetupIntent("secret_123", mockk(relaxed = true))
        assertEquals(1, module.setupIntents.size)
        assertTrue(module.setupIntents.values.contains(returnedSi))
    }

    // =====================================================================
    // Create/Retrieve Failure: does not add entry to map
    // =====================================================================

    @Test
    fun `createPaymentIntent failure does not add entry to map`() {
        val cbSlot = slot<PaymentIntentCallback>()
        every { terminal.createPaymentIntent(any(), capture(cbSlot), any()) } answers {
            cbSlot.captured.onFailure(mockTerminalException())
        }
        module.createPaymentIntent(buildMinimalPaymentIntentParams(), mockk(relaxed = true))
        assertTrue(module.paymentIntents.isEmpty(), "map should remain empty on create failure")
    }

    @Test
    fun `retrievePaymentIntent failure does not add entry to map`() {
        val cbSlot = slot<PaymentIntentCallback>()
        every { terminal.retrievePaymentIntent(any(), capture(cbSlot)) } answers {
            cbSlot.captured.onFailure(mockTerminalException())
        }
        module.retrievePaymentIntent("secret_123", mockk(relaxed = true))
        assertTrue(module.paymentIntents.isEmpty(), "map should remain empty on retrieve failure")
    }

    @Test
    fun `createSetupIntent failure does not add entry to map`() {
        val cbSlot = slot<SetupIntentCallback>()
        every { terminal.createSetupIntent(any(), capture(cbSlot)) } answers {
            cbSlot.captured.onFailure(mockTerminalException())
        }
        module.createSetupIntent(buildMinimalSetupIntentParams(), mockk(relaxed = true))
        assertTrue(module.setupIntents.isEmpty(), "map should remain empty on create failure")
    }

    @Test
    fun `retrieveSetupIntent failure does not add entry to map`() {
        val cbSlot = slot<SetupIntentCallback>()
        every { terminal.retrieveSetupIntent(any(), capture(cbSlot)) } answers {
            cbSlot.captured.onFailure(mockTerminalException())
        }
        module.retrieveSetupIntent("secret_123", mockk(relaxed = true))
        assertTrue(module.setupIntents.isEmpty(), "map should remain empty on retrieve failure")
    }

    // =====================================================================
    // Confirm/Process Success: stores intent under uuid (NOT clear)
    // =====================================================================

    @Test
    fun `confirmPaymentIntent success stores intent under uuid and preserves other entries`() {
        val existingPi = mockPaymentIntent()
        val confirmedPi = mockPaymentIntent()
        val uuid = "pi_confirm_uuid"
        module.paymentIntents[uuid] = existingPi
        module.paymentIntents["other_uuid"] = mockPaymentIntent()

        val cbSlot = slot<PaymentIntentCallback>()
        every { terminal.confirmPaymentIntent(any(), capture(cbSlot), any()) } answers {
            cbSlot.captured.onSuccess(confirmedPi); mockCancelable
        }
        module.confirmPaymentIntent(buildPaymentIntentMethodParams(uuid), mockk(relaxed = true))
        assertSame(confirmedPi, module.paymentIntents[uuid])
        assertEquals(2, module.paymentIntents.size, "other entries should be preserved")
    }

    @Test
    fun `processPaymentIntent success stores intent under uuid and preserves other entries`() {
        val existingPi = mockPaymentIntent()
        val processedPi = mockPaymentIntent()
        val uuid = "pi_process_uuid"
        module.paymentIntents[uuid] = existingPi
        module.paymentIntents["other_uuid"] = mockPaymentIntent()

        val cbSlot = slot<PaymentIntentCallback>()
        every { terminal.processPaymentIntent(any(), any(), any(), capture(cbSlot)) } answers {
            cbSlot.captured.onSuccess(processedPi); mockCancelable
        }
        module.processPaymentIntent(buildPaymentIntentMethodParams(uuid), mockk(relaxed = true))
        assertSame(processedPi, module.paymentIntents[uuid])
        assertEquals(2, module.paymentIntents.size, "other entries should be preserved")
    }

    @Test
    fun `confirmSetupIntent success stores intent under uuid and preserves other entries`() {
        val existingSi = mockSetupIntent()
        val confirmedSi = mockSetupIntent()
        val uuid = "si_confirm_uuid"
        module.setupIntents[uuid] = existingSi
        module.setupIntents["other_uuid"] = mockSetupIntent()

        val cbSlot = slot<SetupIntentCallback>()
        every { terminal.confirmSetupIntent(any(), capture(cbSlot)) } answers {
            cbSlot.captured.onSuccess(confirmedSi); mockCancelable
        }
        module.confirmSetupIntent(buildSetupIntentMethodParams(uuid), mockk(relaxed = true))
        assertSame(confirmedSi, module.setupIntents[uuid])
        assertEquals(2, module.setupIntents.size, "other entries should be preserved")
    }

    @Test
    fun `processSetupIntent success stores intent under uuid and preserves other entries`() {
        val existingSi = mockSetupIntent()
        val processedSi = mockSetupIntent()
        val uuid = "si_process_uuid"
        module.setupIntents[uuid] = existingSi
        module.setupIntents["other_uuid"] = mockSetupIntent()

        val cbSlot = slot<SetupIntentCallback>()
        every { terminal.processSetupIntent(any(), any(), any(), capture(cbSlot)) } answers {
            cbSlot.captured.onSuccess(processedSi); mockCancelable
        }
        module.processSetupIntent(buildSetupIntentMethodParams(uuid), mockk(relaxed = true))
        assertSame(processedSi, module.setupIntents[uuid])
        assertEquals(2, module.setupIntents.size, "other entries should be preserved")
    }

    // =====================================================================
    // Confirm/Process Failure: stores updated intent from exception
    // =====================================================================

    @Test
    fun `confirmPaymentIntent failure stores updated intent from exception`() {
        val existingPi = mockPaymentIntent()
        val updatedPi = mockPaymentIntent()
        val uuid = "pi_fail_uuid"
        module.paymentIntents[uuid] = existingPi

        val cbSlot = slot<PaymentIntentCallback>()
        every { terminal.confirmPaymentIntent(any(), capture(cbSlot), any()) } answers {
            cbSlot.captured.onFailure(mockTerminalExceptionWithPI(updatedPi)); mockCancelable
        }
        module.confirmPaymentIntent(buildPaymentIntentMethodParams(uuid), mockk(relaxed = true))
        assertSame(updatedPi, module.paymentIntents[uuid])
    }

    @Test
    fun `processPaymentIntent failure stores updated intent from exception`() {
        val existingPi = mockPaymentIntent()
        val updatedPi = mockPaymentIntent()
        val uuid = "pi_fail_uuid"
        module.paymentIntents[uuid] = existingPi

        val cbSlot = slot<PaymentIntentCallback>()
        every { terminal.processPaymentIntent(any(), any(), any(), capture(cbSlot)) } answers {
            cbSlot.captured.onFailure(mockTerminalExceptionWithPI(updatedPi)); mockCancelable
        }
        module.processPaymentIntent(buildPaymentIntentMethodParams(uuid), mockk(relaxed = true))
        assertSame(updatedPi, module.paymentIntents[uuid])
    }

    @Test
    fun `confirmSetupIntent failure stores updated intent from exception`() {
        val existingSi = mockSetupIntent()
        val updatedSi = mockSetupIntent()
        val uuid = "si_fail_uuid"
        module.setupIntents[uuid] = existingSi

        val cbSlot = slot<SetupIntentCallback>()
        every { terminal.confirmSetupIntent(any(), capture(cbSlot)) } answers {
            cbSlot.captured.onFailure(mockTerminalExceptionWithSI(updatedSi)); mockCancelable
        }
        module.confirmSetupIntent(buildSetupIntentMethodParams(uuid), mockk(relaxed = true))
        assertSame(updatedSi, module.setupIntents[uuid])
    }

    @Test
    fun `processSetupIntent failure stores updated intent from exception`() {
        val existingSi = mockSetupIntent()
        val updatedSi = mockSetupIntent()
        val uuid = "si_fail_uuid"
        module.setupIntents[uuid] = existingSi

        val cbSlot = slot<SetupIntentCallback>()
        every { terminal.processSetupIntent(any(), any(), any(), capture(cbSlot)) } answers {
            cbSlot.captured.onFailure(mockTerminalExceptionWithSI(updatedSi)); mockCancelable
        }
        module.processSetupIntent(buildSetupIntentMethodParams(uuid), mockk(relaxed = true))
        assertSame(updatedSi, module.setupIntents[uuid])
    }

    // =====================================================================
    // Confirm/Process Failure with null intent: preserves original
    // =====================================================================

    @Test
    fun `confirmPaymentIntent failure with null intent preserves original`() {
        val existingPi = mockPaymentIntent()
        val uuid = "pi_null_fail_uuid"
        module.paymentIntents[uuid] = existingPi

        val cbSlot = slot<PaymentIntentCallback>()
        every { terminal.confirmPaymentIntent(any(), capture(cbSlot), any()) } answers {
            cbSlot.captured.onFailure(mockTerminalException()); mockCancelable
        }
        module.confirmPaymentIntent(buildPaymentIntentMethodParams(uuid), mockk(relaxed = true))
        assertSame(existingPi, module.paymentIntents[uuid], "original intent should be preserved when exception has no intent")
    }

    @Test
    fun `processPaymentIntent failure with null intent preserves original`() {
        val existingPi = mockPaymentIntent()
        val uuid = "pi_null_fail_uuid"
        module.paymentIntents[uuid] = existingPi

        val cbSlot = slot<PaymentIntentCallback>()
        every { terminal.processPaymentIntent(any(), any(), any(), capture(cbSlot)) } answers {
            cbSlot.captured.onFailure(mockTerminalException()); mockCancelable
        }
        module.processPaymentIntent(buildPaymentIntentMethodParams(uuid), mockk(relaxed = true))
        assertSame(existingPi, module.paymentIntents[uuid], "original intent should be preserved when exception has no intent")
    }

    @Test
    fun `confirmSetupIntent failure with null intent preserves original`() {
        val existingSi = mockSetupIntent()
        val uuid = "si_null_fail_uuid"
        module.setupIntents[uuid] = existingSi

        val cbSlot = slot<SetupIntentCallback>()
        every { terminal.confirmSetupIntent(any(), capture(cbSlot)) } answers {
            cbSlot.captured.onFailure(mockTerminalException()); mockCancelable
        }
        module.confirmSetupIntent(buildSetupIntentMethodParams(uuid), mockk(relaxed = true))
        assertSame(existingSi, module.setupIntents[uuid], "original intent should be preserved when exception has no intent")
    }

    @Test
    fun `processSetupIntent failure with null intent preserves original`() {
        val existingSi = mockSetupIntent()
        val uuid = "si_null_fail_uuid"
        module.setupIntents[uuid] = existingSi

        val cbSlot = slot<SetupIntentCallback>()
        every { terminal.processSetupIntent(any(), any(), any(), capture(cbSlot)) } answers {
            cbSlot.captured.onFailure(mockTerminalException()); mockCancelable
        }
        module.processSetupIntent(buildSetupIntentMethodParams(uuid), mockk(relaxed = true))
        assertSame(existingSi, module.setupIntents[uuid], "original intent should be preserved when exception has no intent")
    }

    // =====================================================================
    // Cancel: sets entry to null
    // =====================================================================

    @Test
    fun `cancelPaymentIntent sets entry to null`() {
        val pi = mockPaymentIntent()
        val uuid = "pi_cancel_uuid"
        module.paymentIntents[uuid] = pi

        val cbSlot = slot<PaymentIntentCallback>()
        every { terminal.cancelPaymentIntent(any(), capture(cbSlot)) } answers {
            cbSlot.captured.onSuccess(mockPaymentIntent()); mockCancelable
        }
        module.cancelPaymentIntent(buildPaymentIntentMethodParams(uuid), mockk(relaxed = true))
        assertTrue(module.paymentIntents.containsKey(uuid), "key should still exist")
        assertNull(module.paymentIntents[uuid], "value should be null after cancel")
    }

    @Test
    fun `cancelSetupIntent sets entry to null`() {
        val si = mockSetupIntent()
        val uuid = "si_cancel_uuid"
        module.setupIntents[uuid] = si

        val cbSlot = slot<SetupIntentCallback>()
        every { terminal.cancelSetupIntent(any(), any(), capture(cbSlot)) } answers {
            cbSlot.captured.onSuccess(mockSetupIntent()); mockCancelable
        }
        module.cancelSetupIntent(buildSetupIntentMethodParams(uuid), mockk(relaxed = true))
        assertTrue(module.setupIntents.containsKey(uuid), "key should still exist")
        assertNull(module.setupIntents[uuid], "value should be null after cancel")
    }

    // =====================================================================
    // Collect: stores updated intent
    // =====================================================================

    @Test
    fun `collectPaymentMethod stores updated intent on success`() {
        val originalPi = mockPaymentIntent()
        val uuid = "pi_collect_uuid"
        module.paymentIntents[uuid] = originalPi

        val collectedPi = mockPaymentIntent()
        val cbSlot = slot<PaymentIntentCallback>()
        every { terminal.collectPaymentMethod(any(), capture(cbSlot), any()) } answers {
            cbSlot.captured.onSuccess(collectedPi); mockCancelable
        }
        module.collectPaymentMethod(buildPaymentIntentMethodParams(uuid), mockk(relaxed = true))
        assertSame(collectedPi, module.paymentIntents[uuid])
    }

    @Test
    fun `collectSetupIntentPaymentMethod stores updated intent on success`() {
        val originalSi = mockSetupIntent()
        val uuid = "si_collect_uuid"
        module.setupIntents[uuid] = originalSi

        val collectedSi = mockSetupIntent()
        val cbSlot = slot<SetupIntentCallback>()
        every { terminal.collectSetupIntentPaymentMethod(any(), any(), any(), capture(cbSlot)) } answers {
            cbSlot.captured.onSuccess(collectedSi); mockCancelable
        }
        module.collectSetupIntentPaymentMethod(
            buildSetupIntentMethodParams(uuid, includeAllowRedisplay = true),
            mockk(relaxed = true),
        )
        assertSame(collectedSi, module.setupIntents[uuid])
    }

    // =====================================================================
    // Collect Failure: preserves original intent (no failure lambda wired)
    // =====================================================================

    @Test
    fun `collectPaymentMethod failure preserves original intent in map`() {
        val originalPi = mockPaymentIntent()
        val uuid = "pi_collect_fail_uuid"
        module.paymentIntents[uuid] = originalPi

        val cbSlot = slot<PaymentIntentCallback>()
        every { terminal.collectPaymentMethod(any(), capture(cbSlot), any()) } answers {
            cbSlot.captured.onFailure(mockTerminalExceptionWithPI(mockPaymentIntent())); mockCancelable
        }
        module.collectPaymentMethod(buildPaymentIntentMethodParams(uuid), mockk(relaxed = true))
        assertSame(originalPi, module.paymentIntents[uuid], "original intent should be preserved on collect failure")
    }

    @Test
    fun `collectSetupIntentPaymentMethod failure preserves original intent in map`() {
        val originalSi = mockSetupIntent()
        val uuid = "si_collect_fail_uuid"
        module.setupIntents[uuid] = originalSi

        val cbSlot = slot<SetupIntentCallback>()
        every { terminal.collectSetupIntentPaymentMethod(any(), any(), any(), capture(cbSlot)) } answers {
            cbSlot.captured.onFailure(mockTerminalExceptionWithSI(mockSetupIntent())); mockCancelable
        }
        module.collectSetupIntentPaymentMethod(
            buildSetupIntentMethodParams(uuid, includeAllowRedisplay = true),
            mockk(relaxed = true),
        )
        assertSame(originalSi, module.setupIntents[uuid], "original intent should be preserved on collect failure")
    }

    // =====================================================================
    // Helpers: mock factories
    // =====================================================================

    private fun mockTerminalException(): TerminalException = mockk(relaxed = true) {
        every { errorCode } returns com.stripe.stripeterminal.external.models.TerminalErrorCode.UNEXPECTED_SDK_ERROR
        every { errorMessage } returns "error"
        every { message } returns "error"
        every { cause } returns null
        every { apiError } returns null
        every { paymentIntent } returns null
        every { setupIntent } returns null
        every { refund } returns null
    }

    private fun mockTerminalExceptionWithPI(pi: PaymentIntent): TerminalException = mockk(relaxed = true) {
        every { errorCode } returns com.stripe.stripeterminal.external.models.TerminalErrorCode.DECLINED_BY_STRIPE_API
        every { errorMessage } returns "declined"
        every { message } returns "declined"
        every { cause } returns null
        every { apiError } returns null
        every { paymentIntent } returns pi
        every { setupIntent } returns null
        every { refund } returns null
    }

    private fun mockTerminalExceptionWithSI(si: SetupIntent): TerminalException = mockk(relaxed = true) {
        every { errorCode } returns com.stripe.stripeterminal.external.models.TerminalErrorCode.DECLINED_BY_STRIPE_API
        every { errorMessage } returns "declined"
        every { message } returns "declined"
        every { cause } returns null
        every { apiError } returns null
        every { paymentIntent } returns null
        every { setupIntent } returns si
        every { refund } returns null
    }

    // =====================================================================
    // Helpers: param builders
    // =====================================================================

    private fun buildMinimalPaymentIntentParams(): JavaOnlyMap = JavaOnlyMap().apply {
        putInt("amount", 100)
        putString("currency", "usd")
        putArray("paymentMethodTypes", com.facebook.react.bridge.JavaOnlyArray())
    }

    private fun buildMinimalSetupIntentParams(): JavaOnlyMap = JavaOnlyMap().apply {
        putString("customer", "cus_123")
    }

    private fun buildPaymentIntentMethodParams(uuid: String): JavaOnlyMap = JavaOnlyMap().apply {
        putMap("paymentIntent", JavaOnlyMap().apply { putString("sdkUuid", uuid) })
    }

    private fun buildSetupIntentMethodParams(uuid: String, includeAllowRedisplay: Boolean = false): JavaOnlyMap = JavaOnlyMap().apply {
        putMap("setupIntent", JavaOnlyMap().apply { putString("sdkUuid", uuid) })
        if (includeAllowRedisplay) putString("allowRedisplay", "always")
    }
}
