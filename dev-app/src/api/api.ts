import type { Stripe } from 'stripe';

// Disclaimer: we're using the client layer in lieu of a merchant backend in order
// to allow dynamic switching of merchant accounts within the app. This eases dev and qa
// validation within stripe and SHOULD NOT be used as prior art for your own POS implementation
export class Api {
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

  async registerDevice({
    label,
    registrationCode,
    location,
  }: {
    label: string;
    registrationCode: string;
    location: string | null | undefined;
  }): Promise<Stripe.Terminal.Reader | { error: Stripe.StripeAPIError }> {
    const formData = new URLSearchParams();
    formData.append('label', label);
    formData.append('registration_code', registrationCode);
    if (location) {
      formData.append('location', location);
    }

    return fetch('https://api.stripe.com/v1/terminal/readers', {
      headers: this.headers,
      method: 'POST',
      body: formData.toString(),
    }).then((resp) => resp.json());
  }

  async createSetupIntent({
    description = 'Example SetupIntent',
    paymentMethodTypes = '',
    customer,
  }: {
    description?: string;
    paymentMethodTypes?: string;
    customer?: string;
  }): Promise<Stripe.SetupIntent | { error: Stripe.StripeAPIError }> {
    const formData = new URLSearchParams();
    formData.append('description', description);

    if (paymentMethodTypes.length > 0) {
      formData.append('payment_method_types[]', paymentMethodTypes);
    }

    formData.append('payment_method_types[]', 'card_present');

    if (customer) {
      formData.append('customer', customer);
    }

    return fetch('https://api.stripe.com/v1/setup_intents', {
      headers: this.headers,
      method: 'POST',
      body: formData.toString(),
    }).then((resp) => resp.json());
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
    setup_future_usage,
    capture_method,
  }: Stripe.PaymentIntentCreateParams): Promise<
    Stripe.PaymentIntent | { error: Stripe.StripeError }
  > {
    const formData = new URLSearchParams();
    formData.append('amount', amount.toString());
    formData.append('currency', currency);
    formData.append('description', description);
    formData.append('capture_method', capture_method || 'manual');
    if (setup_future_usage) {
      formData.append('setup_future_usage', setup_future_usage);
    }

    if (typeof payment_method_types === 'string') {
      formData.append('payment_method_types[]', payment_method_types);
    } else if (payment_method_types && payment_method_types.length > 0) {
      payment_method_types.forEach((method: string) => {
        formData.append('payment_method_types[]', method);
      });
    }

    // TODO: implement connect functionality to set these values
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
    const formData = new URLSearchParams();
    return fetch('https://api.stripe.com/v1/terminal/connection_tokens', {
      headers: this.headers,
      method: 'POST',
      body: formData.toString(),
    }).then((resp) => resp.json());
  }

  async getCustomers(
    email?: string
  ): Promise<Array<Stripe.Customer> | { error: Stripe.StripeAPIError }> {
    const params = new URLSearchParams();
    if (email) {
      params.append('email', email);
    }
    return fetch(`https://api.stripe.com/v1/customers?${params.toString()}`, {
      headers: this.headers,
    })
      .then((resp) => resp.json())
      .then((resp) => {
        if ('data' in resp) {
          return resp.data;
        }

        return resp;
      });
  }

  async createCustomer(
    email: string
  ): Promise<Stripe.Customer | { error: Stripe.StripeAPIError }> {
    const formData = new URLSearchParams();
    formData.append('email', email);

    return fetch('https://api.stripe.com/v1/customers', {
      headers: this.headers,
      method: 'POST',
      body: formData.toString(),
    })
      .then((resp) => resp.json())
      .then((resp) => {
        if ('data' in resp) {
          return resp.data;
        }

        return resp;
      });
  }

  async getPaymentIntent(
    id: string
  ): Promise<Stripe.PaymentIntent | { error: Stripe.StripeAPIError }> {
    const formData = new URLSearchParams();

    return fetch(`https://api.stripe.com/v1/payment_intents/${id}`, {
      headers: this.headers,
      method: 'POST',
      body: formData.toString(),
    })
      .then((resp) => resp.json())
      .then((resp) => {
        if ('data' in resp) {
          return resp.data;
        }

        return resp;
      });
  }

  async lookupOrCreateExampleCustomer(): Promise<
    Stripe.Customer | { error: Stripe.StripeAPIError }
  > {
    const customerEmail = 'example@test.com';
    const customerList = await this.getCustomers(customerEmail);

    if ('error' in customerList) {
      return customerList;
    }

    if (customerList.length > 0) {
      return Promise.resolve(customerList[0]);
    }

    return this.createCustomer(customerEmail);
  }
}
