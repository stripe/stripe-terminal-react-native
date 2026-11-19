package com.stripeterminalreactnative

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.ConnectionTokenCallback
import com.stripe.stripeterminal.external.callable.ConnectionTokenProvider
import com.stripe.stripeterminal.external.models.ConnectionTokenException
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants.FETCH_TOKEN_PROVIDER
import java.util.Queue
import java.util.concurrent.ConcurrentLinkedQueue

class TokenProvider(context: ReactApplicationContext? = null) : ConnectionTokenProvider {
    companion object {
        // Terminal.init retains this provider for the lifetime of the process.
        val shared = TokenProvider()

        private const val RUNTIME_UNAVAILABLE = "React Native runtime is unavailable for connection tokens"
    }

    private val lock = Any()
    private var context: ReactApplicationContext? = context
    val queue: Queue<ConnectionTokenCallback> = ConcurrentLinkedQueue()

    fun attach(context: ReactApplicationContext) {
        val callbacks = synchronized(lock) {
            if (this.context === context) return
            this.context = context
            takePendingCallbacks()
        }
        completeCallbacks(callbacks, null, RUNTIME_UNAVAILABLE)
    }

    fun detach(context: ReactApplicationContext) {
        val callbacks = synchronized(lock) {
            // An old module may be invalidated after its replacement attaches.
            if (this.context !== context) return
            this.context = null
            takePendingCallbacks()
        }
        completeCallbacks(callbacks, null, RUNTIME_UNAVAILABLE)
    }

    fun setConnectionToken(context: ReactApplicationContext, token: String?, error: String?) {
        val callbacks = synchronized(lock) {
            // Ignore a response from a runtime that has already been replaced.
            if (this.context !== context) return
            takePendingCallbacks()
        }
        completeCallbacks(callbacks, token, error)
    }

    // Call only while holding lock; invoke SDK callbacks after releasing it.
    private fun takePendingCallbacks(): List<ConnectionTokenCallback> = buildList {
        while (true) add(queue.poll() ?: break)
    }

    private fun completeCallbacks(
        callbacks: List<ConnectionTokenCallback>,
        token: String?,
        error: String?,
    ) {
        for (connectionTokenCallback in callbacks) {
            try {
                if (!token.isNullOrEmpty()) {
                    connectionTokenCallback.onSuccess(token)
                } else {
                    connectionTokenCallback.onFailure(
                        ConnectionTokenException(
                            error ?: "Token is invalid",
                            null
                        )
                    )
                }
            } catch (e: Throwable) {
                connectionTokenCallback.onFailure(
                    ConnectionTokenException(
                        "Failed to fetch connection token",
                        e
                    )
                )
            }
        }
    }

    override fun fetchConnectionToken(callback: ConnectionTokenCallback) {
        val currentContext = synchronized(lock) {
            context?.also { queue.offer(callback) }
        }
        if (currentContext == null) {
            callback.onFailure(ConnectionTokenException(RUNTIME_UNAVAILABLE, null))
            return
        }

        try {
            currentContext.sendEvent(FETCH_TOKEN_PROVIDER.listenerName)
        } catch (e: Exception) {
            // Teardown can race event delivery. Do not leave the SDK waiting for
            // a response to an event that could not be sent.
            val pending = synchronized(lock) { queue.remove(callback) }
            if (pending) callback.onFailure(ConnectionTokenException(RUNTIME_UNAVAILABLE, e))
        }
    }
}
