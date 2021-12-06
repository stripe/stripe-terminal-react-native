# Save cards for online payments

## Learn how to use your Stripe Terminal integration to create online payments.

Stripe Terminal lets you save payment methods for online use. Use an in-person card to initiate an online [subscription](https://stripe.com/docs/billing/subscriptions/creating) using [Billing](https://stripe.com/docs/billing), save payment details to a customer’s online account, or defer payment.

There are two ways to collect reusable card details with Terminal:

- [Save card details while processing in-person transactions (PaymentIntents)](#save-a-card-while-transacting-us-only)

- [Collect card details to charge in the future, without transacting now (readReusableCard)](#collect-card-details-for-future-use-us-only)

## Save a card while transacting _U.S. only_

> Currently, you can’t use Stripe Terminal to save mobile wallets (e.g., Apple Pay, Google Pay) for later reuse while transacting.

Save card details for online reuse from a customer’s in-person transaction. When you successfully [process a payment](./collect-payments.md#process-the-paymen), the returned object contains a successful charge ID. This charge contains a generated_card ID, which represents the ID of a card [PaymentMethod](https://stripe.com/docs/api/payment_methods) that’s used to [charge the saved card](#charding-saved-cards).

The initial, in-person payment benefits from the liability shift (and in certain markets, [lower pricing](https://stripe.com/en-pl/terminal#pricing) given to [standard Terminal payments](./collect-payments.md)). But subsequent payments happen online and are treated as card-not-present. For example, a gym customer pays for an initial session in person and begins a membership in the same transaction. Or a clothing store collects a customer’s email address and payment method at the checkout counter during purchase, and the customer can log in later and use it again.

You can automatically attach the `generated_card` PaymentMethod to a `customer` object to easily retrieve saved card details in the future. When creating a [PaymentIntent](https://stripe.com/docs/api/payment_intents/create), provide a [customer id](https://stripe.com/docs/api/customers) and set the [setup_future_usage](https://stripe.com/docs/api/payment_intents/create#create_payment_intent-setup_future_usage) parameter to indicate you intend to make future payments with the payment method.

### Client side

With the iOS, Android and React Native SDKs, you can create a PaymentIntent client-side and provide the `customer` and set `setup_future_usage`.

```tsx
const { createPaymentIntent } = useStripeTerminal();

const { paymentIntent, error } = await createPaymentIntent({
  amount: 20000,
  currency: 'usd',
  setupFutureUsage: 'offSession',
});
```

### Server side

The JavaScript SDK requires you to create the PaymentIntent on your server. For iOS, Android or React Native, you can create the PaymentIntent on your server if the information required to start a payment isn’t readily available in your app.

```ts
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')('sk_test_7mJuPfZsBzc3JkrANrFrcDqC');

const paymentIntent = await stripe.paymentIntents.create({
  payment_method_types: ['card'],
  amount: 1099,
  currency: 'usd',
  customer: '{{CUSTOMER_ID}}',
  payment_method: '{{PAYMENT_METHOD_ID}}',
  setup_future_usage: 'off_session',
});
```

You can retrieve the saved card details by [listing](https://stripe.com/docs/api/payment_methods/list) the card payment methods associated with that customer.

## Collect card details for future use _U.S. Only_

> Currently, you can’t use Stripe Terminal to save contactless cards and mobile wallets (e.g., Apple Pay, Google Pay) for later reuse using `readReusableCard`.

Alternatively, collect payment details in person and defer any payment until later. For example, a customer orders flowers in your store, but you only want to charge them when the order ships. In this flow, all payments are treated as card-not-present. Although you’re presenting a card in person, the transactions happen later and don’t benefit from the [lower pricing](https://stripe.com/en-pl/terminal#pricing) and liability shift given to [standard Terminal payments](./collect-payments.md) in certain markets.

**United States**

In the United States, use the `readReusableCard` method to save a card for future use.

> `readReusableCard` is only available in the United States and supports contact transactions only. Use readReusableCard with the JavaScript and Mobile SDKs for the Verifone P400, BBPOS WisePOS E, and the BBPOS Chipper 2X BT.

### React Native

The connected reader waits for the customer to present a card. When they do, `readReusableCard` collects encrypted card data and tokenizes it as a [PaymentMethod](https://stripe.com/docs/api/payment_methods) but doesn’t create any payments.

You can cancel reading a card using the `cancelReadReusableCard` method returned by the React Native SDK.

```tsx
const { readReusableCard } = useStripeTerminal();

// ...
const { paymentMethod, error } = await readReusableCard({
  customer: 'cus_KU9GGvjgrRF7Tv',
});

if (error) {
  // Placeholer for error
} else if (paymentMethod) {
  // Notify your backend to attach the PaymentMethod to a Customer
}
// ...
```

You can optionally attach the returned PaymentMethod to a `Customer` for recurring payments.

```ts
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')('sk_test_7mJuPfZsBzc3JkrANrFrcDqC');

const paymentMethod = await stripe.paymentMethods.attach(
  '{{PAYMENT_METHOD_ID}}',
  { customer: '{{CUSTOMER_ID}}' }
);
```

**Charge a saved card** _U.S. only_

You can use previously saved card details to charge customers later.

For one-time use, [create a PaymentIntent](https://stripe.com/docs/api/payment_intents/create#create_payment_intent-payment_method) and attach the saved payment method. You can’t reuse an attached payment method unless you collect payment details again by either [saving a card from a PaymentIntent](#save-a-card-while-transacting-us-only) or [reading a reusable card](#collect-card-details-for-future-use-us-only).

> When charging a saved card, you can’t use the [processPayment](./collect-payments.md#proccess-the-payment) method. Payments with generated cards are online payments and can’t be processed with Terminal SDK methods.

## Track customer behavior with card fingerprints

The Stripe API makes it easy to recognize repeat customers across online and retail channels by correlating transactions by the same card. Like card payment methods, each card_present payment method has a fingerprint attribute that uniquely identifies a particular card number. Cards from mobile wallets (e.g., Apple Pay or Google Pay) don’t share a fingerprint with cards used online.

Starting with API version 2018-01-23, Connect platforms see a fingerprint on card_present and card PaymentMethods that is uniform across all connected accounts. You can use this fingerprint to look up charges across your platform from a particular card.
