package com.stripeterminalreactnative

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.ConnectionTokenCallback
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants.FETCH_TOKEN_PROVIDER
import io.mockk.Called
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlin.test.assertTrue
import org.junit.ClassRule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

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
    private val callback = mockk<ConnectionTokenCallback> {
        every { onSuccess(any()) } returns Unit
        every { onFailure(any()) } returns Unit
    }
    private val callback2 = mockk<ConnectionTokenCallback> {
        every { onSuccess(any()) } returns Unit
        every { onFailure(any()) } returns Unit
    }

    @Test
    fun `should set connection token`() {
        val tokenProvider = TokenProvider(context)
        tokenProvider.fetchConnectionToken(callback)

        assertTrue { tokenProvider.queue.count() == 1 }

        verify(exactly = 1) {
            context.sendEvent(FETCH_TOKEN_PROVIDER.listenerName, any())
        }
        verify { callback wasNot Called }

        tokenProvider.setConnectionToken(context, TOKEN, ERROR)
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
        tokenProvider.setConnectionToken(context, null, ERROR)

        verify(exactly = 0) { callback.onSuccess(any()) }
        verify(exactly = 1) { callback.onFailure(any()) }

        tokenProvider.fetchConnectionToken(callback)

        assertTrue { tokenProvider.queue.count() == 1 }
        verify(exactly = 2) { context.sendEvent(FETCH_TOKEN_PROVIDER.listenerName, any()) }
        tokenProvider.setConnectionToken(context, null, null)

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
        tokenProvider.setConnectionToken(context, null, ERROR)

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
        tokenProvider.setConnectionToken(context, TOKEN, null)

        verify(exactly = 1) { callback.onSuccess(any()) }
        verify(exactly = 1) { callback2.onSuccess(any()) }
        verify(exactly = 0) { callback.onFailure(any()) }
        verify(exactly = 0) { callback2.onFailure(any()) }
        assertTrue { tokenProvider.queue.isEmpty() }
    }

    @Test
    fun `detaching fails pending requests and requests during reload without waiting for timeout`() {
        val tokenProvider = TokenProvider(context)
        tokenProvider.fetchConnectionToken(callback)

        tokenProvider.detach(context)
        tokenProvider.fetchConnectionToken(callback2)

        verify(exactly = 1) { callback.onFailure(any()) }
        verify(exactly = 1) { callback2.onFailure(any()) }
        verify(exactly = 0) { callback.onSuccess(any()) }
        verify(exactly = 0) { callback2.onSuccess(any()) }
        verify(exactly = 1) { context.sendEvent(FETCH_TOKEN_PROVIDER.listenerName, any()) }
        assertTrue { tokenProvider.queue.isEmpty() }
    }

    @Test
    fun `replacement context receives events and old responses cannot complete its requests`() {
        val tokenProvider = TokenProvider(context)
        tokenProvider.fetchConnectionToken(callback)
        val replacement = mockk<ReactApplicationContext>()

        tokenProvider.attach(replacement)
        tokenProvider.fetchConnectionToken(callback2)
        tokenProvider.setConnectionToken(context, "stale_token", null)
        tokenProvider.detach(context)

        verify(exactly = 1) { callback.onFailure(any()) }
        verify { callback2 wasNot Called }
        verify(exactly = 1) { replacement.sendEvent(FETCH_TOKEN_PROVIDER.listenerName, any()) }

        tokenProvider.setConnectionToken(replacement, TOKEN, null)
        verify(exactly = 1) { callback2.onSuccess(TOKEN) }
        verify(exactly = 0) { callback2.onFailure(any()) }
        assertTrue { tokenProvider.queue.isEmpty() }
    }

    @Test
    fun `attaching the same context preserves pending requests`() {
        val tokenProvider = TokenProvider(context)
        tokenProvider.fetchConnectionToken(callback)

        tokenProvider.attach(context)
        tokenProvider.setConnectionToken(context, TOKEN, null)

        verify(exactly = 1) { callback.onSuccess(TOKEN) }
        verify(exactly = 0) { callback.onFailure(any()) }
    }

    @Test
    fun `failed event delivery fails the callback and removes it from the queue`() {
        val tokenProvider = TokenProvider(context)
        every { context.sendEvent(FETCH_TOKEN_PROVIDER.listenerName) } throws IllegalStateException("Destroyed")

        tokenProvider.fetchConnectionToken(callback)
        tokenProvider.setConnectionToken(context, TOKEN, null)

        verify(exactly = 1) { callback.onFailure(any()) }
        verify(exactly = 0) { callback.onSuccess(any()) }
        assertTrue { tokenProvider.queue.isEmpty() }
    }

    @Test
    fun `a request enqueued by a completion waits for its own token response`() {
        val tokenProvider = TokenProvider(context)
        every { callback.onSuccess(TOKEN) } answers { tokenProvider.fetchConnectionToken(callback2) }
        tokenProvider.fetchConnectionToken(callback)

        tokenProvider.setConnectionToken(context, TOKEN, null)

        verify(exactly = 1) { callback.onSuccess(TOKEN) }
        verify { callback2 wasNot Called }

        tokenProvider.setConnectionToken(context, "next_token", null)
        verify(exactly = 1) { callback2.onSuccess("next_token") }
    }
}
