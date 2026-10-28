import type {
  AppTransitionAnimation,
  CardDetails,
  CardPresentDetails,
  Charge,
  CollectSetupIntentPaymentMethodParams,
  CreatePaymentIntentParams,
  CreateSetupIntentParams,
  InitParams,
  InstallmentPlanInterval,
  InstallmentPlanType,
  Location,
  OfflineCardPresentDetails,
  OfflineDetails,
  PaymentMethod,
  PaymentMethodCardPresentDetails,
  PaymentMethodOptions,
  PaymentMethodOptionsResponse,
  PaymentIntent,
  Reader,
  ReceiptDetails,
  Refund,
  ProcessSetupIntentParams,
  QrCodeDisplayData,
  SetupIntent,
  StripeError,
  TapToPayUxConfiguration,
  GetConnectedReaderType,
  UserCallbacks,
  DiscoverReadersResultType,
  CancelDiscoveringResultType,
  DisconnectReaderResultType,
  RebootReaderResultType,
  ClearReaderDisplayResultType,
} from '../types';
import {
  AppTransitionPreset,
  DarkMode,
  InstallmentPlanInterval as InstallmentPlanIntervalValues,
  InstallmentPlanType as InstallmentPlanTypeValues,
  PaymentMethodType,
} from '../types';

describe('PaymentMethodType', () => {
  it('exposes all named enum values with correct string values', () => {
    expect(PaymentMethodType.Card).toBe('card');
    expect(PaymentMethodType.CardPresent).toBe('cardPresent');
    expect(PaymentMethodType.InteracPresent).toBe('interacPresent');
    expect(PaymentMethodType.WechatPay).toBe('wechatPay');
    expect(PaymentMethodType.Affirm).toBe('affirm');
    expect(PaymentMethodType.PayNow).toBe('paynow');
    expect(PaymentMethodType.PayPay).toBe('paypay');
    expect(PaymentMethodType.Klarna).toBe('klarna');
  });

  it('enum values are accepted by CreatePaymentIntentParams.paymentMethodTypes', () => {
    const params: CreatePaymentIntentParams = {
      amount: 1000,
      currency: 'cad',
      paymentMethodTypes: [PaymentMethodType.CardPresent, PaymentMethodType.InteracPresent],
    };
    expect(params.paymentMethodTypes).toEqual(['cardPresent', 'interacPresent']);
  });

  it('enum values are accepted by CreateSetupIntentParams.paymentMethodTypes', () => {
    const params: CreateSetupIntentParams = {
      paymentMethodTypes: [PaymentMethodType.CardPresent],
    };
    expect(params.paymentMethodTypes).toEqual(['cardPresent']);
  });

  it('plain string literals remain valid for backwards compatibility', () => {
    const params: CreatePaymentIntentParams = {
      amount: 1000,
      currency: 'cad',
      paymentMethodTypes: ['cardPresent', 'interacPresent'],
    };
    expect(params.paymentMethodTypes).toEqual(['cardPresent', 'interacPresent']);
  });
});

describe('getConnectedReader result contract', () => {
  it('allows a reader or null, but not an error result or undefined', () => {
    const reader = {} as Reader.Type;
    const results: GetConnectedReaderType[] = [reader, null];
    const acceptsError: { error: StripeError } extends GetConnectedReaderType
      ? true
      : false = false;
    const acceptsUndefined: undefined extends GetConnectedReaderType
      ? true
      : false = false;

    expect(results).toEqual([reader, null]);
    expect(acceptsError).toBe(false);
    expect(acceptsUndefined).toBe(false);
  });
});

describe('callback contracts', () => {
  function expectRequired<T>(
    value: undefined extends T ? false : true
  ): void {
    expect(value).toBe(true);
  }

  function expectOptional<T>(
    value: undefined extends T ? true : false
  ): void {
    expect(value).toBe(true);
  }

  it('keeps the update-start reader optional and accepts existing callbacks', () => {
    type UpdateStarted = NonNullable<UserCallbacks['onDidStartInstallingUpdate']>;
    expectOptional<Parameters<UpdateStarted>[1]>(true);
    const callback: UpdateStarted = (update) => {
      expect(update.deviceSoftwareVersion).toBe('1.2.4');
    };
    callback({
      deviceSoftwareVersion: '1.2.4',
      estimatedUpdateTime: 'estimate1To2Minutes',
      requiredAt: '0',
      components: [],
      isTestUpdate: true,
    });
  });

  it('matches reconnect, disconnect, and offline forwarding payloads', () => {
    type ReconnectReason = Parameters<
      NonNullable<UserCallbacks['onDidStartReaderReconnect']>
    >[1];
    type DisconnectReason = Parameters<
      NonNullable<UserCallbacks['onDidDisconnect']>
    >[0];
    type ForwardingFailure = Parameters<
      NonNullable<UserCallbacks['onDidForwardingFailure']>
    >[0];
    type ForwardedPaymentError = Parameters<
      NonNullable<UserCallbacks['onDidForwardPaymentIntent']>
    >[1];

    expectRequired<ReconnectReason>(true);
    expectRequired<DisconnectReason>(true);
    expectRequired<ForwardingFailure>(true);
    expectOptional<ForwardedPaymentError>(true);
  });
});

describe('public SDK result contracts', () => {
  it('allows no-value APIs to resolve without an error', () => {
    const results = [
      {} satisfies DiscoverReadersResultType,
      {} satisfies CancelDiscoveringResultType,
      {} satisfies DisconnectReaderResultType,
      {} satisfies RebootReaderResultType,
      {} satisfies ClearReaderDisplayResultType,
    ];

    expect(results).toEqual([{}, {}, {}, {}, {}]);
  });
});

// Compile-time regression tests for PaymentMethodOptions type shape.
// If these assignments produce TypeScript errors, the type contract has regressed.

describe('PaymentMethodOptions types', () => {
  it('allows captureMethod without requestedPriority', () => {
    // Regression: requestedPriority was previously required, forcing callers to supply
    // a routing priority even when they only needed to set captureMethod (e.g. manual_preferred
    // for card_present while accepting interac_present with automatic capture).
    const options: PaymentMethodOptions = {
      captureMethod: 'manual_preferred',
    };
    expect(options.captureMethod).toBe('manual_preferred');
    expect(options.requestedPriority).toBeUndefined();
  });

  it('allows requestedPriority alongside captureMethod', () => {
    const options: PaymentMethodOptions = {
      captureMethod: 'manual_preferred',
      requestedPriority: 'domestic',
    };
    expect(options.requestedPriority).toBe('domestic');
  });

  it('allows an empty PaymentMethodOptions object', () => {
    const options: PaymentMethodOptions = {};
    expect(options).toBeDefined();
  });

  it('allows installments to be enabled or explicitly disabled', () => {
    const enabled: PaymentMethodOptions = { installments: { enabled: true } };
    const disabled: PaymentMethodOptions = { installments: { enabled: false } };

    expect(enabled.installments?.enabled).toBe(true);
    expect(disabled.installments?.enabled).toBe(false);
  });

  it('rejects response-only installment fields as creation inputs', () => {
    const options: PaymentMethodOptions = {
      installments: {
        enabled: true,
        // @ts-expect-error availablePlans is response-only
        availablePlans: [],
      },
    };
    const optionsWithPlan: PaymentMethodOptions = {
      installments: {
        enabled: true,
        // @ts-expect-error plan is response-only
        plan: { type: InstallmentPlanTypeValues.FixedCount },
      },
    };

    expect(options.installments?.enabled).toBe(true);
    expect(optionsWithPlan.installments?.enabled).toBe(true);
  });

  it('separates nested response options from flat request options', () => {
    const response: PaymentMethodOptionsResponse = {
      cardPresent: {
        requestExtendedAuthorization: true,
        requestIncrementalAuthorizationSupport: false,
        requestPartialAuthorization: 'if_available',
        requestReauthorization: 'never',
      },
    };
    const paymentIntentOptions: PaymentIntent.Type['paymentMethodOptions'] =
      response;
    const setupIntentOptions: SetupIntent.Type['paymentMethodOptions'] =
      response;

    expect(paymentIntentOptions?.cardPresent.requestExtendedAuthorization).toBe(
      true
    );
    expect(setupIntentOptions?.cardPresent.requestReauthorization).toBe('never');
  });
});

describe('PaymentIntent installment response types', () => {
  it('accepts available and selected fixed-count monthly plans', () => {
    const paymentMethodOptions: PaymentIntent.Type['paymentMethodOptions'] = {
      cardPresent: {
        requestExtendedAuthorization: false,
        requestIncrementalAuthorizationSupport: false,
        requestPartialAuthorization: 'never',
        installments: {
          enabled: true,
          availablePlans: [
            {
              type: InstallmentPlanTypeValues.FixedCount,
              count: 3,
              interval: InstallmentPlanIntervalValues.Month,
            },
          ],
          plan: {
            type: InstallmentPlanTypeValues.FixedCount,
            count: 3,
            interval: InstallmentPlanIntervalValues.Month,
          },
        },
      },
    };

    const type: InstallmentPlanType = InstallmentPlanTypeValues.FixedCount;
    const interval: InstallmentPlanInterval = InstallmentPlanIntervalValues.Month;
    expect(
      paymentMethodOptions?.cardPresent.installments?.availablePlans
    ).toHaveLength(1);
    expect(type).toBe('fixed_count');
    expect(interval).toBe('month');
  });

  it('keeps creation-only installments out of PaymentIntent responses', () => {
    const paymentMethodOptions: PaymentIntent.Type['paymentMethodOptions'] = {
      // @ts-expect-error creation-only installments are not response fields
      installments: { enabled: true },
    };

    expect(paymentMethodOptions).toEqual({ installments: { enabled: true } });
  });

  it('keeps response-only fields out of CreatePaymentIntentParams', () => {
    const params: CreatePaymentIntentParams = {
      amount: 1000,
      currency: 'mxn',
      paymentMethodOptions: {
        installments: {
          enabled: false,
          // @ts-expect-error response-only fields cannot be supplied on creation
          availablePlans: [],
        },
      },
    };

    expect(params.paymentMethodOptions?.installments?.enabled).toBe(false);
  });
});

describe('Terminal SDK 6.0 types', () => {
  it('uses v6 Tap to Pay UX configuration field names', () => {
    const configuration: TapToPayUxConfiguration = {
      theme: DarkMode.SYSTEM,
      colorScheme: {
        primary: '#112233',
        success: '#445566',
        error: '#778899',
      },
    };

    expect(configuration.theme).toBe(DarkMode.SYSTEM);
    expect(configuration.colorScheme?.primary).toBe('#112233');
  });

  it('requires an explicit locale configuration during initialization', () => {
    type IsRequired<T, K extends keyof T> = {} extends Pick<T, K>
      ? false
      : true;
    const localeConfigIsRequired: IsRequired<InitParams, 'localeConfig'> = true;

    expect(localeConfigIsRequired).toBe(true);
  });

  it('accepts automatic_async capture', () => {
    const params: CreatePaymentIntentParams = {
      amount: 1000,
      currency: 'usd',
      captureMethod: 'automatic_async',
    };

    expect(params.captureMethod).toBe('automatic_async');
  });

  it('exposes expanded payment-method card details', () => {
    const details: PaymentMethodCardPresentDetails = {
      brand: 'visa',
      brandProduct: 'visa_signature',
      networks: { available: ['visa'], preferred: 'visa' },
      paymentAccountReference: 'par_test',
      readMethod: 'contact_emv',
    };

    expect(details.networks?.preferred).toBe('visa');
  });

  it('allows nullable PaymentMethod fields to be omitted', () => {
    const paymentMethod: PaymentMethod.Type = {
      id: 'pm_test',
      type: PaymentMethodType.CardPresent,
      livemode: false,
    };
    const details: PaymentMethodCardPresentDetails = {};

    expect(paymentMethod.customer).toBeUndefined();
    expect(paymentMethod.cardPresentDetails).toBeUndefined();
    expect(details.brand).toBeUndefined();
    expect(details.readMethod).toBeUndefined();
  });

  it('allows fields omitted by either native SDK to be absent', () => {
    const paymentIntent: PaymentIntent.Type = {
      amount: 1000,
      created: '0',
      livemode: false,
      sdkUuid: 'uuid',
    };
    const setupIntent: SetupIntent.Type = {
      sdkUuid: 'uuid',
      livemode: false,
    };
    const charge: Charge = {
      id: 'ch_test',
      amount: 1000,
      amountRefunded: 0,
      captured: false,
      livemode: false,
      paid: false,
      refunded: false,
    };
    const location: Location = {};
    const cardPresent: CardPresentDetails = {
      expMonth: 12,
      expYear: 2030,
    };
    const receipt: ReceiptDetails = {};
    const setupAttemptCardPresent: SetupIntent.SetupAttemptCardPresentDetails =
      {};
    const offlineDetails: OfflineDetails = { requiresUpload: true };
    const offlineCardPresent: OfflineCardPresentDetails = {
      expMonth: 12,
      expYear: 2030,
    };
    const qrCode: QrCodeDisplayData = {
      imageUrlPng: 'https://example.com/qr.png',
      expiresAtMs: 123,
      paymentMethodType: 'swish',
    };

    expect(paymentIntent.id).toBeUndefined();
    expect(paymentIntent.captureMethod).toBeUndefined();
    expect(paymentIntent.currency).toBeUndefined();
    expect(setupIntent.id).toBeUndefined();
    expect(charge.currency).toBeUndefined();
    expect(location.id).toBeUndefined();
    expect(location.livemode).toBeUndefined();
    expect(cardPresent.last4).toBeUndefined();
    expect(cardPresent.brand).toBeUndefined();
    expect(cardPresent.readMethod).toBeUndefined();
    expect(receipt.applicationCryptogram).toBeUndefined();
    expect(setupAttemptCardPresent.emvAuthData).toBeUndefined();
    expect(setupAttemptCardPresent.generatedCard).toBeUndefined();
    expect(offlineDetails.storedAtMs).toBeUndefined();
    expect(offlineDetails.cardPresentDetails).toBeUndefined();
    expect(offlineDetails.amountDetails).toBeUndefined();
    expect(offlineCardPresent.brand).toBeUndefined();
    expect(offlineCardPresent.cardholderName).toBeUndefined();
    expect(offlineCardPresent.last4).toBeUndefined();
    expect(offlineCardPresent.readMethod).toBeUndefined();
    expect(offlineCardPresent.receiptDetails).toBeUndefined();
    expect(qrCode.imageUrlSvg).toBeUndefined();
  });

  it('exposes charge IDs when the latest charge is not expanded', () => {
    const paymentIntent: PaymentIntent.Type = {
      id: 'pi_test',
      amount: 1000,
      captureMethod: 'automatic_async',
      created: '0',
      currency: 'usd',
      livemode: false,
      sdkUuid: 'uuid',
      latestChargeId: 'ch_test',
      application: 'ca_test',
      review: 'prv_test',
    };

    expect(paymentIntent.latestChargeId).toBe('ch_test');
    expect(paymentIntent.application).toBe('ca_test');
    expect(paymentIntent.review).toBe('prv_test');
  });

  it('exposes numeric expiry fields, string read methods, and MOTO authorization codes', () => {
    const cardPresent: CardPresentDetails = {
      last4: '4242',
      expMonth: 12,
      expYear: 2030,
      brand: 'visa',
      preferredLocales: ['en'],
      issuer: 'issuer',
      iin: '424242',
      network: 'visa',
      readMethod: 'contact_emv',
      description: 'Visa',
      wallet: { type: 'unknown' },
      paymentAccountReference: 'par_test',
    };
    const card: CardDetails = { authorizationCode: '123456' };

    expect(cardPresent.readMethod).toBe('contact_emv');
    expect(cardPresent.paymentAccountReference).toBe('par_test');
    expect(cardPresent.expMonth).toBe(12);
    expect(cardPresent.expYear).toBe(2030);
    expect(card.authorizationCode).toBe('123456');
  });

  it('requires allowRedisplay for SetupIntent collection', () => {
    type IsRequired<T, K extends keyof T> = {} extends Pick<T, K>
      ? false
      : true;

    const collectRequiresAllowRedisplay: IsRequired<
      CollectSetupIntentPaymentMethodParams,
      'allowRedisplay'
    > = true;
    const processRequiresAllowRedisplay: IsRequired<
      ProcessSetupIntentParams,
      'allowRedisplay'
    > = true;

    expect(collectRequiresAllowRedisplay).toBe(true);
    expect(processRequiresAllowRedisplay).toBe(true);
  });

  it('allows nullable receipt fields to be omitted', () => {
    const receipt: ReceiptDetails = {
      applicationCryptogram: 'cryptogram',
      applicationPreferredName: 'Visa Debit',
      authorizationResponseCode: '00',
      cvm: 'signature',
      dedicatedFileName: 'A0000000031010',
      terminalVerificationResult: '0000008000',
      transactionStatusInformation: 'E800',
    };

    expect(receipt.accountType).toBeUndefined();
    expect(receipt.authorizationCode).toBeUndefined();
  });

  it('allows nullable charge card details to be omitted', () => {
    const cardPresent: CardPresentDetails = {
      last4: '4242',
      expMonth: 12,
      expYear: 2030,
      brand: 'visa',
      readMethod: 'contact_emv',
    };

    expect(cardPresent.preferredLocales).toBeUndefined();
    expect(cardPresent.issuer).toBeUndefined();
    expect(cardPresent.iin).toBeUndefined();
    expect(cardPresent.description).toBeUndefined();
    expect(cardPresent.wallet).toBeUndefined();
  });

  it('exposes Tap to Pay update requirements', () => {
    const requirements: Reader.TapToPayUpdateRequirement[] = [
      { type: 'operatingSystem', apiLevel: 35, requiredAt: '123' },
      { type: 'securityPatch', version: '2026-09-01', requiredAt: '456' },
      { type: 'terminalSdk', version: '6.1.0', requiredAt: '789' },
    ];

    expect(requirements).toHaveLength(3);
  });

  it('allows shared reader responses to omit platform-specific identifiers and battery status', () => {
    const reader: Reader.Type = {
      deviceType: 'wisePosE',
      locationStatus: 'notSet',
      status: 'online',
    };

    expect(reader.id).toBeUndefined();
    expect(reader.serialNumber).toBeUndefined();
    expect(reader.batteryStatus).toBeUndefined();
  });

  it('uses boolean charging state and supports unknown reader network status', () => {
    const iosReader: Reader.IOS.Type = {
      batteryStatus: 'nominal',
      isCharging: true,
    };
    const networkStatus: Reader.NetworkStatus = 'unknown';

    expect(iosReader.isCharging).toBe(true);
    expect(networkStatus).toBe('unknown');
  });

  it('exposes Refund next-action details and new statuses', () => {
    const refund: Refund.Props = {
      status: 'requiresAction',
      nextAction: {
        type: 'display_details',
        displayDetails: {
          expiresAt: '1700000100000',
          emailSent: {
            emailSentAt: '1700000000000',
            emailSentTo: 'customer@example.com',
          },
        },
      },
    };
    const canceledStatus: Refund.Status = 'canceled';

    expect(refund.nextAction?.displayDetails?.emailSent?.emailSentTo).toBe(
      'customer@example.com'
    );
    expect(canceledStatus).toBe('canceled');
  });

  it('allows setup attempts without payment method details', () => {
    const attempt: SetupIntent.SetupAttempt = {
      id: 'setatt_test',
      livemode: false,
      status: 'succeeded',
    };

    expect(attempt.paymentMethodDetails).toBeUndefined();
  });

  it('allows setup attempt details with only the matching payment method branch', () => {
    const attempt: SetupIntent.SetupAttempt = {
      id: 'setatt_test',
      livemode: false,
      status: 'succeeded',
      paymentMethodDetails: {
        type: PaymentMethodType.CardPresent,
        cardPresent: {
          emvAuthData: 'emv_auth_data',
          generatedCard: 'card_test',
        },
      },
    };

    expect(attempt.paymentMethodDetails?.cardPresent?.generatedCard).toBe(
      'card_test'
    );
    expect(attempt.paymentMethodDetails?.interacPresent).toBeUndefined();
  });
});

describe('AppTransitionPreset', () => {
  it('exposes all named enum values with correct string values', () => {
    expect(AppTransitionPreset.SlideFromBottom).toBe('slideFromBottom');
  });

  it('systemDefault animation is accepted by ConnectAppsOnDevicesParams', () => {
    const animation: AppTransitionAnimation = { type: 'systemDefault' };
    expect(animation.type).toBe('systemDefault');
  });

  it('preset animation is accepted by ConnectAppsOnDevicesParams', () => {
    const animation: AppTransitionAnimation = {
      type: 'preset',
      preset: AppTransitionPreset.SlideFromBottom,
    };
    expect(animation.type).toBe('preset');
    if (animation.type === 'preset') {
      expect(animation.preset).toBe('slideFromBottom');
    }
  });

  it('custom animation is accepted by ConnectAppsOnDevicesParams', () => {
    const animation: AppTransitionAnimation = {
      type: 'custom',
      enterAnim: 12345,
      exitAnim: 0,
    };
    expect(animation.type).toBe('custom');
    if (animation.type === 'custom') {
      expect(animation.enterAnim).toBe(12345);
      expect(animation.exitAnim).toBe(0);
    }
  });
});

describe('ReaderSettingsParameters', () => {
  it('accepts accessibility and buzzer volume settings one at a time', () => {
    const accessibility: Reader.AccessibilityReaderSettingsParameters = {
      textToSpeechViaSpeakers: true,
    };
    const low: Reader.BuzzerVolumeReaderSettingsParameters = {
      buzzerVolume: { level: 'low' },
    };
    const high: Reader.ReaderSettingsParameters = {
      buzzerVolume: { level: 'high' },
    };
    const custom: Reader.ReaderSettingsParameters = {
      buzzerVolume: { level: 'custom', volume: 3 },
    };
    const settings: Reader.ReaderSettingsParameters[] = [
      accessibility,
      low,
      high,
      custom,
    ];

    expect(accessibility.textToSpeechViaSpeakers).toBe(true);
    expect(low.buzzerVolume?.level).toBe('low');
    expect(high.buzzerVolume?.level).toBe('high');
    expect(custom.buzzerVolume?.level).toBe('custom');
    expect(settings).toHaveLength(4);
  });

  it('requires a custom volume and exactly one setting category', () => {
    const missingCustomVolume: Reader.BuzzerVolumeReaderSettingsParameters = {
      // @ts-expect-error custom buzzer volume requires an explicit volume
      buzzerVolume: { level: 'custom' },
    };

    // @ts-expect-error setReaderSettings requires a setting category
    const emptySettings: Reader.ReaderSettingsParameters = {};

    const mixedSettings: Reader.ReaderSettingsParameters = {
      textToSpeechViaSpeakers: true,
      // @ts-expect-error setReaderSettings accepts only one setting category per call
      buzzerVolume: { level: 'low' },
    };

    expect(missingCustomVolume.buzzerVolume?.level).toBe('custom');
    expect(emptySettings).toEqual({});
    expect(mixedSettings.buzzerVolume?.level).toBe('low');
  });
});

describe('ReaderSupportResult', () => {
  it('matches native support results and RN boundary failures', () => {
    const supported: Reader.ReaderSupportResult = {
      readerSupportResult: true,
    };
    const unsupported: Reader.ReaderSupportResult = {
      readerSupportResult: false,
      error: {} as StripeError,
    };
    const boundaryFailure: Reader.ReaderSupportResult = {
      error: {} as StripeError,
    };

    // @ts-expect-error native unsupported results include an error
    const unsupportedWithoutError: Reader.ReaderSupportResult = {
      readerSupportResult: false,
    };
    // @ts-expect-error a supported result cannot also contain an error
    const supportedWithError: Reader.ReaderSupportResult = {
      readerSupportResult: true,
      error: {} as StripeError,
    };

    expect(supported.readerSupportResult).toBe(true);
    expect(unsupported.readerSupportResult).toBe(false);
    expect(boundaryFailure.readerSupportResult).toBeUndefined();
    expect(unsupportedWithoutError.readerSupportResult).toBe(false);
    expect(supportedWithError.error).toBeDefined();
  });
});

describe('Reader.Accessibility', () => {
  it('keeps successful status and error results mutually exclusive', () => {
    const success: Reader.Accessibility = {
      textToSpeechStatus: 'speakers',
    };
    const failure: Reader.Accessibility = {
      error: {} as StripeError,
    };

    // @ts-expect-error unknown native statuses are represented as accessibility errors
    const invalidStatus: Reader.ReaderTextToSpeechStatus = 'unknown';

    // @ts-expect-error accessibility errors must not include a status
    const invalid: Reader.Accessibility = {
      textToSpeechStatus: 'off',
      error: {} as StripeError,
    };

    expect(success.textToSpeechStatus).toBe('speakers');
    expect(failure.textToSpeechStatus).toBeUndefined();
    expect(invalidStatus).toBe('unknown');
    expect(invalid.error).toBeDefined();
  });
});

export {};
