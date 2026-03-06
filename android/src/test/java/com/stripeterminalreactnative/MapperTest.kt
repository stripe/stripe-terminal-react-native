package com.stripeterminalreactnative

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.stripe.stripeterminal.external.models.AllowRedisplay
import com.stripe.stripeterminal.external.models.CardPresentRequestPartialAuthorization
import com.stripe.stripeterminal.external.models.CollectSetupIntentConfiguration
import com.stripe.stripeterminal.external.models.ConnectionConfiguration
import com.stripe.stripeterminal.external.models.CustomerCancellation
import com.stripe.stripeterminal.external.models.DiscoveryConfiguration
import com.stripe.stripeterminal.external.models.DiscoveryFilter
import com.stripe.stripeterminal.external.models.EasyConnectConfiguration
import com.stripe.stripeterminal.external.models.PaymentMethodType
import com.stripe.stripeterminal.external.models.SimulatedCollectInputsResult
import com.stripe.stripeterminal.external.models.SimulatedCollectInputsSkipBehavior
import com.stripe.stripeterminal.external.models.TapToPayUxConfiguration
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkStatic
import io.mockk.verify
import java.util.Base64
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import org.junit.ClassRule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4

@RunWith(JUnit4::class)
class MapperTest {
    companion object {

        @ClassRule
        @JvmField
        val typeReplacer = ReactNativeTypeReplacementRule()
    }

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
    fun `test mapFromSetupAttempt transform`() {
        val setupAttempt = mockSetupAttempt()
        val result = mapFromSetupAttempt(setupAttempt)
        val expected = expectedSetupAttempt()
        assertEquals(result, expected)
    }

    @Test
    fun `test mapFromPaymentIntent transform`() {
        val paymentIntent = mockPaymentIntent()
        val result = mapFromPaymentIntent(paymentIntent, "aa")
        val expected = expectedPaymentIntent()
        assertEquals(result, expected)
    }

    @Test
    fun `test mapFromPaymentMethod transform`() {
        val paymentMethod = mockPaymentMethod()
        val result = mapFromPaymentMethod(paymentMethod)
        val expected = expectedPaymentMethod()
        assertEquals(result, expected)
    }

    @Test
    fun `test mapFromSetupIntent transform`() {
        val setupIntent = mockSetupIntent()
        val result = mapFromSetupIntent(setupIntent, "aa")
        val expected = expectedSetupIntent()
        assertEquals(result, expected)
    }

    @Test
    fun `test mapFromCharge transform`() {
        val charge = mockCharge()
        val result = mapFromCharge(charge)
        val expected = expectedCharge()
        assertEquals(result, expected)
    }

    @Test
    fun `test mapFromRefund transform`() {
        val refund = mockRefund()
        val result = mapFromRefund(refund)
        val expected = expectedRefund()
        assertEquals(result, expected)
    }

    @Test
    fun `test mapFromCardDetails transform`() {
        val cardDetails = mockCardDetails()
        val result = mapFromCardDetails(cardDetails)
        val expected = expectedCardDetails()
        assertEquals(result, expected)
    }

    @Test
    fun `test mapFromGeneratedFrom transform`() {
        val generatedFrom = mockGeneratedFrom()
        val result = mapFromGeneratedFrom(generatedFrom)
        val expected = expectedGeneratedFrom()
        assertEquals(result, expected)
    }

    @Test
    fun `test mapFromNextAction transform`() {
        val nextAction = mockNextAction()
        val result = mapFromNextAction(nextAction)
        val expected = expectedNextAction()
        assertEquals(result, expected)
    }

    @Test
    fun `test mapFromRedirectToUrl transform`() {
        val redirectUrl = mockRedirectUrl()
        val result = mapFromRedirectToUrl(redirectUrl)
        val expected = expectedRedirectUrl()
        assertEquals(result, expected)
    }

    @Test
    fun `test mapFromUseStripeSdk transform`() {
        val stripeSdk = mockUseStripeSdk()
        val result = mapFromUseStripeSdk(stripeSdk)
        val expected = expectedUseStripeSdk()
        assertEquals(result, expected)
    }

    @Test
    fun `test mapFromWechatPayDisplayQrCode transform`() {
        val wechatPayDisplayQrCode = mockWechatPayDisplayQrCode()
        val result = mapFromWechatPayDisplayQrCode(wechatPayDisplayQrCode)
        val expected = expectedWechatPayDisplayQrCode()
        assertEquals(result, expected)
    }

    @Test
    fun `test mapToTapZone transform`() {
        assertEquals(
            mapToTapZone("abc", 1f, 2f, 3f),
            TapToPayUxConfiguration.TapZone.Default
        )
        assertEquals(
            mapToTapZone("default", 1f, 2f, 3f),
            TapToPayUxConfiguration.TapZone.Default
        )
        assertEquals(
            mapToTapZone("above", 1f, 2f, 3f),
            TapToPayUxConfiguration.TapZone.Above(1f)
        )
        assertEquals(
            mapToTapZone("below", 1f, 2f, 3f),
            TapToPayUxConfiguration.TapZone.Below(1f)
        )
        assertEquals(
            mapToTapZone("front", 1f, 0.5f, 0.6f),
            TapToPayUxConfiguration.TapZone.Front(0.5f, 0.6f)
        )
        assertEquals(
            mapToTapZone("behind", 1f, 0.5f, 0.6f),
            TapToPayUxConfiguration.TapZone.Behind(0.5f, 0.6f)
        )
        assertEquals(
            mapToTapZone("left", 1f, 2f, 3f),
            TapToPayUxConfiguration.TapZone.Left(1f)
        )
        assertEquals(
            mapToTapZone("right", 1f, 2f, 3f),
            TapToPayUxConfiguration.TapZone.Right(1f)
        )
    }

    @Test
    fun `test mapToCustomerCancellation transform`() {
        assertEquals(
            mapToCustomerCancellation("enableIfAvailable"),
            CustomerCancellation.ENABLE_IF_AVAILABLE
        )
        assertEquals(
            mapToCustomerCancellation("disableIfAvailable"),
            CustomerCancellation.DISABLE_IF_AVAILABLE
        )
    }

    @Test
    fun `test mapToDiscoveryFilter transform`() {
        assertEquals(
            mapToDiscoveryFilter(null),
            null
        )
        val serialMap = JavaOnlyMap().apply {
            putString("serialNumber", "1234")
        }
        val readerMap = JavaOnlyMap().apply {
            putString("readerId", "tmr_5678")
        }
        assertEquals(
            mapToDiscoveryFilter(serialMap),
            DiscoveryFilter.BySerial("1234")
        )
        assertEquals(
            mapToDiscoveryFilter(readerMap),
            DiscoveryFilter.ByReaderId("tmr_5678")
        )
    }

    @Test
    fun `test mapToMotoConfiguration transform`() {
        assertEquals(
            mapToMotoConfiguration(null),
            null
        )
        assertEquals(
            mapToMotoConfiguration(JavaOnlyMap())?.skipCvc,
            false
        )
        assertEquals(
            mapToMotoConfiguration(JavaOnlyMap().apply {
                putBoolean("skipCvc", true)
            })?.skipCvc,
            true
        )
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
        val base64Image =
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
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

    @Test
    fun `test buildConfirmPaymentIntentConfiguration with surcharge and returnUrl`() {
        // GIVEN params with surcharge configuration and returnUrl
        val params = JavaOnlyMap().apply {
            putMap("surcharge", JavaOnlyMap().apply {
                putInt("amount", 100)
                putMap("consent", JavaOnlyMap().apply {
                    putString("collection", "enabled")
                    putString("notice", "Test surcharge notice")
                })
            })
            putString("returnUrl", "https://example.com/return")
        }

        // WHEN building the configuration
        val config = buildConfirmPaymentIntentConfiguration(params)

        // THEN configuration should be built successfully with returnUrl
        assertTrue(config != null)
        assertEquals("https://example.com/return", config.returnUrl)
    }

    @Test
    fun `test buildConfirmPaymentIntentConfiguration with only returnUrl`() {
        // GIVEN params with only returnUrl
        val params = JavaOnlyMap().apply {
            putString("returnUrl", "https://example.com/return")
        }

        // WHEN building the configuration
        val config = buildConfirmPaymentIntentConfiguration(params)

        // THEN configuration should be built successfully with returnUrl
        assertTrue(config != null)
        assertEquals("https://example.com/return", config.returnUrl)
    }

    @Test
    fun `test buildConfirmPaymentIntentConfiguration with empty params`() {
        // GIVEN empty params
        val params = JavaOnlyMap()

        // WHEN building the configuration
        val config = buildConfirmPaymentIntentConfiguration(params)

        // THEN configuration should be built successfully with defaults
        assertTrue(config != null)
        assertEquals(null, config.returnUrl)
    }

    @Test
    fun `test buildCollectPaymentIntentConfiguration with all parameters`() {
        // GIVEN params with all configuration parameters
        val params = JavaOnlyMap().apply {
            putBoolean("skipTipping", true)
            putInt("tipEligibleAmount", 1000)
            putBoolean("updatePaymentIntent", true)
            putString("customerCancellation", "enableIfAvailable")
            putBoolean("requestDynamicCurrencyConversion", true)
            putString("surchargeNotice", "Test surcharge notice")
            putString("allowRedisplay", "always")
            putMap("motoConfiguration", JavaOnlyMap().apply {
                putBoolean("skipCvc", true)
            })
        }

        // WHEN building the configuration
        val config = buildCollectPaymentIntentConfiguration(params)

        // THEN configuration should be built successfully with all parameters
        assertTrue(config != null)
        assertEquals(true, config.skipTipping)
        assertEquals(true, config.updatePaymentIntent)
        assertEquals(true, config.requestDynamicCurrencyConversion)
        assertEquals(CustomerCancellation.ENABLE_IF_AVAILABLE, config.customerCancellation)
        assertEquals("Test surcharge notice", config.surchargeNotice)
        assertEquals(1000L, config.tippingConfiguration?.eligibleAmount)
        assertEquals(true, config.motoConfiguration?.skipCvc)
        assertEquals(AllowRedisplay.ALWAYS, config.allowRedisplay)
    }

    @Test
    fun `test buildCollectPaymentIntentConfiguration with skipTipping`() {
        // GIVEN params with skipTipping only
        val params = JavaOnlyMap().apply {
            putBoolean("skipTipping", true)
        }

        // WHEN building the configuration
        val config = buildCollectPaymentIntentConfiguration(params)

        // THEN configuration should be built successfully with skipTipping enabled
        assertTrue(config != null)
        assertEquals(true, config.skipTipping)
    }

    @Test
    fun `test buildCollectPaymentIntentConfiguration with tipEligibleAmount`() {
        // GIVEN params with tipEligibleAmount only
        val params = JavaOnlyMap().apply {
            putInt("tipEligibleAmount", 1000)
        }

        // WHEN building the configuration
        val config = buildCollectPaymentIntentConfiguration(params)

        // THEN configuration should be built successfully with tipping configuration
        assertTrue(config != null)
        assertEquals(1000L, config.tippingConfiguration?.eligibleAmount)
    }

    @Test
    fun `test buildCollectPaymentIntentConfiguration with customerCancellation`() {
        // GIVEN params with customerCancellation only
        val params = JavaOnlyMap().apply {
            putString("customerCancellation", "enableIfAvailable")
        }

        // WHEN building the configuration
        val config = buildCollectPaymentIntentConfiguration(params)

        // THEN configuration should be built successfully with customerCancellation
        assertTrue(config != null)
        assertEquals(CustomerCancellation.ENABLE_IF_AVAILABLE, config.customerCancellation)
    }

    @Test
    fun `test buildCollectPaymentIntentConfiguration with allowRedisplay limited`() {
        // GIVEN params with allowRedisplay set to limited
        val params = JavaOnlyMap().apply {
            putString("allowRedisplay", "limited")
        }

        // WHEN building the configuration
        val config = buildCollectPaymentIntentConfiguration(params)

        // THEN configuration should be built successfully with allowRedisplay
        assertTrue(config != null)
        assertEquals(AllowRedisplay.LIMITED, config.allowRedisplay)
    }

    @Test
    fun `test buildCollectPaymentIntentConfiguration with empty params`() {
        // GIVEN empty params
        val params = JavaOnlyMap()

        // WHEN building the configuration
        val config = buildCollectPaymentIntentConfiguration(params)

        // THEN configuration should be built successfully with defaults
        assertTrue(config != null)
        assertEquals(false, config.skipTipping)
        assertEquals(false, config.updatePaymentIntent)
        assertEquals(false, config.requestDynamicCurrencyConversion)
        assertEquals(null, config.tippingConfiguration)
        assertEquals(null, config.motoConfiguration)
    }

    @Test
    fun `test buildCollectSetupIntentConfiguration with all parameters`() {
        // GIVEN params with all configuration parameters
        val params = JavaOnlyMap().apply {
            putString("customerCancellation", "enableIfAvailable")
            putMap("motoConfiguration", JavaOnlyMap().apply {
                putBoolean("skipCvc", true)
            })
            putString("collectionReason", "saveCard")
        }

        // WHEN building the configuration
        val config = buildCollectSetupIntentConfiguration(params)

        // THEN configuration should be built successfully with all parameters
        assertTrue(config != null)
        assertEquals(CustomerCancellation.ENABLE_IF_AVAILABLE, config.customerCancellation)
        assertEquals(true, config.motoConfiguration?.skipCvc)
        assertEquals(CollectSetupIntentConfiguration.CollectionReason.SAVE_CARD, config.collectionReason)
    }

    @Test
    fun `test buildCollectSetupIntentConfiguration with customerCancellation`() {
        // GIVEN params with customerCancellation only
        val params = JavaOnlyMap().apply {
            putString("customerCancellation", "disableIfAvailable")
        }

        // WHEN building the configuration
        val config = buildCollectSetupIntentConfiguration(params)

        // THEN configuration should be built successfully with customerCancellation
        assertTrue(config != null)
        assertEquals(CustomerCancellation.DISABLE_IF_AVAILABLE, config.customerCancellation)
    }

    @Test
    fun `test buildCollectSetupIntentConfiguration with motoConfiguration`() {
        // GIVEN params with motoConfiguration only
        val params = JavaOnlyMap().apply {
            putMap("motoConfiguration", JavaOnlyMap().apply {
                putBoolean("skipCvc", false)
            })
        }

        // WHEN building the configuration
        val config = buildCollectSetupIntentConfiguration(params)

        // THEN configuration should be built successfully with motoConfiguration
        assertTrue(config != null)
        assertEquals(false, config.motoConfiguration?.skipCvc)
    }

    @Test
    fun `test buildCollectSetupIntentConfiguration with collectionReason`() {
        // GIVEN params with collectionReason only
        val params = JavaOnlyMap().apply {
            putString("collectionReason", "verify")
        }

        // WHEN building the configuration
        val config = buildCollectSetupIntentConfiguration(params)

        // THEN configuration should be built successfully with collectionReason
        assertTrue(config != null)
        assertEquals(CollectSetupIntentConfiguration.CollectionReason.VERIFY, config.collectionReason)
    }

    @Test
    fun `test buildCollectSetupIntentConfiguration with empty params`() {
        // GIVEN empty params
        val params = JavaOnlyMap()

        // WHEN building the configuration
        val config = buildCollectSetupIntentConfiguration(params)

        // THEN configuration should be built successfully with defaults
        assertTrue(config != null)
        assertEquals(null, config.motoConfiguration)
        // Note: collectionReason may have a default value set by the SDK
    }

    @Test
    fun `test mapToSetupIntentCollectionReason`() {
        assertEquals(
            CollectSetupIntentConfiguration.CollectionReason.SAVE_CARD,
            mapToSetupIntentCollectionReason("saveCard")
        )
        assertEquals(
            CollectSetupIntentConfiguration.CollectionReason.VERIFY,
            mapToSetupIntentCollectionReason("verify")
        )
        assertEquals(null, mapToSetupIntentCollectionReason("invalid"))
        assertEquals(null, mapToSetupIntentCollectionReason(null))
    }

    @Test
    fun `test getUuidFromPaymentIntentParams with valid params`() {
        // GIVEN params with valid paymentIntent and sdkUuid
        val params = JavaOnlyMap().apply {
            putMap("paymentIntent", JavaOnlyMap().apply {
                putString("sdkUuid", "test-uuid-123")
            })
        }

        // WHEN extracting the UUID
        val uuid = getUuidFromPaymentIntentParams(params)

        // THEN should return the correct UUID
        assertEquals("test-uuid-123", uuid)
    }

    @Test
    fun `test getUuidFromPaymentIntentParams throws when paymentIntent missing`() {
        // GIVEN params without paymentIntent
        val params = JavaOnlyMap()

        // WHEN extracting the UUID
        // THEN should throw exception with appropriate message
        try {
            getUuidFromPaymentIntentParams(params)
            throw AssertionError("Expected TerminalException to be thrown")
        } catch (e: Exception) {
            assertTrue(e.message?.contains("You must provide a paymentIntent") == true)
        }
    }

    @Test
    fun `test getUuidFromPaymentIntentParams throws when sdkUuid missing`() {
        // GIVEN params with paymentIntent but without sdkUuid
        val params = JavaOnlyMap().apply {
            putMap("paymentIntent", JavaOnlyMap())
        }

        // WHEN extracting the UUID
        // THEN should throw exception with appropriate message
        try {
            getUuidFromPaymentIntentParams(params)
            throw AssertionError("Expected TerminalException to be thrown")
        } catch (e: Exception) {
            assertTrue(e.message?.contains("sdkUuid") == true)
        }
    }

    @Test
    fun `test getUuidFromSetupIntentParams with valid params`() {
        // GIVEN params with valid setupIntent and sdkUuid
        val params = JavaOnlyMap().apply {
            putMap("setupIntent", JavaOnlyMap().apply {
                putString("sdkUuid", "test-uuid-456")
            })
        }

        // WHEN extracting the UUID
        val uuid = getUuidFromSetupIntentParams(params)

        // THEN should return the correct UUID
        assertEquals("test-uuid-456", uuid)
    }

    @Test
    fun `test getUuidFromSetupIntentParams throws when setupIntent missing`() {
        // GIVEN params without setupIntent
        val params = JavaOnlyMap()

        // WHEN extracting the UUID
        // THEN should throw exception with appropriate message
        try {
            getUuidFromSetupIntentParams(params)
            throw AssertionError("Expected TerminalException to be thrown")
        } catch (e: Exception) {
            assertTrue(e.message?.contains("You must provide a setupIntent") == true)
        }
    }

    @Test
    fun `test getUuidFromSetupIntentParams throws when sdkUuid missing`() {
        // GIVEN params with setupIntent but without sdkUuid
        val params = JavaOnlyMap().apply {
            putMap("setupIntent", JavaOnlyMap())
        }

        // WHEN extracting the UUID
        // THEN should throw exception with appropriate message
        try {
            getUuidFromSetupIntentParams(params)
            throw AssertionError("Expected TerminalException to be thrown")
        } catch (e: Exception) {
            assertTrue(e.message?.contains("sdkUuid") == true)
        }
    }

    @Test
    fun `test getDiscoveryConfiguration for BLUETOOTH_SCAN`() {
        val params = JavaOnlyMap.of(
            "timeout", 30,
            "simulated", true
        )

        val config = getDiscoveryConfiguration(
            discoveryMethod = DiscoveryMethod.BLUETOOTH_SCAN,
            params = params
        )

        assertTrue(config is DiscoveryConfiguration.BluetoothDiscoveryConfiguration)
        assertEquals(30, config.timeout)
        assertEquals(true, config.isSimulated)
    }

    @Test
    fun `test getDiscoveryConfiguration for INTERNET with all parameters`() {
        val params = JavaOnlyMap.of(
            "locationId", "tml_456",
            "timeout", 60,
            "simulated", false,
            "discoveryFilter", JavaOnlyMap.of("readerId", "tmr_123")
        )

        val config = getDiscoveryConfiguration(
            discoveryMethod = DiscoveryMethod.INTERNET,
            params = params
        )

        assertTrue(config is DiscoveryConfiguration.InternetDiscoveryConfiguration)
        assertEquals(60, config.timeout)
        assertEquals(false, config.isSimulated)
        assertEquals("tml_456", config.location)
        assertTrue(config.discoveryFilter is DiscoveryFilter.ByReaderId)
        assertEquals("tmr_123", (config.discoveryFilter as DiscoveryFilter.ByReaderId).id)
    }

    @Test
    fun `test getDiscoveryConfiguration for INTERNET with serialNumber filter`() {
        val params = JavaOnlyMap.of(
            "locationId", "tml_789",
            "timeout", 45,
            "simulated", true,
            "discoveryFilter", JavaOnlyMap.of("serialNumber", "SN12345")
        )

        val config = getDiscoveryConfiguration(
            discoveryMethod = DiscoveryMethod.INTERNET,
            params = params
        )

        assertTrue(config is DiscoveryConfiguration.InternetDiscoveryConfiguration)
        assertTrue(config.discoveryFilter is DiscoveryFilter.BySerial)
        assertEquals("SN12345", (config.discoveryFilter as DiscoveryFilter.BySerial).serialNumber)
    }

    @Test
    fun `test getDiscoveryConfiguration for INTERNET with no filter`() {
        val params = JavaOnlyMap.of(
            "locationId", "tml_000",
            "timeout", 20,
            "simulated", false
        )

        val config = getDiscoveryConfiguration(
            discoveryMethod = DiscoveryMethod.INTERNET,
            params = params
        )

        assertTrue(config is DiscoveryConfiguration.InternetDiscoveryConfiguration)
        assertTrue(config.discoveryFilter is DiscoveryFilter.None)
    }

    @Test
    fun `test getDiscoveryConfiguration for USB`() {
        val params = JavaOnlyMap.of(
            "timeout", 15,
            "simulated", true
        )

        val config = getDiscoveryConfiguration(
            discoveryMethod = DiscoveryMethod.USB,
            params = params
        )

        assertTrue(config is DiscoveryConfiguration.UsbDiscoveryConfiguration)
        assertEquals(15, config.timeout)
        assertEquals(true, config.isSimulated)
    }

    @Test
    fun `test getDiscoveryConfiguration for TAP_TO_PAY`() {
        val params = JavaOnlyMap.of(
            "simulated", false
        )

        val config = getDiscoveryConfiguration(
            discoveryMethod = DiscoveryMethod.TAP_TO_PAY,
            params = params
        )

        assertTrue(config is DiscoveryConfiguration.TapToPayDiscoveryConfiguration)
        assertEquals(false, config.isSimulated)
    }

    @Test
    fun `test getDiscoveryConfiguration for APPS_ON_DEVICES`() {
        val params = JavaOnlyMap()

        val config = getDiscoveryConfiguration(
            discoveryMethod = DiscoveryMethod.APPS_ON_DEVICES,
            params = params
        )

        assertTrue(config is DiscoveryConfiguration.AppsOnDevicesDiscoveryConfiguration)
    }

    @Test
    fun `test getEasyConnectConfiguration for INTERNET`() {
        val discoveryConfig = mockk<DiscoveryConfiguration.InternetDiscoveryConfiguration>()
        val connectionConfig = mockk<ConnectionConfiguration.InternetConnectionConfiguration>()

        val easyConnectConfig = getEasyConnectConfiguration(
            discoveryConfiguration = discoveryConfig,
            connectionConfiguration = connectionConfig
        )

        assertTrue(easyConnectConfig is EasyConnectConfiguration.InternetEasyConnectConfiguration)
        assertEquals(discoveryConfig, easyConnectConfig.discoveryConfiguration)
        assertEquals(connectionConfig, easyConnectConfig.connectionConfiguration)
    }

    @Test
    fun `test getEasyConnectConfiguration for TAP_TO_PAY`() {
        val discoveryConfig = mockk<DiscoveryConfiguration.TapToPayDiscoveryConfiguration>()
        val connectionConfig = mockk<ConnectionConfiguration.TapToPayConnectionConfiguration>()

        val easyConnectConfig = getEasyConnectConfiguration(
            discoveryConfiguration = discoveryConfig,
            connectionConfiguration = connectionConfig
        )

        assertTrue(easyConnectConfig is EasyConnectConfiguration.TapToPayEasyConnectConfiguration)
        assertEquals(discoveryConfig, easyConnectConfig.discoveryConfiguration)
        assertEquals(connectionConfig, easyConnectConfig.connectionConfiguration)
    }

    @Test
    fun `test getEasyConnectConfiguration for APPS_ON_DEVICES`() {
        val discoveryConfig = mockk<DiscoveryConfiguration.AppsOnDevicesDiscoveryConfiguration>()
        val connectionConfig = mockk<ConnectionConfiguration.AppsOnDevicesConnectionConfiguration>()

        val easyConnectConfig = getEasyConnectConfiguration(
            discoveryConfiguration = discoveryConfig,
            connectionConfiguration = connectionConfig
        )

        assertTrue(easyConnectConfig is EasyConnectConfiguration.AppsOnDevicesEasyConnectionConfiguration)
        assertEquals(discoveryConfig, easyConnectConfig.discoveryConfiguration)
        assertEquals(connectionConfig, easyConnectConfig.connectionConfiguration)
    }
}

private fun <T> matchesMap(map: Map<String, T>, reference: Map<String, T>?): Boolean {
    return map.all { (k, v) -> reference?.get(k) == v } && map.size == reference?.size
}
