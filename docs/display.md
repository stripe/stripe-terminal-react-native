# Display cart details

## Dynamically update cart details on the reader screen.

The built-in screen of the Verifone P400 and BBPOS WisePOS E can display line items. During the checkout process, you can update the reader’s screen to show individual items in the transaction, along with the total price.

![img](https://b.stripecdn.com/docs-statics-srv/assets/frame-4.c75473bf488c72dbd45a6c61d46ed203.png)

## Set the reader display

To set the line items and total displayed on the reader during a payment, pass line items and total information into the setReaderDisplay method. The object you pass in will drive the contents displayed on the reader’s screen.

Note that the amounts passed to the setReaderDisplay method are only used for display purposes. The reader will not automatically calculate tax or the total; your application must calculate those before displaying the values. Similarly, the total passed to setReaderDisplay does not control the amount charged to the customer; make sure the amount displayed on the reader matches the amount you’re charging your customer.

To reset the reader’s display from a line item interface to the splash screen, call the clearReaderDisplay method.

### React Native

```tsx
const { error } = await setReaderDisplay({
  currency: 'usd',
  tax: 100,
  total: 1998,
  lineItems: [
    {
      displayName: 'Caramel latte',
      quantity: 1,
      amount: 659,
    },
    {
      displayName: 'Dozen donuts',
      quantity: 1,
      amount: 1239,
    },
  ],
});
if (error) {
  // Placeholder for handling exception
} else {
  // Placeholder for handling successful operation
}
```

## Pre-dip a card

> Pre-dipping a card is only supported for payments in the U.S.

The Verifone P400 and BBPOS WisePOS E support the ability to present a card to the reader before the transaction amount is finalized.

This option—known as pre-dip, pre-tap, or pre-swipe—can help speed up transaction times by allowing a customer to present a payment method before the end of the transaction.

The setReaderDisplay method prepares the reader for pre-dipping. The customer can present a payment method at any point after the method is called.

Even if a customer pre-dips their card, your application must still complete the full payment flow.
