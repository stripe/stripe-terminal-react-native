import Stripe from 'stripe';
import express from 'express';
import winston from 'winston';
import expressWinston from 'express-winston';
import 'dotenv/config';

if (!process.env.STRIPE_PRIVATE_KEY) {
  console.error(
    "No Stripe API Key found!\nPlease ensure you've created a .env file and followed the setup instructions at https://github.com/stripe/stripe-terminal-react-native#run-the-example-app!"
  );
  process.exit(-1);
}

const secret_key = process.env.STRIPE_PRIVATE_KEY;

const stripe = new Stripe(secret_key as string, {
  apiVersion: '2020-08-27',
  typescript: true,
});

const app = express();
const port = process.env.PORT ? process.env.PORT : 3002;

app.use(express.json());

expressWinston.requestWhitelist.push('body');
expressWinston.responseWhitelist.push('body');

app.use(
  expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json(),
      winston.format.prettyPrint()
    ),
  })
);

app.post(
  '/connection_token',
  async (_: express.Request, res: express.Response) => {
    let connectionToken = await stripe.terminal.connectionTokens.create();

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

    res.json({ id: intent.id, client_secret: intent.client_secret });
  }
);

app.post(
  '/capture_payment_intent',
  async (req: express.Request, res: express.Response) => {
    const intent = await stripe.paymentIntents.capture(req.body.id);

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

    res.json({ location: location });
  }
);

app.get('/get_locations', async (_: express.Request, res: express.Response) => {
  const locations = await stripe.terminal.locations.list();

  res.json({ locations: locations.data });
});

app.get('/get_customers', async (_: express.Request, res: express.Response) => {
  const customers = await stripe.customers.list();

  res.json({ customers: customers.data });
});

app.post(
  '/register_reader',
  async (req: express.Request, res: express.Response) => {
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
  }
);

app.listen(port, () => {
  console.log('Running on port ' + port);
});
