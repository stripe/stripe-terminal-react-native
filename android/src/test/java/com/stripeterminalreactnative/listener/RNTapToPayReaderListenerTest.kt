package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.ReaderDisconnectListener
import com.stripe.stripeterminal.external.callable.ReaderReconnectionListener
import com.stripe.stripeterminal.external.models.DisconnectReason
import com.stripe.stripeterminal.external.models.TapToPayUpdateRequirement
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants
import com.stripeterminalreactnative.ReactNativeTypeReplacementRule
import com.stripeterminalreactnative.toJavaOnlyMap
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlin.test.assertEquals
import org.junit.ClassRule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

@RunWith(JUnit4::class)
class RNTapToPayReaderListenerTest {

    companion object {
        @ClassRule
        @JvmField
        val typeReplacer = ReactNativeTypeReplacementRule()
    }

    private val context = mockk<ReactApplicationContext>()

    @Test
    fun `should call inner reconnectionListener`() {
        val readerReconnectionListener = mockk<ReaderReconnectionListener>(relaxed = true)
        val listener = RNTapToPayReaderListener(
            context,
            mockk(relaxed = true),
            readerReconnectionListener
        )

        listener.onReaderReconnectStarted(mockk(), mockk(), mockk())
        verify(exactly = 1) {
            readerReconnectionListener.onReaderReconnectStarted(any(), any(), any())
        }
        listener.onReaderReconnectSucceeded(mockk())
        verify(exactly = 1) { readerReconnectionListener.onReaderReconnectSucceeded(any()) }
        listener.onReaderReconnectFailed(mockk())
        verify(exactly = 1) { readerReconnectionListener.onReaderReconnectFailed(any()) }
    }

    @Test
    fun `should call inner onDisconnect`() {
        val readerDisconnectListener = mockk<ReaderDisconnectListener> {
            every { onDisconnect(any()) } returns Unit
        }
        val listener = RNTapToPayReaderListener(
            context,
            readerDisconnectListener,
            mockk(relaxed = true)
        )

        listener.onDisconnect(DisconnectReason.DISCONNECT_REQUESTED)

        verify(exactly = 1) {
            readerDisconnectListener.onDisconnect(DisconnectReason.DISCONNECT_REQUESTED)
        }
    }

    @Test
    fun `should send update requirements event`() {
        val listener = RNTapToPayReaderListener(
            context,
            mockk(relaxed = true),
            mockk(relaxed = true)
        )

        listener.onUpdateRequirementsAvailable(
            listOf(
                TapToPayUpdateRequirement.OperatingSystem(35, 123L),
                TapToPayUpdateRequirement.SecurityPatch("2026-09-01", 456L),
                TapToPayUpdateRequirement.TerminalSdk("6.1.0", 789L)
            )
        )

        verify(exactly = 1) {
            context.sendEvent(ReactNativeConstants.UPDATE_REQUIREMENTS_AVAILABLE.listenerName, any())
        }
        val result = typeReplacer.sendEventSlot.captured.toJavaOnlyMap().getArray("result")
        assertEquals(3, result?.size())
        assertEquals("operatingSystem", result?.getMap(0)?.getString("type"))
        assertEquals(35, result?.getMap(0)?.getInt("apiLevel"))
        assertEquals("securityPatch", result?.getMap(1)?.getString("type"))
        assertEquals("terminalSdk", result?.getMap(2)?.getString("type"))
    }
}
