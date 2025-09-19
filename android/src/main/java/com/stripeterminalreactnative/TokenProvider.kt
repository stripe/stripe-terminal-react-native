package com.stripeterminalreactnative

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.ConnectionTokenCallback
import com.stripe.stripeterminal.external.callable.ConnectionTokenProvider
import com.stripe.stripeterminal.external.models.ConnectionTokenException
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants.FETCH_TOKEN_PROVIDER
import java.util.Queue
import java.util.concurrent.ConcurrentLinkedQueue

class TokenProvider(private val context: ReactApplicationContext) : ConnectionTokenProvider {
    val queue: Queue<ConnectionTokenCallback> = ConcurrentLinkedQueue()

    fun setConnectionToken(token: String?, error: String?) {
        while (queue.isNotEmpty()) {
            val connectionTokenCallback = queue.poll() ?: break
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
        queue.offer(callback)
        context.sendEvent(FETCH_TOKEN_PROVIDER.listenerName)
    }
}
