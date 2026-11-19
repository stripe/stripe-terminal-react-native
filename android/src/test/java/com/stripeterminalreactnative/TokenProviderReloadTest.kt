package com.stripeterminalreactnative

import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.stripe.stripeterminal.Terminal
import com.stripe.stripeterminal.external.OfflineMode
import com.stripe.stripeterminal.external.callable.ConnectionTokenCallback
import com.stripe.stripeterminal.external.callable.ConnectionTokenProvider
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants.FETCH_TOKEN_PROVIDER
import io.mockk.Called
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

@OptIn(OfflineMode::class)
class TokenProviderReloadTest {
    companion object {
        @ClassRule
        @JvmField
        val typeReplacer = ReactNativeTypeReplacementRule()
    }

    private val modules = mutableListOf<StripeTerminalReactNativeModule>()
    private val retainedProvider = slot<ConnectionTokenProvider>()
    private val terminal = mockk<Terminal>()
    private val promise = mockk<Promise>(relaxed = true)
    private val initParams = JavaOnlyMap().apply {
        putMap("localeConfig", JavaOnlyMap().apply {
            putString("type", "cardLanguagePreferenceIfAvailable")
        })
    }

    @Before
    fun setUp() {
        mockkObject(Terminal.Companion)
        mockkStatic(UiThreadUtil::class)
        every { UiThreadUtil.runOnUiThread(any<Runnable>()) } returns true
        every { Terminal.getInstance() } returns terminal
        every { terminal.connectedReader } returns null
        every { Terminal.isInitialized() } answers { retainedProvider.isCaptured }
        every { Terminal.init(any(), any(), capture(retainedProvider), any(), any(), any()) } returns Unit
        // Reinitialization rebinds the global listeners (see #279); stub them so
        // the reload path works whether or not that change is present.
        every { terminal.setTerminalListener(any()) } returns Unit
        every { terminal.setOfflineListener(any()) } returns Unit
    }

    @After
    fun tearDown() {
        modules.forEach { it.invalidate() }
        unmockkObject(Terminal.Companion)
        unmockkStatic(UiThreadUtil::class)
    }

    @Test
    fun `provider retained by Terminal completes requests through replacement modules after repeated reloads`() {
        val initialContext = mockk<ReactApplicationContext>(relaxed = true)
        var previous = newModule(initialContext)
        previous.initialize(initParams, promise)

        repeat(3) {
            previous.invalidate()
            val context = mockk<ReactApplicationContext>(relaxed = true)
            val replacement = newModule(context)
            replacement.initialize(initParams, promise)

            // This is the original object passed to Terminal.init, not one
            // obtained from the replacement module.
            val callback = mockk<ConnectionTokenCallback> {
                every { onSuccess(any()) } returns Unit
                every { onFailure(any()) } returns Unit
            }
            retainedProvider.captured.fetchConnectionToken(callback)
            previous.invalidate()
            verify { callback wasNot Called }

            replacement.setConnectionToken(JavaOnlyMap.of("token", "new_token"), promise)

            verify(exactly = 1) { context.sendEvent(FETCH_TOKEN_PROVIDER.listenerName, any()) }
            verify(exactly = 1) { callback.onSuccess("new_token") }
            verify(exactly = 0) { callback.onFailure(any()) }
            previous = replacement
        }

        verify(exactly = 1) { Terminal.init(any(), any(), any(), any(), any(), any()) }
        verify(exactly = 0) { initialContext.sendEvent(any(), any()) }
    }

    private fun newModule(context: ReactApplicationContext) =
        StripeTerminalReactNativeModule(context).also { modules.add(it) }
}
