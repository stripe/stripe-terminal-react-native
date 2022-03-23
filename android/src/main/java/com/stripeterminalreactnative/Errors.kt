package com.stripeterminalreactnative

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.stripe.stripeterminal.external.models.TerminalException
import kotlin.jvm.Throws

internal fun createError(exception: TerminalException): ReadableMap = nativeMapOf {
    putMap("error", nativeMapOf {
        putString("message", exception.errorMessage)
        putString("code", exception.errorCode.toString())
    })
}

@Throws(TerminalException::class)
internal fun <T> requireCancelable(cancelable: T?, lazyMessage: () -> String): T {
    return cancelable ?: throw TerminalException(
        TerminalException.TerminalErrorCode.CANCEL_FAILED,
        lazyMessage()
    )
}

@Throws(TerminalException::class)
internal fun <T> requireParam(input: T?, lazyMessage: () -> String): T {
    return input ?: throw TerminalException(
        TerminalException.TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
        lazyMessage()
    )
}

internal fun withExceptionResolver(promise: Promise, block: () -> Unit) {
    try {
        block()
    } catch (e: TerminalException) {
        promise.resolve(createError(e))
    }
}
