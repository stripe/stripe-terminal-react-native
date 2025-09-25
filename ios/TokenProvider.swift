import StripeTerminal

enum TokenError: Error {
    case runtimeError(String)
}

class TokenProvider: ConnectionTokenProvider {
    static let shared = TokenProvider()
    let queue = ThreadSafeQueue<ConnectionTokenCompletionBlock>()
    static var delegate: RCTEventEmitter? = nil

    func setConnectionToken(token: String?, error: String?) {
        while (!queue.isEmpty) {
            let completionCallback = queue.dequeue()
            if let unwrappedToken = token, !unwrappedToken.isEmpty {
                completionCallback?(unwrappedToken, nil)
            } else {
              completionCallback?(nil, TokenError.runtimeError(error ?? "Token is invalid"))
            }
        }
    }

    func fetchConnectionToken(_ completion: @escaping ConnectionTokenCompletionBlock) {
        self.queue.enqueue(completion)
        TokenProvider.delegate?.sendEvent(withName: ReactNativeConstants.FETCH_TOKEN_PROVIDER.rawValue, body: [:])
    }
}
