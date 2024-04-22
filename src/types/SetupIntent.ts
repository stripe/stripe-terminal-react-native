import type { PaymentMethodType } from './';

export namespace SetupIntent {
  export type Type = Android.Type &
    IOS.Type & {
      id: string;
      created: string;
      customer?: string;
      metadata?: Record<string, string>;
      status: Status;
      latestAttempt: SetupAttempt;
      usage: Usage;
      sdkUuid: string;
      paymentMethodTypes?: string[];
    };

  export type Status =
    | 'canceled'
    | 'processing'
    | 'requiresAction'
    | 'requiresConfirmation'
    | 'requiresPaymentMethod'
    | 'succeeded'
    | 'unknown';

  export type Usage = 'offSession' | 'onSession';

  export type SetupAttempt = IOS.SetupAttempt &
    Android.SetupAttempt & {
      id: string;
      created?: number;
      status: string;
      customer?: string;
      setupIntentId?: string;
      paymentMethodDetails: SetupAttemptPaymentMethodDetails;
      onBehalfOfId?: string;
      applicationId?: string;
      paymentMethodId?: string;
    };

  export interface SetupAttemptPaymentMethodDetails {
    cardPresent: SetupAttemptCardPresentDetails;
    interacPresent: SetupAttemptCardPresentDetails;
    type: PaymentMethodType;
  }

  export interface SetupAttemptCardPresentDetails {
    emvAuthData: string;
    generatedCard: string;
  }

  export namespace IOS {
    export type SetupAttempt = {};

    export type Type = {};
  }

  export namespace Android {
    export type SetupAttempt = {
      isLiveMode: boolean;
      usage?: Usage;
    };

    export type Type = {
      applicationId?: string;
      clientSecret?: string;
      description?: string;
      mandateId?: string;
      onBehalfOfId?: string;
      paymentMethodId?: string;
      singleUseMandateId?: string;
    };
  }
}
