package com.stripeterminalreactnative

import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.stripe.stripeterminal.Terminal
import com.stripe.stripeterminal.external.callable.ReaderCallback
import com.stripe.stripeterminal.external.models.Reader
import com.stripe.stripeterminal.external.models.SimulatorConfiguration
import com.stripe.stripeterminal.external.models.TerminalErrorCode
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripeterminalreactnative.TestConstants.STRIPE_ERROR
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

@RunWith(JUnit4::class)
class ConnectionValidationTest {

    companion object {
        @ClassRule
        @JvmField
        val typeReplacer = ReactNativeTypeReplacementRule()
    }

    private val context = mockk<ReactApplicationContext>(relaxed = true)
    private val terminal = mockk<Terminal>()
    private lateinit var module: StripeTerminalReactNativeModule
    private var simulatorConfiguration = SimulatorConfiguration()

    @Before
    fun setUp() {
        mockkObject(Terminal.Companion)
        every { Terminal.getInstance() } returns terminal
        every { terminal.simulatorConfiguration } answers { simulatorConfiguration }
        every { terminal.simulatorConfiguration = any() } answers {
            simulatorConfiguration = firstArg()
        }
        module = StripeTerminalReactNativeModule(context)
    }

    @After
    fun tearDown() {
        unmockkObject(Terminal.Companion)
    }

    @Test
    fun `easyConnect resolves invalid parameter error when locationId is missing`() {
        listOf("bluetoothScan", "tapToPay", "usb").forEach { discoveryMethod ->
            assertEasyConnectValidationError(
                params = JavaOnlyMap().apply {
                    putString("discoveryMethod", discoveryMethod)
                },
                expectedMessage = "You must provide a locationId"
            )
        }
    }

    @Test
    fun `connectReader resolves invalid parameter error when tap to pay testReaderUpdate is provided`() {
        val reader = mockk<Reader> {
            every { serialNumber } returns "rdr_123"
        }
        setDiscoveredReaders(listOf(reader))

        assertConnectReaderValidationError(
            params = JavaOnlyMap().apply {
                putString("discoveryMethod", "tapToPay")
                putString("locationId", "tml_123")
                putMap("reader", JavaOnlyMap().apply {
                    putString("serialNumber", "rdr_123")
                })
                putMap("testReaderUpdate", JavaOnlyMap().apply {
                    putString("type", "lowBattery")
                })
            },
            expectedMessage = "testReaderUpdate is not supported for Tap to Pay on Android"
        )
    }

    @Test
    fun `connectReader resolves SDK callback failure as native exactly once`() {
        val reader = mockk<Reader> {
            every { serialNumber } returns "rdr_123"
        }
        setDiscoveredReaders(listOf(reader))
        val exception = TerminalException(TerminalErrorCode.INVALID_REQUIRED_PARAMETER, "SDK rejected parameter")
        every { terminal.connectReader(reader, any(), any()) } answers {
            thirdArg<ReaderCallback>().onFailure(exception)
        }
        val promise = mockk<Promise>(relaxed = true)

        module.connectReader(JavaOnlyMap().apply {
            putString("discoveryMethod", "internet")
            putMap("reader", JavaOnlyMap().apply {
                putString("serialNumber", "rdr_123")
            })
        }, promise)

        val resolved = slot<ReadableMap>()
        verify(timeout = 1_000, exactly = 1) { promise.resolve(capture(resolved)) }
        val error = (resolved.captured as JavaOnlyMap).requireMap("error")
        assertEquals("native", error.getString("error_source"))
        assertEquals("INVALID_REQUIRED_PARAMETER", error.getString("code"))
        assertEquals("SDK rejected parameter", error.getString("message"))
        verify(exactly = 1) { terminal.connectReader(reader, any(), any()) }
    }

    @Test
    fun `connectReader missing reader resolves RN validation before calling SDK`() {
        assertConnectReaderValidationError(
            JavaOnlyMap().apply { putString("discoveryMethod", "internet") },
            "You must provide a reader"
        )
    }

    private fun assertEasyConnectValidationError(
        params: JavaOnlyMap,
        expectedMessage: String
    ) {
        val promise = mockk<Promise>(relaxed = true)

        module.easyConnect(params, promise)

        val captured = slot<ReadableMap>()
        verify(exactly = 1) { promise.resolve(capture(captured)) }
        verify(exactly = 0) { terminal.easyConnect(any(), any()) }

        val errorWrapper = captured.captured as JavaOnlyMap
        val error = errorWrapper.requireMap("error")
        assertEquals(STRIPE_ERROR, error.getString("name"))
        assertEquals(
            TerminalErrorCode.INVALID_REQUIRED_PARAMETER.convertToReactNativeErrorCode(),
            error.getString("code")
        )
        assertEquals(expectedMessage, error.getString("message"))
        assertEquals("rn", error.getString("error_source"))
    }

    private fun assertConnectReaderValidationError(
        params: JavaOnlyMap,
        expectedMessage: String
    ) {
        val promise = mockk<Promise>(relaxed = true)

        module.connectReader(params, promise)

        val captured = slot<ReadableMap>()
        verify(timeout = 1_000, exactly = 1) { promise.resolve(capture(captured)) }
        verify(exactly = 0) { terminal.connectReader(any(), any(), any()) }

        val errorWrapper = captured.captured as JavaOnlyMap
        val error = errorWrapper.requireMap("error")
        assertEquals(STRIPE_ERROR, error.getString("name"))
        assertEquals(
            TerminalErrorCode.INVALID_REQUIRED_PARAMETER.convertToReactNativeErrorCode(),
            error.getString("code")
        )
        assertEquals(expectedMessage, error.getString("message"))
        assertEquals("rn", error.getString("error_source"))
    }

    private fun setDiscoveredReaders(readers: List<Reader>) {
        val field = StripeTerminalReactNativeModule::class.java.getDeclaredField("discoveredReadersList")
        field.isAccessible = true
        field.set(module, readers)
    }

    private fun JavaOnlyMap.requireMap(key: String): JavaOnlyMap {
        val map = getMap(key)
        assertNotNull(map, "Expected map for key $key")
        return map as JavaOnlyMap
    }
}
