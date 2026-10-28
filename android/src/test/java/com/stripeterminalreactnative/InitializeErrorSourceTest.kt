package com.stripeterminalreactnative

import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.stripe.stripeterminal.Terminal
import com.stripe.stripeterminal.external.OfflineMode
import com.stripe.stripeterminal.external.models.TerminalErrorCode
import com.stripe.stripeterminal.external.models.TerminalException
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.mockkStatic
import io.mockk.slot
import io.mockk.unmockkObject
import io.mockk.unmockkStatic
import io.mockk.verify
import org.junit.After
import org.junit.Before
import org.junit.ClassRule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import kotlin.test.assertEquals
import kotlin.test.assertTrue

@OptIn(OfflineMode::class)
@Suppress("DEPRECATION")
@RunWith(JUnit4::class)
class InitializeErrorSourceTest {
    companion object {
        @ClassRule
        @JvmField
        val typeReplacer = ReactNativeTypeReplacementRule()
    }

    private val context = mockk<ReactApplicationContext>(relaxed = true)
    private lateinit var module: StripeTerminalReactNativeModule

    @Before
    fun setUp() {
        mockkObject(Terminal.Companion)
        mockkStatic(UiThreadUtil::class)
        every { Terminal.isInitialized() } returns false
        every { UiThreadUtil.runOnUiThread(any<Runnable>()) } returns true
        module = StripeTerminalReactNativeModule(context)
    }

    @After
    fun tearDown() {
        unmockkObject(Terminal.Companion)
        unmockkStatic(UiThreadUtil::class)
    }

    @Test
    fun `initialize without locale resolves RN validation error before SDK init`() {
        val promise = mockk<Promise>(relaxed = true)

        module.initialize(JavaOnlyMap(), promise)

        val resolved = slot<ReadableMap>()
        verify(exactly = 1) { promise.resolve(capture(resolved)) }
        val error = resolved.captured.getMap("error")
        assertEquals("rn", error?.getString("error_source"))
        assertEquals("INVALID_REQUIRED_PARAMETER", error?.getString("code"))
        assertEquals("You must provide a localeConfig", error?.getString("message"))
        verify(exactly = 0) { Terminal.init(any(), any(), any(), any(), any(), any()) }
    }

    @Test
    fun `initialize with locale resolves SDK failure as native exactly once`() {
        val exception = TerminalException(TerminalErrorCode.BLUETOOTH_PERMISSION_DENIED, "Permission denied")
        every { Terminal.init(any(), any(), any(), any(), any(), any()) } throws exception

        assertNativeInitializationFailure(JavaOnlyMap().apply {
            putMap("localeConfig", JavaOnlyMap().apply {
                putString("type", "cardLanguagePreferenceIfAvailable")
            })
        })

        verify(exactly = 1) { Terminal.init(any(), any(), any(), any(), any(), any()) }
    }

    @Test
    fun `initialize resolves invalid locale SDK builder error as native before SDK init`() {
        val promise = mockk<Promise>(relaxed = true)

        module.initialize(JavaOnlyMap().apply {
            putMap("localeConfig", JavaOnlyMap().apply {
                putString("type", "hardcoded")
                putString("locale", "not_a_locale")
            })
        }, promise)

        val resolved = slot<ReadableMap>()
        verify(exactly = 1) { promise.resolve(capture(resolved)) }
        val error = resolved.captured.getMap("error")
        assertEquals("native", error?.getString("error_source"))
        assertEquals("INVALID_REQUIRED_PARAMETER", error?.getString("code"))
        assertEquals("Invalid BCP 47 language tag: not_a_locale", error?.getString("message"))
        verify(exactly = 0) { Terminal.init(any(), any(), any(), any(), any(), any()) }
    }

    @Test
    fun `initialize success preserves empty result`() {
        every { Terminal.init(any(), any(), any(), any(), any(), any()) } returns Unit
        val promise = mockk<Promise>(relaxed = true)

        module.initialize(JavaOnlyMap().apply {
            putMap("localeConfig", JavaOnlyMap().apply {
                putString("type", "cardLanguagePreferenceIfAvailable")
            })
        }, promise)

        val resolved = slot<ReadableMap>()
        verify(exactly = 1) { promise.resolve(capture(resolved)) }
        assertTrue(resolved.captured.toHashMap().isEmpty())
    }

    private fun assertNativeInitializationFailure(params: JavaOnlyMap) {
        val promise = mockk<Promise>(relaxed = true)

        module.initialize(params, promise)

        val resolved = slot<ReadableMap>()
        verify(exactly = 1) { promise.resolve(capture(resolved)) }
        val error = resolved.captured.getMap("error")
        assertEquals("native", error?.getString("error_source"))
        assertEquals("BLUETOOTH_PERMISSION_DENIED", error?.getString("code"))
        assertEquals("Permission denied", error?.getString("message"))
    }
}
