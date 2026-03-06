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
        XCTAssertEqual(setupIntent.customer, "fakeCustomer")
        XCTAssertEqual(setupIntent.paymentMethodTypes, [PaymentMethodType.card, PaymentMethodType.cardPresent])
        XCTAssertEqual(setupIntent.usage, SetupIntentUsage.onSession)
    }

    func testMapToSetupIntentUsage() {
        XCTAssertEqual(Mappers.mapToSetupIntentUsage("onSession"), SetupIntentUsage.onSession)
        XCTAssertEqual(Mappers.mapToSetupIntentUsage("offSession"), SetupIntentUsage.offSession)
    }

    func testMapToPaymentMethodTypeArray() {
        let array : NSArray = ["card", "cardPresent"]
        XCTAssertEqual(Mappers.mapToPaymentMethodTypeArray(array), [PaymentMethodType.card, PaymentMethodType.cardPresent])
    }

    func testMapToPaymentMethodType() {
        XCTAssertEqual(Mappers.mapToPaymentMethodType("card"), PaymentMethodType.card)
        XCTAssertEqual(Mappers.mapToPaymentMethodType("cardPresent"), PaymentMethodType.cardPresent)
        XCTAssertEqual(Mappers.mapToPaymentMethodType("interacPresent"), PaymentMethodType.interacPresent)
        XCTAssertEqual(Mappers.mapToPaymentMethodType("wechatPay"), PaymentMethodType.wechatPay)
        XCTAssertEqual(Mappers.mapToPaymentMethodType("adbPay"), PaymentMethodType.unknown)
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

    func testBuildCollectPaymentIntentConfigurationWithAllParameters() throws {
        // GIVEN params with all configuration parameters
        let params: NSDictionary = [
            "skipTipping": true,
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
        XCTAssertEqual(config.updatePaymentIntent, true)
        XCTAssertEqual(config.requestDynamicCurrencyConversion, true)
        XCTAssertEqual(config.customerCancellation, .enableIfAvailable)
        XCTAssertEqual(config.allowRedisplay, .always)
        XCTAssertEqual(config.surchargeNotice, "Test surcharge notice")
        XCTAssertEqual(config.tippingConfiguration?.eligibleAmount, 1000)
        XCTAssertEqual(config.motoConfiguration?.skipCvc, true)
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

    func testMapToSetupIntentCollectionReason() {
        XCTAssertEqual(Mappers.mapToSetupIntentCollectionReason("saveCard"), .saveCard)
        XCTAssertEqual(Mappers.mapToSetupIntentCollectionReason("verify"), .verify)
        XCTAssertNil(Mappers.mapToSetupIntentCollectionReason("invalid"))
        XCTAssertNil(Mappers.mapToSetupIntentCollectionReason(nil))
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
