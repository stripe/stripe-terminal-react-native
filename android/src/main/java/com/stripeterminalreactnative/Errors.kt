package com.stripeterminalreactnative

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.stripe.stripeterminal.external.models.TerminalException

internal fun createError(exception: TerminalException): WritableMap = WritableNativeMap().apply {
    putMap("error", WritableNativeMap().apply {
        putString("message", exception.errorMessage)
        putString("code", exception.errorCode.toString())
    })
}

internal fun validateRequiredParameters(
    params: ReadableMap,
    requiredParams: List<String>
): String? {
    val invalid: MutableList<String> = mutableListOf()

    requiredParams.forEach { param ->
        if (!params.hasKey(param)) {
            invalid.add(param)
        }
    }
    return invalid.joinToString(separator = ", ").ifEmpty { null }
}
