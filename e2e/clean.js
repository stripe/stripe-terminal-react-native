const fs = require('fs');
const path = require('path');
const ProxyAgent = require('https-proxy-agent');
const Stripe = require('stripe');

const DEFAULT_CUSTOMER_ID = 'cus_OXIcxa1cyMcDWD';
const DEV_APP_ENV_PATH = path.join(__dirname, '..', 'dev-app', '.env');

const parseEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((acc, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return acc;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        return acc;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      // Strip surrounding single or double quotes (e.g. KEY="value" → value)
      const value = trimmed
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^(['"])(.*)\1$/, '$2');
      acc[key] = value;
      return acc;
    }, {});
};

const getStripePrivateKey = () => {
  if (process.env.STRIPE_PRIVATE_KEY) {
    return process.env.STRIPE_PRIVATE_KEY;
  }

  const envFile = parseEnvFile(DEV_APP_ENV_PATH);
  const preloadedKeys =
    process.env.PRELOADED_SECRET_KEYS || envFile.PRELOADED_SECRET_KEYS || '';

  // PRELOADED_SECRET_KEYS may contain multiple comma-separated keys; use the first valid one.
  return preloadedKeys
    .split(',')
    .map((key) => key.trim())
    .find(Boolean);
};

const getStripeClient = () => {
  const stripePrivateKey = getStripePrivateKey();

  if (!stripePrivateKey) {
    throw new Error(
      `Missing Stripe secret key. Set STRIPE_PRIVATE_KEY or PRELOADED_SECRET_KEYS, or populate ${DEV_APP_ENV_PATH}.`
    );
  }

  return new Stripe(stripePrivateKey, {
    httpAgent: process.env.http_proxy
      ? new ProxyAgent(process.env.http_proxy)
      : null,
  });
};

const listCustomerCardPaymentMethods = async (stripe, customer) => {
  const paymentMethods = [];
  let startingAfter;

  while (true) {
    const page = await stripe.paymentMethods.list({
      customer,
      type: 'card',
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    paymentMethods.push(...page.data);

    if (!page.has_more || page.data.length === 0) {
      return paymentMethods;
    }

    startingAfter = page.data[page.data.length - 1].id;
  }
};

const isAlreadyDetachedPaymentMethodError = (error) => {
  // Stripe does not set error.code for this case; match
  // on the error type + message instead. The observed message is:
  //   "The payment method you provided is not attached to a customer so detachment is impossible."
  if (error?.type !== 'StripeInvalidRequestError') return false;
  const message = error?.message || '';
  return /not attached|already detached|detachment is impossible/i.test(message);
};

const detachPaymentMethod = async (stripe, paymentMethodId) => {
  try {
    await stripe.paymentMethods.detach(paymentMethodId);
    console.log(`detached payment method ${paymentMethodId}`);
    return 'detached';
  } catch (error) {
    // Android and iOS e2e jobs can race while cleaning the shared customer.
    if (isAlreadyDetachedPaymentMethodError(error)) {
      console.log(
        `payment method ${paymentMethodId} was already detached; skipping`
      );
      return 'skipped';
    }

    throw error;
  }
};

const cleanPaymentMethods = async ({
  customer = process.env.E2E_CUSTOMER_ID || DEFAULT_CUSTOMER_ID,
} = {}) => {
  const stripe = getStripeClient();
  const paymentMethods = await listCustomerCardPaymentMethods(stripe, customer);
  let detachedCount = 0;
  let skippedCount = 0;

  for (const paymentMethod of paymentMethods) {
    const result = await detachPaymentMethod(stripe, paymentMethod.id);
    if (result === 'detached') {
      detachedCount += 1;
    } else {
      skippedCount += 1;
    }
  }

  console.log(
    paymentMethods.length === 0
      ? `No attached card payment methods found for ${customer}`
      : `Detached ${detachedCount} card payment methods from ${customer}` +
          (skippedCount > 0
            ? ` (${skippedCount} already detached by another cleanup run)`
            : '')
  );

  return detachedCount;
};

if (require.main === module) {
  cleanPaymentMethods().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  cleanPaymentMethods,
};
