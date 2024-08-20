import StripeTerminal

enum TokenError: Error {
    case runtimeError(String)
}

class TokenProvider: ConnectionTokenProvider {
    static let shared = TokenProvider()
    var completionCallback: ConnectionTokenCompletionBlock? = nil
    var callbackMap: [String : ConnectionTokenCompletionBlock?] = [:]

    static var delegate: RCTEventEmitter? = nil

    func setConnectionToken(token: String?, error: String?, callbackId: String?) {
        let unwrappedToken = token ?? ""
        if (!unwrappedToken.isEmpty) {
            self.completionCallback = self.callbackMap[callbackId ?? ""] ?? nil
            self.completionCallback?(token, nil)
        } else {
            self.completionCallback = self.callbackMap[callbackId ?? ""] ?? nil
            self.completionCallback?(nil, TokenError.runtimeError(error ?? "") )
        }
    }

    func fetchConnectionToken(_ completion: @escaping ConnectionTokenCompletionBlock) {
        let uuid = UUID().uuidString
        self.callbackMap[uuid] = completion
        TokenProvider.delegate?.sendEvent(withName: ReactNativeConstants.FETCH_TOKEN_PROVIDER.rawValue, body: ["callbackId": uuid])
    }
}
