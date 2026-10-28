import type { PaymentMethodDetails } from './';

export namespace Refund {
  export type Props = {
    id?: string;
    amount?: number;
    balanceTransaction?: string;
    chargeId?: string;
    created?: string;
    currency?: string;
    description?: string;
    failureBalanceTransaction?: string;
    failureReason?: string;
    metadata?: Record<string, string>;
    paymentIntentId?: string;
    paymentMethodDetails?: PaymentMethodDetails;
    reason?: string;
    receiptNumber?: string;
    sourceTransferReversal?: string;
    status?: Status;
    transferReversal?: string;
    nextAction?: NextAction;
  };

  export type Status =
    | 'succeeded'
    | 'failed'
    | 'pending'
    | 'canceled'
    | 'requiresAction'
    | 'unknown';

  export type NextAction = {
    type?: string;
    displayDetails?: NextActionDisplayDetails;
  };

  export type NextActionDisplayDetails = {
    emailSent?: NextActionDisplayDetailsEmailSent;
    expiresAt?: string;
  };

  export type NextActionDisplayDetailsEmailSent = {
    emailSentAt?: string;
    emailSentTo?: string;
  };
}
