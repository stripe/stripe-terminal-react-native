import type { Stripe } from 'stripe';

export class Api {
  headers: Record<string, string>;
  api_url: string;

  constructor() {
    this.headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (!process.env.API_URL) {
      console.error('please set an API_URL for your backend in your .env file');
      throw new Error(
        'please set an API_URL for your backend in your .env file'
      );
    }

    this.api_url = process.env.API_URL || 'https://no-api-url-provided.com';
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

    return fetch(`${this.api_url}/register_reader`, {
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
    id: string
  ): Promise<Partial<Stripe.PaymentIntent> | { error: Stripe.StripeAPIError }> {
    const formData = new URLSearchParams();

    formData.append('payment_intent_id', id);

    return fetch(`${this.api_url}/capture_payment_intent`, {
      headers: this.headers,
      method: 'POST',
      body: formData.toString(),
    })
      .then((resp) => resp.json())
      .then((j) => ({
        client_secret: j.secret,
        id: j.intent,
      }));
  }

  async createPaymentIntent({
    amount,
    currency = 'usd',
    description = 'Example PaymentIntent',
    payment_method_types,
  }: Stripe.PaymentIntentCreateParams): Promise<
    Partial<Stripe.PaymentIntent> | { error: Stripe.StripeError }
  > {
    const formData = new URLSearchParams();
    formData.append('amount', amount.toString());
    formData.append('currency', currency);
    formData.append('description', description);

    if (typeof payment_method_types === 'string') {
      formData.append('payment_method_types[]', payment_method_types);
    } else if (payment_method_types && payment_method_types.length > 0) {
      payment_method_types.forEach((method: string) => {
        formData.append('payment_method_types[]', method);
      });
    }

    formData.append('payment_method_types[]', 'card_present');

    return fetch(`${this.api_url}/create_payment_intent`, {
      headers: this.headers,
      method: 'POST',
      body: formData.toString(),
    })
      .then((resp) => resp.json())
      .then((j) => ({
        client_secret: j.secret,
        id: j.intent,
      }));
  }

  async createConnectionToken(): Promise<
    Stripe.Terminal.ConnectionToken | { error: Stripe.StripeAPIError }
  > {
    const formData = new URLSearchParams();
    return fetch(`${this.api_url}/connection_token`, {
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
