import StripeTerminal

enum CommonErrorType: String {
    case InvalidRequiredParameter
    case AlreadyDiscovering
}

enum BridgeCommonError: String {
  case failed = "Failed"
  case canceled = "Canceled"
  case unknown = "Unknown"
}

struct StripeError {
    let code: BridgeCommonError
    let message: String
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
  
    class func reject(_ reject: RCTPromiseRejectBlock, code: CommonErrorType, message: String) {
        let errorDict = createError(errorCode: code.rawValue, message: message)
        let error = errorDict["error"] as? [String: String]
        reject(error?["code"] ?? "Unknown", error?["message"], nil)
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
        return Terminal.stringFromError(self)
    }
}

func rejectStripeError(_ error: StripeError, using reject: @escaping RCTPromiseRejectBlock) {
    reject(error.code.rawValue, error.message, nil)
}
