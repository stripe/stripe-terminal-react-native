const express = require('express');
const app = express();

// {{ INTEGRATION-BUILDER START: #1a }}
// This is a sample test API key. Sign in to see examples pre-filled with your key.
const stripe = require('stripe')('sk_test_7mJuPfZsBzc3JkrANrFrcDqC');
// {{ INTEGRATION-BUILDER END: #1a }}

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/create_location', async (req, res) => {
  // {{ INTEGRATION-BUILDER START: #2a }}
  const location = await stripe.terminal.locations.create({
    display_name: 'HQ',
    address: {
      line1: '1272 Valencia Street',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      postal_code: '94110',
    },
  });
  res.json({ location });
  // {{ INTEGRATION-BUILDER END: #2a }}
});

// The ConnectionToken's secret lets you connect to any Stripe Terminal reader
// and take payments with your Stripe account.
// Be sure to authenticate the endpoint for creating connection tokens.
// {{ INTEGRATION-BUILDER START: #1b }}
app.post('/connection_token', async (req, res) => {
  let connectionToken = await stripe.terminal.connectionTokens.create();
  res.json({ secret: connectionToken.secret });
});
// {{ INTEGRATION-BUILDER END: #1b }}

// {{ INTEGRATION-BUILDER START: #4a }}
app.post('/create_payment_intent', async (req, res) => {
  // For Terminal payments, the 'payment_method_types' parameter must include
  // 'card_present' and the 'capture_method' must be set to 'manual'
  const intent = await stripe.paymentIntents.create({
    amount: req.body.amount,
    currency: 'usd',
    payment_method_types: ['card_present'],
    capture_method: 'manual',
  });
  res.json({ client_secret: intent.client_secret });
});
// {{ INTEGRATION-BUILDER END: #4a }}

// {{ INTEGRATION-BUILDER START: #4e }}
app.post('/capture_payment_intent', async (req, res) => {
  const intent = await stripe.paymentIntents.capture(req.body.id);
  res.send(intent);
});
// {{ INTEGRATION-BUILDER END: #4e }}

app.listen(4242, () => console.log('Node server listening on port 4242!'));
