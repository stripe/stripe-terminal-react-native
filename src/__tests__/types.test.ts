import type { PaymentMethodOptions, CreatePaymentIntentParams, CreateSetupIntentParams, AppTransitionAnimation } from '../types';
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

export {};
