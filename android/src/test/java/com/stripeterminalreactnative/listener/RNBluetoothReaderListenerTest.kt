package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.stripe.stripeterminal.external.callable.Cancelable
import com.stripe.stripeterminal.external.models.ReaderDisplayMessage
import com.stripe.stripeterminal.external.models.ReaderInputOptions
import com.stripe.stripeterminal.external.models.ReaderInputOptions.ReaderInputOption
import com.stripe.stripeterminal.external.models.ReaderSoftwareUpdate
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripe.stripeterminal.external.models.TerminalException.TerminalErrorCode
import com.stripeterminalreactnative.ReactExtensions
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants.FINISH_INSTALLING_UPDATE
import com.stripeterminalreactnative.ReactNativeConstants.REPORT_AVAILABLE_UPDATE
import com.stripeterminalreactnative.ReactNativeConstants.REPORT_UPDATE_PROGRESS
import com.stripeterminalreactnative.ReactNativeConstants.REQUEST_READER_DISPLAY_MESSAGE
import com.stripeterminalreactnative.ReactNativeConstants.REQUEST_READER_INPUT
import com.stripeterminalreactnative.ReactNativeConstants.START_INSTALLING_UPDATE
import com.stripeterminalreactnative.hasError
import com.stripeterminalreactnative.hasResult
import com.stripeterminalreactnative.nativeArrayOf
import com.stripeterminalreactnative.nativeMapOf
import com.stripeterminalreactnative.toJavaOnlyArray
import com.stripeterminalreactnative.toJavaOnlyMap
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.mockkStatic
import io.mockk.slot
import io.mockk.unmockkAll
import io.mockk.verify
import org.junit.AfterClass
import org.junit.BeforeClass
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import java.util.*
import kotlin.test.assertFalse
import kotlin.test.assertTrue

@RunWith(JUnit4::class)
class RNBluetoothReaderListenerTest {

    companion object {
        private val EXCEPTION = TerminalException(TerminalErrorCode.UNEXPECTED_SDK_ERROR, "message")

        private val sendEventSlot = slot<WritableMap.() -> Unit>()
        private val nativeMapOfSlot = slot<WritableMap.() -> Unit>()
        private val nativeArrayOfSlot = slot<WritableArray.() -> Unit>()

        @BeforeClass
        @JvmStatic
        fun setup() {
            mockkObject(ReactExtensions)
            with(ReactExtensions) {
                every {
                    any<ReactApplicationContext>().sendEvent(any())
                } returns Unit
                every {
                    any<ReactApplicationContext>().sendEvent(any(), capture(sendEventSlot))
                } returns Unit
            }
            mockkStatic("com.stripeterminalreactnative.MappersKt")
            every { nativeMapOf(capture(nativeMapOfSlot)) } answers {
                nativeMapOfSlot.captured.toJavaOnlyMap()
            }
            every { nativeArrayOf(capture(nativeArrayOfSlot)) } answers {
                nativeArrayOfSlot.captured.toJavaOnlyArray()
            }
        }

        @AfterClass
        @JvmStatic
        fun teardown() {
            unmockkAll()
        }
    }

    private val context = mockk<ReactApplicationContext>()
    private val update = mockk<ReaderSoftwareUpdate>(relaxed = true) {
        every {
            version
        } returns "1"
        every {
            timeEstimate
        } returns ReaderSoftwareUpdate.UpdateTimeEstimate.ONE_TO_TWO_MINUTES
        every {
            requiredAt
        } returns Date()
    }

    @Test
    fun `should send onReportAvailableUpdate event`() {
        val listener = RNBluetoothReaderListener(context, mockk())
        listener.onReportAvailableUpdate(update)

        verify(exactly = 1) { context.sendEvent(REPORT_AVAILABLE_UPDATE.listenerName, any()) }

        assertTrue(sendEventSlot.captured.hasResult())
    }

    @Test
    fun `should send onStartInstallingUpdate event`() {
        val mockOnStartInstallingUpdate = mockk<(Cancelable?) -> Unit>(relaxed = true)
        val mockCancelable = mockk<Cancelable>()
        val listener = RNBluetoothReaderListener(context, mockOnStartInstallingUpdate)
        listener.onStartInstallingUpdate(update, mockCancelable)

        verify(exactly = 1) { mockOnStartInstallingUpdate.invoke(mockCancelable) }
        verify(exactly = 1) { context.sendEvent(START_INSTALLING_UPDATE.listenerName, any()) }

        assertTrue(sendEventSlot.captured.hasResult())
    }

    @Test
    fun `should send onReportReaderSoftwareUpdateProgress event`() {
        val listener = RNBluetoothReaderListener(context, mockk())
        listener.onReportReaderSoftwareUpdateProgress(1.0f)

        verify(exactly = 1) { context.sendEvent(REPORT_UPDATE_PROGRESS.listenerName, any()) }

        assertTrue(sendEventSlot.captured.hasResult())
    }

    @Test
    fun `should send onFinishInstallingUpdate event`() {
        val listener = RNBluetoothReaderListener(context, mockk())
        listener.onFinishInstallingUpdate(null)

        verify(exactly = 1) { context.sendEvent(FINISH_INSTALLING_UPDATE.listenerName, any()) }

        assertFalse(sendEventSlot.captured.hasError())
        assertFalse(sendEventSlot.captured.hasResult())

        listener.onFinishInstallingUpdate(update)

        verify(exactly = 2) { context.sendEvent(FINISH_INSTALLING_UPDATE.listenerName, any()) }

        assertFalse(sendEventSlot.captured.hasError())
        assertTrue(sendEventSlot.captured.hasResult())
    }

    @Test
    fun `should send onFinishInstallingUpdate error`() {
        val listener = RNBluetoothReaderListener(context, mockk())
        listener.onFinishInstallingUpdate(update, EXCEPTION)

        verify(exactly = 1) { context.sendEvent(FINISH_INSTALLING_UPDATE.listenerName, any()) }

        assertTrue(sendEventSlot.captured.hasError())
        assertTrue(sendEventSlot.captured.hasResult())
    }

    @Test
    fun `should send onRequestReaderInput event`() {
        val listener = RNBluetoothReaderListener(context, mockk())
        listener.onRequestReaderInput(ReaderInputOptions(listOf(ReaderInputOption.INSERT)))

        verify(exactly = 1) { context.sendEvent(REQUEST_READER_INPUT.listenerName, any()) }

        assertTrue(sendEventSlot.captured.hasResult())
    }

    @Test
    fun `should send onRequestReaderDisplayMessage event`() {
        val listener = RNBluetoothReaderListener(context, mockk())
        listener.onRequestReaderDisplayMessage(ReaderDisplayMessage.INSERT_OR_SWIPE_CARD)

        verify(exactly = 1) {
            context.sendEvent(REQUEST_READER_DISPLAY_MESSAGE.listenerName, any())
        }

        assertTrue(sendEventSlot.captured.hasResult())
    }
}
