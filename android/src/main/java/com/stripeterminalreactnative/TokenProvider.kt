package com.stripeterminalreactnative

import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.external.callable.ConnectionTokenCallback
import com.stripe.stripeterminal.external.callable.ConnectionTokenProvider
import com.stripe.stripeterminal.external.models.ConnectionTokenException
import com.stripeterminalreactnative.ReactExtensions.sendEvent
import com.stripeterminalreactnative.ReactNativeConstants.FETCH_TOKEN_PROVIDER
import java.util.Hashtable
import java.util.UUID

class TokenProvider(private val context: ReactApplicationContext) : ConnectionTokenProvider {
    var callbackMap: Hashtable<String, ConnectionTokenCallback> = Hashtable()

    fun setConnectionToken(token: String?, error: String?, callbackId: String?) {
        if (callbackId.isNullOrEmpty() || callbackMap[callbackId] == null) {
            throw ConnectionTokenException(
                "setConnectionToken requires the callbackId to be set to the callbackId value provided to the tokenProviderHandler."
            )
        }

        val connectionTokenCallback = callbackMap[callbackId]
        if (connectionTokenCallback != null) {
            try {
                if (!token.isNullOrEmpty()) {
                    connectionTokenCallback.onSuccess(token)
                } else {
                    connectionTokenCallback.onFailure(ConnectionTokenException(error ?: "", null))
                }
            } catch (e: Throwable) {
                connectionTokenCallback.onFailure(ConnectionTokenException("Failed to fetch connection token", e))
            } finally {
                callbackMap.remove(callbackId)
            }
        }
    }

    override fun fetchConnectionToken(callback: ConnectionTokenCallback) {
        val uuid = UUID.randomUUID().toString()
        callbackMap[uuid] = callback
        context.sendEvent(FETCH_TOKEN_PROVIDER.listenerName) {
            putString("callbackId", uuid)
        }
    }
}
