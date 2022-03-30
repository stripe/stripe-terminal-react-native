package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.models.ReaderEvent
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants.REQUEST_READER_INPUT
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
class RNHandoffReaderListenerTest {

    companion object {
        @ClassRule
        @JvmField
        val typeReplacer = ReactNativeTypeReplacementRule()
    }

    private val context = mockk<ReactApplicationContext>()

    @Test
    fun `should send onReportReaderEvent event`() {
        val listener = RNHandoffReaderListener(context)
        listener.onReportReaderEvent(ReaderEvent.CARD_INSERTED)

        verify(exactly = 1) { context.sendEvent(REQUEST_READER_INPUT.listenerName, any()) }

        assertTrue(typeReplacer.sendEventSlot.captured.hasValue("event"))
    }
}
