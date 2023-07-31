import type { Refund } from './Refund';
import type { PaymentIntent } from './PaymentIntent';
import type { Reader } from './Reader';
import type { SetupIntent } from './SetupIntent';

export * from './Reader';
export * from './SetupIntent';
export * from './PaymentIntent';
export * from './Refund';

export type InitParams = {
  logLevel?: LogLevel;
};

export type SetConnectionTokenParams = {
  token?: string;
  error?: string;
};

export type LogLevel = LogLevelIOS | LogLevelAndroid;
export type LogLevelIOS = 'none' | 'verbose';
export type LogLevelAndroid = 'none' | 'verbose' | 'error' | 'warning';

export type DiscoverReadersParams = {
  simulated?: boolean;
  discoveryMethod: Reader.DiscoveryMethod;
};

export type GetLocationsParams = {
  limit?: number;
  endingBefore?: string;
  startingAfter?: string;
};

export type ConnectBluetoothReaderParams = {
  reader: Reader.Type;
  locationId?: string;
};

export type ConnectUsbReaderParams = {
  reader: Reader.Type;
  locationId?: string;
};

export type ConnectLocalMobileParams = {
  reader: Reader.Type;
  locationId?: string;
  onBehalfOf?: string;
};

export type ConnectHandoffParams = {
  reader: Reader.Type;
  locationId?: string;
};

export type LineItem = {
  displayName: string;
  quantity: number;
  amount: number;
};

export type Cart = {
  currency: string;
  tax: number;
  total: number;
  lineItems: LineItem[];
};

export type ConnectInternetReaderParams = {
  reader: Reader.Type;
  failIfInUse?: boolean;
};

export enum CommonError {
  Failed = 'Failed',
  Canceled = 'Canceled',
  Unknown = 'Unknown',
}

export type LocationStatus = 'notSet' | 'set' | 'unknown';

export type StripeError<T = CommonError> = {
  code: T;
  message: string;
};

export type InitializeResultType =
  | {
      reader?: Reader.Type;
      error?: undefined;
    }
  | { error: StripeError; reader?: undefined };

export type DiscoverReadersResultType = Promise<{
  error?: StripeError;
}>;

export type CancelDiscoveringResultType = Promise<{
  error?: StripeError;
}>;

export type ConnectReaderResultType =
  | {
      reader: Reader.Type;
      error?: undefined;
    }
  | { reader?: undefined; error: StripeError };

export type DisconnectReaderResultType = {
  error: StripeError;
};

export type UpdateSoftwareResultType = {
  update?: Reader.SoftwareUpdate;
  error?: StripeError;
};

export interface Location {
  displayName?: string;
  id: string;
  livemode: boolean;
  address?: Address;
}

export interface Address {
  city?: string;
  country?: string;
  postalCode?: string;
  line1?: string;
  line2?: string;
  state?: string;
}

export type PaymentStatus =
  | 'notReady'
  | 'ready'
  | 'processing'
  | 'waitingForInput';

export type PaymentMethodType = 'cardPresent' | 'interacPresent' | 'card';

export interface Charge {
  id: string;
  amount: number;
  description: string;
  currency: string;
  status: string;
}

export type CreatePaymentIntentParams = CreatePaymentIntentIOSParams & {
  amount: number;
  currency: string;
  setupFutureUsage?: 'off_session' | 'on_session';
  onBehalfOf?: string;
  transferDataDestination?: string;
  applicationFeeAmount?: number;
  stripeDescription?: string;
  statementDescriptor?: string;
  receiptEmail?: string;
  customer?: string;
  transferGroup?: string;
  metadata?: Record<string, string>;
  paymentMethodOptions?: PaymentMethodOptions;
  captureMethod?: 'automatic' | 'manual';
};

export type CreatePaymentIntentIOSParams = {
  paymentMethodTypes?: string[];
};

export type PaymentMethodOptions = {
  requestExtendedAuthorization?: boolean;
  requestIncrementalAuthorizationSupport?: boolean;
  requestedPriority: string;
};

export type CollectPaymentMethodParams = {
  paymentIntentId: string;
  skipTipping?: boolean;
  tipEligibleAmount?: number;
  updatePaymentIntent?: boolean;
};

export type CollectSetupIntentPaymentMethodParams = {
  customerConsentCollected?: boolean;
  setupIntentId: string;
};

export type CreateSetupIntentParams = {
  customerId?: string;
};

export type PaymentIntentResultType =
  | {
      paymentIntent: PaymentIntent.Type;
      error?: undefined;
    }
  | {
      paymentIntent?: undefined;
      error: StripeError;
    };

export type SetupIntentResultType =
  | {
      setupIntent: SetupIntent.Type;
      error?: undefined;
    }
  | {
      setupIntent?: undefined;
      error: StripeError;
    };

export type GetLocationsResultType =
  | {
      locations: Location[];
      hasMore: boolean;
      error?: undefined;
    }
  | {
      locations?: undefined;
      hasMore?: undefined;
      error: StripeError;
    };

export type ClearReaderDisplayResultType = {
  error: StripeError;
};

export type CollectRefundPaymentMethodType = {
  error?: StripeError;
};

export type RefundParams = {
  chargeId: string;
  amount: number;
  currency: string;
  refundApplicationFee?: boolean;
  reverseTransfer?: boolean;
};

export type CardPresent = {
  last4: string;
  expMonth: string;
  expYear: string;
  cardholderName?: string;
  funding: string;
  brand: string;
  fingerprint: string;
  generatedCard?: string;
  receipt?: string;
  emvAuthData?: string;
  country?: string;
  preferredLocales?: string;
};

export type PaymentMethodDetails = {
  type: string;
  cardPresent?: CardPresent;
  interacPresent?: string;
};

export type ProcessRefundResultType = {
  refund?: Refund.Props;
  error?: StripeError;
};

export type ReadReusableCardParamsType = {
  customer?: string;
};

type CardDetails = {
  brand: string;
  country: string;
  expMonth: number;
  expYear: number;
  fingerprint: string;
  funding: string;
  last4: string;
};

/**
 * @ignore
 */
export type EventResult<T> = {
  result: T;
};

export type UserCallbacks = {
  onUpdateDiscoveredReaders?(readers: Reader.Type[]): void;
  onFinishDiscoveringReaders?(error?: StripeError): void;
  onDidReportUnexpectedReaderDisconnect?(error?: StripeError): void;
  onDidReportAvailableUpdate?(update: Reader.SoftwareUpdate): void;
  onDidStartInstallingUpdate?(update: Reader.SoftwareUpdate): void;
  onDidReportReaderSoftwareUpdateProgress?(progress: string): void;
  onDidFinishInstallingUpdate?(result: UpdateSoftwareResultType): void;

  onDidRequestReaderInput?(input: Reader.InputOptions[]): void;
  onDidRequestReaderDisplayMessage?(message: Reader.DisplayMessage): void;

  onDidChangeConnectionStatus?(status: Reader.ConnectionStatus): void;
  onDidChangePaymentStatus?(status: PaymentStatus): void;
};

export namespace PaymentMethod {
  export type Type = IOS.Type &
    Android.Props & {
      id: string;
      customer: string;
      cardDetails: CardDetails;
    };

  export namespace IOS {
    export interface Type {
      created: string;
      type: string;
    }
  }

  export namespace Android {
    export interface Props {
      livemode: boolean;
    }
  }
}

export type PaymentMethodResultType =
  | {
      paymentMethod?: PaymentMethod.Type;
      error: undefined;
    }
  | {
      paymentMethod: undefined;
      error: StripeError;
    };
