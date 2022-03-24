package com.stripeterminalreactnative.listener

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.stripe.stripeterminal.external.models.Reader
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripe.stripeterminal.external.models.TerminalException.TerminalErrorCode
import com.stripeterminalreactnative.ReactExtensions
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants.FINISH_DISCOVERING_READERS
import com.stripeterminalreactnative.ReactNativeConstants.UPDATE_DISCOVERED_READERS
import com.stripeterminalreactnative.hasEmptyResult
import com.stripeterminalreactnative.hasError
import com.stripeterminalreactnative.hasValue
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
import kotlin.test.assertTrue

@RunWith(JUnit4::class)
class RNDiscoveryListenerTest {

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
    private val readers = listOf(mockk<Reader>(relaxed = true))

    @Test
    fun `should send onUpdateDiscoveredReaders event`() {
        val mockOnDiscoveredReaders = mockk<(List<Reader>) -> Unit>(relaxed = true)
        RNDiscoveryListener(context, mockOnDiscoveredReaders).onUpdateDiscoveredReaders(readers)

        verify(exactly = 1) { mockOnDiscoveredReaders.invoke(readers) }
        verify(exactly = 1) { context.sendEvent(UPDATE_DISCOVERED_READERS.listenerName, any()) }

        assertTrue(sendEventSlot.captured.hasValue("readers"))
    }

    @Test
    fun `should send onSuccess event`() {
        RNDiscoveryListener(context, mockk()).onSuccess()

        verify(exactly = 1) { context.sendEvent(FINISH_DISCOVERING_READERS.listenerName, any()) }

        assertTrue(sendEventSlot.captured.hasEmptyResult())
    }

    @Test
    fun `should send onFailure event`() {
        RNDiscoveryListener(context, mockk()).onFailure(EXCEPTION)

        verify(exactly = 1) { context.sendEvent(FINISH_DISCOVERING_READERS.listenerName, any()) }

        assertTrue(sendEventSlot.captured.hasError())
    }
}
