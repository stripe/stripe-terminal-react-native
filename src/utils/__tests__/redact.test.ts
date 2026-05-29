import { redactForLogging } from '../redact';
import Logger from '../../logger';

const REDACTED = '<REDACTED>';

describe('redactForLogging', () => {
  it('returns primitives unchanged', () => {
    expect(redactForLogging(null)).toBeNull();
    expect(redactForLogging(undefined)).toBeUndefined();
    expect(redactForLogging(42)).toBe(42);
    expect(redactForLogging(true)).toBe(true);
    expect(redactForLogging('hello')).toBe('hello');
  });

  it('redacts clientSecret field', () => {
    const input = {
      id: 'pi_123',
      clientSecret: 'pi_123_secret_abc',
      amount: 1000,
    };
    const result = redactForLogging(input) as Record<string, unknown>;
    expect(result.id).toBe('pi_123');
    expect(result.clientSecret).toBe(REDACTED);
    expect(result.amount).toBe(1000);
  });

  it('redacts metadata field', () => {
    const input = {
      id: 'pi_123',
      metadata: { key1: 'value1', key2: 'value2' },
    };
    const result = redactForLogging(input) as Record<string, unknown>;
    expect(result.id).toBe('pi_123');
    expect(result.metadata).toBe(REDACTED);
  });

  it('redacts nested sensitive fields', () => {
    const input = {
      paymentIntent: {
        id: 'pi_123',
        clientSecret: 'pi_123_secret_abc',
        metadata: { order: '999' },
        charges: [
          {
            id: 'ch_123',
            metadata: { receipt: 'abc' },
          },
        ],
      },
    };
    const result = redactForLogging(input) as any;
    expect(result.paymentIntent.id).toBe('pi_123');
    expect(result.paymentIntent.clientSecret).toBe(REDACTED);
    expect(result.paymentIntent.metadata).toBe(REDACTED);
    expect(result.paymentIntent.charges[0].id).toBe('ch_123');
    expect(result.paymentIntent.charges[0].metadata).toBe(REDACTED);
  });

  it('does not redact non-secret strings in arrays', () => {
    const input = { args: ['cardPresent', 'interacPresent'] };
    const result = redactForLogging(input) as any;
    expect(result.args).toEqual(['cardPresent', 'interacPresent']);
  });

  it('preserves null and undefined field values without redacting', () => {
    const input = {
      clientSecret: null,
      metadata: undefined,
      id: 'pi_123',
    };
    const result = redactForLogging(input) as Record<string, unknown>;
    expect(result.clientSecret).toBeNull();
    expect(result.metadata).toBeUndefined();
    expect(result.id).toBe('pi_123');
  });

  it('does not mutate the original object', () => {
    const input = {
      id: 'pi_123',
      clientSecret: 'pi_123_secret_abc',
      metadata: { key: 'value' },
    };
    redactForLogging(input);
    const original = JSON.parse(JSON.stringify(input));
    expect(input).toEqual(original);
  });

  it('handles empty objects and arrays', () => {
    expect(redactForLogging({})).toEqual({});
    expect(redactForLogging([])).toEqual([]);
  });

  it('handles a realistic createPaymentIntent args trace', () => {
    const input = {
      args: [
        {
          amount: 1000,
          currency: 'usd',
          metadata: { orderId: '12345' },
          paymentMethodTypes: ['card_present'],
          captureMethod: 'automatic',
        },
      ],
    };
    const result = redactForLogging(input) as any;
    expect(result.args[0].amount).toBe(1000);
    expect(result.args[0].currency).toBe('usd');
    expect(result.args[0].metadata).toBe(REDACTED);
    expect(result.args[0].paymentMethodTypes).toEqual(['card_present']);
  });

  it('handles a realistic processRefund args trace', () => {
    const input = {
      args: [
        {
          paymentIntentId: 'pi_123',
          clientSecret: 'pi_123_secret_abc',
          amount: 500,
          currency: 'usd',
          metadata: { reason: 'customer request' },
        },
      ],
    };
    const result = redactForLogging(input) as any;
    expect(result.args[0].paymentIntentId).toBe('pi_123');
    expect(result.args[0].clientSecret).toBe(REDACTED);
    expect(result.args[0].amount).toBe(500);
    expect(result.args[0].metadata).toBe(REDACTED);
  });

  it('handles a realistic PaymentIntent response with all redacted fields', () => {
    const input = {
      paymentIntent: {
        id: 'pi_123',
        clientSecret: 'pi_123_secret_abc',
        receiptEmail: 'user@example.com',
        statementDescriptor: 'MERCHANT NAME',
        statementDescriptorSuffix: 'ORDER-999',
        metadata: { order: '999' },
        charges: [
          {
            id: 'ch_123',
            receiptEmail: 'user@example.com',
            statementDescriptorSuffix: 'ORDER-999',
            metadata: { receipt: 'abc' },
            paymentMethodDetails: {
              cardPresentDetails: {
                last4: '4242',
                brand: 'visa',
                emvAuthData: 'EMV_DATA',
                cardholderName: 'Jane Doe',
                receipt: {
                  applicationCryptogram: 'ARQC_123',
                  authorizationCode: '654321',
                },
              },
            },
          },
        ],
      },
    };
    const result = redactForLogging(input) as any;
    const pi = result.paymentIntent;
    expect(pi.clientSecret).toBe(REDACTED);
    expect(pi.receiptEmail).toBe(REDACTED);
    expect(pi.statementDescriptor).toBe(REDACTED);
    expect(pi.statementDescriptorSuffix).toBe(REDACTED);
    expect(pi.metadata).toBe(REDACTED);
    expect(pi.id).toBe('pi_123');

    const charge = pi.charges[0];
    expect(charge.receiptEmail).toBe(REDACTED);
    expect(charge.statementDescriptorSuffix).toBe(REDACTED);
    expect(charge.metadata).toBe(REDACTED);
    expect(charge.id).toBe('ch_123');

    const cpd = charge.paymentMethodDetails.cardPresentDetails;
    expect(cpd.emvAuthData).toBe(REDACTED);
    expect(cpd.cardholderName).toBe(REDACTED);
    expect(cpd.receipt.applicationCryptogram).toBe(REDACTED);
    expect(cpd.last4).toBe('4242');
    expect(cpd.brand).toBe('visa');
    expect(cpd.receipt.authorizationCode).toBe('654321');
  });
});

describe('redactForLogging – parent-scoped redaction (card detail fields)', () => {
  it('redacts expMonth and expYear inside cardPresentDetails', () => {
    const input = {
      paymentMethodDetails: {
        cardPresentDetails: {
          last4: '4242',
          expMonth: '12',
          expYear: '2025',
          brand: 'visa',
        },
      },
    };
    const result = redactForLogging(input) as any;
    const cpd = result.paymentMethodDetails.cardPresentDetails;
    expect(cpd.expMonth).toBe(REDACTED);
    expect(cpd.expYear).toBe(REDACTED);
    expect(cpd.last4).toBe('4242');
    expect(cpd.brand).toBe('visa');
  });

  it('redacts expMonth and expYear inside interacPresentDetails', () => {
    const input = {
      paymentMethodDetails: {
        interacPresentDetails: {
          last4: '1234',
          expMonth: '06',
          expYear: '2027',
        },
      },
    };
    const result = redactForLogging(input) as any;
    const ipd = result.paymentMethodDetails.interacPresentDetails;
    expect(ipd.expMonth).toBe(REDACTED);
    expect(ipd.expYear).toBe(REDACTED);
    expect(ipd.last4).toBe('1234');
  });

  it('redacts expMonth and expYear inside cardDetails', () => {
    const input = {
      paymentMethod: {
        cardDetails: {
          last4: '5678',
          expMonth: 3,
          expYear: 2026,
          brand: 'mastercard',
        },
      },
    };
    const result = redactForLogging(input) as any;
    const cd = result.paymentMethod.cardDetails;
    expect(cd.expMonth).toBe(REDACTED);
    expect(cd.expYear).toBe(REDACTED);
    expect(cd.last4).toBe('5678');
    expect(cd.brand).toBe('mastercard');
  });

  it('does NOT redact expMonth/expYear at other nesting levels', () => {
    const input = {
      expMonth: '12',
      expYear: '2025',
      nested: {
        expMonth: '06',
        expYear: '2027',
      },
    };
    const result = redactForLogging(input) as any;
    expect(result.expMonth).toBe('12');
    expect(result.expYear).toBe('2025');
    expect(result.nested.expMonth).toBe('06');
    expect(result.nested.expYear).toBe('2027');
  });

  it('redacts expMonth/expYear in offlineDetails.cardPresentDetails', () => {
    const input = {
      paymentIntent: {
        offlineDetails: {
          cardPresentDetails: {
            last4: '9999',
            expMonth: 11,
            expYear: 2028,
            cardholderName: 'Offline User',
          },
        },
      },
    };
    const result = redactForLogging(input) as any;
    const cpd = result.paymentIntent.offlineDetails.cardPresentDetails;
    expect(cpd.expMonth).toBe(REDACTED);
    expect(cpd.expYear).toBe(REDACTED);
    expect(cpd.cardholderName).toBe(REDACTED);
    expect(cpd.last4).toBe('9999');
  });
});

describe('redactForLogging – global redaction (receiptEmail)', () => {
  it('redacts receiptEmail at any nesting level', () => {
    const input = {
      receiptEmail: 'top@example.com',
      paymentIntent: {
        id: 'pi_123',
        receiptEmail: 'pi@example.com',
        charges: [
          { id: 'ch_123', receiptEmail: 'charge@example.com' },
        ],
      },
      args: [{ receiptEmail: 'args@example.com', amount: 1000 }],
    };
    const result = redactForLogging(input) as any;
    expect(result.receiptEmail).toBe(REDACTED);
    expect(result.paymentIntent.receiptEmail).toBe(REDACTED);
    expect(result.paymentIntent.charges[0].receiptEmail).toBe(REDACTED);
    expect(result.args[0].receiptEmail).toBe(REDACTED);
    expect(result.paymentIntent.id).toBe('pi_123');
    expect(result.paymentIntent.charges[0].id).toBe('ch_123');
    expect(result.args[0].amount).toBe(1000);
  });
});

describe('redactForLogging – global redaction (emvAuthData)', () => {
  it('redacts emvAuthData at any nesting level', () => {
    const input = {
      emvAuthData: 'TOP_LEVEL',
      paymentMethodDetails: {
        cardPresentDetails: { last4: '4242', emvAuthData: 'ARPC_DATA' },
        interacPresentDetails: { emvAuthData: 'ARPC_DATA_2' },
      },
      setupIntent: {
        latestAttempt: {
          paymentMethodDetails: {
            cardPresent: { emvAuthData: 'ARPC_DATA_3', generatedCard: 'pm_123' },
            interacPresent: { emvAuthData: 'ARPC_DATA_4' },
          },
        },
      },
    };
    const result = redactForLogging(input) as any;
    expect(result.emvAuthData).toBe(REDACTED);
    expect(result.paymentMethodDetails.cardPresentDetails.emvAuthData).toBe(REDACTED);
    expect(result.paymentMethodDetails.cardPresentDetails.last4).toBe('4242');
    expect(result.paymentMethodDetails.interacPresentDetails.emvAuthData).toBe(REDACTED);
    const sa = result.setupIntent.latestAttempt.paymentMethodDetails;
    expect(sa.cardPresent.emvAuthData).toBe(REDACTED);
    expect(sa.cardPresent.generatedCard).toBe('pm_123');
    expect(sa.interacPresent.emvAuthData).toBe(REDACTED);
  });
});

describe('redactForLogging – global redaction (cardholderName)', () => {
  it('redacts cardholderName at any nesting level', () => {
    const input = {
      cardholderName: 'Top Level',
      paymentMethodDetails: {
        cardPresentDetails: { last4: '4242', cardholderName: 'John Doe', brand: 'visa' },
        interacPresentDetails: { cardholderName: 'Jane Doe' },
      },
    };
    const result = redactForLogging(input) as any;
    expect(result.cardholderName).toBe(REDACTED);
    expect(result.paymentMethodDetails.cardPresentDetails.cardholderName).toBe(REDACTED);
    expect(result.paymentMethodDetails.cardPresentDetails.last4).toBe('4242');
    expect(result.paymentMethodDetails.cardPresentDetails.brand).toBe('visa');
    expect(result.paymentMethodDetails.interacPresentDetails.cardholderName).toBe(REDACTED);
  });
});

describe('redactForLogging – global redaction (applicationCryptogram)', () => {
  it('redacts applicationCryptogram at any nesting level', () => {
    const input = {
      applicationCryptogram: 'TOP_LEVEL',
      paymentMethodDetails: {
        cardPresentDetails: {
          receipt: {
            applicationCryptogram: 'ARQC_VALUE',
            authorizationCode: '123456',
          },
        },
      },
    };
    const result = redactForLogging(input) as any;
    expect(result.applicationCryptogram).toBe(REDACTED);
    const receipt = result.paymentMethodDetails.cardPresentDetails.receipt;
    expect(receipt.applicationCryptogram).toBe(REDACTED);
    expect(receipt.authorizationCode).toBe('123456');
  });
});

describe('redactForLogging – global redaction (jack_rabbit_service fields)', () => {
  it('redacts statementDescriptor at any nesting level', () => {
    const input = {
      paymentIntent: {
        id: 'pi_123',
        statementDescriptor: 'MERCHANT NAME',
      },
      args: [{ statementDescriptor: 'MERCHANT NAME', amount: 1000 }],
    };
    const result = redactForLogging(input) as any;
    expect(result.paymentIntent.statementDescriptor).toBe(REDACTED);
    expect(result.paymentIntent.id).toBe('pi_123');
    expect(result.args[0].statementDescriptor).toBe(REDACTED);
    expect(result.args[0].amount).toBe(1000);
  });

  it('redacts statementDescriptorSuffix at any nesting level', () => {
    const input = {
      paymentIntent: {
        statementDescriptorSuffix: 'ORDER-123',
        charges: [
          { id: 'ch_123', statementDescriptorSuffix: 'ORDER-123' },
        ],
      },
      args: [{ statementDescriptorSuffix: 'ORDER-123' }],
    };
    const result = redactForLogging(input) as any;
    expect(result.paymentIntent.statementDescriptorSuffix).toBe(REDACTED);
    expect(result.paymentIntent.charges[0].statementDescriptorSuffix).toBe(REDACTED);
    expect(result.paymentIntent.charges[0].id).toBe('ch_123');
    expect(result.args[0].statementDescriptorSuffix).toBe(REDACTED);
  });

  it('redacts surchargeNotice at any nesting level', () => {
    const input = {
      args: [{ surchargeNotice: 'A surcharge of 2% applies', amount: 1000 }],
    };
    const result = redactForLogging(input) as any;
    expect(result.args[0].surchargeNotice).toBe(REDACTED);
    expect(result.args[0].amount).toBe(1000);
  });

  it('redacts notice only under a consent parent key', () => {
    const input = {
      surcharge: {
        consent: {
          notice: 'A surcharge of $0.50 will be added',
          collection: 'online',
        },
      },
    };
    const result = redactForLogging(input) as any;
    expect(result.surcharge.consent.notice).toBe(REDACTED);
    expect(result.surcharge.consent.collection).toBe('online');
  });

  it('does not redact notice outside of consent parent', () => {
    const input = {
      notice: 'This is a generic notice',
      other: 'value',
    };
    const result = redactForLogging(input) as any;
    expect(result.notice).toBe('This is a generic notice');
    expect(result.other).toBe('value');
  });
});

describe('redactForLogging – parent-scoped redaction (address)', () => {
  it('redacts all address fields inside an address parent', () => {
    const input = {
      location: {
        id: 'loc_123',
        displayName: 'HQ',
        address: {
          city: 'San Francisco',
          country: 'US',
          postalCode: '94110',
          line1: '123 Market St',
          line2: 'Suite 400',
          state: 'CA',
        },
      },
    };
    const result = redactForLogging(input) as any;
    expect(result.location.id).toBe('loc_123');
    expect(result.location.displayName).toBe('HQ');
    expect(result.location.address.city).toBe(REDACTED);
    expect(result.location.address.country).toBe(REDACTED);
    expect(result.location.address.postalCode).toBe(REDACTED);
    expect(result.location.address.line1).toBe(REDACTED);
    expect(result.location.address.line2).toBe(REDACTED);
    expect(result.location.address.state).toBe(REDACTED);
  });

  it('does NOT redact address-like fields outside of address parent', () => {
    const input = {
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
    };
    const result = redactForLogging(input) as any;
    expect(result.city).toBe('San Francisco');
    expect(result.state).toBe('CA');
    expect(result.country).toBe('US');
  });

  it('preserves null/undefined address fields without redacting', () => {
    const input = {
      address: {
        city: null,
        line1: undefined,
        state: 'CA',
      },
    };
    const result = redactForLogging(input) as any;
    expect(result.address.city).toBeNull();
    expect(result.address.line1).toBeUndefined();
    expect(result.address.state).toBe(REDACTED);
  });
});

describe('redactForLogging – parent-scoped redaction (collectInputResults)', () => {
  it('redacts sensitive fields inside collectInputResults', () => {
    const input = {
      collectInputResults: [
        {
          skipped: false,
          formType: 'email',
          toggles: [],
          email: 'user@example.com',
        },
      ],
    };
    const result = redactForLogging(input) as any;
    expect(result.collectInputResults[0].email).toBe(REDACTED);
    expect(result.collectInputResults[0].skipped).toBe(false);
    expect(result.collectInputResults[0].formType).toBe('email');
    expect(result.collectInputResults[0].toggles).toEqual([]);
  });

  it('does NOT redact same-named fields at other levels', () => {
    const input = {
      id: 'top_level_id',
      text: 'top_level_text',
      email: 'top_level_email',
      collectInputResults: [
        { formType: 'email', email: 'sensitive@example.com', toggles: [] },
      ],
    };
    const result = redactForLogging(input) as any;
    expect(result.id).toBe('top_level_id');
    expect(result.text).toBe('top_level_text');
    expect(result.email).toBe('top_level_email');
    expect(result.collectInputResults[0].email).toBe(REDACTED);
  });

  it('redacts multiple result types in an array', () => {
    const input = {
      collectInputResults: [
        { formType: 'selection', selection: 'Option A', selectionId: 'opt_a', toggles: [] },
        { formType: 'signature', signatureSvg: '<svg>...</svg>', toggles: [] },
        { formType: 'phone', phone: '+15551234567', toggles: [] },
        { formType: 'email', email: 'user@test.com', toggles: [] },
        { formType: 'text', text: 'free text answer', toggles: [] },
        { formType: 'numeric', numericString: '42', toggles: [] },
      ],
    };
    const result = redactForLogging(input) as any;
    expect(result.collectInputResults[0].selection).toBe(REDACTED);
    expect(result.collectInputResults[0].selectionId).toBe(REDACTED);
    expect(result.collectInputResults[1].signatureSvg).toBe(REDACTED);
    expect(result.collectInputResults[2].phone).toBe(REDACTED);
    expect(result.collectInputResults[3].email).toBe(REDACTED);
    expect(result.collectInputResults[4].text).toBe(REDACTED);
    expect(result.collectInputResults[5].numericString).toBe(REDACTED);

    expect(result.collectInputResults[0].formType).toBe('selection');
    expect(result.collectInputResults[1].formType).toBe('signature');
  });

  it('preserves null/undefined scoped fields without redacting', () => {
    const input = {
      collectInputResults: [
        { formType: 'email', email: null, toggles: [] },
        { formType: 'phone', phone: undefined, toggles: [] },
      ],
    };
    const result = redactForLogging(input) as any;
    expect(result.collectInputResults[0].email).toBeNull();
    expect(result.collectInputResults[1].phone).toBeUndefined();
  });

  it('default redaction (clientSecret/metadata) still applies alongside parent-scoped redaction', () => {
    const input = {
      clientSecret: 'secret_abc',
      metadata: { key: 'value' },
      collectInputResults: [
        { formType: 'email', email: 'user@test.com', toggles: [] },
      ],
    };
    const result = redactForLogging(input) as any;
    expect(result.clientSecret).toBe(REDACTED);
    expect(result.metadata).toBe(REDACTED);
    expect(result.collectInputResults[0].email).toBe(REDACTED);
  });

  it('default redaction applies inside parent-scoped containers', () => {
    const input = {
      collectInputResults: [
        {
          formType: 'email',
          email: 'user@test.com',
          metadata: { inner: 'data' },
          toggles: [],
        },
      ],
    };
    const result = redactForLogging(input) as any;
    expect(result.collectInputResults[0].email).toBe(REDACTED);
    expect(result.collectInputResults[0].metadata).toBe(REDACTED);
  });

  it('does not mutate the original object', () => {
    const input = {
      collectInputResults: [
        { formType: 'phone', phone: '+15551234567', toggles: [] },
      ],
    };
    const original = JSON.parse(JSON.stringify(input));
    redactForLogging(input);
    expect(input).toEqual(original);
  });

  it('parent scope does not leak into deeper nesting', () => {
    const input = {
      collectInputResults: [
        {
          formType: 'email',
          email: 'redact-me@test.com',
          nested: {
            email: 'should-not-be-redacted',
          },
        },
      ],
    };
    const result = redactForLogging(input) as any;
    expect(result.collectInputResults[0].email).toBe(REDACTED);
    expect(result.collectInputResults[0].nested.email).toBe(
      'should-not-be-redacted'
    );
  });

  it('has no effect when the response lacks collectInputResults', () => {
    const input = {
      paymentIntent: { id: 'pi_123', amount: 1000 },
    };
    const result = redactForLogging(input) as any;
    expect(result).toEqual({ paymentIntent: { id: 'pi_123', amount: 1000 } });
  });

  it('handles a realistic collectInputs response end-to-end', () => {
    const input = {
      collectInputResults: [
        {
          skipped: false,
          formType: 'selection',
          toggles: [{ id: 'toggle_1', value: 'enabled' }],
          selection: 'Option B',
          selectionId: 'opt_b',
        },
        {
          skipped: true,
          formType: 'signature',
          toggles: [],
          signatureSvg: null,
        },
        {
          skipped: false,
          formType: 'text',
          toggles: [],
          text: 'my free text',
        },
      ],
    };
    const result = redactForLogging(input) as any;

    const r0 = result.collectInputResults[0];
    expect(r0.skipped).toBe(false);
    expect(r0.formType).toBe('selection');
    expect(r0.toggles).toEqual([{ id: 'toggle_1', value: 'enabled' }]);
    expect(r0.selection).toBe(REDACTED);
    expect(r0.selectionId).toBe(REDACTED);

    const r1 = result.collectInputResults[1];
    expect(r1.skipped).toBe(true);
    expect(r1.signatureSvg).toBeNull();

    const r2 = result.collectInputResults[2];
    expect(r2.text).toBe(REDACTED);
    expect(r2.formType).toBe('text');
  });
});

/**
 * Integration tests that verify redaction works end-to-end through the
 * Logger trace pipeline. If someone changes how the response flows through
 * traceSdkMethod (e.g., wraps it in an extra object, renames a key), these
 * tests will fail because the logged trace will contain unredacted data.
 */
jest.mock('../../StripeTerminalSdk', () => ({
  collectInputs: jest.fn(),
}));

function getLatestTrace(method: string) {
  const traces = Logger.getInstance()._collector._traces;
  const match = [...traces].reverse().find((t) => t.trace.method === method);
  if (!match) {
    throw new Error(
      `No trace found for method "${method}". ` +
        `Available: ${traces.map((t) => t.trace.method).join(', ') || '(none)'}`
    );
  }
  return match;
}

describe('collectInputs redaction integration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    Logger.instance = null;
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    Logger.instance = null;
  });

  it('redacts all sensitive fields in the logged trace while returning unredacted data', async () => {
    const mockResponse = {
      collectInputResults: [
        {
          skipped: false,
          formType: 'selection',
          toggles: [{ id: 'toggle_1', value: 'enabled' }],
          selection: 'Option A',
          selectionId: 'opt_a',
        },
        {
          skipped: false,
          formType: 'signature',
          toggles: [],
          signatureSvg: '<svg>signature data</svg>',
        },
        {
          skipped: false,
          formType: 'phone',
          toggles: [],
          phone: '+15551234567',
        },
        {
          skipped: false,
          formType: 'email',
          toggles: [],
          email: 'user@example.com',
        },
        {
          skipped: false,
          formType: 'text',
          toggles: [],
          text: 'free text answer',
        },
        {
          skipped: false,
          formType: 'numeric',
          toggles: [],
          numericString: '42',
        },
      ],
    };

    const StripeTerminalSdk = require('../../StripeTerminalSdk');
    (StripeTerminalSdk.collectInputs as jest.Mock).mockResolvedValue(
      mockResponse
    );

    const { collectInputs } = require('../../functions');
    const result = await collectInputs({ inputs: [] });

    // ── API return value must be UNREDACTED ──
    const results = result.collectInputResults!;
    expect(results[0].selection).toBe('Option A');
    expect(results[0].selectionId).toBe('opt_a');
    expect(results[1].signatureSvg).toBe('<svg>signature data</svg>');
    expect(results[2].phone).toBe('+15551234567');
    expect(results[3].email).toBe('user@example.com');
    expect(results[4].text).toBe('free text answer');
    expect(results[5].numericString).toBe('42');

    // ── Logged trace must have sensitive fields REDACTED ──
    const trace = getLatestTrace('collectInputs');
    const loggedResponse = JSON.parse(trace.trace.response!);
    const logged = loggedResponse.collectInputResults;

    expect(logged[0].selection).toBe(REDACTED);
    expect(logged[0].selectionId).toBe(REDACTED);
    expect(logged[1].signatureSvg).toBe(REDACTED);
    expect(logged[2].phone).toBe(REDACTED);
    expect(logged[3].email).toBe(REDACTED);
    expect(logged[4].text).toBe(REDACTED);
    expect(logged[5].numericString).toBe(REDACTED);

    // ── Non-sensitive fields must be preserved in the logged trace ──
    expect(logged[0].formType).toBe('selection');
    expect(logged[0].skipped).toBe(false);
    expect(logged[0].toggles).toEqual([
      { id: 'toggle_1', value: 'enabled' },
    ]);
    expect(logged[3].formType).toBe('email');
  });

  it('does not redact fields outside of collectInputResults in the trace', async () => {
    const mockResponse = {
      collectInputResults: [
        {
          skipped: false,
          formType: 'email',
          toggles: [],
          email: 'user@example.com',
        },
      ],
    };

    const StripeTerminalSdk = require('../../StripeTerminalSdk');
    (StripeTerminalSdk.collectInputs as jest.Mock).mockResolvedValue(
      mockResponse
    );

    const { collectInputs } = require('../../functions');
    await collectInputs({ inputs: [] });

    const trace = getLatestTrace('collectInputs');

    const loggedRequest = JSON.parse(trace.trace.request);
    expect(loggedRequest).toBeDefined();
    expect(loggedRequest.args).toEqual([]);
  });
});
