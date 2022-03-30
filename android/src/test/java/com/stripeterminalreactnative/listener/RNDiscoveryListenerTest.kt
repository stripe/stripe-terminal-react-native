package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.models.Reader
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripe.stripeterminal.external.models.TerminalException.TerminalErrorCode
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants.FINISH_DISCOVERING_READERS
import com.stripeterminalreactnative.ReactNativeConstants.UPDATE_DISCOVERED_READERS
import com.stripeterminalreactnative.ReactNativeTypeReplacementRule
import com.stripeterminalreactnative.hasEmptyResult
import com.stripeterminalreactnative.hasError
import com.stripeterminalreactnative.hasValue
import io.mockk.mockk
import io.mockk.verify
import org.junit.ClassRule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import kotlin.test.assertTrue

@RunWith(JUnit4::class)
class RNDiscoveryListenerTest {

    companion object {
        private val EXCEPTION = TerminalException(TerminalErrorCode.UNEXPECTED_SDK_ERROR, "message")

        @ClassRule
        @JvmField
        val typeReplacer = ReactNativeTypeReplacementRule()
    }

    private val context = mockk<ReactApplicationContext>()
    private val readers = listOf(mockk<Reader>(relaxed = true))

    @Test
    fun `should send onUpdateDiscoveredReaders event`() {
        val mockOnDiscoveredReaders = mockk<(List<Reader>) -> Unit>(relaxed = true)
        RNDiscoveryListener(context, mockOnDiscoveredReaders).onUpdateDiscoveredReaders(readers)

        verify(exactly = 1) { mockOnDiscoveredReaders.invoke(readers) }
        verify(exactly = 1) { context.sendEvent(UPDATE_DISCOVERED_READERS.listenerName, any()) }

        assertTrue(typeReplacer.sendEventSlot.captured.hasValue("readers"))
    }

    @Test
    fun `should send onSuccess event`() {
        RNDiscoveryListener(context, mockk()).onSuccess()

        verify(exactly = 1) { context.sendEvent(FINISH_DISCOVERING_READERS.listenerName, any()) }

        assertTrue(typeReplacer.sendEventSlot.captured.hasEmptyResult())
    }

    @Test
    fun `should send onFailure event`() {
        RNDiscoveryListener(context, mockk()).onFailure(EXCEPTION)

        verify(exactly = 1) { context.sendEvent(FINISH_DISCOVERING_READERS.listenerName, any()) }

        assertTrue(typeReplacer.sendEventSlot.captured.hasError())
    }
}
