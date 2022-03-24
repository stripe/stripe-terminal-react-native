package com.stripeterminalreactnative

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableNativeMap
import com.stripe.stripeterminal.external.models.TerminalException
import com.stripe.stripeterminal.external.models.TerminalException.TerminalErrorCode
import kotlinx.coroutines.CancellationException
import kotlin.jvm.Throws

internal fun createError(throwable: Throwable): ReadableMap = nativeMapOf {
    putMap("error", nativeMapOf {
        writeError(throwable)
    })
}

private fun WritableNativeMap.writeError(throwable: Throwable?) {
    when (throwable) {
        is TerminalException -> {
            putString("message", throwable.errorMessage)
            putString("code", throwable.errorCode.toString())
        }
        is CancellationException -> {
            writeError(throwable.cause)
        }
        else -> {
            putString("message", throwable?.message ?: "Unknown error")
            putString("code", TerminalErrorCode.UNEXPECTED_SDK_ERROR.toString())
        }
    }
}

@Throws(TerminalException::class)
internal fun <T> requireCancelable(cancelable: T?, lazyMessage: () -> String): T {
    return cancelable ?: throw TerminalException(
        TerminalErrorCode.CANCEL_FAILED,
        lazyMessage()
    )
}

@Throws(TerminalException::class)
internal fun <T> requireParam(input: T?, lazyMessage: () -> String): T {
    return input ?: throw TerminalException(
        TerminalErrorCode.INVALID_REQUIRED_PARAMETER,
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
