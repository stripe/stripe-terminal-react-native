package com.stripeterminalreactnative

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.ConnectionTokenCallback
import com.stripe.stripeterminal.external.models.ConnectionTokenException
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants.FETCH_TOKEN_PROVIDER
import io.mockk.Called
import io.mockk.mockk
import io.mockk.verify
import org.junit.ClassRule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import kotlin.test.assertFailsWith
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
    private val callback2 = mockk<ConnectionTokenCallback>(relaxed = true)

    @Test
    fun `should set connection token`() {
        val tokenProvider = TokenProvider(context)
        tokenProvider.fetchConnectionToken(callback)

        assertTrue { tokenProvider.queue.count() == 1 }

        verify(exactly = 1) {
            context.sendEvent(FETCH_TOKEN_PROVIDER.listenerName, any())
        }
        verify { callback wasNot Called }

        tokenProvider.setConnectionToken(TOKEN, ERROR)
        assertTrue { tokenProvider.queue.isEmpty() }

        verify(exactly = 1) { callback.onSuccess(TOKEN) }
        verify(exactly = 0) { callback.onFailure(any()) }
    }

    @Test
    fun `should fail on connection token retrieval error`() {
        val tokenProvider = TokenProvider(context)
        tokenProvider.fetchConnectionToken(callback)

        assertTrue { tokenProvider.queue.count() == 1 }
        verify(exactly = 1) { context.sendEvent(FETCH_TOKEN_PROVIDER.listenerName, any()) }
        verify { callback wasNot Called }
        tokenProvider.setConnectionToken(null, ERROR)

        verify(exactly = 0) { callback.onSuccess(any()) }
        verify(exactly = 1) { callback.onFailure(any()) }

        tokenProvider.fetchConnectionToken(callback)

        assertTrue { tokenProvider.queue.count() == 1 }
        verify(exactly = 2) { context.sendEvent(FETCH_TOKEN_PROVIDER.listenerName, any()) }
        tokenProvider.setConnectionToken(null, null)

        verify(exactly = 0) { callback.onSuccess(any()) }
        verify(exactly = 2) { callback.onFailure(any()) }

        tokenProvider.fetchConnectionToken(callback)

        assertTrue { tokenProvider.queue.count() == 1 }
        verify(exactly = 3) { context.sendEvent(FETCH_TOKEN_PROVIDER.listenerName, any()) }
    }

    @Test
    fun `should response to all callback and remove when first fail response come`() {
        val tokenProvider = TokenProvider(context)
        tokenProvider.fetchConnectionToken(callback)
        tokenProvider.fetchConnectionToken(callback2)

        assertTrue { tokenProvider.queue.count() == 2 }
        verify(exactly = 2) { context.sendEvent(FETCH_TOKEN_PROVIDER.listenerName, any()) }
        verify { callback wasNot Called }
        verify { callback2 wasNot Called }
        tokenProvider.setConnectionToken(null, ERROR)

        verify(exactly = 0) { callback.onSuccess(any()) }
        verify(exactly = 0) { callback2.onSuccess(any()) }
        verify(exactly = 1) { callback.onFailure(any()) }
        verify(exactly = 1) { callback2.onFailure(any()) }
        assertTrue { tokenProvider.queue.isEmpty() }
    }

    @Test
    fun `should response to all callback and remove when first token response come`() {
        val tokenProvider = TokenProvider(context)
        tokenProvider.fetchConnectionToken(callback)
        tokenProvider.fetchConnectionToken(callback2)

        assertTrue { tokenProvider.queue.count() == 2 }
        verify(exactly = 2) { context.sendEvent(FETCH_TOKEN_PROVIDER.listenerName, any()) }
        verify { callback wasNot Called }
        verify { callback2 wasNot Called }
        tokenProvider.setConnectionToken(TOKEN, null)

        verify(exactly = 1) { callback.onSuccess(any()) }
        verify(exactly = 1) { callback2.onSuccess(any()) }
        verify(exactly = 0) { callback.onFailure(any()) }
        verify(exactly = 0) { callback2.onFailure(any()) }
        assertTrue { tokenProvider.queue.isEmpty() }
    }
}
