import StripeTerminal

enum TokenError: Error {
    case runtimeError(String)
}

class TokenProvider: ConnectionTokenProvider {
    static let shared = TokenProvider()
    var callbackMap: [String : ConnectionTokenCompletionBlock?] = [:]
    static var delegate: RCTEventEmitter? = nil

    func setConnectionToken(token: String?, error: String?, callbackId: String?) {
        let unwrappedToken = token ?? ""
        if (!unwrappedToken.isEmpty) {
            if let callbackId = callbackId {
                let completionCallback = self.callbackMap[callbackId] ?? nil
                completionCallback?(token, nil)
                self.callbackMap.removeValue(forKey: callbackId)
            }
        } else {
            if let callbackId = callbackId {
                let completionCallback = self.callbackMap[callbackId] ?? nil
                completionCallback?(nil, TokenError.runtimeError(error ?? ""))
                self.callbackMap.removeValue(forKey: callbackId)
            }
        }
    }

    func fetchConnectionToken(_ completion: @escaping ConnectionTokenCompletionBlock) {
        let uuid = UUID().uuidString
        self.callbackMap[uuid] = completion
        TokenProvider.delegate?.sendEvent(withName: ReactNativeConstants.FETCH_TOKEN_PROVIDER.rawValue, body: ["callbackId": uuid])
    }
}
