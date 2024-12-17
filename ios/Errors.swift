import StripeTerminal

enum CommonErrorType: String {
    case InvalidRequiredParameter
    case AlreadyDiscovering
}

class Errors {
    class func validateRequiredParameters(params: NSDictionary, requiredParams: [String]) -> String? {
        var invalid: [String] = []

        requiredParams.forEach {
            if (params.object(forKey: $0) == nil) {
                invalid.append($0)
            }
        }
        let joined = invalid.joined(separator: ", ")
        return joined.isEmpty ? nil : joined
    }

    class func createError(code: ErrorCode.Code, message: String) -> [String: Any] {
        return createError(errorCode: code.stringValue, message: message)
    }

    class func createError(code: CommonErrorType, message: String) -> [String: Any] {
        return createError(errorCode: code.rawValue, message: message)
    }

    class func createError(nsError: NSError) -> [String: Any] {
        return createError(code: ErrorCode.Code.init(rawValue: nsError.code) ?? ErrorCode.unexpectedSdkError, message: nsError.localizedDescription)
    }

    private class func createError(errorCode: String, message: String) -> [String: Any] {
        let error = [
            "code": errorCode,
            "message": message
        ]
        return ["error": error]
    }
}

func busyMessage(command: String, by busyCommand: String) -> String {
    return "Could not execute \(command) because the SDK is busy with another command: \(busyCommand)."
}

extension ErrorCode.Code {
    var stringValue: String {
        switch self {
        case .cancelFailedAlreadyCompleted:
            return "CancelFailedAlreadyCompleted"
        case .notConnectedToReader:
            return "NotConnectedToReader"
        case .alreadyConnectedToReader:
            return "AlreadyConnectedToReader"
        case .connectionTokenProviderCompletedWithNothing:
            return "ConnectionTokenProviderCompletedWithNothing"
        case .connectionTokenProviderCompletedWithNothingWhileForwarding:
            return "ConnectionTokenProviderCompletedWithNothingWhileForwarding"
        case .nilPaymentIntent:
            return "NilPaymentIntent"
        case .confirmInvalidPaymentIntent:
            return "ConfirmInvalidPaymentIntent"
        case .nilSetupIntent:
            return "NilSetupIntent"
        case .nilRefundPaymentMethod:
            return "NilRefundPaymentMethod"
        case .invalidRefundParameters:
            return "InvalidRefundParameters"
        case .invalidClientSecret:
            return "InvalidClientSecret"
        case .invalidDiscoveryConfiguration:
            return "InvalidDiscoveryConfiguration"
        case .invalidReaderForUpdate:
            return "InvalidReaderForUpdate"
        case .unsupportedSDK:
            return "UnsupportedSDK"
        case .featureNotAvailableWithConnectedReader:
            return "FeatureNotAvailableWithConnectedReader"
        case .featureNotAvailable:
            return "FeatureNotAvailable"
        case .invalidListLocationsLimitParameter:
            return "InvalidListLocationsLimitParameter"
        case .bluetoothConnectionInvalidLocationIdParameter:
            return "BluetoothConnectionInvalidLocationIdParameter"
        case .canceled:
            return "Canceled"
        case .locationServicesDisabled:
            return "LocationServicesDisabled"
        case .bluetoothDisabled:
            return "BluetoothDisabled"
        case .bluetoothAccessDenied:
            return "BluetoothAccessDenied"
        case .bluetoothScanTimedOut:
            return "BluetoothScanTimedOut"
        case .bluetoothLowEnergyUnsupported:
            return "BluetoothLowEnergyUnsupported"
        case .readerSoftwareUpdateFailedBatteryLow:
            return "ReaderSoftwareUpdateFailedBatteryLow"
        case .readerSoftwareUpdateFailedInterrupted:
            return "ReaderSoftwareUpdateFailedInterrupted"
        case .readerSoftwareUpdateFailedExpiredUpdate:
            return "ReaderSoftwareUpdateFailedExpiredUpdate"
        case .bluetoothConnectionFailedBatteryCriticallyLow:
            return "BluetoothConnectionFailedBatteryCriticallyLow"
        case .cardInsertNotRead:
            return "CardInsertNotRead"
        case .cardSwipeNotRead:
            return "CardSwipeNotRead"
        case .cardReadTimedOut:
            return "CardReadTimedOut"
        case .cardRemoved:
            return "CardRemoved"
        case .cardLeftInReader:
            return "CardLeftInReader"
        case .readerBusy:
            return "ReaderBusy"
        case .incompatibleReader:
            return "IncompatibleReader"
        case .readerCommunicationError:
            return "ReaderCommunicationError"
        case .bluetoothError:
            return "BluetoothError"
        case .bluetoothConnectTimedOut:
            return "BluetoothConnectTimedOut"
        case .bluetoothDisconnected:
            return "BluetoothDisconnected"
        case .bluetoothPeerRemovedPairingInformation:
            return "BluetoothPeerRemovedPairingInformation"
        case .bluetoothAlreadyPairedWithAnotherDevice:
            return "BluetoothAlreadyPairedWithAnotherDevice"
        case .readerSoftwareUpdateFailed:
            return "ReaderSoftwareUpdateFailed"
        case .readerSoftwareUpdateFailedReaderError:
            return "ReaderSoftwareUpdateFailedReaderError"
        case .readerSoftwareUpdateFailedServerError:
            return "ReaderSoftwareUpdateFailedServerError"
        case .unsupportedReaderVersion:
            return "UnsupportedReaderVersion"
        case .unknownReaderIpAddress:
            return "UnknownReaderIpAddress"
        case .internetConnectTimeOut:
            return "InternetConnectTimeOut"
        case .connectFailedReaderIsInUse:
            return "ConnectFailedReaderIsInUse"
        case .unexpectedSdkError:
            return "UnexpectedSdkError"
        case .unexpectedReaderError:
            return "UnexpectedReaderError"
        case .declinedByStripeAPI:
            return "DeclinedByStripeAPI"
        case .declinedByReader:
            return "DeclinedByReader"
        case .commandRequiresCardholderConsent:
            return "CommandRequiresCardholderConsent"
        case .refundFailed:
            return "RefundFailed"
        case .notConnectedToInternet:
            return "NotConnectedToInternet"
        case .requestTimedOut:
            return "RequestTimedOut"
        case .stripeAPIError:
            return "StripeAPIError"
        case .stripeAPIResponseDecodingError:
            return "StripeAPIResponseDecodingError"
        case .internalNetworkError:
            return "InternalNetworkError"
        case .connectionTokenProviderCompletedWithError:
            return "ConnectionTokenProviderCompletedWithError"
        case .sessionExpired:
            return "SessionExpired"
        case .invalidRequiredParameter:
            return "InvalidRequiredParameter"
        case .readerConnectionConfigurationInvalid:
            return "ReaderConnectionConfigurationInvalid"
        case .bluetoothReconnectStarted:
            return "BluetoothReconnectStarted"
        case .accountIdMismatchWhileForwarding:
            return "AccountIdMismatchWhileForwarding"
        case .updatePaymentIntentUnavailableWhileOffline:
            return "UpdatePaymentIntentUnavailableWhileOffline"
        case .updatePaymentIntentUnavailableWhileOfflineModeEnabled:
            return "UpdatePaymentIntentUnavailableWhileOfflineModeEnabled"    
        case .forwardingTestModePaymentInLiveMode:
            return "ForwardingTestModePaymentInLiveMode"
        case .forwardingLiveModePaymentInTestMode:
            return "ForwardingLiveModePaymentInTestMode"
        case .offlinePaymentsDatabaseTooLarge:
            return "OfflinePaymentsDatabaseTooLarge"
        case .readerConnectionNotAvailableOffline:
            return "ReaderConnectionNotAvailableOffline"
        case .readerConnectionOfflineLocationMismatch:
            return "ReaderConnectionOfflineLocationMismatch"
        case .noLastSeenAccount:
            return "NoLastSeenAccount"
        case .amountExceedsMaxOfflineAmount:
            return "AmountExceedsMaxOfflineAmount"
        case .invalidOfflineCurrency:
            return "InvalidOfflineCurrency"
        case .cardSwipeNotAvailable:
            return "CardSwipeNotAvailable"
        case .interacNotSupportedOffline:
            return "InteracNotSupportedOffline"
        case .offlineAndCardExpired:
            return "OfflineAndCardExpired"
        case .offlineTransactionDeclined:
            return "OfflineTransactionDeclined"
        case .offlineCollectAndConfirmMismatch:
            return "OfflineCollectAndConfirmMismatch"
        case .connectionTokenProviderCompletedWithErrorWhileForwarding:
            return "ConnectionTokenProviderCompletedWithErrorWhileForwarding"
        case .notConnectedToInternetAndOfflineBehaviorRequireOnline:
            return "NotConnectedToInternetAndOfflineBehaviorRequireOnline"
        case .offlineBehaviorForceOfflineWithFeatureDisabled:
            return "OfflineBehaviorForceOfflineWithFeatureDisabled"
        case .readerTippingParameterInvalid:
            return "ReaderTippingParameterInvalid"
        case .invalidLocationIdParameter:
            return "InvalidLocationIdParameter"
        case .missingEMVData:
            return "MissingEMVData"
        case .commandNotAllowed:
            return "CommandNotAllowed"
        case .unsupportedMobileDeviceConfiguration:
            return "UnsupportedMobileDeviceConfiguration"
        case .passcodeNotEnabled:
            return "PasscodeNotEnabled"
        case .commandNotAllowedDuringCall:
            return "CommandNotAllowedDuringCall"
        case .invalidAmount:
            return "InvalidAmount"
        case .invalidCurrency:
            return "InvalidCurrency"
        case .tapToPayReaderTOSAcceptanceRequiresiCloudSignIn:
            return "TapToPayReaderTOSAcceptanceRequiresiCloudSignIn"
        case .tapToPayReaderTOSAcceptanceCanceled:
            return "TapToPayReaderTOSAcceptanceCanceled"
        case .nfcDisabled:
            return "NfcDisabled"
        case .readerNotAccessibleInBackground:
            return "ReaderNotAccessibleInBackground"
        case .tapToPayReaderFailedToPrepare:
            return "TapToPayReaderFailedToPrepare"
        case .tapToPayReaderDeviceBanned:
            return "TapToPayReaderDeviceBanned"
        case .tapToPayReaderTOSNotYetAccepted:
            return "TapToPayReaderTOSNotYetAccepted"
        case .tapToPayReaderTOSAcceptanceFailed:
            return "TapToPayReaderTOSAcceptanceFailed"
        case .tapToPayReaderMerchantBlocked:
            return "TapToPayReaderMerchantBlocked"
        case .tapToPayReaderInvalidMerchant:
            return "TapToPayReaderInvalidMerchant"
        case .connectionTokenProviderTimedOut:
            return "ConnectionTokenProviderTimedOut"
        case .surchargingNotAvailable:
            return "SurchargingNotAvailable"
        case .cancelFailedUnavailable:
            return "CancelFailedUnavailable"
        case .invalidConnectionConfiguration:
            return "InvalidConnectionConfiguration"
        case .invalidRequiredParameterOnBehalfOf:
            return "InvalidRequiredParameterOnBehalfOf"
        case .requestDynamicCurrencyConversionRequiresUpdatePaymentIntent:
            return "RequestDynamicCurrencyConversionRequiresUpdatePaymentIntent"
        case .dynamicCurrencyConversionNotAvailable:
            return "DynamicCurrencyConversionNotAvailable"
        case .surchargeNoticeRequiresUpdatePaymentIntent:
            return "SurchargeNoticeRequiresUpdatePaymentIntent"
        case .surchargeUnavailableWithDynamicCurrencyConversion:
            return "SurchargeUnavailableWithDynamicCurrencyConversion"
        case .canceledDueToIntegrationError:
            return "CanceledDueToIntegrationError"
        case .collectInputsInvalidParameter:
            return "CollectInputsInvalidParameter"
        case .collectInputsUnsupported:
            return "CollectInputsUnsupported"
        case .readerConnectionOfflineNeedsUpdate:
            return "ReaderConnectionOfflineNeedsUpdate"
        case .readerConnectionOfflinePairingUnseenDisabled:
            return "ReaderConnectionOfflinePairingUnseenDisabled"
        case .collectInputsTimedOut:
            return "CollectInputsTimedOut"
        case .usbDiscoveryTimedOut:
            return "UsbDiscoveryTimedOut"
        case .tapToPayReaderAccountDeactivated:
            return "TapToPayReaderAccountDeactivated"
        case .readerMissingEncryptionKeys:
            return "ReaderMissingEncryptionKeys"
        case .usbDisconnected:
            return "UsbDisconnected"
        case .encryptionKeyFailure:
            return "EncryptionKeyFailure"
        case .encryptionKeyStillInitializing:
            return "EncryptionKeyStillInitializing"
        case .collectInputsApplicationError:
            return "CollectInputsApplicationError"
        case .genericReaderError:
            return "GenericReaderError"
        case .commandInvalidAllowRedisplay:
            return "CommandInvalidAllowRedisplay"
        case .onlinePinNotSupportedOffline:
            return "OnlinePinNotSupportedOffline"
        case .offlineTestCardInLivemode:
            return "OfflineTestCardInLivemode"
        @unknown default:
            return "Unknown"
        }
    }
}
