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

fun (WritableMap.() -> Unit).hasEmptyResult(): Boolean {
    return hasEmptyValue("result")
}

fun (WritableMap.() -> Unit).hasError(): Boolean {
    val map = toJavaOnlyMap()
    return !map.getMap("result")?.getMap("error")?.toHashMap().isNullOrEmpty()
}

fun (WritableMap.() -> Unit).hasValue(value: String): Boolean {
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

private fun (WritableMap.() -> Unit).hasEmptyValue(value: String): Boolean {
    val map = toJavaOnlyMap()
    return when (map.getType(value)) {
        ReadableType.Null -> false
        ReadableType.Boolean -> false
        ReadableType.Number -> false
        ReadableType.String -> map.getString(value)?.isEmpty() == true
        ReadableType.Map -> map.getMap(value)?.toHashMap()?.isEmpty() == true
        ReadableType.Array -> map.getArray(value)?.toArrayList()?.isEmpty() == true
    }
}
