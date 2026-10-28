package com.stripeterminalreactnative

import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactApplicationContext
import com.stripe.stripeterminal.Terminal
import com.stripe.stripeterminal.external.callable.Cancelable
import com.stripe.stripeterminal.external.models.CollectInputsParameters
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.slot
import io.mockk.unmockkObject
import org.junit.After
import org.junit.Before
import org.junit.ClassRule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import kotlin.test.assertEquals

@RunWith(JUnit4::class)
class CollectInputsTest {

    companion object {
        @ClassRule
        @JvmField
        val typeReplacer = ReactNativeTypeReplacementRule()
    }

    private val context = mockk<ReactApplicationContext>(relaxed = true)
    private val terminal = mockk<Terminal>(relaxed = true)
    private lateinit var module: StripeTerminalReactNativeModule

    @Before
    fun setUp() {
        mockkObject(Terminal.Companion)
        every { Terminal.getInstance() } returns terminal
        module = StripeTerminalReactNativeModule(context)
    }

    @After
    fun tearDown() {
        unmockkObject(Terminal.Companion)
    }

    @Test
    fun `collectInputs defaults omitted required values to false`() {
        assertRequiredValues(requiredValue = null, includeRequired = false, expected = false)
    }

    @Test
    fun `collectInputs defaults null required values to false`() {
        assertRequiredValues(requiredValue = null, includeRequired = true, expected = false)
    }

    @Test
    fun `collectInputs preserves required values`() {
        assertRequiredValues(requiredValue = true, includeRequired = true, expected = true)
    }

    private fun assertRequiredValues(
        requiredValue: Boolean?,
        includeRequired: Boolean,
        expected: Boolean,
    ) {
        val inputs = JavaOnlyArray().apply {
            listOf("text", "numeric", "email", "phone", "signature", "selection").forEach { formType ->
                pushMap(JavaOnlyMap().apply {
                    putString("formType", formType)
                    putString("title", "Title")
                    if (includeRequired) {
                        if (requiredValue == null) putNull("required") else putBoolean("required", requiredValue)
                    }
                })
            }
        }
        val params = JavaOnlyMap().apply { putArray("inputs", inputs) }
        val capturedParams = slot<CollectInputsParameters>()
        every { terminal.collectInputs(capture(capturedParams), any()) } returns mockk<Cancelable>()

        module.collectInputs(params, mockk(relaxed = true))

        assertEquals(List(6) { expected }, capturedParams.captured.inputs.map { it.required })
    }
}
