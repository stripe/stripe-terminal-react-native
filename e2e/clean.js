const ProxyAgent = require('https-proxy-agent');

const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY, {
  httpAgent: process.env.http_proxy
    ? new ProxyAgent(process.env.http_proxy)
    : null,
});

export const cleanPaymentMethods = async () => {
  await stripe.paymentMethods.list(
    { customer: 'cus_KZXZYmu4lAIE94', type: 'card', limit: 100 },
    (err, cards) => {
      if (err) {
        console.error(err);
        return;
      }
      cards.data.forEach((card) =>
        stripe.paymentMethods.detach(card.id, (paymentErr, paymentMethod) => {
          if (paymentErr) {
            console.error(paymentErr);
            return;
          }

          // asynchronously called
          console.log(`detached payment method ${paymentMethod.id}`);
        })
      );
    }
  );
};
