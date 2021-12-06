import type { Refund } from 'src/types/Refund';
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

export type LogLevel = LogLevelIOS | LogLevelAndroid;
export type LogLevelIOS = 'none' | 'verbose';
export type LogLevelAndroid = 'none' | 'verbose' | 'error' | 'warning';

export type DiscoverReadersParams = {
  simulated?: boolean;
  discoveryMethod: Reader.DiscoveryMethod;
};

export type ListLocationsParams = {
  limit?: number;
  endingBefore?: string;
  startingAfter?: string;
};

export type ConnectBluetoothReaderParams = {
  readerId: string;
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
  readerId: string;
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
      initialized: true;
      reader?: Reader.Type;
      error?: undefined;
    }
  | { initialized: false; error: StripeError; reader?: undefined };

export type DiscoverReadersResultType = Promise<{
  error?: StripeError;
}>;

export type CancelDiscoveringResultType = Promise<{
  error?: StripeError;
}>;

export type ConnectBluetoothReaderResultType =
  | {
      reader: Reader.Type;
      error?: undefined;
    }
  | { reader?: undefined; error: StripeError };

export type ConnectInternetResultType =
  | {
      reader: Reader.Type;
      error?: undefined;
    }
  | { reader?: undefined; error: StripeError };

export type DisconnectReaderResultType = {
  error: StripeError;
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
  setupFutureUsage?: 'offSession' | 'onSession';
};

export type CreatePaymentIntentIOSParams = {
  paymentMethodTypes?: string[];
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

export type ListLocationsResultType =
  | {
      locationsList: Location[];
      hasMore: boolean;
      error?: undefined;
    }
  | {
      locationsList?: undefined;
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
