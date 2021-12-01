import StripeTerminal

class TokenProvider: ConnectionTokenProvider {
    static let shared = TokenProvider()
    var completionCallback: ConnectionTokenCompletionBlock? = nil
    
    static var delegate: RCTEventEmitter? = nil
    
    func setConnectionToken(token: String) {
        self.completionCallback?(token, nil)
    }

    func fetchConnectionToken(_ completion: @escaping ConnectionTokenCompletionBlock) {
        self.completionCallback = completion
        TokenProvider.delegate?.sendEvent(withName: "onFetchTokenProviderListener", body: [:])
    }
}
