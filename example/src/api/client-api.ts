import type { Stripe } from 'stripe';

import type { Api } from './api';

export class ClientApi implements Api {
  secretKey: string;

  headers: Record<string, string>;

  constructor({ secretKey }: { secretKey: string }) {
    this.secretKey = secretKey;

    this.headers = {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
  }

  async capturePaymentIntent(
    id: string,
    { amount_to_capture }: Stripe.PaymentIntentCaptureParams
  ): Promise<Stripe.PaymentIntent | Stripe.StripeAPIError> {
    const formData = new URLSearchParams();

    if (amount_to_capture) {
      formData.append('amount_to_capture', amount_to_capture.toString());
    }

    return fetch(`https://api.stripe.com/v1/payment_intents/${id}/capture`, {
      headers: this.headers,
      method: 'POST',
      body: formData.toString(),
    }).then((resp) => resp.json());
  }

  async createPaymentIntent({
    amount,
    currency = 'usd',
    description = 'Example PaymentIntent',
    payment_method_types,
  }: Stripe.PaymentIntentCreateParams): Promise<
    Stripe.PaymentIntent | Stripe.StripeError
  > {
    const formData = new URLSearchParams();
    formData.append('amount', amount.toString());
    formData.append('currency', currency);
    formData.append('description', description);
    formData.append('capture_method', 'manual');

    if (typeof payment_method_types === 'string') {
      formData.append('payment_method_types[]', payment_method_types);
    } else if (payment_method_types && payment_method_types.length > 0) {
      payment_method_types.forEach((method: string) => {
        formData.append('payment_method_types[]', method);
      });
    }

    // if (
    //   this.connectedAccount &&
    //   this.connectedAccount.type === ConnectChargeType.Destination
    // ) {
    //   formData.append('on_behalf_of', this.connectedAccount.id);
    //   formData.append('transfer_data[destination]', this.connectedAccount.id);
    // }

    formData.append('payment_method_types[]', 'card_present');

    return fetch('https://api.stripe.com/v1/payment_intents', {
      headers: this.headers,
      method: 'POST',
      body: formData.toString(),
    }).then((resp) => resp.json());
  }
}
