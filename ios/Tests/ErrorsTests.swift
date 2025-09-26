import XCTest
import StripeTerminal

@testable import stripe_terminal_react_native

final class ErrorsTests: XCTestCase {

    private func makeNSError(
        domain: String = "com.stripe-terminal",
        code: Int = 0,
        userInfo: [String: Any] = [:],
        description: String = "Error occurred",
        failureReason: String? = nil,
        recoverySuggestion: String? = nil
    ) -> NSError {
        var info: [String: Any] = userInfo
        info[NSLocalizedDescriptionKey] = description
        if let failureReason {
            info[NSLocalizedFailureReasonErrorKey] = failureReason
        }
        if let recoverySuggestion {
            info[NSLocalizedRecoverySuggestionErrorKey] = recoverySuggestion
        }
        return NSError(domain: domain, code: code, userInfo: info)
    }

    func testMapToStripeErrorObject_StripeDomain() {
        // GIVEN an NSError within the Stripe domain
        let underlying = makeNSError(domain: "underlying.domain", code: 42, description: "Underlying failure")
        let nsError = makeNSError(
            code: ErrorCode.Code.readerBusy.rawValue,
            userInfo: [NSUnderlyingErrorKey: underlying],
            description: "Reader is busy",
            failureReason: "The reader is currently in use",
            recoverySuggestion: "Wait and retry"
        )

        // WHEN mapping to stripe error object
        let error = Errors.mapToStripeErrorObject(nsError: nsError)

        // THEN
        XCTAssertEqual(error["name"] as? String, "StripeError")
        XCTAssertEqual(error["code"] as? String, "READER_BUSY")
        XCTAssertEqual(error["nativeErrorCode"] as? String, String(ErrorCode.Code.readerBusy.rawValue))
        XCTAssertEqual(error["message"] as? String, "Reader is busy")

        guard let metadata = error["metadata"] as? [String: Any] else {
            return XCTFail("Metadata should be present")
        }
        XCTAssertEqual(metadata["domain"] as? String, "com.stripe-terminal")
        XCTAssertEqual(metadata["isStripeError"] as? Bool, true)
        XCTAssertEqual(metadata["localizedFailureReason"] as? String, "The reader is currently in use")
        XCTAssertEqual(metadata["localizedRecoverySuggestion"] as? String, "Wait and retry")
        XCTAssertEqual(metadata["unmappedErrorCode"] as? String, nil)

        guard let underlyingInfo = metadata["underlyingError"] as? [String: Any] else {
            return XCTFail("Underlying metadata should be present")
        }
        XCTAssertEqual(underlyingInfo["domain"] as? String, "underlying.domain")
        XCTAssertEqual(underlyingInfo["code"] as? Int, 42)
        XCTAssertEqual(underlyingInfo["message"] as? String, "Underlying failure")
    }

    func testMapToStripeErrorObject_NonStripeDomain() {
        // GIVEN an NSError from a non-Stripe domain
        let nsError = makeNSError(domain: "com.partner", code: 99, description: "Partner failure")

        // WHEN mapping to stripe error object
        let error = Errors.mapToStripeErrorObject(nsError: nsError)

        // THEN metadata should reflect non-stripe domain
        XCTAssertEqual(error["name"] as? String, "NonStripeError")
        XCTAssertEqual(error["code"] as? String, "UNEXPECTED_SDK_ERROR")
        XCTAssertEqual(error["nativeErrorCode"] as? String, "com.partner:99")
        XCTAssertEqual(error["message"] as? String, "Partner failure")

        guard let metadata = error["metadata"] as? [String: Any] else {
            return XCTFail("Metadata should be present")
        }
        XCTAssertEqual(metadata["domain"] as? String, "com.partner")
        XCTAssertEqual(metadata["isStripeError"] as? Bool, false)
    }

    func testMapToStripeErrorObject_UnmappedStripeCode() {
        // GIVEN a Stripe-domain error with unmapped code
        let nsError = makeNSError(code: 99999, description: "Unknown code")

        // WHEN mapping to stripe error object
        let error = Errors.mapToStripeErrorObject(nsError: nsError)

        // THEN the code should fallback to UNEXPECTED_SDK_ERROR with unmappedErrorCode metadata
        XCTAssertEqual(error["code"] as? String, "UNEXPECTED_SDK_ERROR")
        XCTAssertEqual(error["nativeErrorCode"] as? String, "99999")
        guard let metadata = error["metadata"] as? [String: Any] else {
            return XCTFail("Metadata should exist")
        }
        XCTAssertEqual(metadata["unmappedErrorCode"] as? String, "UNKNOWN_ERROR(99999)")
    }

    func testCreateErrorReturnsWrappedStructure() {
        // GIVEN an NSError
        let nsError = makeNSError(code: ErrorCode.Code.readerBusy.rawValue)

        // WHEN createError is called
        let wrapped = Errors.createError(nsError: nsError)

        // THEN it should return a wrapper dictionary with error map
        guard let error = wrapped["error"] as? [String: Any] else {
            return XCTFail("Expected error key in wrapper")
        }
        XCTAssertEqual(error["name"] as? String, "StripeError")
    }

    func testSanitizeUserInfoFiltersUnsupportedTypes() {
        // GIVEN userInfo containing complex nested structures
        let underlying = makeNSError(domain: "nested", code: 12, userInfo: ["nonJson": NSSet(array: [1, 2])])
        let nsError = makeNSError(
            userInfo: [
                "string": "value",
                "number": 10,
                NSUnderlyingErrorKey: underlying,
                "date": Date(timeIntervalSince1970: 0),
                "url": URL(string: "https://example.com") as Any
            ]
        )

        let metadata = Errors.mapToStripeErrorObject(nsError: nsError)["metadata"] as? [String: Any]
        XCTAssertNotNil(metadata?["userInfo"])
    }

    // MARK: - createError Overloads Tests

    func testCreateError_withErrorCodeAndMessage() {
        // GIVEN an ErrorCode.Code and message
        let code = ErrorCode.Code.readerBusy
        let message = "Reader is currently busy"

        // WHEN createError is called
        let result = Errors.createError(code: code, message: message)

        // THEN it should return wrapped error with correct mapping
        guard let error = result["error"] as? [String: Any] else {
            return XCTFail("Expected error key in result")
        }
        XCTAssertEqual(error["name"] as? String, "StripeError")
        XCTAssertEqual(error["code"] as? String, "READER_BUSY")
        XCTAssertEqual(error["message"] as? String, message)
        XCTAssertEqual(error["nativeErrorCode"] as? String, code.stringValue)
    }

    func testCreateError_withRNCodeStringAndMessage() {
        // GIVEN an RN error code string and message
        let rnCode = "BLUETOOTH_PERMISSION_DENIED"
        let message = "Bluetooth access denied"

        // WHEN createError is called
        let result = Errors.createError(rnCode: rnCode, message: message)

        // THEN it should return wrapped error
        guard let error = result["error"] as? [String: Any] else {
            return XCTFail("Expected error key in result")
        }
        XCTAssertEqual(error["name"] as? String, "StripeError")
        XCTAssertEqual(error["code"] as? String, rnCode)
        XCTAssertEqual(error["message"] as? String, message)
        XCTAssertEqual(error["nativeErrorCode"] as? String, rnCode)
    }

    func testCreateError_withRNErrorCodeEnumAndMessage() {
        // GIVEN an RNErrorCode enum and message
        let rnCode = Errors.RNErrorCode.CANCEL_FAILED
        let message = "Cancel operation failed"

        // WHEN createError is called
        let result = Errors.createError(rnCode: rnCode, message: message)

        // THEN it should return wrapped error
        guard let error = result["error"] as? [String: Any] else {
            return XCTFail("Expected error key in result")
        }
        XCTAssertEqual(error["name"] as? String, "StripeError")
        XCTAssertEqual(error["code"] as? String, rnCode.rawValue)
        XCTAssertEqual(error["message"] as? String, message)
        XCTAssertEqual(error["nativeErrorCode"] as? String, rnCode.rawValue)
    }

    // MARK: - validateRequiredParameters Tests

    func testValidateRequiredParameters_allPresent() {
        // GIVEN a dictionary with all required parameters
        let params: NSDictionary = [
            "param1": "value1",
            "param2": 42,
            "param3": true
        ]
        let requiredParams = ["param1", "param2", "param3"]

        // WHEN validateRequiredParameters is called
        let result = Errors.validateRequiredParameters(params: params, requiredParams: requiredParams)

        // THEN it should return nil (no missing parameters)
        XCTAssertNil(result)
    }

    func testValidateRequiredParameters_someMissing() {
        // GIVEN a dictionary missing some required parameters
        let params: NSDictionary = [
            "param1": "value1",
            "param3": true
        ]
        let requiredParams = ["param1", "param2", "param3"]

        // WHEN validateRequiredParameters is called
        let result = Errors.validateRequiredParameters(params: params, requiredParams: requiredParams)

        // THEN it should return the missing parameter name
        XCTAssertEqual(result, "param2")
    }

    func testValidateRequiredParameters_multipleMissing() {
        // GIVEN a dictionary missing multiple required parameters
        let params: NSDictionary = [
            "param1": "value1"
        ]
        let requiredParams = ["param1", "param2", "param3"]

        // WHEN validateRequiredParameters is called
        let result = Errors.validateRequiredParameters(params: params, requiredParams: requiredParams)

        // THEN it should return comma-separated missing parameters
        XCTAssertEqual(result, "param2, param3")
    }

    func testValidateRequiredParameters_emptyParams() {
        // GIVEN an empty dictionary
        let params: NSDictionary = [:]
        let requiredParams = ["param1", "param2"]

        // WHEN validateRequiredParameters is called
        let result = Errors.validateRequiredParameters(params: params, requiredParams: requiredParams)

        // THEN it should return all required parameters as missing
        XCTAssertEqual(result, "param1, param2")
    }

    func testValidateRequiredParameters_noRequiredParams() {
        // GIVEN any dictionary with no required parameters
        let params: NSDictionary = ["param1": "value1"]
        let requiredParams: [String] = []

        // WHEN validateRequiredParameters is called
        let result = Errors.validateRequiredParameters(params: params, requiredParams: requiredParams)

        // THEN it should return nil
        XCTAssertNil(result)
    }

    // MARK: - Edge Cases and Boundary Tests

    func testMapToStripeErrorObject_emptyMessage() {
        // GIVEN an NSError with empty message
        let nsError = makeNSError(description: "")

        // WHEN mapping to stripe error object
        let error = Errors.mapToStripeErrorObject(nsError: nsError)

        // THEN message should fallback to "Unknown error"
        XCTAssertEqual(error["message"] as? String, "Unknown error")
    }

    func testMapToStripeErrorObject_withPaymentIntent() {
        // GIVEN an NSError with payment intent in userInfo
        let paymentIntentId = "pi_test_123"
        let nsError = makeNSError(
            code: ErrorCode.Code.readerBusy.rawValue,
            userInfo: ["paymentIntent": paymentIntentId]
        )

        // WHEN mapping to stripe error object
        let error = Errors.mapToStripeErrorObject(nsError: nsError)

        // THEN payment intent should be preserved in userInfo
        guard let metadata = error["metadata"] as? [String: Any],
              let userInfo = metadata["userInfo"] as? [String: Any] else {
            return XCTFail("Expected userInfo in metadata")
        }
        XCTAssertEqual(userInfo["paymentIntent"] as? String, paymentIntentId)
    }

    func testMapToStripeErrorObject_complexNestedUserInfo() {
        // GIVEN an NSError with deeply nested userInfo
        let complexUserInfo: [String: Any] = [
            "level1": [
                "level2": [
                    "level3": ["key": "value"],
                    "array": [1, 2, 3],
                    "url": URL(string: "https://example.com")!,
                    "date": Date(timeIntervalSince1970: 1234567890)
                ]
            ],
            "unsupported": NSSet(array: ["filtered", "out"])
        ]
        let nsError = makeNSError(userInfo: complexUserInfo)

        // WHEN mapping to stripe error object
        let error = Errors.mapToStripeErrorObject(nsError: nsError)

        // THEN nested structures should be preserved and unsupported types filtered
        guard let metadata = error["metadata"] as? [String: Any],
              let userInfo = metadata["userInfo"] as? [String: Any] else {
            return XCTFail("Expected userInfo in metadata")
        }
        
        XCTAssertNotNil(userInfo["level1"])
        XCTAssertNotNil(userInfo["unsupported"]) // Converted to string description
    }

    // MARK: - Comprehensive ErrorCode Mapping Tests

    func testErrorCodeMapping_integrationErrors() {
        // GIVEN integration-related ErrorCode.Code values
        let testCases: [(ErrorCode.Code, String)] = [
            (.canceled, "CANCELED"),
            (.notConnectedToReader, "NOT_CONNECTED_TO_READER"),
            (.alreadyConnectedToReader, "ALREADY_CONNECTED_TO_READER"),
            (.confirmInvalidPaymentIntent, "CONFIRM_INVALID_PAYMENT_INTENT"),
            (.invalidRefundParameters, "INVALID_REQUIRED_PARAMETER"),
            (.cancelFailedAlreadyCompleted, "CANCEL_FAILED"),
            (.invalidClientSecret, "INVALID_CLIENT_SECRET"),
            (.invalidDiscoveryConfiguration, "MISSING_REQUIRED_PARAMETER"),
            (.unsupportedSDK, "UNSUPPORTED_SDK"),
            (.invalidRequiredParameter, "INVALID_REQUIRED_PARAMETER"),
            (.invalidRequiredParameterOnBehalfOf, "INVALID_REQUIRED_PARAMETER"),
            (.readerConnectionConfigurationInvalid, "MISSING_REQUIRED_PARAMETER"),
            (.readerTippingParameterInvalid, "INVALID_TIP_PARAMETER"),
            (.invalidLocationIdParameter, "MISSING_REQUIRED_PARAMETER")
        ]

        for (errorCode, expectedRNCode) in testCases {
            // WHEN creating error with integration ErrorCode
            let nsError = makeNSError(code: errorCode.rawValue)
            let error = Errors.mapToStripeErrorObject(nsError: nsError)

            // THEN it should map to correct RN error code
            XCTAssertEqual(error["code"] as? String, expectedRNCode, 
                          "Failed integration mapping for \(errorCode)")
        }
    }

    func testErrorCodeMapping_bluetoothErrors() {
        // GIVEN Bluetooth-related ErrorCode.Code values
        let testCases: [(ErrorCode.Code, String)] = [
            (.bluetoothDisabled, "BLUETOOTH_PERMISSION_DENIED"),
            (.bluetoothAccessDenied, "BLUETOOTH_PERMISSION_DENIED"),
            (.bluetoothScanTimedOut, "BLUETOOTH_SCAN_TIMED_OUT"),
            (.bluetoothLowEnergyUnsupported, "BLUETOOTH_LOW_ENERGY_UNSUPPORTED"),
            (.bluetoothError, "BLUETOOTH_ERROR"),
            (.bluetoothDisconnected, "BLUETOOTH_DISCONNECTED"),
            (.bluetoothPeerRemovedPairingInformation, "BLUETOOTH_ERROR"),
            (.bluetoothAlreadyPairedWithAnotherDevice, "READER_CONNECTED_TO_ANOTHER_DEVICE"),
            (.bluetoothConnectTimedOut, "REQUEST_TIMED_OUT"),
            (.bluetoothConnectionFailedBatteryCriticallyLow, "READER_BATTERY_CRITICALLY_LOW"),
            (.bluetoothReconnectStarted, "BLUETOOTH_RECONNECT_STARTED"),
            (.bluetoothConnectionInvalidLocationIdParameter, "INVALID_REQUIRED_PARAMETER")
        ]

        for (errorCode, expectedRNCode) in testCases {
            // WHEN creating error with Bluetooth ErrorCode
            let nsError = makeNSError(code: errorCode.rawValue)
            let error = Errors.mapToStripeErrorObject(nsError: nsError)

            // THEN it should map to correct RN error code
            XCTAssertEqual(error["code"] as? String, expectedRNCode, 
                          "Failed Bluetooth mapping for \(errorCode)")
        }
    }

    func testErrorCodeMapping_readerErrors() {
        // GIVEN Reader-related ErrorCode.Code values
        let testCases: [(ErrorCode.Code, String)] = [
            (.readerBusy, "READER_BUSY"),
            (.readerCommunicationError, "READER_COMMUNICATION_ERROR"),
            (.incompatibleReader, "UNSUPPORTED_READER_VERSION"),
            (.unsupportedReaderVersion, "UNSUPPORTED_READER_VERSION"),
            (.unknownReaderIpAddress, "GENERIC_READER_ERROR"),
            (.connectFailedReaderIsInUse, "READER_CONNECTED_TO_ANOTHER_DEVICE"),
            (.unexpectedReaderError, "GENERIC_READER_ERROR"),
            (.encryptionKeyFailure, "READER_MISSING_ENCRYPTION_KEYS"),
            (.encryptionKeyStillInitializing, "READER_MISSING_ENCRYPTION_KEYS"),
            (.readerMissingEncryptionKeys, "READER_MISSING_ENCRYPTION_KEYS"),
            (.invalidReaderForUpdate, "READER_SOFTWARE_UPDATE_FAILED"),
            (.readerSoftwareUpdateFailed, "READER_SOFTWARE_UPDATE_FAILED"),
            (.readerSoftwareUpdateFailedBatteryLow, "READER_SOFTWARE_UPDATE_FAILED_BATTERY_LOW"),
            (.readerSoftwareUpdateFailedServerError, "READER_SOFTWARE_UPDATE_FAILED_SERVER_ERROR"),
            (.readerSoftwareUpdateFailedReaderError, "READER_SOFTWARE_UPDATE_FAILED_READER_ERROR"),
            (.readerSoftwareUpdateFailedInterrupted, "READER_SOFTWARE_UPDATE_FAILED_INTERRUPTED"),
            (.readerSoftwareUpdateFailedExpiredUpdate, "READER_SOFTWARE_UPDATE_FAILED"),
            (.readerConnectionOfflineNeedsUpdate, "UNSUPPORTED_READER_VERSION"),
            (.readerNotAccessibleInBackground, "UNSUPPORTED_OPERATION")
        ]

        for (errorCode, expectedRNCode) in testCases {
            // WHEN creating error with Reader ErrorCode
            let nsError = makeNSError(code: errorCode.rawValue)
            let error = Errors.mapToStripeErrorObject(nsError: nsError)

            // THEN it should map to correct RN error code
            XCTAssertEqual(error["code"] as? String, expectedRNCode, 
                          "Failed Reader mapping for \(errorCode)")
        }
    }

    func testErrorCodeMapping_paymentErrors() {
        // GIVEN Payment-related ErrorCode.Code values
        let testCases: [(ErrorCode.Code, String)] = [
            (.declinedByStripeAPI, "DECLINED_BY_STRIPE_API"),
            (.declinedByReader, "DECLINED_BY_READER"),
            (.refundFailed, "STRIPE_API_ERROR"),
            (.cardInsertNotRead, "CARD_INSERT_NOT_READ"),
            (.cardSwipeNotRead, "CARD_SWIPE_NOT_READ"),
            (.cardReadTimedOut, "CARD_READ_TIMED_OUT"),
            (.cardRemoved, "CARD_REMOVED"),
            (.cardLeftInReader, "CARD_LEFT_IN_READER"),
            (.cardSwipeNotAvailable, "CARD_SWIPE_NOT_AVAILABLE"),
            (.commandRequiresCardholderConsent, "CUSTOMER_CONSENT_REQUIRED"),
            (.invalidAmount, "INVALID_REQUIRED_PARAMETER"),
            (.invalidCurrency, "INVALID_REQUIRED_PARAMETER")
        ]

        for (errorCode, expectedRNCode) in testCases {
            // WHEN creating error with Payment ErrorCode
            let nsError = makeNSError(code: errorCode.rawValue)
            let error = Errors.mapToStripeErrorObject(nsError: nsError)

            // THEN it should map to correct RN error code
            XCTAssertEqual(error["code"] as? String, expectedRNCode, 
                          "Failed Payment mapping for \(errorCode)")
        }
    }

    func testErrorCodeMapping_networkErrors() {
        // GIVEN Network-related ErrorCode.Code values
        let testCases: [(ErrorCode.Code, String)] = [
            (.connectionTokenProviderCompletedWithNothing, "CONNECTION_TOKEN_PROVIDER_ERROR"),
            (.connectionTokenProviderCompletedWithNothingWhileForwarding, "CONNECTION_TOKEN_PROVIDER_ERROR_WHILE_FORWARDING"),
            (.connectionTokenProviderCompletedWithError, "CONNECTION_TOKEN_PROVIDER_ERROR"),
            (.connectionTokenProviderCompletedWithErrorWhileForwarding, "CONNECTION_TOKEN_PROVIDER_ERROR_WHILE_FORWARDING"),
            (.connectionTokenProviderTimedOut, "REQUEST_TIMED_OUT"),
            (.internetConnectTimeOut, "REQUEST_TIMED_OUT"),
            (.requestTimedOut, "REQUEST_TIMED_OUT"),
            (.notConnectedToInternet, "STRIPE_API_CONNECTION_ERROR"),
            (.stripeAPIError, "STRIPE_API_ERROR"),
            (.stripeAPIResponseDecodingError, "STRIPE_API_RESPONSE_DECODING_ERROR"),
            (.internalNetworkError, "STRIPE_API_CONNECTION_ERROR"),
            (.sessionExpired, "SESSION_EXPIRED")
        ]

        for (errorCode, expectedRNCode) in testCases {
            // WHEN creating error with Network ErrorCode
            let nsError = makeNSError(code: errorCode.rawValue)
            let error = Errors.mapToStripeErrorObject(nsError: nsError)

            // THEN it should map to correct RN error code
            XCTAssertEqual(error["code"] as? String, expectedRNCode, 
                          "Failed Network mapping for \(errorCode)")
        }
    }

    func testErrorCodeMapping_offlineErrors() {
        // GIVEN Offline-related ErrorCode.Code values
        let testCases: [(ErrorCode.Code, String)] = [
            (.offlineAndCardExpired, "OFFLINE_AND_CARD_EXPIRED"),
            (.offlineTransactionDeclined, "OFFLINE_TRANSACTION_DECLINED"),
            (.interacNotSupportedOffline, "INTERAC_NOT_SUPPORTED_OFFLINE"),
            (.onlinePinNotSupportedOffline, "ONLINE_PIN_NOT_SUPPORTED_OFFLINE"),
            (.offlineTestCardInLivemode, "OFFLINE_TESTMODE_PAYMENT_IN_LIVEMODE"),
            (.offlinePaymentsDatabaseTooLarge, "OFFLINE_PAYMENTS_DATABASE_TOO_LARGE"),
            (.readerConnectionNotAvailableOffline, "READER_CONNECTION_NOT_AVAILABLE_OFFLINE"),
            (.offlineCollectAndConfirmMismatch, "OFFLINE_COLLECT_AND_CONFIRM_MISMATCH"),
            (.readerConnectionOfflineLocationMismatch, "LOCATION_CONNECTION_NOT_AVAILABLE_OFFLINE"),
            (.readerConnectionOfflinePairingUnseenDisabled, "MISSING_PREREQUISITE"),
            (.noLastSeenAccount, "NO_LAST_SEEN_ACCOUNT"),
            (.notConnectedToInternetAndOfflineBehaviorRequireOnline, "NOT_CONNECTED_TO_INTERNET_AND_REQUIRE_ONLINE_SET"),
            (.amountExceedsMaxOfflineAmount, "AMOUNT_EXCEEDS_MAX_OFFLINE_AMOUNT"),
            (.missingEMVData, "MISSING_EMV_DATA"),
            (.invalidOfflineCurrency, "INVALID_OFFLINE_CURRENCY"),
            (.accountIdMismatchWhileForwarding, "ACCOUNT_ID_MISMATCH_WHILE_FORWARDING"),
            (.updatePaymentIntentUnavailableWhileOffline, "UNEXPECTED_OPERATION"),
            (.updatePaymentIntentUnavailableWhileOfflineModeEnabled, "UNEXPECTED_OPERATION"),
            (.forwardingLiveModePaymentInTestMode, "OFFLINE_LIVEMODE_PAYMENT_IN_TESTMODE"),
            (.forwardingTestModePaymentInLiveMode, "OFFLINE_TESTMODE_PAYMENT_IN_LIVEMODE"),
            (.offlineBehaviorForceOfflineWithFeatureDisabled, "FORCE_OFFLINE_WITH_FEATURE_DISABLED")
        ]

        for (errorCode, expectedRNCode) in testCases {
            // WHEN creating error with Offline ErrorCode
            let nsError = makeNSError(code: errorCode.rawValue)
            let error = Errors.mapToStripeErrorObject(nsError: nsError)

            // THEN it should map to correct RN error code
            XCTAssertEqual(error["code"] as? String, expectedRNCode, 
                          "Failed Offline mapping for \(errorCode)")
        }
    }

    func testErrorCodeMapping_miscellaneousErrors() {
        // GIVEN Miscellaneous ErrorCode.Code values
        let testCases: [(ErrorCode.Code, String)] = [
            (.locationServicesDisabled, "LOCATION_SERVICES_DISABLED"),
            (.nfcDisabled, "TAP_TO_PAY_NFC_DISABLED"),
            (.commandNotAllowed, "UNSUPPORTED_OPERATION"),
            (.unsupportedMobileDeviceConfiguration, "UNSUPPORTED_OPERATION"),
            (.passcodeNotEnabled, "UNSUPPORTED_OPERATION"),
            (.commandNotAllowedDuringCall, "UNSUPPORTED_OPERATION"),
            (.featureNotAvailableWithConnectedReader, "UNSUPPORTED_OPERATION"),
            (.featureNotAvailable, "UNSUPPORTED_OPERATION"),
            (.invalidListLocationsLimitParameter, "INVALID_REQUIRED_PARAMETER"),
            (.collectInputsApplicationError, "COLLECT_INPUTS_APPLICATION_ERROR"),
            (.collectInputsTimedOut, "COLLECT_INPUTS_TIMED_OUT"),
            (.collectInputsInvalidParameter, "COLLECT_INPUTS_INVALID_PARAMETER"),
            (.collectInputsUnsupported, "COLLECT_INPUTS_UNSUPPORTED"),
            (.surchargeNoticeRequiresUpdatePaymentIntent, "ALLOW_REDISPLAY_INVALID"),
            (.surchargeUnavailableWithDynamicCurrencyConversion, "UNEXPECTED_OPERATION"),
            (.requestDynamicCurrencyConversionRequiresUpdatePaymentIntent, "UNEXPECTED_OPERATION"),
            (.dynamicCurrencyConversionNotAvailable, "UNEXPECTED_OPERATION"),
            (.surchargingNotAvailable, "UNEXPECTED_OPERATION"),
            (.usbDiscoveryTimedOut, "USB_DISCOVERY_TIMED_OUT"),
            (.usbDisconnected, "USB_DISCONNECTED"),
            (.unexpectedSdkError, "UNEXPECTED_SDK_ERROR")
        ]

        for (errorCode, expectedRNCode) in testCases {
            // WHEN creating error with Miscellaneous ErrorCode
            let nsError = makeNSError(code: errorCode.rawValue)
            let error = Errors.mapToStripeErrorObject(nsError: nsError)

            // THEN it should map to correct RN error code
            XCTAssertEqual(error["code"] as? String, expectedRNCode, 
                          "Failed Miscellaneous mapping for \(errorCode)")
        }
    }

    func testErrorCodeMapping_unknownDefault() {
        // GIVEN an unknown ErrorCode that would trigger @unknown default
        // We use a non-existent raw value that StripeTerminal SDK doesn't recognize
        let unknownRawValue = 999999
        let nsError = makeNSError(code: unknownRawValue)

        // WHEN mapping the unknown error code
        let error = Errors.mapToStripeErrorObject(nsError: nsError)

        // THEN it should map to UNEXPECTED_SDK_ERROR via @unknown default
        XCTAssertEqual(error["code"] as? String, "UNEXPECTED_SDK_ERROR", 
                      "Unknown ErrorCode should map to UNEXPECTED_SDK_ERROR")
        
        // AND should have unmappedErrorCode in metadata
        guard let metadata = error["metadata"] as? [String: Any] else {
            return XCTFail("Expected metadata for unknown error code")
        }
        XCTAssertNotNil(metadata["unmappedErrorCode"], 
                       "Unknown ErrorCode should have unmappedErrorCode in metadata")
    }
}

