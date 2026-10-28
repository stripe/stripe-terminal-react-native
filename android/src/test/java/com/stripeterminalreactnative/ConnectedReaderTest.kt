package com.stripeterminalreactnative

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.stripe.stripeterminal.Terminal
import com.stripe.stripeterminal.external.models.Reader
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.slot
import io.mockk.unmockkObject
import io.mockk.verify
import org.junit.After
import org.junit.Before
import org.junit.ClassRule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

@RunWith(JUnit4::class)
class ConnectedReaderTest {
    companion object {
        @ClassRule
        @JvmField
        val typeReplacer = ReactNativeTypeReplacementRule()
    }

    private val context = mockk<ReactApplicationContext>(relaxed = true)
    private val terminal = mockk<Terminal>()
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

    @Test
    fun `getConnectedReader resolves an explicit null in a non-empty map when no reader is connected`() {
        every { terminal.connectedReader } returns null
        val promise = mockk<Promise>(relaxed = true)

        module.getConnectedReader(promise)

        val resolved = slot<ReadableMap>()
        verify(exactly = 1) { promise.resolve(capture(resolved)) }
        assertEquals(setOf("reader"), resolved.captured.toHashMap().keys)
        assertTrue(resolved.captured.isNull("reader"))
    }

    @Test
    fun `getConnectedReader forwards unexpected lookup exceptions to JavaScript`() {
        every { terminal.connectedReader } throws IllegalStateException("Reader lookup failed")

        assertUnexpectedError("Reader lookup failed")
    }

    @Test
    fun `getConnectedReader forwards unexpected mapping exceptions to JavaScript`() {
        val reader = mockk<Reader>()
        every { reader.label } throws IllegalStateException("Reader mapping failed")
        every { terminal.connectedReader } returns reader

        assertUnexpectedError("Reader mapping failed")
    }

    private fun assertUnexpectedError(message: String) {
        val promise = mockk<Promise>(relaxed = true)

        module.getConnectedReader(promise)

        val resolved = slot<ReadableMap>()
        verify(exactly = 1) { promise.resolve(capture(resolved)) }
        assertEquals(setOf("error"), resolved.captured.toHashMap().keys)
        val error = assertNotNull(resolved.captured.getMap("error"))
        assertEquals("UNEXPECTED_SDK_ERROR", error.getString("code"))
        assertEquals(message, error.getString("message"))
        assertEquals("rn", error.getString("error_source"))
    }
}
