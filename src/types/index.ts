import type { Refund } from './Refund';
import type { PaymentIntent } from './PaymentIntent';
import type { Reader } from './Reader';
import type { SetupIntent } from './SetupIntent';
import type { StripeError } from './StripeError';

export * from './StripeError';
export * from './Reader';
export * from './SetupIntent';
export * from './PaymentIntent';
export * from './Refund';

/**
 * Represents a payment option
 * Used when a reader supports multiple payment methods (e.g., card + QR code).
 *
 * @see onPaymentMethodSelectionRequired
 */
export type PaymentOption = {
  /** Index of the payment option, used when calling selectPaymentOption() */
  index: number;
  /** Type of payment: 'card' for card-present, 'nonCard' for QR-based payments */
  type: 'card' | 'nonCard' | 'unknown';
  /** Human-readable label for the payment option */
  label?: string;
  /** The underlying payment method type */
  paymentMethodType?: string;
};

/**
 * Data required to display a QR code
 * The customer scans this QR code with their mobile payment app to complete the transaction.
 *
 * @see onQrCodeDisplayRequired
 */
export type QrCodeDisplayData = {
  /** URL to a PNG image of the QR code */
  imageUrlPng: string;
  /** URL to an SVG image of the QR code */
  imageUrlSvg: string;
  /** Unix timestamp (in milliseconds) when the QR code expires */
  expiresAtMs: number;
  /** The payment method type this QR code is for */
  paymentMethodType: string;
};

/**
 * Handler for payment method selection events.
 * Called when a mobile Bluetooth reader supports multiple payment options.
 */
export type PaymentMethodSelectionHandler = (
  paymentIntent: PaymentIntent.Type,
  availablePaymentOptions: PaymentOption[],
  callback: {
    selectPaymentOption: (paymentOptionType: string) => Promise<{ error?: StripeError }>;
    failPaymentMethodSelection: (error?: string) => Promise<{ error?: StripeError }>;
  }
) => void;

/**
 * Handler for QR code display events.
 * Called when the SDK needs to display a QR code for payment.
 */
export type QrCodeDisplayHandler = (
  paymentIntent: PaymentIntent.Type,
  qrData: QrCodeDisplayData,
  callback: {
    confirmQrCodeDisplayed: () => Promise<{ error?: StripeError }>;
    failQrCodeDisplay: (error?: string) => Promise<{ error?: StripeError }>;
  }
) => void;

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

export type DiscoverReadersParams =
  | DiscoverBluetoothScanParams
  | DiscoverBluetoothProximityParams
  | DiscoverInternetParams
  | DiscoverUsbParams
  | DiscoverAppsOnDevicesParams
  | DiscoverTapToPayParams;

export type DiscoverBluetoothScanParams = {
  discoveryMethod: 'bluetoothScan';
  timeout?: number;
  simulated?: boolean;
};

export type DiscoverBluetoothProximityParams = {
  discoveryMethod: 'bluetoothProximity';
  simulated?: boolean;
};

export type DiscoverInternetParams = {
  discoveryMethod: 'internet';
  timeout?: number;
  simulated?: boolean;
  locationId?: string;
  discoveryFilter?: DiscoveryFilter;
};

export type DiscoverUsbParams = {
  discoveryMethod: 'usb';
  timeout?: number;
  simulated?: boolean;
};

export type DiscoverAppsOnDevicesParams = {
  discoveryMethod: 'appsOnDevices';
};

export type DiscoverTapToPayParams = {
  discoveryMethod: 'tapToPay';
  simulated?: boolean;
};

export type DiscoveryFilter =
  | DiscoveryFilterNone
  | DiscoveryFilterReaderId
  | DiscoveryFilterSerialNumber;
export type DiscoveryFilterNone = {};
export type DiscoveryFilterReaderId = {
  readerId: string;
};
export type DiscoveryFilterSerialNumber = {
  serialNumber: string;
};

export type GetLocationsParams = {
  limit?: number;
  endingBefore?: string;
  startingAfter?: string;
};

export type EasyConnectParams =
  | EasyConnectInternetParams
  | EasyConnectTapToPayParams
  | EasyConnectAppsOnDevicesParams;

export type EasyConnectInternetParams = {
  discoveryMethod: 'internet';
  timeout?: number;
  simulated?: boolean;
  locationId?: string;
  discoveryFilter?: DiscoveryFilter;
  failIfInUse?: boolean;
};

export type EasyConnectTapToPayParams = {
  discoveryMethod: 'tapToPay';
  simulated?: boolean;
  locationId: string;
  autoReconnectOnUnexpectedDisconnect?: boolean;
  merchantDisplayName?: string;
  onBehalfOf?: string;
  tosAcceptancePermitted?: boolean;
};

export type EasyConnectAppsOnDevicesParams = {
  discoveryMethod: 'appsOnDevices';
};

export type ConnectReaderParams =
  | ConnectBluetoothReaderParams
  | ConnectBluetoothProximityReaderParams
  | ConnectUsbReaderParams
  | ConnectTapToPayParams
  | ConnectAppsOnDevicesParams
  | ConnectInternetReaderParams;

export type ConnectBluetoothReaderParams = {
  discoveryMethod: 'bluetoothScan';
  reader: Reader.Type;
  locationId: string;
  autoReconnectOnUnexpectedDisconnect?: boolean;
  onPaymentMethodSelectionRequired?: PaymentMethodSelectionHandler;
  onQrCodeDisplayRequired?: QrCodeDisplayHandler;
};

export type ConnectBluetoothProximityReaderParams = {
  discoveryMethod: 'bluetoothProximity';
  reader: Reader.Type;
  locationId: string;
  autoReconnectOnUnexpectedDisconnect?: boolean;
  onPaymentMethodSelectionRequired?: PaymentMethodSelectionHandler;
  onQrCodeDisplayRequired?: QrCodeDisplayHandler;
};

export type ConnectUsbReaderParams = {
  discoveryMethod: 'usb';
  reader: Reader.Type;
  locationId: string;
  autoReconnectOnUnexpectedDisconnect?: boolean;
  onPaymentMethodSelectionRequired?: PaymentMethodSelectionHandler;
  onQrCodeDisplayRequired?: QrCodeDisplayHandler;
};

export type ConnectTapToPayParams = {
  discoveryMethod: 'tapToPay';
  reader: Reader.Type;
  locationId: string;
  onBehalfOf?: string;
  merchantDisplayName?: string;
  tosAcceptancePermitted?: boolean;
  autoReconnectOnUnexpectedDisconnect?: boolean;
};

export type ConnectAppsOnDevicesParams = {
  discoveryMethod: 'appsOnDevices';
  reader: Reader.Type;
};

export type ConnectInternetReaderParams = {
  discoveryMethod: 'internet';
  reader: Reader.Type;
  failIfInUse?: boolean;
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

export type LocationStatus = 'notSet' | 'set' | 'unknown';

export type NextAction = {
  type?: string;
  wechatPayDisplayQrCode?: WechatPayDisplayQrCode;
  redirectToUrl?: RedirectToUrl;
  useStripeSdk?: UseStripeSdk;
};

export type RedirectToUrl = {
  url?: string;
  returnUrl?: string;
};

export type WechatPayDisplayQrCode = {
  data?: string;
  hostedInstructionsUrl?: string;
  imageDataUrl?: string;
  imageUrlPng?: string;
  imageUrlSvg?: string;
};

export type UseStripeSdk = {
  type?: string;
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

export type RebootReaderResultType = {
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

export type PaymentMethodType =
  | 'cardPresent'
  | 'interacPresent'
  | 'card'
  | 'wechatPay'
  | 'affirm'
  | 'paynow'
  | 'paypay'
  | 'klarna';

export interface Charge {
  id: string;
  amount: number;
  amountRefunded: number;
  applicationFee?: string;
  applicationFeeAmount?: number;
  authorizationCode?: string;
  balanceTransaction?: string;
  captured: boolean;
  calculatedStatementDescriptor?: string;
  created?: string;
  currency: string;
  customer?: string;
  description?: string;
  generatedFrom?: GeneratedFrom;
  livemode: boolean;
  metadata?: Record<string, string>;
  onBehalfOf?: string;
  paid: boolean;
  paymentIntentId?: string;
  paymentMethodDetails?: PaymentMethodDetails;
  receiptEmail?: string;
  receiptNumber?: string;
  receiptUrl?: string;
  refunded: boolean;
  statementDescriptorSuffix?: string;
  status?: string;
}

export type GeneratedFrom = {
  charge?: string;
  paymentMethodDetails?: PaymentMethodDetails;
  setupAttempt?: string;
};

export type CreatePaymentIntentParams = CreatePaymentIntentIOSParams & {
  amount: number;
  currency: string;
  setupFutureUsage?: 'off_session' | 'on_session';
  onBehalfOf?: string;
  transferDataDestination?: string;
  applicationFeeAmount?: number;
  description?: string;
  statementDescriptor?: string;
  statementDescriptorSuffix?: string;
  receiptEmail?: string;
  customer?: string;
  transferGroup?: string;
  metadata?: Record<string, string>;
  paymentMethodOptions?: PaymentMethodOptions;
  captureMethod?: 'automatic' | 'manual';
  offlineBehavior?: 'prefer_online' | 'require_online' | 'force_offline';
};

export type CreatePaymentIntentIOSParams = {
  paymentMethodTypes?: string[];
};

export type PaymentMethodOptions = {
  requestExtendedAuthorization?: boolean;
  requestIncrementalAuthorizationSupport?: boolean;
  requestedPriority: string;
  requestPartialAuthorization?: string;
  captureMethod?: 'manual' | 'manual_preferred';
};

export type MotoConfiguration = {
  skipCvc?: boolean;
};

export type CollectPaymentMethodParams = {
  paymentIntent: PaymentIntent.Type;
  skipTipping?: boolean;
  tipEligibleAmount?: number;
  updatePaymentIntent?: boolean;
  customerCancellation?: CustomerCancellation;
  requestDynamicCurrencyConversion?: boolean;
  surchargeNotice?: string;
  allowRedisplay?: AllowRedisplay;
  motoConfiguration?: MotoConfiguration;
};

export type ConfirmPaymentMethodParams = {
  paymentIntent: PaymentIntent.Type;
  surcharge?: Surcharge;
  returnUrl?: string;
};

export type ProcessPaymentIntentParams = {
  paymentIntent: PaymentIntent.Type;
  skipTipping?: boolean;
  tipEligibleAmount?: number;
  updatePaymentIntent?: boolean;
  customerCancellation?: CustomerCancellation;
  requestDynamicCurrencyConversion?: boolean;
  surchargeNotice?: string;
  allowRedisplay?: AllowRedisplay;
  motoConfiguration?: MotoConfiguration;
  surcharge?: Surcharge;
  returnUrl?: string;
};

export type Surcharge = {
  amount: number;
  consent?: SurchargeConsent | null;
};

export type SurchargeConsent = {
  notice: string;
  collection: SurchargeConsentCollection;
};

export type SurchargeConsentCollection = 'disabled' | 'enabled';

export type CancelPaymentMethodParams = {
  paymentIntent: PaymentIntent.Type;
};

export type ConfirmSetupIntentMethodParams = {
  setupIntent: SetupIntent.Type;
};

export type CancelSetupIntentMethodParams = {
  setupIntent: SetupIntent.Type;
};

export type CollectSetupIntentPaymentMethodParams = {
  allowRedisplay?: AllowRedisplay;
  customerCancellation?: CustomerCancellation;
  setupIntent: SetupIntent.Type;
  motoConfiguration?: MotoConfiguration;
  collectionReason?: CollectionReason;
};

export type ProcessSetupIntentParams = {
  setupIntent: SetupIntent.Type;
  allowRedisplay?: AllowRedisplay;
  customerCancellation?: CustomerCancellation;
  motoConfiguration?: MotoConfiguration;
  collectionReason?: CollectionReason;
};

export type AllowRedisplay = 'always' | 'limited' | 'unspecified';

export type CollectionReason = 'saveCard' | 'verify' | 'unspecified';

export type CreateSetupIntentParams = {
  customer?: string;
  description?: string;
  metadata?: Record<string, string>;
  onBehalfOf?: string;
  paymentMethodTypes?: string[];
  usage?: string;
};

export type PaymentIntentResultType =
  | {
    paymentIntent: PaymentIntent.Type;
    error?: undefined;
  }
  | {
    paymentIntent?: undefined;
    error: StripeError;
  }
  | {
    paymentIntent: PaymentIntent.Type;
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

export type RefundParamsWithPaymentIntentId = {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  refundApplicationFee?: boolean;
  reverseTransfer?: boolean;
  customerCancellation?: CustomerCancellation;
  metadata?: Record<string, string>;
};

export type RefundParamsWithChargeId = {
  chargeId: string;
  amount: number;
  currency: string;
  refundApplicationFee?: boolean;
  reverseTransfer?: boolean;
  customerCancellation?: CustomerCancellation;
  metadata?: Record<string, string>;
};

export type RefundParams =
  | RefundParamsWithPaymentIntentId
  | RefundParamsWithChargeId;

export type CardPresentDetails = {
  last4: string;
  expMonth: string;
  expYear: string;
  cardholderName?: string;
  funding: string;
  brand: string;
  generatedCard?: string;
  receipt?: ReceiptDetails;
  emvAuthData?: string;
  country?: string;
  preferredLocales: string[];
  issuer: string;
  iin: string;
  network: string;
  description: string;
  wallet: Wallet;
  location?: string;
  reader?: string;
};

export type WechatPayDetails = {
  location?: string;
  reader?: string;
  transactionId?: string;
};

export type AffirmDetails = {
  location?: string;
  reader?: string;
  transactionId?: string;
};

export type PaynowDetails = {
  location?: string;
  reader?: string;
  reference?: string;
};

export type PaypayDetails = {
  location?: string;
  reader?: string;
  reference?: string;
};

export type KlarnaDetails = {
  location?: string;
  reader?: string;
};

export type ReceiptDetails = {
  accountType: string;
  applicationCryptogram: string;
  applicationPreferredName: string;
  authorizationCode: string;
  authorizationResponseCode: string;
  cvm: string;
  dedicatedFileName: string;
  terminalVerificationResult: string;
  transactionStatusInformation: string;
};

export type Wallet = {
  type: string;
};

export type PaymentMethodDetails = {
  type: string;
  cardPresentDetails?: CardPresentDetails;
  interacPresentDetails?: CardPresentDetails;
  wechatPayDetails?: WechatPayDetails;
  affirmDetails?: AffirmDetails;
  paynowDetails?: PaynowDetails;
  paypayDetails?: PaypayDetails;
  klarnaDetails?: KlarnaDetails;
  cardDetails?: CardDetails;
};

export type CardDetails = {
  brand?: string;
  country?: string;
  expMonth?: number;
  expYear?: number;
  funding?: string;
  generatedFrom?: GeneratedFrom;
  last4?: string;
};

export type ProcessRefundResultType = {
  refund?: Refund.Props;
  error?: StripeError;
};

export type OfflineStatusDetails = {
  networkStatus: 'online' | 'offline' | 'unknown';
  offlinePaymentsCount: number;
  offlinePaymentAmountsByCurrency: { [key: string]: number };
};

export type OfflineStatus = {
  sdk: OfflineStatusDetails;
  reader?: OfflineStatusDetails;
};

export type ReaderEvent = 'cardInserted' | 'cardRemoved';

export type ConnectionStatus =
  | 'notConnected'
  | 'connecting'
  | 'connected'
  | 'discovering'
  | 'reconnecting';

/**
 * @ignore
 */
export type EventResult<T> = {
  result: T;
};

export type UserCallbacks = {
  onUpdateDiscoveredReaders?(readers: Reader.Type[]): void;
  onFinishDiscoveringReaders?(error?: StripeError): void;
  onDidReportAvailableUpdate?(update: Reader.SoftwareUpdate): void;
  onDidStartInstallingUpdate?(update: Reader.SoftwareUpdate): void;
  onDidReportReaderSoftwareUpdateProgress?(progress: string): void;
  onDidFinishInstallingUpdate?(result: UpdateSoftwareResultType): void;

  onDidRequestReaderInput?(input: Reader.InputOptions[]): void;
  onDidRequestReaderDisplayMessage?(message: Reader.DisplayMessage): void;

  onDidChangeConnectionStatus?(status: Reader.ConnectionStatus): void;
  onDidChangePaymentStatus?(status: PaymentStatus): void;

  onDidStartReaderReconnect?(
    reader: Reader.Type,
    reason?: Reader.DisconnectReason
  ): void;
  onDidSucceedReaderReconnect?(reader: Reader.Type): void;
  onDidFailReaderReconnect?(reader: Reader.Type): void;

  onDidChangeOfflineStatus?(status: OfflineStatus): void;
  onDidForwardPaymentIntent?(
    paymentIntent: PaymentIntent.Type,
    error: StripeError
  ): void;
  onDidForwardingFailure?(error?: StripeError): void;

  onDidDisconnect?(reason?: Reader.DisconnectReason): void;

  onDidUpdateBatteryLevel?(result: Reader.BatteryLevel): void;
  onDidReportLowBatteryWarning?(): void;
  onDidReportReaderEvent?(event: ReaderEvent): void;

  onDidAcceptTermsOfService?(): void;
};

export namespace PaymentMethod {
  export type Type = {
    type: PaymentMethodType;
    id: string;
    customer: string;
    interacPresentDetails: CardPresentDetails;
    cardPresentDetails: CardPresentDetails;
    wechatPayDetails: WechatPayDetails;
    affirmDetails: AffirmDetails;
    paynowDetails?: PaynowDetails;
    paypayDetails?: PaypayDetails;
    klarnaDetails?: KlarnaDetails;
    cardDetails?: CardDetails;
    livemode: boolean;
    metadata?: Record<string, string>;
  };
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

export interface ICollectInputsParameters {
  inputs: Array<IInput>;
}

export enum FormType {
  SELECTION = 'selection',
  SIGNATURE = 'signature',
  PHONE = 'phone',
  EMAIL = 'email',
  NUMERIC = 'numeric',
  TEXT = 'text',
}

export interface IInput {
  formType: FormType;
  required?: boolean | null;
  title: string;
  description?: string | null;
  toggles?: IToggle[] | null;
  skipButtonText?: string | null;
  submitButtonText?: string | null;
  selectionButtons?: ISelectionButton[];
}

export type ICollectInputsResults =
  | {
    collectInputResults?: ICollectInputsResult[];
    error?: undefined;
  }
  | {
    collectInputResults?: undefined;
    error: StripeError;
  };

export interface ICollectInputsResult {
  skipped: boolean;
  formType: FormType;
  toggles: ToggleResult[];
}

// Contains data collected from a selection form
export interface SelectionResult extends ICollectInputsResult {
  // selected button. Null if the form was skipped.
  selection?: string | null;
  selectionId?: string | null;
}

// Contains data collected from a signature form
export interface SignatureResult extends ICollectInputsResult {
  // signature in svg format. Null if the form was skipped.
  signatureSvg?: string | null;
}

// Contains data collected from a phone form
export interface PhoneResult extends ICollectInputsResult {
  // the submitted phone number in E.164 format. Null if the form was skipped.
  phone?: string | null;
}

// Contains data collected from an email form
export interface EmailResult extends ICollectInputsResult {
  // the submitted email. Null if the form was skipped.
  email?: string | null;
}

// Contains data collected from a text form
export interface TextResult extends ICollectInputsResult {
  // the submitted text. Null if the form was skipped.
  text?: string | null;
}

// Contains data collected from an email form
export interface NumericResult extends ICollectInputsResult {
  // the submitted number as a string. Null if the form was skipped.
  numericString?: string | null;
}

export interface ISelectionButton {
  style: SelectionButtonStyle;
  text: string;
  id: string;
}

export enum SelectionButtonStyle {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
}

export interface IToggle {
  title?: string | null;
  description?: string | null;
  defaultValue: ToggleValue;
}

export enum ToggleValue {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
}

export enum ToggleResult {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  SKIPPED = 'skipped',
}

export type OfflineDetails = {
  storedAtMs: string;
  requiresUpload: boolean;
  cardPresentDetails: OfflineCardPresentDetails;
  amountDetails: AmountDetails;
};

export type OfflineCardPresentDetails = {
  brand: string;
  cardholderName: string;
  expMonth: number;
  expYear: number;
  last4: string;
  readMethod: string;
  receiptDetails: ReceiptDetails;
};

export type AmountDetails = {
  tip?: Amount;
  donation?: Amount;
  surcharge?: Amount;
};

export type Amount = {
  amount?: number;
};

export type CollectedData = {
  stripeId?: string;
  nfcUid?: string;
  created: string;
  livemode: boolean;
};

export interface CollectDataParams {
  collectDataType: CollectDataType;
  customerCancellation: CustomerCancellation;
}

export enum CollectDataType {
  MAGSTRIPE = 'magstripe',
  NFC_UID = 'nfcUid',
  UNKNOWN = 'unknown',
}

export type CollectDataResultType =
  | {
    collectedData?: CollectedData;
    error?: undefined;
  }
  | {
    collectedData?: undefined;
    error: StripeError;
  };

export type CustomerCancellation =
  | 'enableIfAvailable'
  | 'disableIfAvailable'
  | 'unspecified';

export type TapToPayUxConfiguration = {
  tapZone?: TapZone;
  darkMode?: DarkMode;
  colors?: Colors;
};

export type TapZone =
  | TapZoneDefault
  | TapZoneAbove
  | TapZoneBelow
  | TapZoneFront
  | TapZoneBehind
  | TapZoneLeft
  | TapZoneRight;

export type TapZoneDefault = {
  indicator: 'default';
};

export type TapZoneAbove = {
  indicator: 'above';
  bias?: number;
};

export type TapZoneBelow = {
  indicator: 'below';
  bias?: number;
};

export type TapZoneFront = {
  indicator: 'front';
  xBias?: number;
  yBias?: number;
};

export type TapZoneBehind = {
  indicator: 'behind';
  xBias?: number;
  yBias?: number;
};

export type TapZoneLeft = {
  indicator: 'left';
  bias?: number;
};

export type TapZoneRight = {
  indicator: 'right';
  bias?: number;
};

export type Colors = {
  primary?: string;
  success?: string;
  error?: string;
};

export enum DarkMode {
  DARK = 'dark',
  LIGHT = 'light',
  SYSTEM = 'system',
}

/**
 * Content for a print operation.
 *
 * Supported content:
 * - Image (JPEG/PNG) encoded as a base64 string or 'data:' URI scheme.
 */
export type PrintContent = string;
