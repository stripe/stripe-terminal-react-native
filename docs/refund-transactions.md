# Refund transactions

## Cancel or refund Stripe Terminal payments.

Stripe Terminal uses a two-step process to prevent unintended and duplicate payments on card_present payments.

When the SDK returns a confirmed PaymentIntent to your app, the payment is authorized but not captured. You can cancel these payments on your server. We recommend reconciling payments on your backend after a day’s activity to prevent unintended authorizations and uncollected funds.

If the PaymentIntent has already been captured, you must refund the underlying charge created by the PaymentIntent, using the refunds API, Dashboard, or Terminal SDK methods.

> Interac is a single-message network; interac_present PaymentIntents are automatically captured. In lieu of canceling PaymentIntents, your application should allow initiating an in-person client-side refund at the end of the checkout flow.

## Cancel payments

You can cancel a `card_present` PaymentIntent at any time before it has been captured. Canceling a PaymentIntent releases all uncaptured funds, and a canceled PaymentIntent can no longer be used to perform charges.

This can be useful if, for example, your customer decides to use a different payment method or pay with cash after the payment has been processed. In your application’s UI, consider allowing the user to cancel after processing the payment, before finalizing the payment and notifying your backend to capture.

With the JavaScript SDK, you must cancel uncaptured payments on the server. The iOS, Android and React Native SDKs let you cancel from the client side.

```tsx
const { cancelPaymentIntent } = useStripeTerminal();

const { paymentIntent, error } = await cancelPaymentIntent(paymentIntentId);

if (error) {
  // Placeholder for handling exception
} else if (paymentIntent) {
  // Placeholder for handling successful operation
}
```

## Perform refunds

When you use a PaymentIntent to collect payment from a customer, Stripe creates a charge behind the scenes. To refund the customer’s payment after the PaymentIntent has succeeded, create a refund by passing in the PaymentIntent ID or the charge ID. You can also optionally refund part of a payment by specifying an amount.

You can perform refunds with the API or through the Dashboard. For Interac transactions in Canada, the BBPOS WisePOS E also supports an client-side refund flow.

### Server-side

Server-side refunds don’t require a cardholder to present their card again at the point of sale. The following example shows how to create a full refund by passing in the PaymentIntent ID.

```ts
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')('sk_test_7mJuPfZsBzc3JkrANrFrcDqC');

const refund = await stripe.refunds.create({
  payment_intent: 'pi_Aabcxyz01aDfoo',
});
```

To refund part of a PaymentIntent, provide an amount parameter, as an integer in cents (or the charge currency’s smallest currency unit):

```ts
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')('sk_test_7mJuPfZsBzc3JkrANrFrcDqC');

const refund = await stripe.refunds.create({
  payment_intent: 'pi_Aabcxyz01aDfoo',
  amount: 1000,
});
```

### Client-side _CA Interac only_

```tsx
const { error } = await collectRefundPaymentMethod({
  chargeId: 'ch_1FLyVV2eZvKYlo2C9Z8rmX02',
  amount: 2000,
  currency: 'cad',
});

if (error) {
  // Handle error
} else {
  const { processedRefund, error } = await processRefund();

  if (error) {
    // Handle error
  } else if (processedRefund && processedRefund.status === 'succeeded') {
    // Process refund successful!
  } else {
    // Refund pending or unsuccessful.
  }
}
```
