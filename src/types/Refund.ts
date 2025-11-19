import type { PaymentMethodDetails } from './';

export namespace Refund {
  export type Props = IOS.Type &
    Android.Type & {
      id: string;
      amount?: number;
      chargeId: string;
      currency?: string;
      failureReason?: string;
      metadata?: Record<string, string>;
      reason?: string;
      description?: string;
      status?: Status;
    };

  export namespace IOS {
    export interface Type {
      created: string;
      paymentMethodDetails?: PaymentMethodDetails;
    }
  }

  export type Status = 'succeeded' | 'failed' | 'pending' | 'unknown';

  export namespace Android {
    export interface Type {
      balanceTransaction?: string;
      failureBalanceTransaction?: string;
      receiptNumber?: string;
      sourceTransferReversal?: string;
      transferReversal?: string;
      paymentIntentId?: string;
    }
  }
}
