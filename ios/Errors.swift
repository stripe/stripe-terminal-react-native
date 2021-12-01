enum CommonErrorType: String {
    case Failed, Canceled, Unknown
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
    
    class func createError(code: String, message: String) -> NSDictionary {
        let error: NSDictionary = [
            "code": code,
            "message": message
        ]
        return ["error": error]
    }
}
