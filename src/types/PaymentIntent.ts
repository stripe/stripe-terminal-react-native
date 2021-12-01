import type { Charge } from './';

export namespace PaymentIntent {
  export interface Type {
    id: string;
    amount: number;
    charges: Charge[];
    created: string;
    currency: string;
    status: Status;
    stripeId: string;
  }

  export type Status =
    | 'canceled'
    | 'processing'
    | 'requiresCapture'
    | 'requiresConfirmation'
    | 'requiresPaymentMethod'
    | 'succeeded'
    | 'unknown';
}
