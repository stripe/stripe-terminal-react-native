import type { PaymentMethodDetails } from './';

export namespace Refund {
  export type Props = IOS.Props &
    Android.Props & {
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
    export interface Props {
      created: string;
      paymentMethodDetails?: PaymentMethodDetails;
    }
  }

  export type Status = 'succeeded' | 'failed' | 'pending' | 'unknown';

  export namespace Android {
    export interface Props {
      balanceTransaction?: string;
      failureBalanceTransaction?: string;
      receiptNumber?: string;
      sourceTransferReversal?: string;
      transferReversal?: string;
      paymentIntentId?: string;
    }
  }
}
