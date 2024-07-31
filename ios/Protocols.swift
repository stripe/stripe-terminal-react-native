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

protocol NumericResult : CollectInputsResult {
    var numericString: String? { get }
    var toggles: [NSNumber] { get }
}

protocol PhoneResult : CollectInputsResult {
    var phone: String? { get }
    var toggles: [NSNumber] { get }
}

protocol EmailResult : CollectInputsResult {
    var email: String? { get }
    var toggles: [NSNumber] { get }
}

protocol SignatureResult : CollectInputsResult {
    var signatureSvg: String? { get }
    var toggles: [NSNumber] { get }
}

protocol SelectionResult : CollectInputsResult {
    var selection: String? { get }
    var toggles: [NSNumber] { get }
}

extension StripeTerminal.TextResult : TextResult {
}

extension StripeTerminal.NumericResult : NumericResult {
}

extension StripeTerminal.PhoneResult : PhoneResult {
}

extension StripeTerminal.EmailResult : EmailResult {
}

extension StripeTerminal.SignatureResult : SignatureResult {
}

extension StripeTerminal.SelectionResult : SelectionResult {
}

extension StripeTerminal.CollectInputsResult : CollectInputsResult {
}
