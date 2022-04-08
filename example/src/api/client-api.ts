import type { Stripe } from 'stripe';

import type { Api } from './api';

export class ClientApi implements Api {
  secretKey: string;

  headers: Record<string, string>;

  constructor() {
    this.secretKey = '';
    this.headers = {};
  }

  setSecretKey(secretKey: string) {
    this.secretKey = secretKey;

    this.headers = {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
  }

  async capturePaymentIntent(
    id: string,
    { amount_to_capture }: Stripe.PaymentIntentCaptureParams
  ): Promise<Stripe.PaymentIntent | { error: Stripe.StripeAPIError }> {
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
    Stripe.PaymentIntent | { error: Stripe.StripeError }
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
  static async getAccounts(
    keys: Array<string>
  ): Promise<Array<Stripe.Account & { secretKey: string }>> {
    const results = keys.map((key) => this.getAccount(key));

    const accounts = await Promise.all(results);

    // Silently drop any accounts we were unable to fetch
    return accounts.filter((account) => !('error' in account)) as Array<
      Stripe.Account & { secretKey: string }
    >;
  }

  static async getAccount(
    secretKey: string
  ): Promise<
    (Stripe.Account & { secretKey: string }) | { error: Stripe.StripeAPIError }
  > {
    const result = await fetch('https://api.stripe.com/v1/account', {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    const data = await result.json();

    if ('error' in data) {
      return data;
    }

    data.secretKey = secretKey;

    return data;
  }

  async createConnectionToken(): Promise<
    Stripe.Terminal.ConnectionToken | { error: Stripe.StripeAPIError }
  > {
    console.log(this.secretKey);
    const formData = new URLSearchParams();
    return fetch('https://api.stripe.com/v1/terminal/connection_tokens', {
      headers: this.headers,
      method: 'POST',
      body: formData.toString(),
    }).then((resp) => resp.json());
  }
}
