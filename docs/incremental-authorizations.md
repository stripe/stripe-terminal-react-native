# Display cart details

## Incremental authorizations

Incremental authorizations allow you to increase the authorized amount on a confirmed PaymentIntent before you capture it. This means you can update the amount on a payment if the estimated price changes or goods and services are added. Before capture, each incremental authorization appears on your customer’s credit card statement as an additional pending charge (e.g., a 10 USD authorization incremented to 15 USD appears as 10 USD and 5 USD). After capture, the pending authorizations disappear and the total captured amount appears as one entry.

## 1 Create and confirm an uncaptured PaymentIntent

```tsx
const { paymentIntent, error } = await createPaymentIntent({
  amount: 1000,
  currency: 'usd',
});

if (error) {
  console.log(`createPaymentIntent failed: ${error.message}`);
} else if (paymentIntent) {
  console.log('createPaymentIntent succeeded');

  const { paymentIntent, error } = await collectPaymentMethod(paymentIntentId);

  if (error) {
    console.log(`collectPaymentMethod failed: ${error.message}`);
  } else if (paymentIntent) {
    console.log('collectPaymentMethod succeeded');

    const { paymentIntent, error } = await processPayment(paymentIntent.id);

    if (error) {
      console.log(`processPayment failed: ${error.message}`);
    } else if (paymentIntent) {
      console.log('processPayment succeeded');
    }
  }
}
```

Not all payment intents are eligible for incremental authorizations. To determine eligibility based on the restrictions above, check the incremental_authorization_supported field after confirmation.

## 2 Perform an incremental authorization

To increase the authorized amount on a payment, use the increment_authorization endpoint and provide the updated total amount to increment to, which must be greater than the original authorized amount. This attempts to authorize for a higher amount on your customer’s card. A single PaymentIntent can call this endpoint multiple times to further increase the authorized amount.

```
curl https://api.stripe.com/v1/payment_intents/{{PAYMENT_INTENT_ID}}/increment_authorization \
  -u sk_test_7mJuPfZsBzc3JkrANrFrcDqC: \
  -d "amount"=1500
```

A successful authorization returns the PaymentIntent with the updated amount. A failed authorization returns a card_declined error, and the PaymentIntent remains authorized to capture the original amount. Updates to other PaymentIntent fields (e.g.,application_fee_amount) aren’t saved if the incremental authorization fails.

The underlying Charge object for the PaymentIntent contains an amount_updates array field that’s appended with the results of the incremental authorization. It shows whether the authorization succeeded or failed, and any details associated with the result.

## 3 Capture the PaymentIntent

To capture the authorized amount on a PaymentIntent that has prior incremental authorizations, use the capture endpoint. To increase the authorized amount and simultaneously capture that updated amount, provide an updated amount_to_capture. Providing an amount_to_capture higher than the currently authorized amount results in an automatic incremental authorization attempt.

> If you’re eligible to collect on-receipt tips, capture requests always succeed. Using amount_to_capture that’s higher than the currently authorized amount won’t result in an automatic incremental authorization attempt.

```
curl https://api.stripe.com/v1/payment_intents/{{PAYMENT_INTENT_ID}}/capture \
  -u sk_test_7mJuPfZsBzc3JkrANrFrcDqC: \
  -d "amount_to_capture"=2000
```

A successful authorization returns the captured PaymentIntent with the updated amount. A failed authorization returns a card_declined error, and the PaymentIntent remains authorized to capture the original amount. Updates to other PaymentIntent fields (e.g., application_fee_amount) aren’t saved if the incremental authorization fails.
