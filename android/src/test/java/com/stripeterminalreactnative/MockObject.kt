package com.stripeterminalreactnative

import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.stripe.stripeterminal.external.api.ApiError
import com.stripe.stripeterminal.external.api.ApiErrorType
import com.stripe.stripeterminal.external.models.AffirmDetails
import com.stripe.stripeterminal.external.models.AmountDetails
import com.stripe.stripeterminal.external.models.CardDetails
import com.stripe.stripeterminal.external.models.CardPresentDetails
import com.stripe.stripeterminal.external.models.CardPresentOptions
import com.stripe.stripeterminal.external.models.CardPresentRequestPartialAuthorization
import com.stripe.stripeterminal.external.models.Charge
import com.stripe.stripeterminal.external.models.Donation
import com.stripe.stripeterminal.external.models.GeneratedFrom
import com.stripe.stripeterminal.external.models.KlarnaDetails
import com.stripe.stripeterminal.external.models.NextAction
import com.stripe.stripeterminal.external.models.OfflineCardPresentDetails
import com.stripe.stripeterminal.external.models.OfflineDetails
import com.stripe.stripeterminal.external.models.PaymentIntent
import com.stripe.stripeterminal.external.models.PaymentIntentStatus
import com.stripe.stripeterminal.external.models.PaymentMethod
import com.stripe.stripeterminal.external.models.PaymentMethodDetails
import com.stripe.stripeterminal.external.models.PaymentMethodOptions
import com.stripe.stripeterminal.external.models.PaymentMethodType
import com.stripe.stripeterminal.external.models.PaynowDetails
import com.stripe.stripeterminal.external.models.PaypayDetails
import com.stripe.stripeterminal.external.models.ReceiptDetails
import com.stripe.stripeterminal.external.models.RedirectUrl
import com.stripe.stripeterminal.external.models.Refund
import com.stripe.stripeterminal.external.models.SetupAttempt
import com.stripe.stripeterminal.external.models.SetupAttemptStatus
import com.stripe.stripeterminal.external.models.SetupIntent
import com.stripe.stripeterminal.external.models.SetupIntentCancellationReason
import com.stripe.stripeterminal.external.models.SetupIntentCardPresentDetails
import com.stripe.stripeterminal.external.models.SetupIntentNextAction
import com.stripe.stripeterminal.external.models.SetupIntentOfflineDetails
import com.stripe.stripeterminal.external.models.SetupIntentPaymentMethodDetails
import com.stripe.stripeterminal.external.models.SetupIntentStatus
import com.stripe.stripeterminal.external.models.SetupIntentUsage
import com.stripe.stripeterminal.external.models.Surcharge
import com.stripe.stripeterminal.external.models.SurchargeDetails
import com.stripe.stripeterminal.external.models.Tip
import com.stripe.stripeterminal.external.models.UseStripeSdk
import com.stripe.stripeterminal.external.models.Wallet
import com.stripe.stripeterminal.external.models.WechatPayDetails
import com.stripe.stripeterminal.external.models.WechatPayDisplayQrCode
import io.mockk.every
import io.mockk.mockk

fun mockRefund() = mockk<Refund>(relaxed = true) {
    every { id } returns "myId"
    every { amount } returns 123
    every { balanceTransaction } returns "myBalanceTransaction"
    every { chargeId } returns "myChargeId"
    every { created } returns 1762154053427L
    every { currency } returns "myCurrency"
    every { description } returns "myDescription"
    every { failureBalanceTransaction } returns "myFailureBalanceTransaction"
    every { failureReason } returns "myFailureReason"
    every { metadata } returns mockMetadata()
    every { paymentIntentId } returns "myPaymentIntentId"
    every { paymentMethodDetails } returns mockPaymentMethodDetails()
    every { reason } returns "myReason"
    every { receiptNumber } returns "myReceiptNumber"
    every { sourceTransferReversal } returns "mySourceTransferReversal"
    every { status } returns "myStatus"
    every { transferReversal } returns "myTransferReversal"
}

fun expectedRefund() = JavaOnlyMap().apply {
    putString("id", "myId")
    putInt("amount", 123)
    putString("balanceTransaction", "myBalanceTransaction")
    putString("chargeId", "myChargeId")
    putString("created", "1762154053427000")
    putString("currency", "myCurrency")
    putString("description", "myDescription")
    putString("failureBalanceTransaction", "myFailureBalanceTransaction")
    putString("failureReason", "myFailureReason")
    putMap("metadata", expectedMetadata())
    putString("paymentIntentId", "myPaymentIntentId")
    putMap("paymentMethodDetails", expectedPaymentMethodDetails())
    putString("reason", "myReason")
    putString("receiptNumber", "myReceiptNumber")
    putString("sourceTransferReversal", "mySourceTransferReversal")
    putString("status", "myStatus")
    putString("transferReversal", "myTransferReversal")
}

fun mockOfflineCardPresentDetails() = mockk<OfflineCardPresentDetails>(relaxed = true) {
    every { brand } returns "myBrand"
    every { cardholderName } returns "myCardholderName"
    every { expMonth } returns 1
    every { expYear } returns 2000
    every { last4 } returns "myLast4"
    every { readMethod } returns "myReadMethod"
    every { receiptDetails } returns mockReceiptDetails()
}

fun expectedOfflineCardPresentDetails() = JavaOnlyMap().apply {
    putString("brand", "myBrand")
    putString("cardholderName", "myCardholderName")
    putInt("expMonth", 1)
    putInt("expYear", 2000)
    putString("last4", "myLast4")
    putString("readMethod", "myReadMethod")
    putMap("receiptDetails", expectedReceiptDetails())
}

fun mockOfflineDetails() = mockk<OfflineDetails>(relaxed = true) {
    every { storedAtMs } returns 123
    every { requiresUpload } returns true
    every { cardPresentDetails } returns mockOfflineCardPresentDetails()
    every { amountDetails } returns mockAmountDetails()
}

fun expectedOfflineDetails() = JavaOnlyMap().apply {
    putString("storedAtMs", "123")
    putBoolean("requiresUpload", true)
    putMap("cardPresentDetails", expectedOfflineCardPresentDetails())
    putMap("amountDetails", expectedAmountDetails())
}

fun mockSetupIntentOfflineDetails() = mockk<SetupIntentOfflineDetails>(relaxed = true) {
    every { storedAtMs } returns 123
    every { requiresUpload } returns true
    every { cardPresentDetails } returns mockOfflineCardPresentDetails()
}

fun expectedSetupIntentOfflineDetails() = JavaOnlyMap().apply {
    putString("storedAtMs", "123")
    putBoolean("requiresUpload", true)
    putMap("cardPresentDetails", expectedOfflineCardPresentDetails())
}

fun mockSurcharge() = mockk<Surcharge>(relaxed = true) {
    every { status } returns "myStatus"
    every { maximumAmount } returns 123
}

fun expectedSurcharge() = JavaOnlyMap().apply {
    putString("status", "myStatus")
    putInt("maximumAmount", 123)
}

fun mockCardPresentOptions() = mockk<CardPresentOptions>(relaxed = true) {
    every { requestExtendedAuthorization } returns true
    every { requestIncrementalAuthorizationSupport } returns false
    every { requestPartialAuthorization } returns CardPresentRequestPartialAuthorization.NEVER
    every { surcharge } returns mockSurcharge()
}

fun expectedCardPresentOptions() = JavaOnlyMap().apply {
    putBoolean("requestExtendedAuthorization", true)
    putBoolean("requestIncrementalAuthorizationSupport", false)
    putString("requestPartialAuthorization", "never")
    putMap("surcharge", expectedSurcharge())
}

fun mockPaymentMethodOptions() = mockk<PaymentMethodOptions>(relaxed = true) {
    every { cardPresent } returns mockCardPresentOptions()
}

fun expectedPaymentMethodOptions() = JavaOnlyMap().apply {
    putMap("cardPresent", expectedCardPresentOptions())
}

fun mockPaymentMethod() = mockk<PaymentMethod>(relaxed = true) {
    every { cardPresentDetails } returns mockCardPresentDetails()
    every { interacPresentDetails } returns mockCardPresentDetails()
    every { wechatPayDetails } returns mockWechatPayDetails()
    every { affirmDetails } returns mockAffirmDetails()
    every { paynowDetails } returns mockPaynowDetails()
    every { paypayDetails } returns mockPaypayDetails()
    every { klarnaDetails } returns mockKlarnaDetails()
    every { cardDetails } returns mockCardDetails()
    every { customer } returns "myCustomer"
    every { id } returns "myId"
    every { type } returns PaymentMethodType.CARD
    every { livemode } returns true
    every { metadata } returns mockMetadata()
}

fun expectedPaymentMethod() = JavaOnlyMap().apply {
    putMap("cardPresentDetails", expectedCardPresentDetails())
    putMap("interacPresentDetails", expectedCardPresentDetails())
    putMap("wechatPayDetails", expectedWechatPayDetails())
    putMap("affirmDetails", expectedAffirmDetails())
    putMap("paynowDetails", expectedPaynowDetails())
    putMap("paypayDetails", expectedPaypayDetails())
    putMap("klarnaDetails", expectedKlarnaDetails())
    putMap("cardDetails", expectedCardDetails())
    putString("customer", "myCustomer")
    putString("id", "myId")
    putString("type", "card")
    putBoolean("livemode", true)
    putMap("metadata", expectedMetadata())
}

fun mockSetupIntent() = mockk<SetupIntent>(relaxed = true) {
    every { id } returns "myId"
    every { applicationId } returns "123"
    every { cancellationReason } returns SetupIntentCancellationReason.DUPLICATE
    every { clientSecret } returns "myClientSecret"
    every { created } returns 1762154053427L
    every { customerId } returns "myCustomer"
    every { description } returns "myDescription"
    every { latestAttempt } returns mockSetupAttempt()
    every { isLiveMode } returns true
    every { mandateId } returns "myMandate"
    every { metadata } returns mockMetadata()
    every { nextAction } returns mockSetupIntentNextAction()
    every { offlineDetails } returns mockSetupIntentOfflineDetails()
    every { onBehalfOfId } returns "myOnBehalfOf"
    every { paymentMethod } returns mockPaymentMethod()
    every { paymentMethodId } returns "myPaymentMethodId"
    every { paymentMethodOptions } returns mockPaymentMethodOptions()
    every { paymentMethodTypes } returns listOf("a", "b")
    every { singleUseMandateId } returns "mySingleUseMandate"
    every { status } returns SetupIntentStatus.SUCCEEDED
    every { usage } returns SetupIntentUsage.ON_SESSION
    every { lastSetupError } returns mockApiError()
}

fun expectedSetupIntent() = JavaOnlyMap().apply {
    putString("id", "myId")
    putString("sdkUuid", "aa")
    putString("application", "123")
    putString("cancellationReason", "duplicate")
    putString("clientSecret", "myClientSecret")
    putString("created", "1762154053427000")
    putString("customer", "myCustomer")
    putString("description", "myDescription")
    putMap("latestAttempt", expectedSetupAttempt())
    putBoolean("livemode", true)
    putString("mandate", "myMandate")
    putMap("metadata", expectedMetadata())
    putMap("nextAction", expectedSetupIntentNextAction())
    putMap("offlineDetails", expectedSetupIntentOfflineDetails())
    putString("onBehalfOf", "myOnBehalfOf")
    putMap("paymentMethod", expectedPaymentMethod())
    putString("paymentMethodId", "myPaymentMethodId")
    putMap("paymentMethodOptions", expectedPaymentMethodOptions())
    putArray("paymentMethodTypes", JavaOnlyArray().apply {
        pushString("a")
        pushString("b")
    })
    putString("singleUseMandate", "mySingleUseMandate")
    putString("status", "succeeded")
    putString("usage", "onSession")
    putMap("lastSetupError", expectedApiError())
}

fun mockApiError() = mockk<ApiError>(relaxed = true) {
    every { code } returns "card_declined"
    every { message } returns "Your card was declined."
    every { declineCode } returns "generic_decline"
    every { type } returns ApiErrorType.CARD_ERROR
    every { charge } returns "ch_123"
    every { docUrl } returns "https://stripe.com/docs/error-codes/card-declined"
    every { param } returns "card_number"
}

fun expectedApiError() = JavaOnlyMap().apply {
    putString("code", "card_declined")
    putString("message", "Your card was declined.")
    putString("declineCode", "generic_decline")
    putString("type", "CARD_ERROR")
    putString("charge", "ch_123")
    putString("docUrl", "https://stripe.com/docs/error-codes/card-declined")
    putString("param", "card_number")
}

fun mockPaymentIntent() = mockk<PaymentIntent>(relaxed = true) {
    every { id } returns "myId"
    every { amount } returns 123
    every { amountCapturable } returns 234
    every { amountDetails } returns mockAmountDetails()
    every { amountReceived } returns 345
    every { amountRequested } returns 456
    every { amountTip } returns 567
    every { applicationFeeAmount } returns 678
    every { canceledAt } returns 1762154053426L
    every { cancellationReason } returns "myCancellationReason"
    every { captureMethod } returns "myCaptureMethod"
    every { clientSecret } returns "myClientSecret"
    every { confirmationMethod } returns "myConfirmationMethod"
    every { created } returns 1762154053427L
    every { currency } returns "myCurrency"
    every { customer } returns "myCustomer"
    every { description } returns "myDescription"
    every { lastPaymentError } returns mockApiError()
    every { livemode } returns true
    every { metadata } returns mockMetadata()
    every { nextAction } returns mockNextAction()
    every { offlineDetails } returns mockOfflineDetails()
    every { onBehalfOf } returns "myOnBehalfOf"
    every { paymentMethod } returns mockPaymentMethod()
    every { paymentMethodId } returns "myPaymentMethodId"
    every { paymentMethodOptions } returns mockPaymentMethodOptions()
    every { receiptEmail } returns "myReceiptEmail"
    every { setupFutureUsage } returns "mySetupFutureUsage"
    every { statementDescriptor } returns "myStatementDescriptor"
    every { statementDescriptorSuffix } returns "myStatementDescriptorSuffix"
    every { status } returns PaymentIntentStatus.SUCCEEDED
    every { transferGroup } returns "myTransferGroup"
}

fun expectedPaymentIntent() = JavaOnlyMap().apply {
    putString("id", "myId")
    putInt("amount", 123)
    putInt("amountCapturable", 234)
    putMap("amountDetails", expectedAmountDetails())
    putInt("amountReceived", 345)
    putInt("amountRequested", 456)
    putInt("amountTip", 567)
    putInt("applicationFeeAmount", 678)
    putString("canceledAt", "1762154053426000")
    putString("cancellationReason", "myCancellationReason")
    putString("captureMethod", "myCaptureMethod")
    putArray("charges", JavaOnlyArray())
    putString("clientSecret", "myClientSecret")
    putString("confirmationMethod", "myConfirmationMethod")
    putString("created", "1762154053427000")
    putString("currency", "myCurrency")
    putString("customer", "myCustomer")
    putString("description", "myDescription")
    putMap("lastPaymentError", expectedApiError())
    putBoolean("livemode", true)
    putMap("metadata", expectedMetadata())
    putMap("nextAction", expectedNextAction())
    putMap("offlineDetails", expectedOfflineDetails())
    putString("onBehalfOf", "myOnBehalfOf")
    putMap("paymentMethod", expectedPaymentMethod())
    putString("paymentMethodId", "myPaymentMethodId")
    putMap("paymentMethodOptions", expectedPaymentMethodOptions())
    putString("receiptEmail", "myReceiptEmail")
    putString("sdkUuid", "aa")
    putString("setupFutureUsage", "mySetupFutureUsage")
    putString("statementDescriptor", "myStatementDescriptor")
    putString("statementDescriptorSuffix", "myStatementDescriptorSuffix")
    putString("status", "succeeded")
    putString("transferGroup", "myTransferGroup")
}

fun mockCharges() = listOf(mockCharge(), mockCharge())
fun mockCharge() = mockk<Charge>(relaxed = true) {
    every { id } returns "myId"
    every { amount } returns 123
    every { amountRefunded } returns 234
    every { applicationFee } returns "myApplicationFee"
    every { applicationFeeAmount } returns 345
    every { authorizationCode } returns "myAuthorizationCode"
    every { balanceTransaction } returns "myBalanceTransaction"
    every { captured } returns true
    every { calculatedStatementDescriptor } returns "myCalculatedStatementDescriptor"
    every { created } returns 456
    every { currency } returns "myCurrency"
    every { customer } returns "myCustomer"
    every { description } returns "myDescription"
    every { livemode } returns true
    every { metadata } returns mockMetadata()
    every { onBehalfOf } returns "myOnBehalfOf"
    every { paid } returns true
    every { paymentIntentId } returns "myPaymentIntentId"
    every { paymentMethodDetails } returns mockPaymentMethodDetails()
    every { receiptEmail } returns "myReceiptEmail"
    every { receiptNumber } returns "myReceiptNumber"
    every { receiptUrl } returns "myReceiptUrl"
    every { refunded } returns true
    every { statementDescriptorSuffix } returns "myStatementDescriptorSuffix"
    every { status } returns "myStatus"
}

fun expectedCharge() = JavaOnlyMap().apply {
    putString("id", "myId")
    putInt("amount", 123)
    putInt("amountRefunded", 234)
    putString("applicationFee", "myApplicationFee")
    putInt("applicationFeeAmount", 345)
    putString("authorizationCode", "myAuthorizationCode")
    putString("balanceTransaction", "myBalanceTransaction")
    putBoolean("captured", true)
    putString("calculatedStatementDescriptor", "myCalculatedStatementDescriptor")
    putString("created", "456000")
    putString("currency", "myCurrency")
    putString("customer", "myCustomer")
    putString("description", "myDescription")
    putBoolean("livemode", true)
    putMap(
        "metadata",
        expectedMetadata()
    )
    putString("onBehalfOf", "myOnBehalfOf")
    putBoolean("paid", true)
    putString("paymentIntentId", "myPaymentIntentId")
    putMap("paymentMethodDetails", expectedPaymentMethodDetails())
    putString("receiptEmail", "myReceiptEmail")
    putString("receiptNumber", "myReceiptNumber")
    putString("receiptUrl", "myReceiptUrl")
    putBoolean("refunded", true)
    putString("statementDescriptorSuffix", "myStatementDescriptorSuffix")
    putString("status", "myStatus")
}

fun mockPaymentMethodDetails() =
    mockk<PaymentMethodDetails>(relaxed = true) {
        every { cardPresentDetails } returns mockCardPresentDetails()
        every { interacPresentDetails } returns mockCardPresentDetails()
        every { wechatPayDetails } returns mockWechatPayDetails()
        every { affirmDetails } returns mockAffirmDetails()
        every { paynowDetails } returns mockPaynowDetails()
        every { paypayDetails } returns mockPaypayDetails()
        every { klarnaDetails } returns mockKlarnaDetails()
        every { cardDetails } returns mockCardDetails()
        every { type } returns PaymentMethodType.CARD
    }

fun expectedPaymentMethodDetails() = JavaOnlyMap().apply {
    putMap("cardPresentDetails", expectedCardPresentDetails())
    putMap("interacPresentDetails", expectedCardPresentDetails())
    putMap("wechatPayDetails", expectedWechatPayDetails())
    putMap("affirmDetails", expectedAffirmDetails())
    putMap("paynowDetails", expectedPaynowDetails())
    putMap("paypayDetails", expectedPaypayDetails())
    putMap("klarnaDetails", expectedKlarnaDetails())
    putMap("cardDetails", expectedCardDetails())
    putString("type", "card")
}

fun mockMetadata() = mapOf("key1" to "value1", "key2" to "value2")

fun expectedMetadata() = JavaOnlyMap().apply {
    putString("key1", "value1")
    putString("key2", "value2")
}

fun mockCardDetails() = mockk<CardDetails>(relaxed = true) {
    every { brand } returns "brand"
    every { country } returns "country"
    every { expMonth } returns 1
    every { expYear } returns 2
    every { funding } returns "funding"
    every { generatedFrom } returns mockGeneratedFromNoPaymentMethodDetails()
    every { last4 } returns "last4"
}

fun expectedCardDetails() = JavaOnlyMap().apply {
    putString("brand", "brand")
    putString("country", "country")
    putInt("expMonth", 1)
    putInt("expYear", 2)
    putString("funding", "funding")
    putMap("generatedFrom", expectedGeneratedFromNoPaymentMethodDetails())
    putString("last4", "last4")
}

// Identical to mockGeneratedFrom but avoid cycle, better way is add a flag as parameter but compile will fail
fun mockGeneratedFromNoPaymentMethodDetails() = mockk<GeneratedFrom>(relaxed = true) {
    every { charge } returns "charge"
    every { setupAttempt } returns "setupAttempt"
    every { paymentMethodDetails } returns null
}

// Identical to expectedGeneratedFrom but avoid cycle, better way is add a flag as parameter but compile will fail
fun expectedGeneratedFromNoPaymentMethodDetails() = JavaOnlyMap().apply {
    putString("charge", "charge")
    putString("setupAttempt", "setupAttempt")
    putNull("paymentMethodDetails")
}

fun mockGeneratedFrom() = mockk<GeneratedFrom>(relaxed = true) {
    every { charge } returns "charge"
    every { setupAttempt } returns "setupAttempt"
    every { paymentMethodDetails } returns mockPaymentMethodDetails()
}

fun expectedGeneratedFrom() = JavaOnlyMap().apply {
    putString("charge", "charge")
    putString("setupAttempt", "setupAttempt")
    putMap("paymentMethodDetails", expectedPaymentMethodDetails())
}

fun mockSetupIntentNextAction() = mockk<SetupIntentNextAction>(relaxed = true) {
    every { type } returns "type"
    every { redirectToUrl } returns mockRedirectUrl()
}

fun expectedSetupIntentNextAction() = JavaOnlyMap().apply {
    putString("type", "type")
    putMap("redirectToUrl", expectedRedirectUrl())
}

fun mockNextAction() = mockk<NextAction>(relaxed = true) {
    every { type } returns "type"
    every { useStripeSdk } returns mockUseStripeSdk()
    every { redirectToUrl } returns mockRedirectUrl()
    every { wechatPayDisplayQrCode } returns mockWechatPayDisplayQrCode()
}

fun expectedNextAction() = JavaOnlyMap().apply {
    putString("type", "type")
    putMap("useStripeSdk", expectedUseStripeSdk())
    putMap("redirectToUrl", expectedRedirectUrl())
    putMap("wechatPayDisplayQrCode", expectedWechatPayDisplayQrCode())
}

fun mockUseStripeSdk() = mockk<UseStripeSdk>(relaxed = true) {
    every { type } returns "type"
}

fun expectedUseStripeSdk() = JavaOnlyMap().apply {
    putString("type", "type")
}

fun mockWechatPayDisplayQrCode() = mockk<WechatPayDisplayQrCode>(relaxed = true) {
    every { data } returns "data"
    every { hostedInstructionsUrl } returns "hostedInstructionsUrl"
    every { imageDataUrl } returns "imageDataUrl"
    every { imageUrlPng } returns "imageUrlPng"
    every { imageUrlSvg } returns "imageUrlSvg"
}

fun expectedWechatPayDisplayQrCode() = JavaOnlyMap().apply {
    putString("data", "data")
    putString("hostedInstructionsUrl", "hostedInstructionsUrl")
    putString("imageDataUrl", "imageDataUrl")
    putString("imageUrlPng", "imageUrlPng")
    putString("imageUrlSvg", "imageUrlSvg")
}

fun mockRedirectUrl() = mockk<RedirectUrl>(relaxed = true) {
    every { url } returns "url"
    every { returnUrl } returns "returnUrl"
}

fun expectedRedirectUrl() = JavaOnlyMap().apply {
    putString("url", "url")
    putString("returnUrl", "returnUrl")
}

fun mockWechatPayDetails() = mockk<WechatPayDetails>(relaxed = true) {
    every { location } returns "location"
    every { reader } returns "reader"
    every { transactionId } returns "transactionId"
}

fun expectedWechatPayDetails() = JavaOnlyMap().apply {
    putString("location", "location")
    putString("reader", "reader")
    putString("transactionId", "transactionId")
}

fun mockAffirmDetails() = mockk<AffirmDetails>(relaxed = true) {
    every { location } returns "location"
    every { reader } returns "reader"
    every { transactionId } returns "transactionId"
}

fun expectedAffirmDetails() = JavaOnlyMap().apply {
    putString("location", "location")
    putString("reader", "reader")
    putString("transactionId", "transactionId")
}

fun mockPaynowDetails() = mockk<PaynowDetails>(relaxed = true) {
    every { location } returns "location"
    every { reader } returns "reader"
    every { reference } returns "reference"
}

fun expectedPaynowDetails() = JavaOnlyMap().apply {
    putString("location", "location")
    putString("reader", "reader")
    putString("reference", "reference")
}


fun mockPaypayDetails() = mockk<PaypayDetails>(relaxed = true) {
    every { location } returns "location"
    every { reader } returns "reader"
}

fun expectedPaypayDetails() = JavaOnlyMap().apply {
    putString("location", "location")
    putString("reader", "reader")
}

fun mockKlarnaDetails() = mockk<KlarnaDetails>(relaxed = true) {
    every { location } returns "location"
    every { reader } returns "reader"
}

fun expectedKlarnaDetails() = JavaOnlyMap().apply {
    putString("location", "location")
    putString("reader", "reader")
}

fun mockAmountDetails() = mockk<AmountDetails>(relaxed = true) {
    every { tip } returns mockTip()
    every { donation } returns mockDonation()
    every { surcharge } returns mockAmountSurcharge()
}

fun expectedAmountDetails() = JavaOnlyMap().apply {
    putMap("tip", expectedTip())
    putMap("donation", expectedDonation())
    putMap("surcharge", expectedAmountSurcharge())
}

fun mockTip() = mockk<Tip>(relaxed = true) {
    every { amount } returns 1L
}

fun expectedTip() = JavaOnlyMap().apply {
    putInt("amount", 1)
}

fun mockDonation() = mockk<Donation>(relaxed = true) {
    every { amount } returns 3L
}

fun expectedDonation() = JavaOnlyMap().apply {
    putInt("amount", 3)
}

fun mockAmountSurcharge() = mockk<SurchargeDetails>(relaxed = true) {
    every { amount } returns 2L
}

fun expectedAmountSurcharge() = JavaOnlyMap().apply {
    putInt("amount", 2)
}

fun mockSetupAttempt() = mockk<SetupAttempt>(relaxed = true) {
    every { id } returns "myId"
    every { applicationId } returns "myApplicationId"
    every { created } returns 1762154053427L
    every { customerId } returns "myCustomer"
    every { isLiveMode } returns true
    every { onBehalfOfId } returns "myOnBehalfOfId"
    every { paymentMethodDetails } returns mockSetupIntentPaymentMethodDetails()
    every { paymentMethodId } returns "myPaymentMethodId"
    every { setupIntentId } returns "mySetupIntentId"
    every { status } returns SetupAttemptStatus.SUCCEEDED
    every { usage } returns SetupIntentUsage.ON_SESSION
}

fun expectedSetupAttempt() = JavaOnlyMap().apply {
    putString("id", "myId")
    putString("applicationId", "myApplicationId")
    putString("created", "1762154053427000")
    putString("customer", "myCustomer")
    putBoolean("livemode", true)
    putString("onBehalfOfId", "myOnBehalfOfId")
    putMap("paymentMethodDetails", expectedSetupIntentPaymentMethodDetails())
    putString("paymentMethodId", "myPaymentMethodId")
    putString("setupIntentId", "mySetupIntentId")
    putString("status", "succeeded")
    putString("usage", "onSession")
}

fun mockSetupIntentPaymentMethodDetails() = mockk<SetupIntentPaymentMethodDetails>(relaxed = true) {
    every { cardPresentDetails } returns mockSetupIntentCardPresentDetails()
    every { interacPresentDetails } returns mockSetupIntentCardPresentDetails()
}

fun expectedSetupIntentPaymentMethodDetails() = JavaOnlyMap().apply {
    putMap("cardPresent", expectedSetupIntentCardPresentDetails())
    putMap("interacPresent", expectedSetupIntentCardPresentDetails())
}

fun mockCardPresentDetails() = mockk<CardPresentDetails>(relaxed = true) {
    every { brand } returns "myBrand"
    every { cardholderName } returns "myCardholderName"
    every { country } returns "myCountry"
    every { emvAuthData } returns "myEmvAuthData"
    every { expMonth } returns 12
    every { expYear } returns 2000
    every { funding } returns "myFunding"
    every { generatedCard } returns "myGeneratedCard"
    every { last4 } returns "myLast4"
    every { readMethod } returns "myReadMethod"
    every { receiptDetails } returns mockReceiptDetails()
    every { issuer } returns "myIssuer"
    every { iin } returns "myIin"
    every { network } returns "myNetwork"
    every { description } returns "myDescription"
    every { wallet } returns mockWallet()
    every { preferredLocales } returns listOf()
    every { location } returns "myLocation"
    every { reader } returns "myReader"
}

fun expectedCardPresentDetails() = JavaOnlyMap().apply {
    putString("brand", "myBrand")
    putString("cardholderName", "myCardholderName")
    putString("country", "myCountry")
    putString("emvAuthData", "myEmvAuthData")
    putInt("expMonth", 12)
    putInt("expYear", 2000)
    putString("funding", "myFunding")
    putString("generatedCard", "myGeneratedCard")
    putString("last4", "myLast4")
    putString("readMethod", "myReadMethod")
    putMap("receipt", expectedReceiptDetails())
    putString("issuer", "myIssuer")
    putString("iin", "myIin")
    putString("network", "myNetwork")
    putString("description", "myDescription")
    putMap("wallet", expectedWallet())
    putArray("preferredLocales", JavaOnlyArray())
    putString("location", "myLocation")
    putString("reader", "myReader")
}

fun mockReceiptDetails() = mockk<ReceiptDetails>(relaxed = true) {
    every { accountType } returns "myAccountType"
    every { applicationCryptogram } returns "myApplicationCryptogram"
    every { applicationPreferredName } returns "myApplicationPreferredName"
    every { authorizationCode } returns "myAuthorizationCode"
    every { authorizationResponseCode } returns "myAuthorizationResponseCode"
    every { cvm } returns "myCvm"
    every { dedicatedFileName } returns "myDedicatedFileName"
    every { tsi } returns "myTransactionStatusInformation"
    every { tvr } returns "myTerminalVerificationResult"
}

fun expectedReceiptDetails() = JavaOnlyMap().apply {
    putString("accountType", "myAccountType")
    putString("applicationCryptogram", "myApplicationCryptogram")
    putString("applicationPreferredName", "myApplicationPreferredName")
    putString("authorizationCode", "myAuthorizationCode")
    putString("authorizationResponseCode", "myAuthorizationResponseCode")
    putString("cvm", "myCvm")
    putString("dedicatedFileName", "myDedicatedFileName")
    putString("transactionStatusInformation", "myTransactionStatusInformation")
    putString("terminalVerificationResult", "myTerminalVerificationResult")
}

fun mockWallet() = mockk<Wallet>(relaxed = true) {
    every { type } returns "myType"
}

fun expectedWallet() = JavaOnlyMap().apply {
    putString("type", "myType")
}

fun mockSetupIntentCardPresentDetails() = mockk<SetupIntentCardPresentDetails>(relaxed = true) {
    every { emvAuthData } returns "myEmvAuthData"
    every { generatedCard } returns "myGeneratedCard"
}

fun expectedSetupIntentCardPresentDetails() = JavaOnlyMap().apply {
    putString("emvAuthData", "myEmvAuthData")
    putString("generatedCard", "myGeneratedCard")
}