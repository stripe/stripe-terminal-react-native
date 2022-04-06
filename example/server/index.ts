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

const default_port = 3002;

// Port reserved for Canada's accounts for testing purposes
const canada_port = 3003;

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : default_port;

const secret_key = process.env.STRIPE_PRIVATE_KEY;
const secret_ca_key = process.env.STRIPE_CA_PRIVATE_KEY;

const stripe_default = new Stripe(secret_key as string, {
  apiVersion: '2020-08-27',
  typescript: true,
});

const stripe = (() => {
  // in case of Canada's port provided let's use proper Stripe instance.
  if (port === canada_port) {
    if (!secret_ca_key) {
      console.error(
        "You've provided `3003` port which is reserved for Canada's accounts, in order to use it you must provide STRIPE_CA_PRIVATE_KEY env as well."
      );
      process.exit(-1);
    }
    const stripe_ca = new Stripe(secret_ca_key as string, {
      apiVersion: '2020-08-27',
      typescript: true,
    });

    return stripe_ca;
  }
  return stripe_default;
})();

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
  async (req: express.Request, res: express.Response) => {
    const intent = await stripe.paymentIntents.create({
      amount: req.body.amount || 1000,
      currency: req.body.currency || 'usd',
      payment_method_types: req.body.payment_method_types || ['card_present'],
      setup_future_usage: req.body.setup_future_usage,
      capture_method: req.body.capture_method || 'manual',
      on_behalf_of: req.body.on_behalf_of,
      transfer_data: {
        destination: req.body.transfer_data_destination,
      },
      application_fee_amount: req.body.applicationFeeAmount,
    });

    res.json({ id: intent.id, client_secret: intent.client_secret });
  }
);

app.post(
  '/capture_payment_intent',
  async (req: express.Request, res: express.Response) => {
    try {
      const intent = await stripe.paymentIntents.capture(req.body.id);
      res.json({ intent });
    } catch (error) {
      res.json({ error: (error as any).raw });
    }
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

app.get(
  '/fetch_latest_interac_charge',
  async (_: express.Request, res: express.Response) => {
    const charges = await stripe.charges.list();
    const paymentIntents = await stripe.paymentIntents.list();

    const filteredCharges = charges.data.filter((charge) => {
      const paymentIntent = paymentIntents.data.find(
        (pi) => pi.id === charge.payment_intent
      );

      return paymentIntent?.payment_method_types.includes('interac_present');
    });

    const charge = filteredCharges[0];

    if (!charge) {
      res.json({ error: 'Charges list is empty' });
      return;
    }

    res.json({ id: charge.id });
  }
);

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

// 404 error handler - this should always be the last route
app.use(function (req, res, _) {
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  res.status(404).send(
    res.json({
      errorCode: '404',
      errorMessage: `Route not found ${url}`,
    })
  );
});

app.listen(port, () => {
  console.log('Running on port ' + port);
});
