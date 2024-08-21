package com.stripeterminalreactnative

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.ConnectionTokenCallback
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants.FETCH_TOKEN_PROVIDER
import io.mockk.Called
import io.mockk.mockk
import io.mockk.verify
import org.junit.ClassRule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import kotlin.test.assertTrue

@RunWith(JUnit4::class)
class TokenProviderTest {

    companion object {
        const val TOKEN = "token"
        const val ERROR = "error"

        @ClassRule
        @JvmField
        val typeReplacer = ReactNativeTypeReplacementRule()
    }

    private val context = mockk<ReactApplicationContext>()
    private val callback = mockk<ConnectionTokenCallback>(relaxed = true)

    @Test
    fun `should set connection token`() {
        val tokenProvider = TokenProvider(context)
        tokenProvider.fetchConnectionToken(callback)

        assertTrue { tokenProvider.callbackMap.keys.count() == 1 }

        verify(exactly = 1) {
            context.sendEvent(FETCH_TOKEN_PROVIDER.listenerName, any())
        }
        verify { callback wasNot Called }

        tokenProvider.setConnectionToken(TOKEN, ERROR, tokenProvider.callbackMap.keys.first())
        assertTrue { tokenProvider.callbackMap.keys.count() == 0 }

        verify(exactly = 1) { callback.onSuccess(TOKEN) }
        verify(exactly = 0) { callback.onFailure(any()) }
    }

    @Test
    fun `should fail on connection token retrieval error`() {
        val tokenProvider = TokenProvider(context)
        tokenProvider.fetchConnectionToken(callback)

        assertTrue { tokenProvider.callbackMap.keys.count() == 1 }
        verify(exactly = 1) { context.sendEvent(FETCH_TOKEN_PROVIDER.listenerName, any()) }
        verify { callback wasNot Called }
        tokenProvider.setConnectionToken(null, ERROR, tokenProvider.callbackMap.keys.first())

        verify(exactly = 0) { callback.onSuccess(any()) }
        verify(exactly = 1) { callback.onFailure(any()) }

        tokenProvider.fetchConnectionToken(callback)

        assertTrue { tokenProvider.callbackMap.keys.count() == 1 }
        verify(exactly = 2) { context.sendEvent(FETCH_TOKEN_PROVIDER.listenerName, any()) }
        tokenProvider.setConnectionToken(null, null, tokenProvider.callbackMap.keys.first())

        verify(exactly = 0) { callback.onSuccess(any()) }
        verify(exactly = 2) { callback.onFailure(any()) }

        tokenProvider.fetchConnectionToken(callback)

        assertTrue { tokenProvider.callbackMap.keys.count() == 1 }
        verify(exactly = 3) { context.sendEvent(FETCH_TOKEN_PROVIDER.listenerName, any()) }
        tokenProvider.setConnectionToken(null, null, null)

        verify(exactly = 0) { callback.onSuccess(any()) }
        verify(exactly = 2) { callback.onFailure(any()) }
    }
}
