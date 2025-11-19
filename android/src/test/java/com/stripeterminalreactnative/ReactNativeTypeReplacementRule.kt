package com.stripeterminalreactnative

import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import io.mockk.every
import io.mockk.mockkObject
import io.mockk.mockkStatic
import io.mockk.slot
import io.mockk.unmockkAll
import org.junit.rules.TestRule
import org.junit.runner.Description
import org.junit.runners.model.Statement

class ReactNativeTypeReplacementRule : TestRule {

    val sendEventSlot = slot<WritableMap.() -> Unit>()

    override fun apply(base: Statement?, description: Description?): Statement {
        return object : Statement() {
            override fun evaluate() {
                mockkObject(ReactExtensions)
                with(ReactExtensions) {
                    every { any<ReactApplicationContext>().sendEvent(any()) } returns Unit
                    every {
                        any<ReactApplicationContext>().sendEvent(
                            any(), capture(sendEventSlot)
                        )
                    } returns Unit
                }
                mockkStatic("com.stripeterminalreactnative.MappersKt")
                every { nativeMapOf(any()) } answers {
                    JavaOnlyMap().apply { firstArg<WritableMap.() -> Unit>().invoke(this) }
                }
                every { nativeMapOf() } answers { JavaOnlyMap() }
                every { nativeArrayOf(any()) } answers {
                    JavaOnlyArray().apply { firstArg<WritableArray.() -> Unit>().invoke(this) }
                }
                every { nativeArrayOf() } answers { JavaOnlyArray() }
                try {
                    base?.evaluate()
                } finally {
                    unmockkAll()
                }
            }
        }
    }
}
