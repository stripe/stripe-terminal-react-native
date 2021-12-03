# Collect payments

## Prepare your application and backend to collect payments using Stripe Terminal.

Collecting payments with Stripe Terminal requires writing a payment flow in your application. Use the Stripe Terminal SDK to create and update a [PaymentIntent](https://stripe.com/docs/api#payment_intents), an object representing a single payment session.

Designed to be robust to failures, the Terminal integration splits the payment process into several steps, each of which can be retried safely:

- [Create a PaymentIntent](#create-a-paymentintent)
- [Collect a payment method](#collect-a-payment-method)

- [Process the payment](#process-the-payment)
- [Capture the payments](#capture-the-payments)

Authorization on the customer’s card takes place in [Step 3](#process-the-payment), when the SDK processes the payment.

## Create a PaymentIntent

The first step when collecting payments is to start the payment flow. When a customer begins checking out, your application must create a `PaymentIntent` object. This represents a new payment session on Stripe.

Use [test amounts](https://stripe.com/docs/terminal/references/testing#physical-test-cards) to try producing different results. An amount ending in 00 results in an approved payment.

The following example shows how to create a `PaymentIntent` on your server:

```ts
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')('sk_test_7mJuPfZsBzc3JkrANrFrcDqC');

const intent = await stripe.paymentIntents.create({
  amount: 1000,
  currency: 'usd',
  payment_method_types: ['card_present'],
  capture_method: 'manual',
});
```

For Terminal payments, the `payment_method_types` parameter must include `card_present`. To control the payment flow for `card_present` payments, set the `capture_method` to `manual`.

> To accept Interac payments in Canada, you will need to also include interac_present in payment_method_types. For more details, visit our [Canada documentation](https://stripe.com/docs/terminal/payments/regional?integration-country=CA).

The PaymentIntent contains a [client secret](https://stripe.com/docs/api/payment_intents/object#payment_intent_object-client_secret), a key that is unique to the individual PaymentIntent. To use the client secret, you must obtain it from the PaymentIntent on your server and [pass it to the client side](https://stripe.com/docs/payments/payment-intents#passing-to-client).

```ts
const express = require('express');
const app = express();

app.post('/create_payment_intent', async (req, res) => {
  const intent = res.json({ client_secret: intent.client_secret }); // ... Fetch or create the PaymentIntent
});

app.listen(3000, () => {
  console.log('Running on port 3000');
});
```

Use the client secret as a parameter when calling `retrievePaymentIntent` to get a `PaymentIntent` object on client side.

## Collect a payment method

After you’ve created a PaymentIntent, the next step is to collect a payment method with the SDK.

Before you do this, you need to retrieve a PaymentIntent object on the client side which is required to collect a payment method.

```tsx
const { paymentIntent, error } = await retrievePaymentIntent(clientSecret);

if (error) {
  // Placeholder for handling exception
} else if (paymentIntent) {
  // Placeholder for collecting payment method
}
```

In order to collect a payment method, your app needs to be connected to a reader. The connected reader will wait for a card to be presented after your app calls `collectPaymentMethod`.

```tsx
const { paymentIntent, error } = await collectPaymentMethod(paymentIntentId);

if (error) {
  // Placeholder for handling exception
} else if (paymentIntent) {
  // Placeholder for processing paymentIntent
}
```

This method collects encrypted payment method data using the connected card reader, and associates the encrypted data with the local PaymentIntent.

You can cancel collecting a payment method using `cancelCollectPaymentMethod` method returned by the React Native SDK.

> Collecting a payment method happens locally and requires no authorization or updates to the Payment Intents API object until the next step, [process the payment](#process-the-payment).

### Handle events

When collecting a payment method using a reader like the [BBPOS Chipper 2X BT](https://stripe.com/docs/terminal/readers/bbpos-chipper2xbt), without a built-in display, your app must be able to display events from the payment method collection process to users. These events help users successfully collect payments (e.g., retrying a card, trying a different card, or using a different read method).

When a transaction begins, the SDK passes a `Reader.InputOptions` value to your app’s reader display handler, denoting the acceptable types of input (e.g., Swipe, Insert, Tap). In your app’s checkout UI, prompt the user to present a card using one of these options.

During the transaction, the SDK might request your app to display additional prompts (e.g., Retry Card) to your user by passing a `Reader.DisplayMessage` value to your app’s reader display handler. Make sure your checkout UI displays these messages to the user.

```tsx
useStripeTerminal({
  onDidRequestReaderInput: (options) => {
    Alert.alert(options.join('/'));
  },
  onDidRequestReaderDisplayMessage: (message) => {
    Alert.alert(message);
  },
});
```

## Process the payment

After successfully collecting a payment method from the customer, the next step is to process the payment with the SDK. You can either process automatically or display a confirmation screen, where the customer can choose to proceed with the payment or cancel (e.g., to pay with cash, or use a different payment method).

When you’re ready to proceed with the payment, call processPayment with the updated PaymentIntent from [Step 2](#collect-a-payment-method). A successful `processPayment` call results in a PaymentIntent with a status of `requires_capture`.

```tsx
const { paymentIntent, error } = await processPayment(paymentIntentId);
if (error) {
  // Placeholder for handling exception
} else if (paymentIntent) {
  // Placeholder for notifying your backend to capture paymentIntent.id
}
```

> You must manually capture payments processed by the Terminal SDKs. Set up your backend to [capture the payment](#capture-a-payment) within two days. Otherwise, the authorization expires and funds get released back to the customer.

### Handle processing failures

When processing a payment fails, the SDK returns an error that includes the updated `PaymentIntent`. Your application should inspect the `PaymentIntent` to decide how to deal with the error.

| PAYMENTINTENT STATUS      |                                                           | RESOLUTION                                                                                                                               |
| ------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `requires_payment_method` | Payment method declined                                   | Try collecting a different payment method by calling `collectPaymentMethod` again with the same PaymentIntent.                           |
| `requires_confirmation`   | Temporary connectivity problem                            | Call `processPayment` again with the same PaymentIntent to retry the request.                                                            |
| PaymentIntent is `nil`    | Request to Stripe timed out, unknown PaymentIntent status | Retry processing the original PaymentIntent. Don’t create a new one, as that could result in multiple authorizations for the cardholder. |

## Capture the payments

Stripe Terminal uses a two-step process to prevent unintended and duplicate payments. When the SDK returns a processed PaymentIntent to your app, the payment is authorized but not captured. Read the [auth and capture](https://stripe.com/docs/payments/capture-later) documentation for more information about the difference.

When your app receives a processed PaymentIntent from the SDK, make sure it notifies your backend to capture the payment. Create an endpoint on your backend that accepts a PaymentIntent ID and sends a request to the Stripe API to capture it:

```ts
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')('sk_test_7mJuPfZsBzc3JkrANrFrcDqC');

const paymentIntent = await stripe.paymentIntents.capture(
  '{{PAYMENT_INTENT_ID}}'
);
```

A successful `capture` call will result in a PaymentIntent with a status of `succeeded`.

**Reconcile payments**
To monitor the payments activity of your business, you may want to reconcile PaymentIntents with your internal orders system on your server at the end of a day’s activity.

A PaymentIntent that retains a `requires_capture` status may represent two things:

**Unnecessary authorization on your customer’s card statement**

- Cause: User abandons your app’s checkout flow in the middle of a transaction
- Solution: If the uncaptured PaymentIntent is not associated with a completed order on your server, you can [cancel](https://stripe.com/docs/api/payment_intents/cancel) it. A canceled PaymentIntent can no longer be used to perform charges.

**Incomplete collection of funds from a customer**

- Cause: Failure of the request from your app notifying your backend to capture the payment
- Solution: If the uncaptured PaymentIntent is associated with a completed order on your server, and no other payment has been taken for the order (e.g., a cash payment), you can [capture](https://stripe.com/docs/api/payment_intents/capture) it.

**Collect tips US only**

In the US, eligible users can [collect tips when capturing payments](https://stripe.com/docs/terminal/features/collecting-tips/on-receipt).
