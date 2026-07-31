import XCTest

@testable import stripe_terminal_react_native
import StripeTerminal

final class MappersTests: XCTestCase {

    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }

    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    func testLocationStatusMapper() {
        // bric note: Just an example, this isn't really a useful test since this mapper just maps from
        // and to constants
        XCTAssertEqual(Mappers.mapFromLocationStatus(.notSet), "notSet")
    }

    func testMapFromRequestPartialAuthorization() {
        XCTAssertEqual(Mappers.mapFromRequestPartialAuthorization(CardPresentRequestPartialAuthorization.ifAvailable.rawValue), "if_available")
        XCTAssertEqual(Mappers.mapFromRequestPartialAuthorization(CardPresentRequestPartialAuthorization.never.rawValue), "never")
        XCTAssertEqual(Mappers.mapFromRequestPartialAuthorization(100), "")
        XCTAssertEqual(Mappers.mapFromRequestPartialAuthorization(0), "if_available")
        XCTAssertEqual(Mappers.mapFromRequestPartialAuthorization(1), "never")
    }

    func testMapFromMulticaptureStatus() {
        XCTAssertEqual(Mappers.mapFromMulticaptureStatus(.available), "available")
        XCTAssertEqual(Mappers.mapFromMulticaptureStatus(.unavailable), "unavailable")
        XCTAssertEqual(Mappers.mapFromMulticaptureStatus(.unknown), "unknown")
    }

    func testMapFromRequestReauthorization() {
        XCTAssertEqual(Mappers.mapFromRequestReauthorization(CardPresentRequestReauthorization.ifAvailable.rawValue), "if_available")
        XCTAssertEqual(Mappers.mapFromRequestReauthorization(CardPresentRequestReauthorization.never.rawValue), "never")
        XCTAssertEqual(Mappers.mapFromRequestReauthorization(100), nil)
        XCTAssertEqual(Mappers.mapFromRequestReauthorization(0), "if_available")
        XCTAssertEqual(Mappers.mapFromRequestReauthorization(1), "never")
    }

    func testMapFromReauthorizationStatus() {
        XCTAssertEqual(Mappers.mapFromReauthorizationStatus(.available), "available")
        XCTAssertEqual(Mappers.mapFromReauthorizationStatus(.unavailable), "unavailable")
        XCTAssertEqual(Mappers.mapFromReauthorizationStatus(.unknown), "unknown")
    }

    func testMapToSetupIntent() throws {
        let params: NSDictionary = [
            "customer" : "fakeCustomer",
            "description" : "fakeDescription",
            "onBehalfOf" : "fakeOnBehalfOf",
            "paymentMethodTypes" : ["card", "cardPresent"],
            "usage" : "onSession"
        ]
        let setupIntent = try Mappers.mapToSetupIntent(params).build()

        XCTAssertEqual(setupIntent.customer, "fakeCustomer")
        XCTAssertEqual(setupIntent.stripeDescription, "fakeDescription")
        XCTAssertEqual(setupIntent.onBehalfOf, "fakeOnBehalfOf")
        XCTAssertEqual(setupIntent.paymentMethodTypes, [PaymentMethodType.card, PaymentMethodType.cardPresent])
        XCTAssertEqual(setupIntent.usage, SetupIntentUsage.onSession)
    }

    func testMapToSetupIntentUsage() {
        XCTAssertEqual(Mappers.mapToSetupIntentUsage("onSession"), SetupIntentUsage.onSession)
        XCTAssertEqual(Mappers.mapToSetupIntentUsage("offSession"), SetupIntentUsage.offSession)
    }

    func testMapToPaymentMethodType() {
        XCTAssertEqual(Mappers.mapToPaymentMethodType("card"), PaymentMethodType.card)
        XCTAssertEqual(Mappers.mapToPaymentMethodType("cardPresent"), PaymentMethodType.cardPresent)
        XCTAssertEqual(Mappers.mapToPaymentMethodType("card_present"), PaymentMethodType.cardPresent)
        XCTAssertEqual(Mappers.mapToPaymentMethodType("interacPresent"), PaymentMethodType.interacPresent)
        XCTAssertEqual(Mappers.mapToPaymentMethodType("interac_present"), PaymentMethodType.interacPresent)
        XCTAssertEqual(Mappers.mapToPaymentMethodType("wechatPay"), PaymentMethodType.wechatPay)
        XCTAssertEqual(Mappers.mapToPaymentMethodType("wechat_pay"), PaymentMethodType.wechatPay)
        XCTAssertEqual(Mappers.mapToPaymentMethodType("affirm"), PaymentMethodType.affirm)
        XCTAssertEqual(Mappers.mapToPaymentMethodType("paynow"), PaymentMethodType.paynow)
        XCTAssertEqual(Mappers.mapToPaymentMethodType("paypay"), PaymentMethodType.paypay)
        XCTAssertEqual(Mappers.mapToPaymentMethodType("klarna"), PaymentMethodType.klarna)
        XCTAssertEqual(Mappers.mapToPaymentMethodType("adbPay"), PaymentMethodType.unknown)
    }

    func testMapPaymentIntentPaymentMethodTypes() {
        XCTAssertEqual(
            Mappers.mapPaymentIntentPaymentMethodTypes(["cardPresent", "interacPresent"]),
            [PaymentMethodType.cardPresent, PaymentMethodType.interacPresent]
        )
    }

    func testMapPaymentIntentPaymentMethodTypesEmpty() {
        XCTAssertEqual(
            Mappers.mapPaymentIntentPaymentMethodTypes([]),
            []
        )
    }

    func testCollectInputsReturnsMapper() {
        let textResult = TestableTextResult(skipped: false, text: "Written text from the reader", toggles: [
            ToggleResult.enabled.rawValue as NSNumber,
            ToggleResult.skipped.rawValue as NSNumber,
        ])
        let numericResult = TestableNumericResult(skipped: false, numericString: "123456", toggles: [
            ToggleResult.enabled.rawValue as NSNumber,
            ToggleResult.skipped.rawValue as NSNumber,
        ])
        let phoneResult = TestablePhoneResult(skipped: false, phone: "+1 425-555-1234", toggles: [
            ToggleResult.enabled.rawValue as NSNumber,
            ToggleResult.skipped.rawValue as NSNumber,
        ])
        let emailResult = TestableEmailResult(skipped: false, email: "unit.test@test.com", toggles: [
            ToggleResult.enabled.rawValue as NSNumber,
            ToggleResult.skipped.rawValue as NSNumber,
        ])
        let selectionResult = TestableSelectionResult(skipped: false, selection: "Yes", selectionId: "yes_id", toggles: [
            ToggleResult.enabled.rawValue as NSNumber,
            ToggleResult.skipped.rawValue as NSNumber,
        ])
        let signatureResult = TestableSignatureResult(skipped: false, signatureSvg: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 974 943\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"10\" stroke=\"black\"><g><path d=\"M468.5171463.52472 L468.5171 463.52472 \"/></g></svg>", toggles: [
            ToggleResult.enabled.rawValue as NSNumber,
            ToggleResult.skipped.rawValue as NSNumber,
        ])
        var output: NSDictionary = Mappers.mapFromCollectInputsResults([
            textResult
        ])
        XCTAssertNotNil(output.object(forKey: "collectInputResults"))
        XCTAssertTrue(output["collectInputResults"] is [NSDictionary])

        var results: [NSDictionary] = output["collectInputResults"] as! [NSDictionary]

        XCTAssertEqual(results.count, 1)
        guard let result = results.first else {
            XCTFail("CollectInput result should have had a result")
            return
        }
        guard
            let skipped = result["skipped"] as? Bool,
            let toggles = result["toggles"] as? [String],
            let formType = result["formType"] as? String,
            let text = result["text"] as? String else {
            XCTFail("CollectInput TestResult should have had text, formType, skipped and toggles")
            return
        }
        XCTAssertFalse(skipped)
        XCTAssertEqual(toggles.count, 2)
        XCTAssertEqual(toggles[0], "enabled")
        XCTAssertEqual(toggles[1], "skipped")
        XCTAssertEqual(formType, "text")
        XCTAssertEqual(text, "Written text from the reader")

        output = Mappers.mapFromCollectInputsResults([
            numericResult, phoneResult, emailResult, selectionResult, signatureResult
        ])
        XCTAssertNotNil(output.object(forKey: "collectInputResults"))
        XCTAssertTrue(output["collectInputResults"] is [NSDictionary])

        results = output["collectInputResults"] as! [NSDictionary]

        let testNumericString = "numericString"
        let testPhone = "phone"
        let testEmail = "email"
        let testSelection = "selection"
        let testSelectionId = "selectionId"
        let testSignatureSvg = "signatureSvg"
        XCTAssertEqual(results.count, 5)
        XCTAssertTrue(results[0][testNumericString] != nil)
        XCTAssertTrue(results[1][testPhone] != nil)
        XCTAssertTrue(results[2][testEmail] != nil)
        XCTAssertTrue(results[3][testSelection] != nil)
        XCTAssertTrue(results[4][testSignatureSvg] != nil)

        XCTAssertTrue(results[0]["formType"] as! String == "numeric")
        XCTAssertTrue(results[1]["formType"] as! String == "phone")
        XCTAssertTrue(results[2]["formType"] as! String == "email")
        XCTAssertTrue(results[3]["formType"] as! String == "selection")
        XCTAssertTrue(results[4]["formType"] as! String == "signature")

        for result in results {
            if ((result.object(forKey: testNumericString)) != nil) {
                guard
                    let skipped = result["skipped"] as? Bool,
                    let toggles = result["toggles"] as? [String],
                    let numericString = result[testNumericString] as? String else {
                    XCTFail("CollectInput NumericResult should have had numericString, skipped and toggles")
                    return
                }
                XCTAssertFalse(skipped)
                XCTAssertEqual(toggles.count, 2)
                XCTAssertEqual(toggles[0], "enabled")
                XCTAssertEqual(toggles[1], "skipped")
                XCTAssertEqual(numericString, "123456")
            }
            if ((result.object(forKey: testPhone)) != nil) {
                guard
                    let skipped = result["skipped"] as? Bool,
                    let toggles = result["toggles"] as? [String],
                    let phone = result[testPhone] as? String else {
                    XCTFail("CollectInput PhoneResult should have had phone, skipped and toggles")
                    return
                }
                XCTAssertFalse(skipped)
                XCTAssertEqual(toggles.count, 2)
                XCTAssertEqual(toggles[0], "enabled")
                XCTAssertEqual(toggles[1], "skipped")
                XCTAssertEqual(phone, "+1 425-555-1234")
            }
            if ((result.object(forKey: testEmail)) != nil) {
                guard
                    let skipped = result["skipped"] as? Bool,
                    let toggles = result["toggles"] as? [String],
                    let email = result[testEmail] as? String else {
                    XCTFail("CollectInput EmailResult should have had email, skipped and toggles")
                    return
                }
                XCTAssertFalse(skipped)
                XCTAssertEqual(toggles.count, 2)
                XCTAssertEqual(toggles[0], "enabled")
                XCTAssertEqual(toggles[1], "skipped")
                XCTAssertEqual(email, "unit.test@test.com")
            }
            if ((result.object(forKey: testSelection)) != nil) {
                guard
                    let skipped = result["skipped"] as? Bool,
                    let toggles = result["toggles"] as? [String],
                    let selection = result[testSelection] as? String,
                    let selectionId = result[testSelectionId] as? String else {
                    XCTFail("CollectInput SelectionResult should have had selection, skipped and toggles")
                    return
                }
                XCTAssertFalse(skipped)
                XCTAssertEqual(toggles.count, 2)
                XCTAssertEqual(toggles[0], "enabled")
                XCTAssertEqual(toggles[1], "skipped")
                XCTAssertEqual(selection, "Yes")
                XCTAssertEqual(selectionId, "yes_id")
            }
            if ((result.object(forKey: testSignatureSvg)) != nil) {
                guard
                    let skipped = result["skipped"] as? Bool,
                    let toggles = result["toggles"] as? [String],
                    let signatureSvg = result[testSignatureSvg] as? String else {
                    XCTFail("CollectInput SignatureResult should have had signatureSvg, skipped and toggles")
                    return
                }
                XCTAssertFalse(skipped)
                XCTAssertEqual(toggles.count, 2)
                XCTAssertEqual(toggles[0], "enabled")
                XCTAssertEqual(toggles[1], "skipped")
                XCTAssertEqual(signatureSvg, "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 974 943\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"10\" stroke=\"black\"><g><path d=\"M468.5171463.52472 L468.5171 463.52472 \"/></g></svg>")
            }
        }
    }

    func testMapToSimulatedCollectInputsResultBehaviors() {
          let testCases: [(input: String, expectedSucceeded: SimulatedCollectInputsSkipBehavior?)] = [
                  ("all", .all),
                  ("none", SimulatedCollectInputsSkipBehavior.none),
                  ("timeout", nil),
                  ("invalid", SimulatedCollectInputsSkipBehavior.none)
          ]

          for (input, expectedBehavior) in testCases {
              let result = Mappers.mapToSimulatedCollectInputsResult(input)

              if let expected = expectedBehavior {
                  guard let succeeded = result as? SimulatedCollectInputsResultSucceeded else {
                      XCTFail("Expected SimulatedCollectInputsResultSucceeded for input '\(input)'")
                      continue
                  }
                  XCTAssertEqual(succeeded.simulatedCollectInputsSkipBehavior, expected, "Wrong skipBehavior for input '\(input)'")
              } else {
                  XCTAssertTrue(result is SimulatedCollectInputsResultTimeout, "Expected SimulatedCollectInputsResultTimeout for input '\(input)'")
              }
          }
    }

    func testMapToUIImage() {
        // Simple 1x1 PNG image
        let base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

        // Test valid data URI with PNG
        let validDataURI = "data:image/png;base64," + base64Image
        let pngImage = Mappers.mapToUIImage(validDataURI)
        XCTAssertNotNil(pngImage, "Should create UIImage from valid PNG data URI")
        XCTAssertEqual(pngImage?.size.width, 1)
        XCTAssertEqual(pngImage?.size.height, 1)

        // Test valid plain base64 string
        XCTAssertNotNil(Mappers.mapToUIImage(base64Image), "Should create UIImage from valid base64 string")

        // Test invalid data URI - missing comma
        let invalidDataURINoComma = "data:image/png;base64" + base64Image
        XCTAssertNil(Mappers.mapToUIImage(invalidDataURINoComma), "Should return nil for data URI without comma")

        // Test invalid data URI - too many components
        let invalidDataURITooMany = "data:image/png;base64,abc,def"
        XCTAssertNil(Mappers.mapToUIImage(invalidDataURITooMany), "Should return nil for data URI with too many components")

        // Test invalid data URI - empty base64
        let invalidDataURIEmpty = "data:image/png;base64,"
        XCTAssertNil(Mappers.mapToUIImage(invalidDataURIEmpty), "Should return nil for data URI with empty base64")

        // Test invalid base64 string
        let invalidBase64 = "not-valid-base64-data"
        XCTAssertNil(Mappers.mapToUIImage(invalidBase64), "Should return nil for invalid base64 string")

        // Test empty string
        let emptyString = ""
        XCTAssertNil(Mappers.mapToUIImage(emptyString), "Should return nil for empty string")
    }

    func testMapToCustomerCancellation() {
        let enable = Mappers.mapToCustomerCancellation("enableIfAvailable")
        XCTAssertEqual(enable, .enableIfAvailable)
        let disable = Mappers.mapToCustomerCancellation("disableIfAvailable")
        XCTAssertEqual(disable, .disableIfAvailable)
    }

    func testMapToMotoConfiguration() {
        let nilConfiguration = Mappers.mapToMotoConfiguration(nil)
        XCTAssertEqual(nilConfiguration, nil)
        let emptyConfiguration = Mappers.mapToMotoConfiguration([:])
        XCTAssertEqual(emptyConfiguration?.skipCvc, false)
        let skipCvcConfiguration = Mappers.mapToMotoConfiguration(["skipCvc": true])
        XCTAssertEqual(skipCvcConfiguration?.skipCvc, true)
    }

    func testMapToLocaleConfigMapsHardcodedLocaleConfig() throws {
        let config = try Mappers.mapToLocaleConfig([
            "type": "hardcoded",
            "locale": "fr-FR"
        ])

        let hardcodedConfig = config as? HardcodedLocaleConfig
        XCTAssertNotNil(hardcodedConfig)
        XCTAssertEqual(hardcodedConfig?.locale, "fr-FR")
    }

    func testMapToLocaleConfigMapsCardLanguagePreferenceLocaleConfig() throws {
        let config = try Mappers.mapToLocaleConfig([
            "type": "cardLanguagePreferenceIfAvailable"
        ])

        XCTAssertTrue(config === LocaleConfig.cardLanguagePreferenceIfAvailable)
    }

    func testMapToLocaleConfigReturnsNilForMissingConfig() throws {
        XCTAssertNil(try Mappers.mapToLocaleConfig(nil))
    }

    func testMapToLocaleConfigReturnsNilForHardcodedMissingLocale() throws {
        let config = try Mappers.mapToLocaleConfig([
            "type": "hardcoded"
        ])

        XCTAssertNil(config)
    }

    func testMapToLocaleConfigReturnsNilForUnknownType() throws {
        let config = try Mappers.mapToLocaleConfig([
            "type": "unknown"
        ])

        XCTAssertNil(config)
    }

    func testMapToLocaleConfigPropagatesInvalidHardcodedLocaleError() {
        XCTAssertThrowsError(try Mappers.mapToLocaleConfig([
            "type": "hardcoded",
            "locale": "not_a_locale"
        ]))
    }

    func testBuildCollectPaymentIntentConfigurationWithAllParameters() throws {
        // GIVEN params with all configuration parameters
        let params: NSDictionary = [
            "skipTipping": true,
            "skipDonation": true,
            "tipEligibleAmount": 1000,
            "updatePaymentIntent": true,
            "customerCancellation": "enableIfAvailable",
            "requestDynamicCurrencyConversion": true,
            "surchargeNotice": "Test surcharge notice",
            "allowRedisplay": "always",
            "motoConfiguration": [
                "skipCvc": true
            ]
        ]

        // WHEN building the configuration
        let config = try Mappers.buildCollectPaymentIntentConfiguration(from: params)

        // THEN configuration should be built successfully with all parameters
        XCTAssertEqual(config.skipTipping, true)
        XCTAssertEqual(config.skipDonation, true)
        XCTAssertEqual(config.updatePaymentIntent, true)
        XCTAssertEqual(config.requestDynamicCurrencyConversion, true)
        XCTAssertEqual(config.customerCancellation, .enableIfAvailable)
        XCTAssertEqual(config.allowRedisplay, .always)
        XCTAssertEqual(config.surchargeNotice, "Test surcharge notice")
        XCTAssertEqual(config.tippingConfiguration?.eligibleAmount, 1000)
        XCTAssertEqual(config.motoConfiguration?.skipCvc, true)
    }

    func testBuildCollectPaymentIntentConfigurationWithSkipDonation() throws {
        // GIVEN params with skipDonation only
        let params: NSDictionary = [
            "skipDonation": true
        ]

        // WHEN building the configuration
        let config = try Mappers.buildCollectPaymentIntentConfiguration(from: params)

        // THEN configuration should be built successfully with skipDonation enabled
        XCTAssertEqual(config.skipDonation, true)
    }

    func testBuildCollectPaymentIntentConfigurationWithSkipTipping() throws {
        // GIVEN params with skipTipping only
        let params: NSDictionary = [
            "skipTipping": true
        ]

        // WHEN building the configuration
        let config = try Mappers.buildCollectPaymentIntentConfiguration(from: params)

        // THEN configuration should be built successfully with skipTipping enabled
        XCTAssertEqual(config.skipTipping, true)
    }

    func testBuildCollectPaymentIntentConfigurationWithTipEligibleAmount() throws {
        // GIVEN params with tipEligibleAmount only
        let params: NSDictionary = [
            "tipEligibleAmount": 1000
        ]

        // WHEN building the configuration
        let config = try Mappers.buildCollectPaymentIntentConfiguration(from: params)

        // THEN configuration should be built successfully with tipping configuration
        XCTAssertEqual(config.tippingConfiguration?.eligibleAmount, 1000)
    }

    func testBuildCollectPaymentIntentConfigurationWithCustomerCancellation() throws {
        // GIVEN params with customerCancellation only
        let params: NSDictionary = [
            "customerCancellation": "enableIfAvailable"
        ]

        // WHEN building the configuration
        let config = try Mappers.buildCollectPaymentIntentConfiguration(from: params)

        // THEN configuration should be built successfully with customerCancellation
        XCTAssertEqual(config.customerCancellation, .enableIfAvailable)
    }

    func testBuildCollectPaymentIntentConfigurationWithAllowRedisplay() throws {
        // GIVEN params with allowRedisplay set to limited
        let params: NSDictionary = [
            "allowRedisplay": "limited"
        ]

        // WHEN building the configuration
        let config = try Mappers.buildCollectPaymentIntentConfiguration(from: params)

        // THEN configuration should be built successfully with allowRedisplay
        XCTAssertEqual(config.allowRedisplay, .limited)
    }

    func testBuildCollectPaymentIntentConfigurationWithMotoConfiguration() throws {
        // GIVEN params with motoConfiguration only
        let params: NSDictionary = [
            "motoConfiguration": [
                "skipCvc": false
            ]
        ]

        // WHEN building the configuration
        let config = try Mappers.buildCollectPaymentIntentConfiguration(from: params)

        // THEN configuration should be built successfully with motoConfiguration
        XCTAssertEqual(config.motoConfiguration?.skipCvc, false)
    }

    func testBuildCollectPaymentIntentConfigurationWithEmptyParams() throws {
        // GIVEN empty params
        let params: NSDictionary = [:]

        // WHEN building the configuration
        let config = try Mappers.buildCollectPaymentIntentConfiguration(from: params)

        // THEN configuration should be built successfully with defaults
        XCTAssertEqual(config.skipTipping, false)
        XCTAssertEqual(config.skipDonation, false)
        XCTAssertEqual(config.updatePaymentIntent, false)
        XCTAssertEqual(config.requestDynamicCurrencyConversion, false)
        XCTAssertNil(config.tippingConfiguration)
        XCTAssertNil(config.motoConfiguration)
    }

    func testBuildConfirmPaymentIntentConfigurationWithSurchargeAndReturnUrl() throws {
        // GIVEN params with surcharge configuration and returnUrl
        let params: NSDictionary = [
            "surcharge": [
                "amount": 100,
                "consent": [
                    "collection": "enabled",
                    "notice": "Test surcharge notice"
                ]
            ] as [String: Any],
            "returnUrl": "https://example.com/return"
        ]

        // WHEN building the configuration
        let config = try Mappers.buildConfirmPaymentIntentConfiguration(from: params)

        // THEN configuration should be built successfully with returnUrl
        XCTAssertEqual(config.returnUrl, "https://example.com/return")
    }

    func testBuildConfirmPaymentIntentConfigurationWithOnlyReturnUrl() throws {
        // GIVEN params with only returnUrl
        let params: NSDictionary = [
            "returnUrl": "https://example.com/return"
        ]

        // WHEN building the configuration
        let config = try Mappers.buildConfirmPaymentIntentConfiguration(from: params)

        // THEN configuration should be built successfully with returnUrl
        XCTAssertEqual(config.returnUrl, "https://example.com/return")
    }

    func testBuildConfirmPaymentIntentConfigurationWithEmptyParams() throws {
        // GIVEN empty params
        let params: NSDictionary = [:]

        // WHEN building the configuration
        let config = try Mappers.buildConfirmPaymentIntentConfiguration(from: params)

        // THEN configuration should be built successfully with defaults
        XCTAssertNil(config.returnUrl)
    }

    // MARK: - AmountDetails Tests

    func testMapFromAmountDetailsWithNilInputs() {
        let result = Mappers.mapFromAmountDetails(nil)

        let tip = result["tip"] as? NSDictionary
        XCTAssertNotNil(tip)
        XCTAssertNil(tip?["amount"])

        let surcharge = result["surcharge"] as? NSDictionary
        XCTAssertNotNil(surcharge)
        XCTAssertNil(surcharge?["amount"])
        XCTAssertNil(surcharge?["status"])
        XCTAssertNil(surcharge?["maximumAmount"])
    }

    func testMapFromAmountDetailsWithNilSurcharge() {
        let result = Mappers.mapFromAmountDetails(nil)

        let surcharge = result["surcharge"] as? NSDictionary
        XCTAssertNotNil(surcharge)
        XCTAssertNil(surcharge?["amount"])
        XCTAssertNil(surcharge?["status"])
        XCTAssertNil(surcharge?["maximumAmount"])
    }

    // MARK: - Discovery Configuration Tests

    func testMapToDiscoveryConfigurationForBluetoothScan() throws {
        let config = try Mappers.mapToDiscoveryConfiguration(
            "bluetoothScan",
            simulated: true,
            locationId: nil,
            discoveryFilter: nil,
            timeout: 30
        )

        XCTAssertTrue(config is BluetoothScanDiscoveryConfiguration)
        let bluetoothConfig = config as! BluetoothScanDiscoveryConfiguration
        XCTAssertEqual(bluetoothConfig.timeout, 30)
        XCTAssertEqual(bluetoothConfig.simulated, true)
    }

    func testMapToDiscoveryConfigurationForBluetoothProximity() throws {
        let config = try Mappers.mapToDiscoveryConfiguration(
            "bluetoothProximity",
            simulated: false,
            locationId: nil,
            discoveryFilter: nil,
            timeout: 0
        )

        XCTAssertTrue(config is BluetoothProximityDiscoveryConfiguration)
        let bluetoothConfig = config as! BluetoothProximityDiscoveryConfiguration
        XCTAssertEqual(bluetoothConfig.simulated, false)
    }

    func testMapToDiscoveryConfigurationForInternetWithAllParams() throws {
        let filter = DiscoveryFilter.byReaderId("tmr_123")

        let config = try Mappers.mapToDiscoveryConfiguration(
            "internet",
            simulated: false,
            locationId: "1234",
            discoveryFilter: filter,
            timeout: 60
        )

        XCTAssertTrue(config is InternetDiscoveryConfiguration)
        let internetConfig = config as! InternetDiscoveryConfiguration
        XCTAssertEqual(internetConfig.timeout, 60)
        XCTAssertEqual(internetConfig.simulated, false)
        XCTAssertEqual(internetConfig.locationId, "1234")
    }

    func testMapToDiscoveryConfigurationForUsb() throws {
        let config = try Mappers.mapToDiscoveryConfiguration(
            "usb",
            simulated: true,
            locationId: nil,
            discoveryFilter: nil,
            timeout: 15
        )

        XCTAssertTrue(config is UsbDiscoveryConfiguration)
        let usbConfig = config as! UsbDiscoveryConfiguration
        XCTAssertEqual(usbConfig.timeout, 15)
        XCTAssertEqual(usbConfig.simulated, true)
    }

    func testMapToDiscoveryConfigurationForTapToPay() throws {
        let config = try Mappers.mapToDiscoveryConfiguration(
            "tapToPay",
            simulated: false,
            locationId: nil,
            discoveryFilter: nil,
            timeout: 0
        )

        XCTAssertTrue(config is TapToPayDiscoveryConfiguration)
        let tapToPayConfig = config as! TapToPayDiscoveryConfiguration
        XCTAssertEqual(tapToPayConfig.simulated, false)
    }

    //TODO: defer when iOS support
    // func testMapToDiscoveryFilter() {
    //   let emptyFilter: [String: String] = [:]
    //   let filterReader: [String: String] = ["readerId": "1234"]
    //   let filterSerial: [String: String] = ["serialNumber": "5678"]
    //   XCTAssertEqual(Mappers.mapToDiscoveryFilter(nil), nil)
    //   XCTAssertEqual(Mappers.mapToDiscoveryFilter(emptyFilter), DiscoveryFilter.none())
    //   XCTAssertEqual(Mappers.mapToDiscoveryFilter(filterReader), DiscoveryFilter.byReaderId("1234"))
    //   XCTAssertEqual(Mappers.mapToDiscoveryFilter(filterSerial), DiscoveryFilter.bySerialNumber("5678"))
    // }

    func testBuildCollectSetupIntentConfigurationWithAllParameters() throws {
        // GIVEN params with all configuration parameters
        let params: NSDictionary = [
            "customerCancellation": "enableIfAvailable",
            "motoConfiguration": [
                "skipCvc": true
            ],
            "collectionReason": "saveCard"
        ]

        // WHEN building the configuration
        let config = try Mappers.buildCollectSetupIntentConfiguration(from: params)

        // THEN configuration should be built successfully with all parameters
        XCTAssertEqual(config.customerCancellation, .enableIfAvailable)
        XCTAssertEqual(config.motoConfiguration?.skipCvc, true)
        XCTAssertEqual(config.collectionReason, .saveCard)
    }

    func testBuildCollectSetupIntentConfigurationWithCustomerCancellation() throws {
        // GIVEN params with customerCancellation only
        let params: NSDictionary = [
            "customerCancellation": "disableIfAvailable"
        ]

        // WHEN building the configuration
        let config = try Mappers.buildCollectSetupIntentConfiguration(from: params)

        // THEN configuration should be built successfully with customerCancellation
        XCTAssertEqual(config.customerCancellation, .disableIfAvailable)
    }

    func testBuildCollectSetupIntentConfigurationWithMotoConfiguration() throws {
        // GIVEN params with motoConfiguration only
        let params: NSDictionary = [
            "motoConfiguration": [
                "skipCvc": false
            ]
        ]

        // WHEN building the configuration
        let config = try Mappers.buildCollectSetupIntentConfiguration(from: params)

        // THEN configuration should be built successfully with motoConfiguration
        XCTAssertEqual(config.motoConfiguration?.skipCvc, false)
    }

    func testBuildCollectSetupIntentConfigurationWithCollectionReason() throws {
        // GIVEN params with collectionReason only
        let params: NSDictionary = [
            "collectionReason": "verify"
        ]

        // WHEN building the configuration
        let config = try Mappers.buildCollectSetupIntentConfiguration(from: params)

        // THEN configuration should be built successfully with collectionReason
        XCTAssertEqual(config.collectionReason, .verify)
    }

    func testBuildCollectSetupIntentConfigurationWithEmptyParams() throws {
        // GIVEN empty params
        let params: NSDictionary = [:]

        // WHEN building the configuration
        let config = try Mappers.buildCollectSetupIntentConfiguration(from: params)

        // THEN configuration should be built successfully with defaults
        XCTAssertNil(config.motoConfiguration)
        // Note: collectionReason may have a default value set by the SDK
    }

    func testDeviceTypeRoundtripMapping() {
        let allDeviceTypes: [DeviceType] = [
            .tapToPay,
            .chipper1X,
            .chipper2X,
            .etna,
            .stripeM2,
            .stripeS700,
            .stripeS700DevKit,
            .stripeS710,
            .stripeS710DevKit,
            .stripeT600,
            .stripeT600DevKit,
            .wiseCube,
            .wisePad3,
            .wisePosE,
            .wisePosEDevKit,
            .verifoneV660p,
            .verifoneV660pDevKit,
            .verifoneM425,
            .verifoneM450,
            .verifoneP630,
            .verifoneUX700,
            .verifoneUX700DevKit,
            .verifoneVM100,
            .verifoneVP100,
        ]

        for deviceType in allDeviceTypes {
            let rnString = Mappers.mapFromDeviceType(deviceType)
            let mappedBack = Mappers.mapToDeviceType(rnString)
            XCTAssertEqual(
                deviceType,
                mappedBack,
                "DeviceType roundtrip failed for \(deviceType): mapped to \"\(rnString)\", but mapped back to \(String(describing: mappedBack))"
            )
        }
    }

    func testMapToSetupIntentCollectionReason() {
        XCTAssertEqual(Mappers.mapToSetupIntentCollectionReason("saveCard"), .saveCard)
        XCTAssertEqual(Mappers.mapToSetupIntentCollectionReason("verify"), .verify)
        XCTAssertNil(Mappers.mapToSetupIntentCollectionReason("invalid"))
        XCTAssertNil(Mappers.mapToSetupIntentCollectionReason(nil))
    }


    // MARK: - mapFromRefund Tests

    func testMapFromRefund_mapsRequiredFields() {
        // SDK Refund objects have init NS_UNAVAILABLE, so we use Obj-C runtime to create a dummy instance
        guard let refund = ObjCRuntimeHelper.createInstance(className: "SCPRefund") else {
            XCTFail("Could not create SCPRefund instance via Obj-C runtime")
            return
        }

        // Set all non-nullable fields via KVC (required to avoid crash when Swift accesses them)
        refund.setValue("re_test_123", forKey: "stripeId")
        refund.setValue(NSNumber(value: 5000), forKey: "amount")
        refund.setValue("usd", forKey: "currency")
        refund.setValue(["key1": "value1"], forKey: "metadata")
        refund.setValue(NSNumber(value: RefundStatus.succeeded.rawValue), forKey: "status")
        refund.setValue(Date(timeIntervalSince1970: 1700000000), forKey: "created")

        guard let typedRefund = refund as? Refund else {
            XCTFail("SCPRefund instance could not be cast to Refund")
            return
        }
        let mapped = Mappers.mapFromRefund(typedRefund)

        XCTAssertEqual(mapped["id"] as? String, "re_test_123")
        XCTAssertEqual(mapped["amount"] as? UInt, 5000)
        XCTAssertEqual(mapped["currency"] as? String, "usd")
        XCTAssertEqual(mapped["status"] as? String, "succeeded")
        XCTAssertNotNil(mapped["created"])

        guard let metadata = mapped["metadata"] as? NSDictionary else {
            XCTFail("metadata should be an NSDictionary")
            return
        }
        XCTAssertEqual(metadata["key1"] as? String, "value1")

        // Optional fields should be absent when not set
        XCTAssertNil(mapped["balanceTransaction"])
        XCTAssertNil(mapped["chargeId"])
        XCTAssertNil(mapped["description"])
        XCTAssertNil(mapped["failureBalanceTransaction"])
        XCTAssertNil(mapped["failureReason"])
        XCTAssertNil(mapped["paymentIntentId"])
        XCTAssertNil(mapped["reason"])
        XCTAssertNil(mapped["receiptNumber"])
        XCTAssertNil(mapped["sourceTransferReversal"])
        XCTAssertNil(mapped["transferReversal"])
    }

    func testMapFromRefund_mapsOptionalFields() {
        guard let refund = ObjCRuntimeHelper.createInstance(className: "SCPRefund") else {
            XCTFail("Could not create SCPRefund instance via Obj-C runtime")
            return
        }

        // Required fields
        refund.setValue("re_test_456", forKey: "stripeId")
        refund.setValue(NSNumber(value: 1000), forKey: "amount")
        refund.setValue("eur", forKey: "currency")
        refund.setValue([:] as [String: String], forKey: "metadata")
        refund.setValue(NSNumber(value: RefundStatus.pending.rawValue), forKey: "status")

        // Optional fields
        refund.setValue("bt_abc", forKey: "balanceTransaction")
        refund.setValue("ch_xyz", forKey: "chargeId")
        refund.setValue("Test refund", forKey: "stripeDescription")
        refund.setValue("fbt_abc", forKey: "failureBalanceTransaction")
        refund.setValue("expired_or_canceled_card", forKey: "failureReason")
        refund.setValue("pi_abc", forKey: "paymentIntentId")
        refund.setValue("duplicate", forKey: "reason")
        refund.setValue("1234-5678", forKey: "receiptNumber")
        refund.setValue("str_abc", forKey: "sourceTransferReversal")
        refund.setValue("tr_abc", forKey: "transferReversal")
        refund.setValue(Date(timeIntervalSince1970: 1700000000), forKey: "created")

        guard let typedRefund = refund as? Refund else {
            XCTFail("SCPRefund instance could not be cast to Refund")
            return
        }
        let mapped = Mappers.mapFromRefund(typedRefund)

        XCTAssertEqual(mapped["id"] as? String, "re_test_456")
        XCTAssertEqual(mapped["status"] as? String, "pending")
        XCTAssertEqual(mapped["balanceTransaction"] as? String, "bt_abc")
        XCTAssertEqual(mapped["chargeId"] as? String, "ch_xyz")
        XCTAssertEqual(mapped["description"] as? String, "Test refund")
        XCTAssertEqual(mapped["failureBalanceTransaction"] as? String, "fbt_abc")
        XCTAssertEqual(mapped["failureReason"] as? String, "expired_or_canceled_card")
        XCTAssertEqual(mapped["paymentIntentId"] as? String, "pi_abc")
        XCTAssertEqual(mapped["reason"] as? String, "duplicate")
        XCTAssertEqual(mapped["receiptNumber"] as? String, "1234-5678")
        XCTAssertEqual(mapped["sourceTransferReversal"] as? String, "str_abc")
        XCTAssertEqual(mapped["transferReversal"] as? String, "tr_abc")
        XCTAssertNotNil(mapped["created"])
    }

    func testMapFromRefundStatus() {
        XCTAssertEqual(Mappers.mapFromRefundStatus(.succeeded), "succeeded")
        XCTAssertEqual(Mappers.mapFromRefundStatus(.pending), "pending")
        XCTAssertEqual(Mappers.mapFromRefundStatus(.failed), "failed")
        XCTAssertEqual(Mappers.mapFromRefundStatus(.unknown), "unknown")
    }

    // MARK: - mapFromSetupIntent Tests

    func testMapFromSetupIntent_mapsRequiredAndOptionalFields() {
        guard let si = ObjCRuntimeHelper.createInstance(className: "SCPSetupIntent") else {
            XCTFail("Could not create SCPSetupIntent instance via Obj-C runtime")
            return
        }

        let testUuid = "test-uuid-123"

        // Set all non-nullable fields via KVC, then optional fields
        si.setValue("seti_test_789", forKey: "stripeId")
        si.setValue(true, forKey: "livemode")
        si.setValue(NSNumber(value: SetupIntentStatus.requiresConfirmation.rawValue), forKey: "status")
        si.setValue(NSNumber(value: SetupIntentUsage.offSession.rawValue), forKey: "usage")
        si.setValue([] as [NSNumber], forKey: "paymentMethodTypes")
        si.setValue("cus_test", forKey: "customer")
        si.setValue("Test setup intent", forKey: "stripeDescription")
        si.setValue("app_test", forKey: "application")
        si.setValue("cxl_reason", forKey: "cancellationReason")
        si.setValue("seti_secret_test", forKey: "clientSecret")
        si.setValue(Date(timeIntervalSince1970: 1700000000), forKey: "created")
        si.setValue("mandate_test", forKey: "mandate")
        si.setValue(["meta_key": "meta_val"], forKey: "metadata")
        si.setValue("acct_test", forKey: "onBehalfOf")
        si.setValue("pm_test", forKey: "paymentMethod")
        si.setValue("sum_test", forKey: "singleUseMandate")

        guard let typedSI = si as? SetupIntent else {
            XCTFail("SCPSetupIntent instance could not be cast to SetupIntent")
            return
        }
        let mapped = Mappers.mapFromSetupIntent(typedSI, uuid: testUuid)

        XCTAssertEqual(mapped["sdkUuid"] as? String, testUuid)
        XCTAssertEqual(mapped["id"] as? String, "seti_test_789")
        XCTAssertEqual(mapped["livemode"] as? Bool, true)
        XCTAssertEqual(mapped["status"] as? String, "requiresConfirmation")
        XCTAssertEqual(mapped["usage"] as? String, "offSession")
        XCTAssertEqual(mapped["customer"] as? String, "cus_test")
        XCTAssertEqual(mapped["description"] as? String, "Test setup intent")
        XCTAssertEqual(mapped["application"] as? String, "app_test")
        XCTAssertEqual(mapped["cancellationReason"] as? String, "cxl_reason")
        XCTAssertEqual(mapped["clientSecret"] as? String, "seti_secret_test")
        XCTAssertNotNil(mapped["created"])
        XCTAssertEqual(mapped["mandate"] as? String, "mandate_test")
        XCTAssertEqual(mapped["onBehalfOf"] as? String, "acct_test")
        XCTAssertEqual(mapped["paymentMethodId"] as? String, "pm_test")
        XCTAssertEqual(mapped["singleUseMandate"] as? String, "sum_test")

        guard let metadata = mapped["metadata"] as? NSDictionary else {
            XCTFail("metadata should be an NSDictionary")
            return
        }
        XCTAssertEqual(metadata["meta_key"] as? String, "meta_val")
    }

    func testMapFromSetupIntent_nilOptionalFieldsAreAbsent() {
        guard let si = ObjCRuntimeHelper.createInstance(className: "SCPSetupIntent") else {
            XCTFail("Could not create SCPSetupIntent instance via Obj-C runtime")
            return
        }

        // Set all non-nullable fields via KVC (required to avoid crash when Swift accesses them)
        si.setValue(NSNumber(value: SetupIntentStatus.requiresPaymentMethod.rawValue), forKey: "status")
        si.setValue(NSNumber(value: SetupIntentUsage.onSession.rawValue), forKey: "usage")
        si.setValue(false, forKey: "livemode")
        si.setValue(Date(timeIntervalSince1970: 1700000000), forKey: "created")
        si.setValue([] as [NSNumber], forKey: "paymentMethodTypes")

        guard let typedSI = si as? SetupIntent else {
            XCTFail("SCPSetupIntent instance could not be cast to SetupIntent")
            return
        }
        let mapped = Mappers.mapFromSetupIntent(typedSI, uuid: "uuid")

        XCTAssertEqual(mapped["sdkUuid"] as? String, "uuid")
        XCTAssertEqual(mapped["status"] as? String, "requiresPaymentMethod")
        XCTAssertEqual(mapped["usage"] as? String, "onSession")
        // Optional fields should be nil/absent
        XCTAssertNil(mapped["id"])
        XCTAssertNil(mapped["customer"])
        XCTAssertNil(mapped["latestAttempt"])
        XCTAssertNil(mapped["lastSetupError"])
    }

    // MARK: - mapFromSetupAttempt Tests

    func testMapFromSetupAttempt_nilReturnsNil() {
        let result = Mappers.mapFromSetupAttempt(nil)
        XCTAssertNil(result)
    }

    func testMapFromSetupAttempt_mapsAllFields() {
        guard let attempt = ObjCRuntimeHelper.createInstance(className: "SCPSetupAttempt") else {
            XCTFail("Could not create SCPSetupAttempt instance via Obj-C runtime")
            return
        }

        attempt.setValue("setatt_test_123", forKey: "stripeId")
        attempt.setValue("succeeded", forKey: "status")
        attempt.setValue("seti_parent", forKey: "setupIntent")
        attempt.setValue(true, forKey: "livemode")
        attempt.setValue(NSNumber(value: SetupIntentUsage.offSession.rawValue), forKey: "usage")
        attempt.setValue(Date(timeIntervalSince1970: 1700000000), forKey: "created")
        attempt.setValue("cus_test", forKey: "customer")
        attempt.setValue("acct_test", forKey: "onBehalfOf")
        attempt.setValue("app_test", forKey: "application")
        attempt.setValue("pm_test", forKey: "paymentMethod")

        guard let typedAttempt = attempt as? SetupAttempt else {
            XCTFail("SCPSetupAttempt instance could not be cast to SetupAttempt")
            return
        }
        let mapped = Mappers.mapFromSetupAttempt(typedAttempt)

        XCTAssertEqual(mapped?["id"] as? String, "setatt_test_123")
        XCTAssertEqual(mapped?["status"] as? String, "succeeded")
        XCTAssertEqual(mapped?["setupIntentId"] as? String, "seti_parent")
        XCTAssertEqual(mapped?["livemode"] as? Bool, true)
        XCTAssertEqual(mapped?["usage"] as? String, "offSession")
        XCTAssertNotNil(mapped?["created"])
        XCTAssertEqual(mapped?["customer"] as? String, "cus_test")
        XCTAssertEqual(mapped?["onBehalfOfId"] as? String, "acct_test")
        XCTAssertEqual(mapped?["applicationId"] as? String, "app_test")
        XCTAssertEqual(mapped?["paymentMethodId"] as? String, "pm_test")
        // setupError and paymentMethodDetails are nil by default
        XCTAssertNil(mapped?["setupError"])
        XCTAssertNil(mapped?["paymentMethodDetails"])
    }

    // MARK: - mapFromSetupAttemptPaymentMethodDetails Tests

    func testMapFromSetupAttemptPaymentMethodDetails_nilReturnsNil() {
        let result = Mappers.mapFromSetupAttemptPaymentMethodDetails(nil)
        XCTAssertNil(result)
    }

    func testMapFromSetupAttemptPaymentMethodDetails_mapsType() {
        guard let details = ObjCRuntimeHelper.createInstance(className: "SCPSetupAttemptPaymentMethodDetails") else {
            XCTFail("Could not create SCPSetupAttemptPaymentMethodDetails instance via Obj-C runtime")
            return
        }

        details.setValue(NSNumber(value: PaymentMethodType.cardPresent.rawValue), forKey: "type")

        guard let typedDetails = details as? SetupAttemptPaymentMethodDetails else {
            XCTFail("SCPSetupAttemptPaymentMethodDetails instance could not be cast to SetupAttemptPaymentMethodDetails")
            return
        }
        let mapped = Mappers.mapFromSetupAttemptPaymentMethodDetails(typedDetails)

        XCTAssertEqual(mapped?["type"] as? String, "cardPresent")
        // cardPresent and interacPresent are nil by default
        XCTAssertNil(mapped?["cardPresent"])
        XCTAssertNil(mapped?["interacPresent"])
    }

    // MARK: - mapFromSetupAttemptCardPresentDetails Tests

    func testMapFromSetupAttemptCardPresentDetails_nilReturnsNil() {
        let result = Mappers.mapFromSetupAttemptCardPresentDetails(nil)
        XCTAssertNil(result)
    }

    func testMapFromSetupAttemptCardPresentDetails_mapsFields() {
        guard let details = ObjCRuntimeHelper.createInstance(className: "SCPSetupAttemptCardPresentDetails") else {
            XCTFail("Could not create SCPSetupAttemptCardPresentDetails instance via Obj-C runtime")
            return
        }

        details.setValue("emv_auth_data_value", forKey: "emvAuthData")
        details.setValue("pm_generated_card", forKey: "generatedCard")

        guard let typedDetails = details as? SetupAttemptCardPresentDetails else {
            XCTFail("SCPSetupAttemptCardPresentDetails instance could not be cast to SetupAttemptCardPresentDetails")
            return
        }
        let mapped = Mappers.mapFromSetupAttemptCardPresentDetails(typedDetails)

        XCTAssertEqual(mapped?["emvAuthData"] as? String, "emv_auth_data_value")
        XCTAssertEqual(mapped?["generatedCard"] as? String, "pm_generated_card")
    }

    // MARK: - mapFromSetupIntentStatus Tests

    func testMapFromSetupIntentStatus() {
        XCTAssertEqual(Mappers.mapFromSetupIntentStatus(.canceled), "canceled")
        XCTAssertEqual(Mappers.mapFromSetupIntentStatus(.processing), "processing")
        XCTAssertEqual(Mappers.mapFromSetupIntentStatus(.requiresConfirmation), "requiresConfirmation")
        XCTAssertEqual(Mappers.mapFromSetupIntentStatus(.requiresPaymentMethod), "requiresPaymentMethod")
        XCTAssertEqual(Mappers.mapFromSetupIntentStatus(.succeeded), "succeeded")
        XCTAssertEqual(Mappers.mapFromSetupIntentStatus(.requiresAction), "requiresAction")
    }

    // MARK: - mapFromSetupIntentUsage Tests

    func testMapFromSetupIntentUsage() {
        XCTAssertEqual(Mappers.mapFromSetupIntentUsage(.offSession), "offSession")
        XCTAssertEqual(Mappers.mapFromSetupIntentUsage(.onSession), "onSession")
    }

    // MARK: - UpdateComponent tests

    func testMapToUpdateComponent() {
        XCTAssertEqual(Mappers.mapToUpdateComponent("firmware"), .firmware)
        XCTAssertEqual(Mappers.mapToUpdateComponent("config"), .config)
        XCTAssertEqual(Mappers.mapToUpdateComponent("keys"), .keys)
        XCTAssertEqual(Mappers.mapToUpdateComponent("incremental"), .incremental)
        XCTAssertNil(Mappers.mapToUpdateComponent("unknown"))
    }

    func testMapFromUpdateComponents() {
        let components: UpdateComponent = [.firmware, .config]
        let result = Mappers.mapFromUpdateComponents(components)
        XCTAssertTrue(result.contains("firmware"))
        XCTAssertTrue(result.contains("config"))
        XCTAssertEqual(result.count, 2)
    }

    // MARK: - TestReaderUpdate tests

    func testMapToTestReaderUpdateAvailable() {
        let dict: NSDictionary = [
            "type": "available",
            "components": ["firmware", "config"]
        ]
        let result = Mappers.mapToTestReaderUpdate(dict)
        XCTAssertNotNil(result)
        XCTAssertEqual(result!.updateType, .available)
        XCTAssertTrue(result!.components.contains(.firmware))
        XCTAssertTrue(result!.components.contains(.config))
    }

    func testMapToTestReaderUpdateRequired() {
        let dict: NSDictionary = [
            "type": "required",
            "components": ["keys"]
        ]
        let result = Mappers.mapToTestReaderUpdate(dict)
        XCTAssertNotNil(result)
        XCTAssertEqual(result!.updateType, .required)
        XCTAssertTrue(result!.components.contains(.keys))
    }

    func testMapToTestReaderUpdateRequiredOffline() {
        let dict: NSDictionary = [
            "type": "requiredOffline",
            "components": ["incremental"]
        ]
        let result = Mappers.mapToTestReaderUpdate(dict)
        XCTAssertNotNil(result)
        XCTAssertEqual(result!.updateType, .requiredOffline)
    }

    func testMapToTestReaderUpdateLowBattery() {
        let dict: NSDictionary = ["type": "lowBattery"]
        let result = Mappers.mapToTestReaderUpdate(dict)
        XCTAssertNotNil(result)
        XCTAssertEqual(result!.updateType, .lowBattery)
    }

    func testMapToTestReaderUpdateLowBatterySucceedConnect() {
        let dict: NSDictionary = ["type": "lowBatterySucceedConnect"]
        let result = Mappers.mapToTestReaderUpdate(dict)
        XCTAssertNotNil(result)
        XCTAssertEqual(result!.updateType, .lowBatterySucceedConnect)
    }

    func testMapToTestReaderUpdateRandom() {
        let dict: NSDictionary = ["type": "random"]
        let result = Mappers.mapToTestReaderUpdate(dict)
        // random returns a randomly selected type or null, just verify it doesn't crash
    }

    func testMapToTestReaderUpdateUnknownType() {
        let dict: NSDictionary = ["type": "unknown"]
        XCTAssertNil(Mappers.mapToTestReaderUpdate(dict))
    }

    func testMapToTestReaderUpdateMissingType() {
        let dict: NSDictionary = [:]
        XCTAssertNil(Mappers.mapToTestReaderUpdate(dict))

    }
}

struct TestableTextResult : stripe_terminal_react_native.TextResult {
    var skipped: Bool
    var text: String?
    var toggles: [NSNumber]
}

struct TestableNumericResult : stripe_terminal_react_native.NumericResult {
    var skipped: Bool
    var numericString: String?
    var toggles: [NSNumber]
}

struct TestablePhoneResult : stripe_terminal_react_native.PhoneResult {
    var skipped: Bool
    var phone: String?
    var toggles: [NSNumber]
}

struct TestableEmailResult : stripe_terminal_react_native.EmailResult {
    var skipped: Bool
    var email: String?
    var toggles: [NSNumber]
}

struct TestableSelectionResult : stripe_terminal_react_native.SelectionResult {
    var skipped: Bool
    var selection: String?
    var selectionId: String?
    var toggles: [NSNumber]
}

struct TestableSignatureResult : stripe_terminal_react_native.SignatureResult {
    var skipped: Bool
    var signatureSvg: String?
    var toggles: [NSNumber]
}

// MARK: - Obj-C Runtime Helper

/// Helper to create instances of SDK classes that have `init NS_UNAVAILABLE`.
/// These are Obj-C classes (NSObject subclasses) so we can use the runtime to
/// allocate + init them, then use KVC (setValue:forKey:) to set properties.
private enum ObjCRuntimeHelper {
    static func createInstance(className: String) -> NSObject? {
        guard let cls = NSClassFromString(className) as? NSObject.Type else {
            return nil
        }
        guard let allocated = cls.perform(NSSelectorFromString("alloc"))?.takeRetainedValue() as? NSObject else {
            return nil
        }
        // takeUnretainedValue is correct here because init returns self for these concrete
        // NSObject subclasses (not class clusters), so the retain from alloc still applies.
        guard let initialized = allocated.perform(NSSelectorFromString("init"))?.takeUnretainedValue() as? NSObject else {
            return nil
        }
        return initialized
    }
}
