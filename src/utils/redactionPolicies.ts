import type * as api from '../functions';
import type * as types from '../types';

const REDACTED_PLACEHOLDER = '<REDACTED>';
const REQUEST_ARGUMENTS_KEY = 'rn-args';

const ALLOW_RULE = Object.freeze({ kind: 'allow' } as const);
const REDACT_RULE = Object.freeze({ kind: 'redact' } as const);

export const Rule = Object.freeze({
  allow: ALLOW_RULE,
  redact: REDACT_RULE,
});

type Leaf = (typeof Rule)[keyof typeof Rule];
type AnyPolicy = {
  readonly kind: 'policy';
  readonly fields: Readonly<Record<string, AnyRule>>;
};
type AnyListRule = {
  readonly kind: 'list';
  readonly element: AnyRule;
};
type AnyRule = Leaf | AnyPolicy | AnyListRule;

declare const policyType: unique symbol;

type PolicyRef<T> = {
  readonly kind: 'policy';
  readonly fields: PolicyFields<T>;
  /** Phantom invariant binding to the RN type reviewed by this policy. */
  readonly [policyType]?: (value: T) => T;
};

type ListRule<E> = {
  readonly kind: 'list';
  readonly element: FieldRule<E>;
};

type FieldRule<V> = NonNullable<V> extends readonly (infer E)[]
  ? ListRule<E> | typeof Rule.redact
  : NonNullable<V> extends (...args: never[]) => unknown
    ? typeof Rule.redact
    : NonNullable<V> extends object
      ? PolicyRef<NonNullable<V>> | typeof Rule.redact
      : Leaf;

type AllKeys<T> = T extends unknown ? keyof T : never;
type FieldValue<T, K extends PropertyKey> = T extends unknown
  ? K extends keyof T
    ? T[K]
    : never
  : never;
type PolicyFields<T> = {
  readonly [K in AllKeys<T> & string]-?: FieldRule<FieldValue<T, K>>;
};

const policy = <T,>(fields: PolicyFields<T>): PolicyRef<T> =>
  Object.freeze({
    kind: 'policy' as const,
    fields: Object.freeze(fields),
  });

const list = <E,>(element: FieldRule<E>): ListRule<E> =>
  Object.freeze({ kind: 'list', element });

const nested = <T,>(ref: PolicyRef<T>): PolicyRef<T> => ref;

// Leaf policies are declared first. Parent policies can only reference policies
// that have already been initialized, making recursive policy graphs impossible.
const DiscoveryFilterPolicy = policy<types.DiscoveryFilter>({
  readerId: Rule.allow,
  serialNumber: Rule.allow,
});

const AppTransitionAnimationPolicy = policy<types.AppTransitionAnimation>({
  type: Rule.allow,
  preset: Rule.allow,
  enterAnim: Rule.allow,
  exitAnim: Rule.allow,
});

const TestReaderUpdatePolicy = policy<types.TestReaderUpdate>({
  type: Rule.allow,
  components: list(Rule.allow),
});

const ReaderSoftwareUpdatePolicy = policy<types.Reader.SoftwareUpdate>({
  deviceSoftwareVersion: Rule.allow,
  estimatedUpdateTime: Rule.allow,
  requiredAt: Rule.allow,
  components: list(Rule.allow),
  isTestUpdate: Rule.allow,
});

const InstallmentsParametersPolicy = policy<types.InstallmentsParameters>({
  enabled: Rule.allow,
});

const PaymentMethodOptionsRequestPolicy = policy<types.PaymentMethodOptions>({
  requestExtendedAuthorization: Rule.allow,
  requestIncrementalAuthorizationSupport: Rule.allow,
  requestedPriority: Rule.allow,
  requestPartialAuthorization: Rule.allow,
  requestReauthorization: Rule.allow,
  captureMethod: Rule.allow,
  captureDelayDays: Rule.allow,
  requestMulticapture: Rule.allow,
  installments: nested(InstallmentsParametersPolicy),
});

const InstallmentPlanDetailsPolicy = policy<types.InstallmentPlanDetails>({
  type: Rule.allow,
  count: Rule.allow,
  interval: Rule.allow,
});

const InstallmentDetailsPolicy = policy<types.InstallmentDetails>({
  enabled: Rule.allow,
  availablePlans: list(nested(InstallmentPlanDetailsPolicy)),
  plan: nested(InstallmentPlanDetailsPolicy),
});

const PaymentMethodOptionsResponseCardPresentPolicy = policy<
  types.PaymentMethodOptionsResponse['cardPresent']
>({
  requestExtendedAuthorization: Rule.allow,
  requestIncrementalAuthorizationSupport: Rule.allow,
  requestPartialAuthorization: Rule.allow,
  requestReauthorization: Rule.allow,
  installments: nested(InstallmentDetailsPolicy),
});

const PaymentMethodOptionsResponsePolicy =
  policy<types.PaymentMethodOptionsResponse>({
    cardPresent: nested(PaymentMethodOptionsResponseCardPresentPolicy),
  });

const AmountPolicy = policy<types.Amount>({
  amount: Rule.allow,
});

const SurchargeDetailsPolicy = policy<types.SurchargeDetails>({
  amount: Rule.allow,
  maximumAmount: Rule.allow,
  status: Rule.allow,
});

const ReceiptDetailsPolicy = policy<types.ReceiptDetails>({
  accountType: Rule.allow,
  applicationCryptogram: Rule.redact,
  applicationPreferredName: Rule.allow,
  authorizationCode: Rule.allow,
  authorizationResponseCode: Rule.allow,
  cvm: Rule.allow,
  dedicatedFileName: Rule.allow,
  terminalVerificationResult: Rule.allow,
  transactionStatusInformation: Rule.allow,
});

const WalletPolicy = policy<types.Wallet>({
  type: Rule.allow,
});

const NetworksPolicy = policy<types.Networks>({
  available: list(Rule.allow),
  preferred: Rule.allow,
});

const WechatPayDetailsPolicy = policy<types.WechatPayDetails>({
  location: Rule.allow,
  reader: Rule.allow,
  transactionId: Rule.allow,
});

const AffirmDetailsPolicy = policy<types.AffirmDetails>({
  location: Rule.allow,
  reader: Rule.allow,
  transactionId: Rule.allow,
});

const PaynowDetailsPolicy = policy<types.PaynowDetails>({
  location: Rule.allow,
  reader: Rule.allow,
  reference: Rule.allow,
});

const PaypayDetailsPolicy = policy<types.PaypayDetails>({
  location: Rule.allow,
  reader: Rule.allow,
  reference: Rule.redact,
});

const KlarnaDetailsPolicy = policy<types.KlarnaDetails>({
  location: Rule.allow,
  reader: Rule.allow,
});

const LocalizationResultPolicy = policy<types.LocalizationResult>({
  requestedLocale: Rule.allow,
  resolvedLocale: Rule.allow,
});

const WechatPayDisplayQrCodePolicy = policy<types.WechatPayDisplayQrCode>({
  data: Rule.allow,
  hostedInstructionsUrl: Rule.allow,
  imageDataUrl: Rule.allow,
  imageUrlPng: Rule.allow,
  imageUrlSvg: Rule.allow,
});

const RedirectToUrlPolicy = policy<types.RedirectToUrl>({
  url: Rule.allow,
  returnUrl: Rule.allow,
});

const UseStripeSdkPolicy = policy<types.UseStripeSdk>({
  type: Rule.allow,
});

const MotoConfigurationPolicy = policy<types.MotoConfiguration>({
  skipCvc: Rule.allow,
});

const SurchargeConsentPolicy = policy<types.SurchargeConsent>({
  notice: Rule.redact,
  collection: Rule.allow,
});

const LineItemPolicy = policy<types.LineItem>({
  displayName: Rule.redact,
  quantity: Rule.allow,
  amount: Rule.allow,
});

const SetupAttemptCardPresentDetailsPolicy =
  policy<types.SetupIntent.SetupAttemptCardPresentDetails>({
    emvAuthData: Rule.redact,
    generatedCard: Rule.redact,
  });

const BuzzerVolumeParametersPolicy =
  policy<types.Reader.BuzzerVolumeParameters>({
    level: Rule.allow,
    volume: Rule.allow,
  });

const SelectionButtonPolicy = policy<types.ISelectionButton>({
  style: Rule.allow,
  text: Rule.redact,
  id: Rule.redact,
});

const TogglePolicy = policy<types.IToggle>({
  title: Rule.redact,
  description: Rule.redact,
  defaultValue: Rule.allow,
});

const TapZonePolicy = policy<types.TapZone>({
  indicator: Rule.allow,
  bias: Rule.allow,
  xBias: Rule.allow,
  yBias: Rule.allow,
});

const ColorsPolicy = policy<types.Colors>({
  primary: Rule.allow,
  success: Rule.allow,
  error: Rule.allow,
});

const AmountDetailsPolicy = policy<types.AmountDetails>({
  tip: nested(AmountPolicy),
  donation: nested(AmountPolicy),
  surcharge: nested(SurchargeDetailsPolicy),
});

const OfflineCardPresentDetailsPolicy =
  policy<types.OfflineCardPresentDetails>({
    brand: Rule.allow,
    cardholderName: Rule.redact,
    expMonth: Rule.redact,
    expYear: Rule.redact,
    last4: Rule.redact,
    readMethod: Rule.allow,
    receiptDetails: nested(ReceiptDetailsPolicy),
  });

const OfflineDetailsPolicy = policy<types.OfflineDetails>({
  storedAtMs: Rule.allow,
  requiresUpload: Rule.allow,
  cardPresentDetails: nested(OfflineCardPresentDetailsPolicy),
  amountDetails: nested(AmountDetailsPolicy),
});

const CardPresentDetailsPolicy = policy<types.CardPresentDetails>({
  last4: Rule.redact,
  expMonth: Rule.redact,
  expYear: Rule.redact,
  cardholderName: Rule.redact,
  funding: Rule.allow,
  brand: Rule.allow,
  generatedCard: Rule.redact,
  receipt: nested(ReceiptDetailsPolicy),
  emvAuthData: Rule.redact,
  country: Rule.allow,
  preferredLocales: list(Rule.allow),
  issuer: Rule.allow,
  iin: Rule.redact,
  network: Rule.allow,
  readMethod: Rule.allow,
  description: Rule.allow,
  wallet: nested(WalletPolicy),
  location: Rule.allow,
  reader: Rule.allow,
  multicaptureStatus: Rule.allow,
  reauthorizationStatus: Rule.allow,
  captureBefore: Rule.allow,
  reauthorizeBefore: Rule.allow,
  paymentAccountReference: Rule.redact,
});

const PaymentMethodCardPresentDetailsPolicy =
  policy<types.PaymentMethodCardPresentDetails>({
    brand: Rule.allow,
    brandProduct: Rule.allow,
    cardholderName: Rule.redact,
    country: Rule.allow,
    description: Rule.allow,
    expMonth: Rule.redact,
    expYear: Rule.redact,
    funding: Rule.allow,
    iin: Rule.redact,
    issuer: Rule.allow,
    last4: Rule.redact,
    networks: nested(NetworksPolicy),
    paymentAccountReference: Rule.redact,
    preferredLocales: list(Rule.allow),
    readMethod: Rule.allow,
    wallet: nested(WalletPolicy),
  });

// This policy is intentionally the finite boundary in the GeneratedFrom cycle.
const CardGeneratedFromPolicy = policy<types.GeneratedFrom>({
  charge: Rule.allow,
  paymentMethodDetails: Rule.redact,
  setupAttempt: Rule.allow,
});

const CardDetailsPolicy = policy<types.CardDetails>({
  brand: Rule.allow,
  country: Rule.allow,
  expMonth: Rule.redact,
  expYear: Rule.redact,
  funding: Rule.allow,
  generatedFrom: nested(CardGeneratedFromPolicy),
  last4: Rule.redact,
  authorizationCode: Rule.allow,
});

const PaymentMethodPolicy = policy<types.PaymentMethod.Type>({
  type: Rule.allow,
  id: Rule.allow,
  customer: Rule.allow,
  interacPresentDetails: nested(PaymentMethodCardPresentDetailsPolicy),
  cardPresentDetails: nested(PaymentMethodCardPresentDetailsPolicy),
  wechatPayDetails: nested(WechatPayDetailsPolicy),
  affirmDetails: nested(AffirmDetailsPolicy),
  paynowDetails: nested(PaynowDetailsPolicy),
  paypayDetails: nested(PaypayDetailsPolicy),
  klarnaDetails: nested(KlarnaDetailsPolicy),
  cardDetails: nested(CardDetailsPolicy),
  livemode: Rule.allow,
  metadata: Rule.redact,
});

const PaymentMethodDetailsPolicy = policy<types.PaymentMethodDetails>({
  type: Rule.allow,
  cardPresentDetails: nested(CardPresentDetailsPolicy),
  interacPresentDetails: nested(CardPresentDetailsPolicy),
  wechatPayDetails: nested(WechatPayDetailsPolicy),
  affirmDetails: nested(AffirmDetailsPolicy),
  paynowDetails: nested(PaynowDetailsPolicy),
  paypayDetails: nested(PaypayDetailsPolicy),
  klarnaDetails: nested(KlarnaDetailsPolicy),
  cardDetails: nested(CardDetailsPolicy),
});

const ApiErrorInformationPolicy = policy<types.ApiErrorInformation>({
  code: Rule.allow,
  message: Rule.allow,
  declineCode: Rule.allow,
  docUrl: Rule.allow,
  param: Rule.allow,
  type: Rule.allow,
  charge: Rule.allow,
  requestLogUrl: Rule.allow,
  adviceCode: Rule.allow,
  networkAdviceCode: Rule.allow,
  networkDeclineCode: Rule.allow,
  localizationResult: nested(LocalizationResultPolicy),
  paymentMethod: nested(PaymentMethodPolicy),
  paymentMethodType: Rule.allow,
});

const ChargeGeneratedFromPolicy = policy<types.GeneratedFrom>({
  charge: Rule.allow,
  paymentMethodDetails: nested(PaymentMethodDetailsPolicy),
  setupAttempt: Rule.allow,
});

const ChargePolicy = policy<types.Charge>({
  id: Rule.allow,
  amount: Rule.allow,
  amountRefunded: Rule.allow,
  applicationFee: Rule.allow,
  applicationFeeAmount: Rule.allow,
  authorizationCode: Rule.allow,
  balanceTransaction: Rule.allow,
  captured: Rule.allow,
  calculatedStatementDescriptor: Rule.redact,
  created: Rule.allow,
  currency: Rule.allow,
  customer: Rule.allow,
  description: Rule.redact,
  generatedFrom: nested(ChargeGeneratedFromPolicy),
  livemode: Rule.allow,
  metadata: Rule.redact,
  onBehalfOf: Rule.allow,
  paid: Rule.allow,
  paymentIntentId: Rule.allow,
  paymentMethodDetails: nested(PaymentMethodDetailsPolicy),
  receiptEmail: Rule.redact,
  receiptNumber: Rule.allow,
  receiptUrl: Rule.allow,
  refunded: Rule.allow,
  statementDescriptorSuffix: Rule.redact,
  status: Rule.allow,
});

const PaymentIntentNextActionPolicy = policy<types.NextAction>({
  type: Rule.allow,
  wechatPayDisplayQrCode: nested(WechatPayDisplayQrCodePolicy),
  redirectToUrl: nested(RedirectToUrlPolicy),
  useStripeSdk: nested(UseStripeSdkPolicy),
});

// SetupIntent shares the RN NextAction type, but does not expose WeChat QR data.
const SetupIntentNextActionPolicy = policy<types.NextAction>({
  type: Rule.allow,
  wechatPayDisplayQrCode: Rule.redact,
  redirectToUrl: nested(RedirectToUrlPolicy),
  useStripeSdk: nested(UseStripeSdkPolicy),
});

const SurchargePolicy = policy<types.Surcharge>({
  amount: Rule.allow,
  consent: nested(SurchargeConsentPolicy),
});

const SetupAttemptPaymentMethodDetailsPolicy =
  policy<types.SetupIntent.SetupAttemptPaymentMethodDetails>({
    cardPresent: nested(SetupAttemptCardPresentDetailsPolicy),
    interacPresent: nested(SetupAttemptCardPresentDetailsPolicy),
    type: Rule.allow,
  });

const SetupAttemptPolicy = policy<types.SetupIntent.SetupAttempt>({
  id: Rule.allow,
  applicationId: Rule.allow,
  created: Rule.allow,
  customer: Rule.allow,
  livemode: Rule.allow,
  onBehalfOfId: Rule.allow,
  paymentMethodDetails: nested(SetupAttemptPaymentMethodDetailsPolicy),
  paymentMethodId: Rule.allow,
  setupIntentId: Rule.allow,
  status: Rule.allow,
  usage: Rule.allow,
  setupError: nested(ApiErrorInformationPolicy),
});

const SetupIntentPolicy = policy<types.SetupIntent.Type>({
  id: Rule.allow,
  sdkUuid: Rule.allow,
  application: Rule.allow,
  cancellationReason: Rule.allow,
  clientSecret: Rule.redact,
  created: Rule.allow,
  customer: Rule.allow,
  description: Rule.redact,
  latestAttempt: nested(SetupAttemptPolicy),
  livemode: Rule.allow,
  mandate: Rule.allow,
  metadata: Rule.redact,
  nextAction: nested(SetupIntentNextActionPolicy),
  onBehalfOf: Rule.allow,
  paymentMethodId: Rule.allow,
  paymentMethod: nested(PaymentMethodPolicy),
  paymentMethodOptions: nested(PaymentMethodOptionsResponsePolicy),
  paymentMethodTypes: list(Rule.allow),
  singleUseMandate: Rule.allow,
  status: Rule.allow,
  usage: Rule.allow,
  lastSetupError: nested(ApiErrorInformationPolicy),
});

const PaymentIntentPolicy = policy<types.PaymentIntent.Type>({
  id: Rule.allow,
  amount: Rule.allow,
  amountCapturable: Rule.allow,
  amountDetails: nested(AmountDetailsPolicy),
  amountReceived: Rule.allow,
  amountRequested: Rule.allow,
  amountTip: Rule.allow,
  application: Rule.allow,
  applicationFeeAmount: Rule.allow,
  canceledAt: Rule.allow,
  cancellationReason: Rule.allow,
  captureMethod: Rule.allow,
  latestCharge: nested(ChargePolicy),
  latestChargeId: Rule.allow,
  clientSecret: Rule.redact,
  confirmationMethod: Rule.allow,
  created: Rule.allow,
  currency: Rule.allow,
  customer: Rule.allow,
  description: Rule.redact,
  livemode: Rule.allow,
  metadata: Rule.redact,
  nextAction: nested(PaymentIntentNextActionPolicy),
  offlineDetails: nested(OfflineDetailsPolicy),
  onBehalfOf: Rule.allow,
  paymentMethod: nested(PaymentMethodPolicy),
  paymentMethodId: Rule.allow,
  paymentMethodOptions: nested(PaymentMethodOptionsResponsePolicy),
  paymentMethodTypes: list(Rule.allow),
  receiptEmail: Rule.redact,
  review: Rule.allow,
  lastPaymentError: nested(ApiErrorInformationPolicy),
  sdkUuid: Rule.allow,
  setupFutureUsage: Rule.allow,
  statementDescriptor: Rule.redact,
  statementDescriptorSuffix: Rule.redact,
  status: Rule.allow,
  transferGroup: Rule.allow,
});

const ReaderPolicyFields = {
  id: Rule.allow,
  label: Rule.redact,
  batteryLevel: Rule.allow,
  serialNumber: Rule.allow,
  locationId: Rule.allow,
  deviceSoftwareVersion: Rule.allow,
  simulated: Rule.allow,
  availableUpdate: nested(ReaderSoftwareUpdatePolicy),
  ipAddress: Rule.redact,
  livemode: Rule.allow,
  locationStatus: Rule.allow,
  location: Rule.redact,
  deviceType: Rule.allow,
  status: Rule.allow,
  batteryStatus: Rule.allow,
  isCharging: Rule.allow,
  baseUrl: Rule.allow,
  bootloaderVersion: Rule.allow,
  configVersion: Rule.allow,
  emvKeyProfileId: Rule.allow,
  firmwareVersion: Rule.allow,
  hardwareVersion: Rule.allow,
  macKeyProfileId: Rule.allow,
  pinKeyProfileId: Rule.allow,
  trackKeyProfileId: Rule.allow,
  settingsVersion: Rule.allow,
  pinKeysetId: Rule.allow,
} as const;

const ReaderPolicy = policy<types.Reader.Type>(ReaderPolicyFields);

const DiscoverReadersPolicy = policy<types.DiscoverReadersParams>({
  discoveryMethod: Rule.allow,
  timeout: Rule.allow,
  simulated: Rule.allow,
  locationId: Rule.allow,
  discoveryFilter: nested(DiscoveryFilterPolicy),
});

const EasyConnectPolicy = policy<types.EasyConnectParams>({
  discoveryMethod: Rule.allow,
  timeout: Rule.allow,
  simulated: Rule.allow,
  locationId: Rule.allow,
  discoveryFilter: nested(DiscoveryFilterPolicy),
  failIfInUse: Rule.allow,
  autoReconnectOnUnexpectedDisconnect: Rule.allow,
  merchantDisplayName: Rule.redact,
  onBehalfOf: Rule.allow,
  tosAcceptancePermitted: Rule.allow,
  appTransitionAnimation: nested(AppTransitionAnimationPolicy),
});

const ConnectReaderPolicy = policy<types.ConnectReaderParams>({
  discoveryMethod: Rule.allow,
  reader: nested(ReaderPolicy),
  locationId: Rule.allow,
  autoReconnectOnUnexpectedDisconnect: Rule.allow,
  onPaymentMethodSelectionRequired: Rule.redact,
  onQrCodeDisplayRequired: Rule.redact,
  testReaderUpdate: nested(TestReaderUpdatePolicy),
  onBehalfOf: Rule.allow,
  merchantDisplayName: Rule.redact,
  tosAcceptancePermitted: Rule.allow,
  appTransitionAnimation: nested(AppTransitionAnimationPolicy),
  failIfInUse: Rule.allow,
});

const CreatePaymentIntentPolicy = policy<types.CreatePaymentIntentParams>({
  amount: Rule.allow,
  currency: Rule.allow,
  setupFutureUsage: Rule.allow,
  onBehalfOf: Rule.allow,
  transferDataDestination: Rule.allow,
  applicationFeeAmount: Rule.allow,
  description: Rule.redact,
  statementDescriptor: Rule.redact,
  statementDescriptorSuffix: Rule.redact,
  receiptEmail: Rule.redact,
  customer: Rule.allow,
  transferGroup: Rule.allow,
  metadata: Rule.redact,
  paymentMethodOptions: nested(PaymentMethodOptionsRequestPolicy),
  captureMethod: Rule.allow,
  offlineBehavior: Rule.allow,
  paymentMethodTypes: list(Rule.allow),
});

const CreateSetupIntentPolicy = policy<types.CreateSetupIntentParams>({
  customer: Rule.allow,
  description: Rule.redact,
  metadata: Rule.redact,
  onBehalfOf: Rule.allow,
  paymentMethodTypes: list(Rule.allow),
  usage: Rule.allow,
});

const CollectPaymentMethodPolicy = policy<types.CollectPaymentMethodParams>({
  paymentIntent: nested(PaymentIntentPolicy),
  skipTipping: Rule.allow,
  skipDonation: Rule.allow,
  tipEligibleAmount: Rule.allow,
  updatePaymentIntent: Rule.allow,
  customerCancellation: Rule.allow,
  requestDynamicCurrencyConversion: Rule.allow,
  surchargeNotice: Rule.redact,
  allowRedisplay: Rule.allow,
  motoConfiguration: nested(MotoConfigurationPolicy),
});

const GetLocationsPolicy = policy<types.GetLocationsParams>({
  limit: Rule.allow,
  endingBefore: Rule.allow,
  startingAfter: Rule.allow,
});

const ConfirmPaymentIntentPolicy = policy<types.ConfirmPaymentMethodParams>({
  paymentIntent: nested(PaymentIntentPolicy),
  surcharge: nested(SurchargePolicy),
  returnUrl: Rule.allow,
});

const ProcessPaymentIntentPolicy = policy<types.ProcessPaymentIntentParams>({
  paymentIntent: nested(PaymentIntentPolicy),
  skipTipping: Rule.allow,
  skipDonation: Rule.allow,
  tipEligibleAmount: Rule.allow,
  updatePaymentIntent: Rule.allow,
  customerCancellation: Rule.allow,
  requestDynamicCurrencyConversion: Rule.allow,
  surchargeNotice: Rule.redact,
  allowRedisplay: Rule.allow,
  motoConfiguration: nested(MotoConfigurationPolicy),
  surcharge: nested(SurchargePolicy),
  returnUrl: Rule.allow,
});

const CancelPaymentIntentPolicy = policy<types.CancelPaymentMethodParams>({
  paymentIntent: nested(PaymentIntentPolicy),
});

const CartPolicy = policy<types.Cart>({
  currency: Rule.allow,
  tax: Rule.allow,
  total: Rule.allow,
  lineItems: list(LineItemPolicy),
});

const CollectSetupIntentPaymentMethodPolicy =
  policy<types.CollectSetupIntentPaymentMethodParams>({
    allowRedisplay: Rule.allow,
    customerCancellation: Rule.allow,
    setupIntent: nested(SetupIntentPolicy),
    motoConfiguration: nested(MotoConfigurationPolicy),
    collectionReason: Rule.allow,
  });

const CancelSetupIntentPolicy = policy<types.CancelSetupIntentMethodParams>({
  setupIntent: nested(SetupIntentPolicy),
});

const ConfirmSetupIntentPolicy = policy<types.ConfirmSetupIntentMethodParams>({
  setupIntent: nested(SetupIntentPolicy),
});

const ProcessSetupIntentPolicy = policy<types.ProcessSetupIntentParams>({
  setupIntent: nested(SetupIntentPolicy),
  allowRedisplay: Rule.allow,
  customerCancellation: Rule.allow,
  motoConfiguration: nested(MotoConfigurationPolicy),
  collectionReason: Rule.allow,
});

const RefundPolicy = policy<types.RefundParams>({
  paymentIntentId: Rule.allow,
  clientSecret: Rule.redact,
  amount: Rule.allow,
  currency: Rule.allow,
  refundApplicationFee: Rule.allow,
  reverseTransfer: Rule.allow,
  customerCancellation: Rule.allow,
  metadata: Rule.redact,
  chargeId: Rule.allow,
});

const ReaderSettingsPolicy = policy<types.Reader.ReaderSettingsParameters>({
  textToSpeechViaSpeakers: Rule.allow,
  buzzerVolume: nested(BuzzerVolumeParametersPolicy),
});

const InputPolicy = policy<types.IInput>({
  formType: Rule.allow,
  required: Rule.allow,
  title: Rule.redact,
  description: Rule.redact,
  toggles: list(TogglePolicy),
  skipButtonText: Rule.redact,
  submitButtonText: Rule.redact,
  selectionButtons: list(SelectionButtonPolicy),
});

const CollectInputsPolicy = policy<types.ICollectInputsParameters>({
  inputs: list(InputPolicy),
});

const CollectDataPolicy = policy<types.CollectDataParams>({
  collectDataType: Rule.allow,
  customerCancellation: Rule.allow,
});

const ReaderSupportPolicy = policy<types.Reader.ReaderSupportParams>({
  deviceType: Rule.allow,
  simulated: Rule.allow,
  discoveryMethod: Rule.allow,
});

const TapToPayUxConfigurationPolicy =
  policy<types.TapToPayUxConfiguration>({
    tapZone: nested(TapZonePolicy),
    theme: Rule.allow,
    colorScheme: nested(ColorsPolicy),
  });

const defineRequestPolicies = <const M extends keyof typeof api>(
  policies: {
    readonly [K in M]: PolicyRef<
      NonNullable<Parameters<(typeof api)[K]>[0]>
    >;
  }
) => Object.freeze(policies);

export const REQUEST_POLICIES = defineRequestPolicies({
  discoverReaders: DiscoverReadersPolicy,
  easyConnect: EasyConnectPolicy,
  connectReader: ConnectReaderPolicy,
  createPaymentIntent: CreatePaymentIntentPolicy,
  createSetupIntent: CreateSetupIntentPolicy,
  collectPaymentMethod: CollectPaymentMethodPolicy,
  getLocations: GetLocationsPolicy,
  confirmPaymentIntent: ConfirmPaymentIntentPolicy,
  processPaymentIntent: ProcessPaymentIntentPolicy,
  cancelPaymentIntent: CancelPaymentIntentPolicy,
  setReaderDisplay: CartPolicy,
  collectSetupIntentPaymentMethod: CollectSetupIntentPaymentMethodPolicy,
  cancelSetupIntent: CancelSetupIntentPolicy,
  confirmSetupIntent: ConfirmSetupIntentPolicy,
  processSetupIntent: ProcessSetupIntentPolicy,
  processRefund: RefundPolicy,
  setReaderSettings: ReaderSettingsPolicy,
  collectInputs: CollectInputsPolicy,
  collectData: CollectDataPolicy,
  supportsReadersOfType: ReaderSupportPolicy,
  setTapToPayUxConfiguration: TapToPayUxConfigurationPolicy,
});

const policiesByMethod: Readonly<Partial<Record<string, AnyPolicy>>> =
  REQUEST_POLICIES;

type ScalarArgMethod = {
  [M in keyof typeof api]: (typeof api)[M] extends (
    ...args: infer A
  ) => unknown
    ? A extends []
      ? never
      : NonNullable<A[0]> extends object
        ? never
        : M
    : never;
}[keyof typeof api];

/** Reviewed as "every non-null argument redacted". */
export const SCALAR_ARG_METHODS = Object.freeze([
  'retrievePaymentIntent',
  'selectPaymentOption',
  'failPaymentMethodSelection',
  'failQrCodeDisplay',
  'retrieveSetupIntent',
  'setSimulatedCard',
  'setSimulatedOfflineMode',
  'setSimulatedCollectInputsResult',
  'print',
] as const satisfies readonly ScalarArgMethod[]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasOwn(object: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function redactValue(value: unknown, rule: AnyRule): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (rule.kind === 'redact') {
    return REDACTED_PLACEHOLDER;
  }

  if (rule.kind === 'allow') {
    return typeof value === 'object' || typeof value === 'function'
      ? REDACTED_PLACEHOLDER
      : value;
  }

  if (rule.kind === 'list') {
    if (!Array.isArray(value)) {
      return REDACTED_PLACEHOLDER;
    }

    // Do not use value.map: since `map` may be
    // overridden by the integration to return unredacted items.
    const redactedItems: unknown[] = [];
    for (let index = 0; index < value.length; index += 1) {
      redactedItems[index] = redactValue(value[index], rule.element);
    }
    return redactedItems;
  }

  if (!isPlainObject(value)) {
    return REDACTED_PLACEHOLDER;
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, fieldValue] of Object.entries(value)) {
    const fieldRule = hasOwn(rule.fields, key) ? rule.fields[key] : undefined;
    if (fieldRule !== undefined) {
      redacted[key] = redactValue(fieldValue, fieldRule);
    }
  }
  return redacted;
}

/**
 * Serializes a traced SDK request using typed, total per-field policies.
 *
 * The RN-specific envelope avoids the server-side whole-field redaction applied
 * to the legacy `args` key while keeping positional argument structure intact.
 */
export function stringifyRedactedRequest(
  method: string,
  args: readonly unknown[]
): string {
  try {
    const root = hasOwn(policiesByMethod, method)
      ? policiesByMethod[method]
      : undefined;
    const redacted =
      root && args.length === 1 && isPlainObject(args[0])
        ? [redactValue(args[0], root)]
        : args.map((arg) =>
            arg === null || arg === undefined ? arg : REDACTED_PLACEHOLDER
          );

    return JSON.stringify({
      [REQUEST_ARGUMENTS_KEY]: redacted,
    });
  } catch {
    // Request logging must never prevent the SDK method from running.
    return JSON.stringify({
      [REQUEST_ARGUMENTS_KEY]: [REDACTED_PLACEHOLDER],
    });
  }
}

type AnyRedactionRule = AnyRule;
type RedactionRule<V> = FieldRule<V>;
type InternalStripeError =
  import('../Errors/InternalStripeError').InternalStripeError;

/**
 * Applies a typed field policy and fails closed if the value cannot be
 * inspected safely.
 */
function redactWithPolicySafely(
  value: unknown,
  root: AnyRedactionRule
): unknown {
  try {
    return redactValue(value, root);
  } catch {
    return REDACTED_PLACEHOLDER;
  }
}

/** Serializes a value with an explicit typed, default-deny redaction policy. */
export function stringifyWithTypedPolicySafely<Value>(
  value: NoInfer<Value>,
  root: RedactionRule<Value>
): string {
  try {
    return JSON.stringify(redactValue(value, root as AnyRedactionRule));
  } catch {
    return JSON.stringify(REDACTED_PLACEHOLDER);
  }
}

const RefundNextActionDisplayDetailsEmailSentPolicy =
  policy<types.Refund.NextActionDisplayDetailsEmailSent>({
    emailSentAt: Rule.allow,
    emailSentTo: Rule.redact,
  });

const RefundNextActionDisplayDetailsPolicy =
  policy<types.Refund.NextActionDisplayDetails>({
    emailSent: nested(RefundNextActionDisplayDetailsEmailSentPolicy),
    expiresAt: Rule.allow,
  });

const RefundNextActionPolicy = policy<types.Refund.NextAction>({
  type: Rule.allow,
  displayDetails: nested(RefundNextActionDisplayDetailsPolicy),
});

const RefundValuePolicy = policy<types.Refund.Props>({
  id: Rule.allow,
  amount: Rule.allow,
  balanceTransaction: Rule.allow,
  chargeId: Rule.allow,
  created: Rule.allow,
  currency: Rule.allow,
  description: Rule.redact,
  failureBalanceTransaction: Rule.allow,
  failureReason: Rule.redact,
  metadata: Rule.redact,
  paymentIntentId: Rule.allow,
  paymentMethodDetails: nested(PaymentMethodDetailsPolicy),
  reason: Rule.allow,
  receiptNumber: Rule.allow,
  sourceTransferReversal: Rule.allow,
  status: Rule.allow,
  transferReversal: Rule.allow,
  nextAction: nested(RefundNextActionPolicy),
});

const UnderlyingErrorPolicy = policy<types.UnderlyingErrorInformation>({
  code: Rule.allow,
  message: Rule.allow,
  iosDomain: Rule.allow,
  iosLocalizedFailureReason: Rule.redact,
  iosLocalizedRecoverySuggestion: Rule.redact,
});

export const StripeErrorPolicy = policy<types.StripeError>({
  name: Rule.allow,
  message: Rule.allow,
  stack: Rule.redact,
  cause: Rule.redact,
  code: Rule.allow,
  nativeErrorCode: Rule.allow,
  metadata: Rule.redact,
  paymentIntent: nested(PaymentIntentPolicy),
  setupIntent: nested(SetupIntentPolicy),
  refund: nested(RefundValuePolicy),
  apiError: nested(ApiErrorInformationPolicy),
  underlyingError: nested(UnderlyingErrorPolicy),
});

const InternalStripeErrorPolicy = policy<InternalStripeError>({
  stripeError: nested(StripeErrorPolicy),
  errorSource: Rule.allow,
});

const AddressPolicy = policy<types.Address>({
  city: Rule.redact,
  country: Rule.redact,
  postalCode: Rule.redact,
  line1: Rule.redact,
  line2: Rule.redact,
  state: Rule.redact,
});

const LocationPolicy = policy<types.Location>({
  displayName: Rule.redact,
  id: Rule.allow,
  livemode: Rule.allow,
  address: nested(AddressPolicy),
});

const OfflineStatusDetailsPolicy = policy<types.OfflineStatusDetails>({
  networkStatus: Rule.allow,
  offlinePaymentsCount: Rule.allow,
  // Currency codes are runtime-defined keys, so redact the full map.
  offlinePaymentAmountsByCurrency: Rule.redact,
});

export const OfflineStatusPolicy = policy<types.OfflineStatus>({
  sdk: nested(OfflineStatusDetailsPolicy),
  reader: nested(OfflineStatusDetailsPolicy),
});

const AccessibilityPolicy = policy<types.Reader.Accessibility>({
  textToSpeechStatus: Rule.allow,
  error: nested(StripeErrorPolicy),
});

const ReaderBuzzerVolumePolicy = policy<types.Reader.ReaderBuzzerVolume>({
  currentVolume: Rule.allow,
  maxVolume: Rule.allow,
  error: nested(StripeErrorPolicy),
});

const ReaderSettingsResultPolicy = policy<types.Reader.ReaderSettings>({
  accessibility: nested(AccessibilityPolicy),
  buzzerVolume: nested(ReaderBuzzerVolumePolicy),
  error: nested(StripeErrorPolicy),
});

type CollectInputResult =
  | types.SelectionResult
  | types.SignatureResult
  | types.PhoneResult
  | types.EmailResult
  | types.TextResult
  | types.NumericResult;

const CollectInputResultPolicy = policy<CollectInputResult>({
  skipped: Rule.allow,
  formType: Rule.allow,
  toggles: list(Rule.allow),
  selection: Rule.redact,
  selectionId: Rule.redact,
  signatureSvg: Rule.redact,
  phone: Rule.redact,
  email: Rule.redact,
  text: Rule.redact,
  numericString: Rule.redact,
});

const CollectedDataPolicy = policy<types.CollectedData>({
  stripeId: Rule.redact,
  nfcUid: Rule.redact,
  created: Rule.allow,
  livemode: Rule.allow,
});

const EmptyResponsePolicy = policy<Record<never, never>>({});

const ReviewedScalarResponsePolicy = Rule.allow;

const ReaderResponsePolicy = policy<{
  reader?: types.Reader.Type;
}>({
  reader: nested(ReaderPolicy),
});

const PaymentIntentResponsePolicy = policy<{
  paymentIntent?: types.PaymentIntent.Type;
}>({
  paymentIntent: nested(PaymentIntentPolicy),
});

const SetupIntentResponsePolicy = policy<{
  setupIntent?: types.SetupIntent.Type;
}>({
  setupIntent: nested(SetupIntentPolicy),
});

const LocationsResponsePolicy = policy<{
  locations?: types.Location[];
  hasMore?: boolean;
}>({
  locations: list(LocationPolicy),
  hasMore: Rule.allow,
});

const RefundResponsePolicy = policy<{
  refund?: types.Refund.Props;
}>({
  refund: nested(RefundValuePolicy),
});

const CollectInputsResponsePolicy = policy<{
  collectInputResults?: CollectInputResult[];
}>({
  collectInputResults: list(CollectInputResultPolicy),
});

const CollectDataResponsePolicy = policy<{
  collectedData?: types.CollectedData;
}>({
  collectedData: nested(CollectedDataPolicy),
});

const ReaderSupportResponsePolicy = policy<{
  readerSupportResult?: boolean;
}>({
  readerSupportResult: Rule.allow,
});

type ApiFunction = (...args: never[]) => unknown;
type ApiMethod = {
  [K in keyof typeof api]: (typeof api)[K] extends ApiFunction ? K : never;
}[keyof typeof api];
type TracedMethod = Exclude<ApiMethod, 'setConnectionToken'>;

type OptionalInAnyMember<T, K extends PropertyKey> = T extends unknown
  ? K extends keyof T
    ? {} extends Pick<T, K>
      ? true
      : false
    : true
  : never;
type OptionalKeys<T> = {
  [K in AllKeys<T>]: true extends OptionalInAnyMember<T, K> ? K : never;
}[AllKeys<T>];
type MergeResponseObject<T> = {
  [K in Exclude<AllKeys<T>, OptionalKeys<T> | 'error'>]: FieldValue<T, K>;
} & {
  [K in Exclude<OptionalKeys<T>, 'error'>]?: FieldValue<T, K>;
};
type ResponsePayload<T> = [T] extends [object] ? MergeResponseObject<T> : T;
// ReaderSettingsResultPolicy covers the full success/error union because its nested
// settings can also contain errors; all other response policies omit the
// top-level error handled separately below.
type ResponsePayloadFor<K extends TracedMethod> = K extends
  | 'getReaderSettings'
  | 'setReaderSettings'
  ? Awaited<ReturnType<(typeof api)[K]>>
  : ResponsePayload<Awaited<ReturnType<(typeof api)[K]>>>;
type ResponsePolicies = {
  readonly [K in TracedMethod]: RedactionRule<ResponsePayloadFor<K>>;
};

/** Every public function wrapped by Logger.traceSdkMethod. */
export const RESPONSE_POLICIES = Object.freeze({
  initialize: ReaderResponsePolicy,
  discoverReaders: EmptyResponsePolicy,
  easyConnect: ReaderResponsePolicy,
  cancelEasyConnect: EmptyResponsePolicy,
  cancelDiscovering: EmptyResponsePolicy,
  connectReader: ReaderResponsePolicy,
  disconnectReader: EmptyResponsePolicy,
  rebootReader: EmptyResponsePolicy,
  createPaymentIntent: PaymentIntentResponsePolicy,
  createSetupIntent: SetupIntentResponsePolicy,
  collectPaymentMethod: PaymentIntentResponsePolicy,
  retrievePaymentIntent: PaymentIntentResponsePolicy,
  getLocations: LocationsResponsePolicy,
  confirmPaymentIntent: PaymentIntentResponsePolicy,
  processPaymentIntent: PaymentIntentResponsePolicy,
  cancelPaymentIntent: PaymentIntentResponsePolicy,
  selectPaymentOption: EmptyResponsePolicy,
  failPaymentMethodSelection: EmptyResponsePolicy,
  confirmQrCodeDisplayed: EmptyResponsePolicy,
  failQrCodeDisplay: EmptyResponsePolicy,
  installAvailableUpdate: EmptyResponsePolicy,
  setReaderDisplay: EmptyResponsePolicy,
  cancelInstallingUpdate: EmptyResponsePolicy,
  retrieveSetupIntent: SetupIntentResponsePolicy,
  collectSetupIntentPaymentMethod: SetupIntentResponsePolicy,
  clearReaderDisplay: EmptyResponsePolicy,
  cancelSetupIntent: SetupIntentResponsePolicy,
  confirmSetupIntent: SetupIntentResponsePolicy,
  processSetupIntent: SetupIntentResponsePolicy,
  setSimulatedCard: EmptyResponsePolicy,
  setSimulatedOfflineMode: EmptyResponsePolicy,
  setSimulatedCollectInputsResult: EmptyResponsePolicy,
  processRefund: RefundResponsePolicy,
  clearCachedCredentials: EmptyResponsePolicy,
  cancelCollectPaymentMethod: EmptyResponsePolicy,
  cancelProcessRefund: EmptyResponsePolicy,
  cancelCollectSetupIntent: EmptyResponsePolicy,
  cancelConfirmPaymentIntent: EmptyResponsePolicy,
  cancelProcessPaymentIntent: EmptyResponsePolicy,
  cancelConfirmSetupIntent: EmptyResponsePolicy,
  cancelProcessSetupIntent: EmptyResponsePolicy,
  getOfflineStatus: OfflineStatusPolicy,
  getPaymentStatus: ReviewedScalarResponsePolicy,
  getConnectionStatus: ReviewedScalarResponsePolicy,
  getConnectedReader: ReaderPolicy,
  getReaderSettings: ReaderSettingsResultPolicy,
  setReaderSettings: ReaderSettingsResultPolicy,
  collectInputs: CollectInputsResponsePolicy,
  cancelCollectInputs: EmptyResponsePolicy,
  collectData: CollectDataResponsePolicy,
  cancelCollectData: EmptyResponsePolicy,
  print: EmptyResponsePolicy,
  cancelReaderReconnection: EmptyResponsePolicy,
  supportsReadersOfType: ReaderSupportResponsePolicy,
  setTapToPayUxConfiguration: EmptyResponsePolicy,
  getNativeSdkVersion: ReviewedScalarResponsePolicy,
} satisfies ResponsePolicies);

const responsePoliciesByMethod: Readonly<
  Partial<Record<string, AnyRedactionRule>>
> = RESPONSE_POLICIES;

function redactResponse(method: string, response: unknown): unknown {
  const root = hasOwn(responsePoliciesByMethod, method)
    ? responsePoliciesByMethod[method]
    : undefined;

  if (isPlainObject(response) && response.error != null) {
    const { error, ...successFields } = response;
    const redactedError = redactWithPolicySafely(
      error,
      InternalStripeErrorPolicy
    );
    const redactedSuccess = root
      ? redactWithPolicySafely(successFields, root)
      : undefined;

    return isPlainObject(redactedSuccess)
      ? { ...redactedSuccess, error: redactedError }
      : { error: redactedError };
  }

  return root ? redactWithPolicySafely(response, root) : REDACTED_PLACEHOLDER;
}

/** Serializes an SDK response with a method-specific, default-deny policy. */
export function stringifyRedactedResponse(
  method: string,
  response: unknown
): string {
  try {
    return JSON.stringify(redactResponse(method, response));
  } catch {
    return JSON.stringify(REDACTED_PLACEHOLDER);
  }
}

/** Serializes a normalized SDK error with the shared StripeError policy. */
export function stringifyRedactedInternalError(error: unknown): string {
  return stringifyWithTypedPolicySafely(
    error as InternalStripeError,
    InternalStripeErrorPolicy
  );
}
