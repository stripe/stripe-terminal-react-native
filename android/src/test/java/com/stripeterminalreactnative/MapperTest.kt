package com.stripeterminalreactnative

import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.stripe.stripeterminal.external.models.CardPresentRequestPartialAuthorization
import com.stripe.stripeterminal.external.models.PaymentMethodType
import io.mockk.every
import io.mockk.mockk
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
import kotlin.test.assertEquals
import kotlin.test.assertTrue

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
}

private fun <T> matchesMap(map: Map<String, T>, reference: Map<String, T>?): Boolean {
    return map.all { (k, v) -> reference?.get(k) == v } && map.size == reference?.size
}