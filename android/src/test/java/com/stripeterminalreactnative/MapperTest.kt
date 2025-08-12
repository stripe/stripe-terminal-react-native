package com.stripeterminalreactnative

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.stripe.stripeterminal.external.models.CardPresentRequestPartialAuthorization
import com.stripe.stripeterminal.external.models.PaymentMethodType
import com.stripe.stripeterminal.external.models.SimulatedCollectInputsResult
import com.stripe.stripeterminal.external.models.SimulatedCollectInputsSkipBehavior
import io.mockk.*
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import java.util.Base64

@RunWith(JUnit4::class)
class MapperTest {

    @Test
    fun `test mapToPaymentMethodDetailsType transform`() {
        val paymentMethodTypes = mockk<ReadableArray>()
        every { paymentMethodTypes.toArrayList() } returns arrayListOf("card", "cardPresent")

        val result = mapToPaymentMethodDetailsType(paymentMethodTypes)

        assertTrue(
            result.containsAll(
                listOf(
                    PaymentMethodType.CARD,
                    PaymentMethodType.CARD_PRESENT
                )
            )
        )
    }

    @Test
    fun `test mapToSetupIntentPaymentMethodDetailsType transform`() {
        assertEquals(
            mapFromRequestPartialAuthorization(CardPresentRequestPartialAuthorization.IF_AVAILABLE),
            "if_available"
        )
        assertEquals(
            mapFromRequestPartialAuthorization(CardPresentRequestPartialAuthorization.NEVER),
            "never"
        )
        assertEquals(mapFromRequestPartialAuthorization(null), "")
    }

    @Test
    fun `test mapToSetupIntentParameters transform`() {
        val params = mockk<ReadableMap>()
        val paymentMethodTypes = mockk<ReadableArray>()
        val metadata = mockk<ReadableMap>()

        every { params.getString("customer") } returns "fakeCustomer"
        every { params.getString("usage") } returns "fakeUsage"
        every { params.getString("description") } returns "fakeDescription"
        every { params.getString("onBehalfOf") } returns "fakeOnBehalfOf"
        every { params.getArray("paymentMethodTypes") } returns paymentMethodTypes
        every { params.getMap("metadata") } returns metadata

        every { paymentMethodTypes.toArrayList() } returns arrayListOf("card")
        every { metadata.toHashMap() } returns hashMapOf("key1" to "value1", "key2" to "value2")

        val result = mapToSetupIntentParameters(params)

        assertEquals("fakeCustomer", result.customer)
        assertEquals("fakeUsage", result.usage)
        assertEquals("fakeDescription", result.description)
        assertEquals("fakeOnBehalfOf", result.onBehalfOf)
        assertTrue(matchesMap(mapOf("key1" to "value1", "key2" to "value2"), result.metadata))
        assertTrue(
            result.paymentMethodTypes.containsAll(
                listOf(
                    PaymentMethodType.CARD
                )
            )
        )
    }

    @Test
    fun `test mapFromSimulatedCollectInputsBehavior transform`() {
        val notSkipInputBehavior = mapFromSimulatedCollectInputsBehavior("none")
        assertTrue {
            notSkipInputBehavior is SimulatedCollectInputsResult.SimulatedCollectInputsResultSucceeded &&
                notSkipInputBehavior.simulatedCollectInputsSkipBehavior == SimulatedCollectInputsSkipBehavior.NONE
        }

        val skipAllInputBehavior = mapFromSimulatedCollectInputsBehavior("all")
        assertTrue {
            skipAllInputBehavior is SimulatedCollectInputsResult.SimulatedCollectInputsResultSucceeded &&
                skipAllInputBehavior.simulatedCollectInputsSkipBehavior == SimulatedCollectInputsSkipBehavior.ALL
        }

        val timeoutBehavior = mapFromSimulatedCollectInputsBehavior("timeout")
        assertTrue {
            timeoutBehavior is SimulatedCollectInputsResult.SimulatedCollectInputsResultTimeout
        }

        val unexpectedBehavior = mapFromSimulatedCollectInputsBehavior("unexpected")
        assertTrue {
            unexpectedBehavior is SimulatedCollectInputsResult.SimulatedCollectInputsResultSucceeded &&
                unexpectedBehavior.simulatedCollectInputsSkipBehavior == SimulatedCollectInputsSkipBehavior.NONE
        }
    }

    @Test
    fun `test mapToBitmap`() {
        // Simple 1x1 PNG image
        val base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        val expectedImageBytes = Base64.getDecoder().decode(base64Image)

        // Mock BitmapFactory.decodeByteArray
        mockkStatic(BitmapFactory::class)
        val mockBitmap = mockk<Bitmap>()
        every { BitmapFactory.decodeByteArray(any(), any(), any()) } returns mockBitmap

        // Test valid data URI with PNG
        val validDataURI = "data:image/png;base64,$base64Image"
        assertEquals(mockBitmap, mapToBitmap(validDataURI))
        verify { BitmapFactory.decodeByteArray(expectedImageBytes, 0, expectedImageBytes.size) }

        // Test valid plain base64 string
        assertEquals(mockBitmap, mapToBitmap(base64Image))
        verify { BitmapFactory.decodeByteArray(expectedImageBytes, 0, expectedImageBytes.size) }

        // Test invalid data URI - missing comma
        val invalidDataURINoComma = "data:image/png;base64$base64Image"
        assertEquals(null, mapToBitmap(invalidDataURINoComma))

        // Test invalid data URI - too many components
        val invalidDataURITooMany = "data:image/png;base64,abc,def"
        assertEquals(null, mapToBitmap(invalidDataURITooMany))

        // Test invalid data URI - empty base64
        val invalidDataURIEmpty = "data:image/png;base64,"
        assertEquals(null, mapToBitmap(invalidDataURIEmpty))

        // Test invalid base64 string
        val invalidBase64 = "not-valid-base64-data"
        assertEquals(null, mapToBitmap(invalidBase64))

        // Test empty string
        val emptyString = ""
        assertEquals(null, mapToBitmap(emptyString))
    }
}

private fun <T> matchesMap(map: Map<String, T>, reference: Map<String, T>?): Boolean {
    return map.all { (k, v) -> reference?.get(k) == v } && map.size == reference?.size
}
