package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.models.ConnectionStatus
import com.stripe.stripeterminal.external.models.PaymentStatus
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants.CHANGE_CONNECTION_STATUS
import com.stripeterminalreactnative.ReactNativeConstants.CHANGE_PAYMENT_STATUS
import com.stripeterminalreactnative.ReactNativeTypeReplacementRule
import com.stripeterminalreactnative.hasResult
import io.mockk.mockk
import io.mockk.verify
import org.junit.ClassRule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import kotlin.test.assertTrue

@RunWith(JUnit4::class)
class RNTerminalListenerTest {

    companion object {
        @ClassRule
        @JvmField
        val typeReplacer = ReactNativeTypeReplacementRule()
    }

    private val context = mockk<ReactApplicationContext>()

    @Test
    fun `should send onConnectionStatusChange event`() {
        val listener = RNTerminalListener(context)
        listener.onConnectionStatusChange(ConnectionStatus.CONNECTED)

        verify(exactly = 1) { context.sendEvent(CHANGE_CONNECTION_STATUS.listenerName, any()) }

        assertTrue(typeReplacer.sendEventSlot.captured.hasResult())
    }

    @Test
    fun `should send onPaymentStatusChange event`() {
        val listener = RNTerminalListener(context)
        listener.onPaymentStatusChange(PaymentStatus.READY)

        verify(exactly = 1) { context.sendEvent(CHANGE_PAYMENT_STATUS.listenerName, any()) }

        assertTrue(typeReplacer.sendEventSlot.captured.hasResult())
    }
}
