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

    /**
     * Returns an empty WritableMap, which will be sent to JS as an empty object `{}`.
     * This is the standard way to return an empty object from native to JavaScript.
     */
    fun writableNativeMap(): WritableMap = WritableNativeMap()

    /**
     * Returns an empty WritableArray, which will be sent to JS as an empty array `[]`.
     * This is the standard way to return an empty array from native to JavaScript.
     */
    fun writableNativeArray(): WritableArray = WritableNativeArray()
}
