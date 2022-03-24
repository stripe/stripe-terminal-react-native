package com.stripeterminalreactnative

import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap

fun (WritableMap.() -> Unit).toJavaOnlyMap(): JavaOnlyMap {
    return JavaOnlyMap().apply { invoke(this) }
}

fun (WritableArray.() -> Unit).toJavaOnlyArray(): JavaOnlyArray {
    return JavaOnlyArray().apply { invoke(this) }
}

fun (WritableMap.() -> Unit).hasResult(): Boolean {
    return hasValue("result")
}

fun (WritableMap.() -> Unit).hasError(): Boolean {
    return hasValue("error")
}

private fun (WritableMap.() -> Unit).hasValue(value: String): Boolean {
    val map = toJavaOnlyMap()
    return when (map.getType(value)) {
        ReadableType.Null -> false
        ReadableType.Boolean -> true
        ReadableType.Number -> true
        ReadableType.String -> true
        ReadableType.Map -> !map.getMap(value)?.toHashMap().isNullOrEmpty()
        ReadableType.Array -> !map.getArray(value)?.toArrayList().isNullOrEmpty()
    }
}
