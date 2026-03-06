package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.ReaderDisconnectListener
import com.stripe.stripeterminal.external.models.DisconnectReason
import com.stripe.stripeterminal.external.models.ReaderEvent
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants
import com.stripeterminalreactnative.ReactNativeTypeReplacementRule
import com.stripeterminalreactnative.hasValue
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlin.test.assertTrue
import org.junit.ClassRule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

@RunWith(JUnit4::class)
class RNAppsOnDevicesListenerTest {

    companion object {
        @ClassRule
        @JvmField
        val typeReplacer = ReactNativeTypeReplacementRule()
    }

    private val context = mockk<ReactApplicationContext>()

    @Test
    fun `should send onReportReaderEvent event`() {
        val listener = RNAppsOnDevicesListener(context, mockk())
        listener.onReportReaderEvent(ReaderEvent.CARD_INSERTED)

        verify(exactly = 1) { context.sendEvent(ReactNativeConstants.REPORT_READER_EVENT.listenerName, any()) }

        assertTrue(typeReplacer.sendEventSlot.captured.hasValue("result"))
    }

    @Test
    fun `should call inner onDisconnect`() {
        val readerDisconnectListener = mockk<ReaderDisconnectListener> {
            every { onDisconnect(any()) } returns Unit
        }
        val listener = RNAppsOnDevicesListener(context, readerDisconnectListener)
        listener.onDisconnect(DisconnectReason.DISCONNECT_REQUESTED)
        verify(exactly = 1) { readerDisconnectListener.onDisconnect(DisconnectReason.DISCONNECT_REQUESTED) }
    }
}
