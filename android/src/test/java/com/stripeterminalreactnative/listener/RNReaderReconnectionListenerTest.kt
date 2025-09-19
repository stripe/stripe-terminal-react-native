package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.Cancelable
import com.stripe.stripeterminal.external.models.DisconnectReason
import com.stripe.stripeterminal.external.models.Reader
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants.READER_RECONNECT_FAIL
import com.stripeterminalreactnative.ReactNativeConstants.READER_RECONNECT_SUCCEED
import com.stripeterminalreactnative.ReactNativeConstants.START_READER_RECONNECT
import com.stripeterminalreactnative.ReactNativeTypeReplacementRule
import com.stripeterminalreactnative.hasValue
import io.mockk.mockk
import io.mockk.verify
import org.junit.ClassRule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import kotlin.test.assertTrue

@RunWith(JUnit4::class)
class RNReaderReconnectionListenerTest {

    companion object {
        @ClassRule
        @JvmField
        val typeReplacer = ReactNativeTypeReplacementRule()
    }

    private val context = mockk<ReactApplicationContext>()

    @Test
    fun `should send onReaderReconnectFailed event`() {
        val mockOnReaderReconnectStarted = mockk<(Cancelable?) -> Unit>(relaxed = true)
        val reader = mockk<Reader>(relaxed = true)
        val listener = RNReaderReconnectionListener(context, mockOnReaderReconnectStarted)
        listener.onReaderReconnectFailed(reader)

        verify(exactly = 1) {
            context.sendEvent(READER_RECONNECT_FAIL.listenerName, any())
        }

        assertTrue(typeReplacer.sendEventSlot.captured.hasValue("reader"))
    }

    @Test
    fun `should send onReaderReconnectStarted event`() {
        val mockOnReaderReconnectStarted = mockk<(Cancelable?) -> Unit>(relaxed = true)
        val mockCancelable = mockk<Cancelable>()
        val reader = mockk<Reader>(relaxed = true)
        val listener = RNReaderReconnectionListener(context, mockOnReaderReconnectStarted)
        listener.onReaderReconnectStarted(reader, mockCancelable, DisconnectReason.UNKNOWN)

        verify(exactly = 1) { mockOnReaderReconnectStarted.invoke(mockCancelable) }
        verify(exactly = 1) { context.sendEvent(START_READER_RECONNECT.listenerName, any()) }

        assertTrue(typeReplacer.sendEventSlot.captured.hasValue("reason"))
        assertTrue(typeReplacer.sendEventSlot.captured.hasValue("reader"))
    }

    @Test
    fun `should send onReaderReconnectSucceeded event`() {
        val mockOnReaderReconnectStarted = mockk<(Cancelable?) -> Unit>(relaxed = true)
        val reader = mockk<Reader>(relaxed = true)
        val listener = RNReaderReconnectionListener(context, mockOnReaderReconnectStarted)
        listener.onReaderReconnectSucceeded(reader)

        verify(exactly = 1) { context.sendEvent(READER_RECONNECT_SUCCEED.listenerName, any()) }

        assertTrue(typeReplacer.sendEventSlot.captured.hasValue("reader"))
    }
}
