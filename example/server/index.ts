import Stripe from 'stripe';
import express from 'express';

const secret_key =
  'sk_test_51ITUqcBDuqlYGNW2ZibB5toEOYCEbazYnrOGZI0lnkdNxBFatdifhUPEEdlIesmT21PSFPYy2qD4IqbMSi4KQk7e00ONMnQeXM';

const stripe = new Stripe(secret_key as string, {
  apiVersion: '2020-08-27',
  typescript: true,
});

const app = express();
const port = 3002;

app.use(express.json());

app.post(
  '/connection_token',
  async (_: express.Request, res: express.Response) => {
    let connectionToken = await stripe.terminal.connectionTokens.create();

    console.log('/connection_token', connectionToken);

    res.json({ secret: connectionToken.secret });
  }
);

app.post(
  '/create_payment_intent',
  async (_: express.Request, res: express.Response) => {
    const intent = await stripe.paymentIntents.create({
      amount: 1000,
      currency: 'usd',
      payment_method_types: ['card_present'],
      capture_method: 'manual',
    });

    console.log('/create_payment_intent', intent);

    res.json({ id: intent.id, client_secret: intent.client_secret });
  }
);

app.post(
  '/capture_payment_intent',
  async (req: express.Request, res: express.Response) => {
    const intent = await stripe.paymentIntents.capture(req.body.id);

    console.log('/capture_payment_intent', intent);

    res.json({ intent });
  }
);

app.post(
  '/create_setup_intent',
  async (_: express.Request, res: express.Response) => {
    const intent = await stripe.setupIntents.create({
      payment_method_types: ['card_present'],
    });

    res.json({ client_secret: intent.client_secret });
  }
);

app.get(
  '/create_location',
  async (_: express.Request, res: express.Response) => {
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
    console.log('/create_location', location);

    res.json({ location: location });
  }
);

app.get('/get_locations', async (_: express.Request, res: express.Response) => {
  const locations = await stripe.terminal.locations.list();

  console.log('/get_locations', locations);

  res.json({ locations: locations.data });
});

app.get('/get_customers', async (_: express.Request, res: express.Response) => {
  const customers = await stripe.customers.list();

  console.log('/get_customers', customers);

  res.json({ customers: customers.data });
});

app.post('/readers', async (req: express.Request, res: express.Response) => {
  try {
    const reader = await stripe.terminal.readers.create({
      ...req.body,
    });
    res.json({ reader });
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    res.json({ error: errorMessage });
  }
});

app.listen(port, () => {
  console.log('Running on port ' + port);
});
