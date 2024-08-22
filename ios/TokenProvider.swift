import StripeTerminal

enum TokenError: Error {
    case runtimeError(String)
}

class TokenProvider: ConnectionTokenProvider {
    static let shared = TokenProvider()
    var callbackMap: [String : ConnectionTokenCompletionBlock?] = [:]
    static var delegate: RCTEventEmitter? = nil

    func setConnectionToken(token: String?, error: String?, callbackId: String?) {
        guard let callbackId = callbackId, let completionCallback = callbackMap[callbackId] else { return }

        let unwrappedToken = token ?? ""
        if (!unwrappedToken.isEmpty) {
            completionCallback?(unwrappedToken, nil)
        } else {
            completionCallback?(nil, TokenError.runtimeError(error ?? ""))
        }

        callbackMap.removeValue(forKey: callbackId)
    }

    func fetchConnectionToken(_ completion: @escaping ConnectionTokenCompletionBlock) {
        let uuid = UUID().uuidString
        self.callbackMap[uuid] = completion
        TokenProvider.delegate?.sendEvent(withName: ReactNativeConstants.FETCH_TOKEN_PROVIDER.rawValue, body: ["callbackId": uuid])
    }
}
