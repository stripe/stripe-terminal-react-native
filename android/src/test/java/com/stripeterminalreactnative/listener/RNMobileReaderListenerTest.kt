package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.Cancelable
import com.stripe.stripeterminal.external.callable.ReaderDisconnectListener
import com.stripe.stripeterminal.external.callable.ReaderReconnectionListener
import com.stripe.stripeterminal.external.models.DisconnectReason
import com.stripe.stripeterminal.external.models.ReaderDisplayMessage
import com.stripe.stripeterminal.external.models.ReaderInputOptions
import com.stripe.stripeterminal.external.models.ReaderInputOptions.ReaderInputOption
import com.stripe.stripeterminal.external.models.ReaderSoftwareUpdate
import com.stripe.stripeterminal.external.models.TerminalErrorCode
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants.FINISH_INSTALLING_UPDATE
import com.stripeterminalreactnative.ReactNativeConstants.REPORT_AVAILABLE_UPDATE
import com.stripeterminalreactnative.ReactNativeConstants.REPORT_UPDATE_PROGRESS
import com.stripeterminalreactnative.ReactNativeConstants.REQUEST_READER_DISPLAY_MESSAGE
import com.stripeterminalreactnative.ReactNativeConstants.REQUEST_READER_INPUT
import com.stripeterminalreactnative.ReactNativeConstants.START_INSTALLING_UPDATE
import com.stripeterminalreactnative.ReactNativeTypeReplacementRule
import com.stripeterminalreactnative.hasError
import com.stripeterminalreactnative.hasResult
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.ClassRule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import kotlin.test.assertFalse
import kotlin.test.assertTrue

@RunWith(JUnit4::class)
class RNMobileReaderListenerTest {

    companion object {
        private val EXCEPTION = TerminalException(TerminalErrorCode.UNEXPECTED_SDK_ERROR, "message")

        @ClassRule
        @JvmField
        val typeReplacer = ReactNativeTypeReplacementRule()
    }

    private val context = mockk<ReactApplicationContext>()
    private val update = mockk<ReaderSoftwareUpdate>(relaxed = true) {
        every {
            version
        } returns "1"
        every {
            durationEstimate
        } returns ReaderSoftwareUpdate.UpdateDurationEstimate.ONE_TO_TWO_MINUTES
        every {
            requiredAtMs
        } returns 0
    }

    @Test
    fun `should send onReportAvailableUpdate event`() {
        val listener = RNMobileReaderListener(context, mockk(), mockk(), mockk())
        listener.onReportAvailableUpdate(update)

        verify(exactly = 1) { context.sendEvent(REPORT_AVAILABLE_UPDATE.listenerName, any()) }

        assertTrue(typeReplacer.sendEventSlot.captured.hasResult())
    }

    @Test
    fun `should send onStartInstallingUpdate event`() {
        val mockOnStartInstallingUpdate = mockk<(Cancelable?) -> Unit>(relaxed = true)
        val mockCancelable = mockk<Cancelable>()
        val listener =
            RNMobileReaderListener(context, mockk(), mockk(), mockOnStartInstallingUpdate)
        listener.onStartInstallingUpdate(update, mockCancelable)

        verify(exactly = 1) { mockOnStartInstallingUpdate.invoke(mockCancelable) }
        verify(exactly = 1) { context.sendEvent(START_INSTALLING_UPDATE.listenerName, any()) }

        assertTrue(typeReplacer.sendEventSlot.captured.hasResult())
    }

    @Test
    fun `should send onReportReaderSoftwareUpdateProgress event`() {
        val listener = RNMobileReaderListener(context, mockk(), mockk(), mockk())
        listener.onReportReaderSoftwareUpdateProgress(1.0f)

        verify(exactly = 1) { context.sendEvent(REPORT_UPDATE_PROGRESS.listenerName, any()) }

        assertTrue(typeReplacer.sendEventSlot.captured.hasResult())
    }

    @Test
    fun `should send onFinishInstallingUpdate event`() {
        val listener = RNMobileReaderListener(context, mockk(), mockk(), mockk())
        listener.onFinishInstallingUpdate(null)

        verify(exactly = 1) { context.sendEvent(FINISH_INSTALLING_UPDATE.listenerName, any()) }

        assertFalse(typeReplacer.sendEventSlot.captured.hasError())
        assertFalse(typeReplacer.sendEventSlot.captured.hasResult())

        listener.onFinishInstallingUpdate(update)

        verify(exactly = 2) { context.sendEvent(FINISH_INSTALLING_UPDATE.listenerName, any()) }

        assertFalse(typeReplacer.sendEventSlot.captured.hasError())
        assertTrue(typeReplacer.sendEventSlot.captured.hasResult())
    }

    @Test
    fun `should send onFinishInstallingUpdate error`() {
        val listener = RNMobileReaderListener(context, mockk(), mockk(), mockk())
        listener.onFinishInstallingUpdate(update, EXCEPTION)

        verify(exactly = 1) { context.sendEvent(FINISH_INSTALLING_UPDATE.listenerName, any()) }

        assertTrue(typeReplacer.sendEventSlot.captured.hasError())
        assertTrue(typeReplacer.sendEventSlot.captured.hasResult())
    }

    @Test
    fun `should send onRequestReaderInput event`() {
        val listener = RNMobileReaderListener(context, mockk(), mockk(), mockk())
        listener.onRequestReaderInput(ReaderInputOptions(listOf(ReaderInputOption.INSERT)))

        verify(exactly = 1) { context.sendEvent(REQUEST_READER_INPUT.listenerName, any()) }

        assertTrue(typeReplacer.sendEventSlot.captured.hasResult())
    }

    @Test
    fun `should send onRequestReaderDisplayMessage event`() {
        val listener = RNMobileReaderListener(context, mockk(), mockk(), mockk())
        listener.onRequestReaderDisplayMessage(ReaderDisplayMessage.INSERT_OR_SWIPE_CARD)

        verify(exactly = 1) {
            context.sendEvent(REQUEST_READER_DISPLAY_MESSAGE.listenerName, any())
        }

        assertTrue(typeReplacer.sendEventSlot.captured.hasResult())
    }

    @Test
    fun `should call inner onDisconnect`() {
        val readerDisconnectListener = mockk<ReaderDisconnectListener> {
            every { onDisconnect(any()) } returns Unit
        }
        val listener = RNMobileReaderListener(context, mockk(), readerDisconnectListener, mockk())
        listener.onDisconnect(DisconnectReason.DISCONNECT_REQUESTED)
        verify(exactly = 1) { readerDisconnectListener.onDisconnect(DisconnectReason.DISCONNECT_REQUESTED) }
    }

    @Test
    fun `should call inner reconnectionListener`() {
        val readerReconnectionListener = mockk<ReaderReconnectionListener>(relaxed = true)
        val listener = RNMobileReaderListener(context, readerReconnectionListener, mockk(), mockk())
        listener.onReaderReconnectStarted(mockk(), mockk(), mockk())
        verify(exactly = 1) {
            readerReconnectionListener.onReaderReconnectStarted(
                any(),
                any(),
                any()
            )
        }
        listener.onReaderReconnectSucceeded(mockk())
        verify(exactly = 1) { readerReconnectionListener.onReaderReconnectSucceeded(any()) }
        listener.onReaderReconnectFailed(mockk())
        verify(exactly = 1) { readerReconnectionListener.onReaderReconnectFailed(any()) }
    }

}
