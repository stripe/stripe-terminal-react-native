import StripeTerminal

/**
 This file includes a collection of protocols that mirror a selection of the StripeTerminal iOS public classes.
 This enables writing swift unit tests against these protocols since the Terminal iOS SDK
 classes prevent instantiating them (init and new are annotated as unavailable).

 Note the naming here is exactly as they are named in the native SDK so we can use them interchangeably. We will
 need to keep them in sync.
 */

protocol CollectInputsResult {
    var skipped: Bool { get }
}

protocol TextResult : CollectInputsResult {
    var text: String? { get }
    var toggles: [NSNumber] { get }
}

extension StripeTerminal.TextResult : TextResult {
}

extension StripeTerminal.CollectInputsResult : CollectInputsResult {
}
