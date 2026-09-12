import type {
  AppTransitionAnimation,
  CreatePaymentIntentParams,
  CreateSetupIntentParams,
  PaymentMethodOptions,
  Reader,
  StripeError,
} from '../types';
import { PaymentMethodType, AppTransitionPreset } from '../types';

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
