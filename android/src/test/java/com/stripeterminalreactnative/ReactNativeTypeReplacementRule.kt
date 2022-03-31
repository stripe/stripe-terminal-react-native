package com.stripeterminalreactnative

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
    private val nativeMapOfSlot = slot<WritableMap.() -> Unit>()
    private val nativeArrayOfSlot = slot<WritableArray.() -> Unit>()

    override fun apply(base: Statement?, description: Description?): Statement {
        return object : Statement() {
            override fun evaluate() {
                mockkObject(ReactExtensions)
                with(ReactExtensions) {
                    every {
                        any<ReactApplicationContext>().sendEvent(any())
                    } returns Unit
                    every {
                        any<ReactApplicationContext>().sendEvent(
                            any(), capture(
                                sendEventSlot
                            )
                        )
                    } returns Unit
                }
                mockkStatic("com.stripeterminalreactnative.MappersKt")
                every { nativeMapOf(capture(nativeMapOfSlot)) } answers {
                    nativeMapOfSlot.captured.toJavaOnlyMap()
                }
                every { nativeArrayOf(capture(nativeArrayOfSlot)) } answers {
                    nativeArrayOfSlot.captured.toJavaOnlyArray()
                }
                try {
                    base?.evaluate()
                } finally {
                    unmockkAll()
                }
            }
        }
    }
}
