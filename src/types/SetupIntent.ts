import type {
  NextAction,
  PaymentMethod,
  PaymentMethodOptions,
  PaymentMethodType,
  ApiErrorInformation,
} from './';

export namespace SetupIntent {
  export type Type = {
    id: string;
    sdkUuid: string;
    application?: string;
    cancellationReason?: string;
    clientSecret?: string;
    created?: string;
    customer?: string;
    description?: string;
    latestAttempt?: SetupAttempt;
    livemode: boolean;
    mandate?: string;
    metadata?: Record<string, string>;
    nextAction?: NextAction;
    onBehalfOf?: string;
    paymentMethodId?: string;
    paymentMethod?: PaymentMethod.Type;
    paymentMethodOptions?: PaymentMethodOptions;
    paymentMethodTypes?: string[];
    singleUseMandate?: string;
    status?: Status;
    usage?: Usage;
    lastSetupError?: ApiErrorInformation;
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

  export type SetupAttempt = {
    id: string;
    applicationId?: string;
    created?: string;
    customer?: string;
    livemode: boolean;
    onBehalfOfId?: string;
    paymentMethodDetails: SetupAttemptPaymentMethodDetails;
    paymentMethodId?: string;
    setupIntentId?: string;
    status: string;
    usage?: Usage;
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
}
