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

/**
 * Test rule that replaces React Native bridge types with test-friendly equivalents.
 *
 * Necessary because WritableNativeMap/Array require native libraries (soloader),
 * which aren't available in JVM unit tests. We replace them with JavaOnly* types.
 *
 * Usage:
 * ```
 * companion object {
 *     @ClassRule @JvmField
 *     val reactNativeMocks = ReactNativeTypeReplacementRule()
 * }
 * ```
 */
class ReactNativeTypeReplacementRule : TestRule {

    val sendEventSlot = slot<WritableMap.() -> Unit>()
    
    private val nativeMapOfSlot = slot<WritableMap.() -> Unit>()
    private val nativeArrayOfSlot = slot<WritableArray.() -> Unit>()
    private val listOfSlot = slot<List<String>>()

    companion object {
        @Volatile
        private var isInitialized = false
        
        init {
            initNativeTypeMocks()
        }
        
        @Synchronized
        private fun initNativeTypeMocks() {
            if (!isInitialized) {
                mockkObject(NativeTypeFactory)
                every { NativeTypeFactory.writableNativeMap() } returns JavaOnlyMap()
                every { NativeTypeFactory.writableNativeArray() } returns JavaOnlyArray()
                isInitialized = true
            }
        }
    }

    override fun apply(base: Statement?, description: Description?): Statement {
        return object : Statement() {
            override fun evaluate() {
                setupMocks()
                try {
                    base?.evaluate()
                } finally {
                    cleanupMocks()
                }
            }
        }
    }
    
    private fun setupMocks() {
        mockkObject(ReactExtensions)
        with(ReactExtensions) {
            every { any<ReactApplicationContext>().sendEvent(any()) } returns Unit
            every { any<ReactApplicationContext>().sendEvent(any(), capture(sendEventSlot)) } returns Unit
        }

        mockkStatic("com.stripeterminalreactnative.MappersKt")
        every { nativeMapOf(capture(nativeMapOfSlot)) } answers {
            nativeMapOfSlot.captured.toJavaOnlyMap()
        }
        every { convertListToReadableArray(capture(listOfSlot)) } answers {
            JavaOnlyArray().apply { listOfSlot.captured.forEach { pushString(it) } }
        }
        every { nativeArrayOf(capture(nativeArrayOfSlot)) } answers {
            nativeArrayOfSlot.captured.toJavaOnlyArray()
        }
    }
    
    private fun cleanupMocks() {
        unmockkAll()
        isInitialized = false
        initNativeTypeMocks()
    }
}
