import type { Stripe } from 'stripe';

export interface Api {
  createConnectionToken(): Promise<
    Stripe.Terminal.ConnectionToken | { error: Stripe.StripeAPIError }
  >;

  createPaymentIntent(
    intentParams: Stripe.PaymentIntentCreateParams
  ): Promise<Stripe.PaymentIntent | { error: Stripe.StripeError }>;

  capturePaymentIntent(
    id: string,
    params: Stripe.PaymentIntentCaptureParams
  ): Promise<Stripe.PaymentIntent | { error: Stripe.StripeError }>;
}
