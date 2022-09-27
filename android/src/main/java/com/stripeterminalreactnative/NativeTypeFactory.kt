package com.stripeterminalreactnative

import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap

/**
 * Factory abstraction layer to make testing easier
 *
 * Native types like [WritableNativeMap] may have an Android OS dependency on, for example,
 * [android.os.SystemClock.uptimeMillis] which can be challenging to mock.
 */
object NativeTypeFactory {
    fun writableNativeMap(): WritableMap = WritableNativeMap()

    fun writableNativeArray(): WritableArray = WritableNativeArray()
}
