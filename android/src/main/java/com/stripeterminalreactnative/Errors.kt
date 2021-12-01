package com.stripeterminalreactnative

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap

enum class CommonErrorType {
  Failed, Canceled, Unknown
}

internal fun createError(code: String, message: String?): WritableMap {
  val errorMap: WritableMap = WritableNativeMap()
  val errorDetails: WritableMap = WritableNativeMap()
  errorDetails.putString("code", code)
  errorDetails.putString("message", message)

  errorMap.putMap("error", errorDetails)

  return errorMap
}

internal fun validateRequiredParameters(params: ReadableMap, requiredParams: List<String>): String? {
  val invalid: MutableList<String> = mutableListOf()

  requiredParams.forEach { param ->
    if (!params.hasKey(param)) {
      invalid.add(param)
    }
  }
  val joined = invalid.joinToString(separator = ", ")
  return if (joined.isEmpty()) null else joined
}
