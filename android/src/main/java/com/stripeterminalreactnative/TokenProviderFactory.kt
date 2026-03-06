package com.stripeterminalreactnative

import android.util.Log
import com.facebook.react.bridge.ReadableMap
import com.stripe.stripeterminal.appsondevices.AppsOnDevicesConnectionTokenProvider
import com.stripe.stripeterminal.external.ConnectionTokenProviderForAppsOnDevices
import com.stripe.stripeterminal.external.callable.ConnectionTokenProvider

/**
 * Factory for creating the appropriate ConnectionTokenProvider based on init params.
 */
object TokenProviderFactory {

    private const val TAG = "TokenProviderFactory"

    /**
     * Creates the appropriate ConnectionTokenProvider based on the init params.
     *
     * @param params The initialization parameters from JS
     * @param defaultTokenProvider The default JS-bridge token provider
     * @return AppsOnDevicesConnectionTokenProvider if useAppsOnDevicesConnectionTokenProvider is true,
     *         otherwise the default token provider
     */
    @OptIn(ConnectionTokenProviderForAppsOnDevices::class)
    fun createTokenProvider(
        params: ReadableMap,
        defaultTokenProvider: ConnectionTokenProvider
    ): ConnectionTokenProvider {
        val useAppsOnDevices = getBoolean(params, "useAppsOnDevicesConnectionTokenProvider")
        val connectionTokenProviderMode = if (useAppsOnDevices) {
            "AppsOnDevicesConnectionTokenProvider"
        } else {
            "StandardConnectionTokenProvider"
        }
        val logLevel = params.getString("logLevel")
        if (logLevel == "verbose") {
            Log.d(TAG, "createTokenProvider: selecting $connectionTokenProviderMode")
        }

        return if (useAppsOnDevices) {
            AppsOnDevicesConnectionTokenProvider()
        } else {
            defaultTokenProvider
        }
    }
}
