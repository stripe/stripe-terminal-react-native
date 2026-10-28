import type {
  AmountDetails,
  Charge,
  OfflineDetails,
  PaymentMethod,
  PaymentMethodType,
  PaymentMethodOptionsResponse,
  NextAction,
  ApiErrorInformation,
} from './';

export namespace PaymentIntent {
  export interface Type {
    id?: string;
    amount: number;
    amountCapturable?: number;
    amountDetails?: AmountDetails;
    amountReceived?: number;
    amountRequested?: number;
    amountTip?: number;
    application?: string;
    applicationFeeAmount?: number;
    canceledAt?: string;
    cancellationReason?: string;
    captureMethod?: string;
    latestCharge?: Charge;
    latestChargeId?: string;
    clientSecret?: string;
    confirmationMethod?: string;
    created: string;
    currency?: string;
    customer?: string;
    description?: string;
    livemode: boolean;
    metadata?: Record<string, string>;
    nextAction?: NextAction;
    offlineDetails?: OfflineDetails;
    onBehalfOf?: string;
    paymentMethod?: PaymentMethod.Type;
    paymentMethodId?: string;
    paymentMethodOptions?: PaymentMethodOptionsResponse;
    paymentMethodTypes?: PaymentMethodType[];
    receiptEmail?: string;
    review?: string;
    lastPaymentError?: ApiErrorInformation;
    sdkUuid: string;
    setupFutureUsage?: string;
    statementDescriptor?: string;
    statementDescriptorSuffix?: string;
    status?: Status;
    transferGroup?: string;
  }

  export type Status =
    | 'canceled'
    | 'processing'
    | 'requiresAction'
    | 'requiresCapture'
    | 'requiresConfirmation'
    | 'requiresPaymentMethod'
    | 'requiresReauthorization'
    | 'succeeded'
    | 'unknown';
}
