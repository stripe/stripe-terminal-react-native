package com.stripeterminalreactnative

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.modules.core.DeviceEventManagerModule

internal object ReactExtensions {

    fun ReactApplicationContext.sendEvent(
        eventName: String,
        resultBuilder: WritableNativeMap.() -> Unit
    ) {
        getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, nativeMapOf {
                resultBuilder()
            })
    }
}
