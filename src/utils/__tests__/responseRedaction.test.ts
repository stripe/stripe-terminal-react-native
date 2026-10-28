import {
  REQUEST_POLICIES,
  RESPONSE_POLICIES,
  StripeErrorPolicy,
  stringifyRedactedResponse,
  stringifyWithTypedPolicySafely,
} from '../redactionPolicies';
import fs from 'fs';
import nodePath from 'path';
import ts from 'typescript';

const REDACTED = '<REDACTED>';

const parsedResponse = (method: string, response: unknown) =>
  JSON.parse(stringifyRedactedResponse(method, response));

describe('stringifyRedactedResponse', () => {
  it('serializes a value with an explicit typed policy', () => {
    const logged = JSON.parse(
      stringifyWithTypedPolicySafely(
        {
          name: 'StripeError',
          message: 'Payment failed',
          code: 'DECLINED_BY_STRIPE_API',
          nativeErrorCode: 'api_error',
          metadata: { orderId: 'private' },
          futureSensitiveField: 'must-not-be-logged',
        } as any,
        StripeErrorPolicy
      )
    );

    expect(logged).toEqual({
      name: 'StripeError',
      message: 'Payment failed',
      code: 'DECLINED_BY_STRIPE_API',
      nativeErrorCode: 'api_error',
      metadata: REDACTED,
    });
  });

  it('uses the reviewed PaymentIntent policy and omits unknown fields', () => {
    const logged = parsedResponse('createPaymentIntent', {
      paymentIntent: {
        id: 'pi_123',
        amount: 1000,
        status: 'succeeded',
        clientSecret: 'pi_123_secret_private',
        receiptEmail: 'private@example.com',
        metadata: { orderId: 'private' },
        futureSensitiveField: 'must-not-be-logged',
      },
      error: undefined,
      futureResponseField: 'must-not-be-logged',
    });

    expect(logged).toEqual({
      paymentIntent: {
        id: 'pi_123',
        amount: 1000,
        status: 'succeeded',
        clientSecret: REDACTED,
        receiptEmail: REDACTED,
        metadata: REDACTED,
      },
    });
  });

  it('applies the distinct PaymentMethod and charge card policies', () => {
    const logged = parsedResponse('processPaymentIntent', {
      paymentIntent: {
        id: 'pi_123',
        clientSecret: 'pi_123_secret_private',
        receiptEmail: 'private@example.com',
        paymentMethod: {
          id: 'pm_123',
          type: 'cardPresent',
          cardPresentDetails: {
            brandProduct: 'visa_signature',
            cardholderName: 'Private Name',
            expMonth: 12,
            iin: '424242',
            last4: '4242',
            networks: {
              available: ['visa', 'cartes_bancaires'],
              preferred: 'visa',
            },
            paymentAccountReference: 'private-par',
            readMethod: 'contact_emv',
          },
        },
        latestCharge: {
          paymentMethodDetails: {
            type: 'cardPresent',
            cardPresentDetails: {
              cardholderName: 'Private Name',
              generatedCard: 'pm_generated',
              iin: '424242',
              last4: '4242',
              emvAuthData: 'private-emv-data',
              receipt: {
                applicationCryptogram: 'private-cryptogram',
                authorizationCode: '123456',
              },
            },
          },
        },
      },
    });

    expect(logged).toEqual({
      paymentIntent: {
        id: 'pi_123',
        clientSecret: REDACTED,
        receiptEmail: REDACTED,
        paymentMethod: {
          id: 'pm_123',
          type: 'cardPresent',
          cardPresentDetails: {
            brandProduct: 'visa_signature',
            cardholderName: REDACTED,
            expMonth: REDACTED,
            iin: REDACTED,
            last4: REDACTED,
            networks: {
              available: ['visa', 'cartes_bancaires'],
              preferred: 'visa',
            },
            paymentAccountReference: REDACTED,
            readMethod: 'contact_emv',
          },
        },
        latestCharge: {
          paymentMethodDetails: {
            type: 'cardPresent',
            cardPresentDetails: {
              cardholderName: REDACTED,
              generatedCard: REDACTED,
              iin: REDACTED,
              last4: REDACTED,
              emvAuthData: REDACTED,
              receipt: {
                applicationCryptogram: REDACTED,
                authorizationCode: '123456',
              },
            },
          },
        },
      },
    });
  });

  it('redacts the refund next-action recipient email', () => {
    expect(
      parsedResponse('processRefund', {
        refund: {
          id: 're_123',
          status: 'requiresAction',
          nextAction: {
            type: 'display_details',
            displayDetails: {
              expiresAt: '1700000100000',
              emailSent: {
                emailSentAt: '1700000000000',
                emailSentTo: 'private@example.com',
              },
            },
          },
        },
      })
    ).toEqual({
      refund: {
        id: 're_123',
        status: 'requiresAction',
        nextAction: {
          type: 'display_details',
          displayDetails: {
            expiresAt: '1700000100000',
            emailSent: {
              emailSentAt: '1700000000000',
              emailSentTo: REDACTED,
            },
          },
        },
      },
    });
  });

  it.each([
    ['getPaymentStatus', 'processing'],
    ['getConnectionStatus', 'connected'],
    ['getNativeSdkVersion', '6.0.0'],
  ])('allows a reviewed scalar response for %s', (method, response) => {
    expect(parsedResponse(method, response)).toBe(response);
  });

  it('redacts sensitive connected reader fields', () => {
    expect(
      parsedResponse('getConnectedReader', {
        id: 'tmr_123',
        label: 'Private register name',
        deviceType: 'stripeS700',
        futureSensitiveField: 'must-not-be-logged',
      })
    ).toEqual({
      id: 'tmr_123',
      label: REDACTED,
      deviceType: 'stripeS700',
    });
  });

  it('fails closed for an unregistered method and opaque string response', () => {
    expect(parsedResponse('futureSdkMethod', 'possibly-sensitive')).toBe(
      REDACTED
    );
  });

  it('applies the typed internal error policy to failed responses', () => {
    const logged = parsedResponse('collectPaymentMethod', {
      paymentIntent: undefined,
      error: {
        errorSource: 'native',
        stripeError: {
          name: 'StripeError',
          message: 'Declined for private@example.com',
          code: 'DECLINED_BY_STRIPE_API',
          nativeErrorCode: 'api_error',
          metadata: { private: 'value' },
          underlyingError: {
            code: 'IOException',
            message: 'Connection interrupted',
            iosDomain: 'NSURLErrorDomain',
            iosLocalizedFailureReason: 'Private failure detail',
            iosLocalizedRecoverySuggestion: 'Private recovery detail',
          },
          paymentIntent: {
            id: 'pi_123',
            clientSecret: 'pi_123_secret_private',
          },
          futureErrorField: 'must-not-be-logged',
        },
      },
    });

    expect(logged).toEqual({
      error: {
        errorSource: 'native',
        stripeError: {
          name: 'StripeError',
          message: 'Declined for private@example.com',
          code: 'DECLINED_BY_STRIPE_API',
          nativeErrorCode: 'api_error',
          metadata: REDACTED,
          underlyingError: {
            code: 'IOException',
            message: 'Connection interrupted',
            iosDomain: 'NSURLErrorDomain',
            iosLocalizedFailureReason: REDACTED,
            iosLocalizedRecoverySuggestion: REDACTED,
          },
          paymentIntent: {
            id: 'pi_123',
            clientSecret: REDACTED,
          },
        },
      },
    });
  });

  it('preserves reviewed response fields when a resolved response also has an error', () => {
    const logged = parsedResponse('supportsReadersOfType', {
      readerSupportResult: false,
      futureResponseField: 'must-not-be-logged',
      error: {
        errorSource: 'native',
        stripeError: {
          name: 'StripeError',
          message: 'This reader configuration is unsupported',
          code: 'UNSUPPORTED_OPERATION',
          nativeErrorCode: 'unsupported_operation',
          metadata: { private: 'value' },
          futureErrorField: 'must-not-be-logged',
        },
      },
    });

    expect(logged).toEqual({
      readerSupportResult: false,
      error: {
        errorSource: 'native',
        stripeError: {
          name: 'StripeError',
          message: 'This reader configuration is unsupported',
          code: 'UNSUPPORTED_OPERATION',
          nativeErrorCode: 'unsupported_operation',
          metadata: REDACTED,
        },
      },
    });
  });

  it('redacts a companion SetupIntent when an error response includes both', () => {
    const logged = parsedResponse('processSetupIntent', {
      setupIntent: {
        id: 'seti_123',
        status: 'requires_payment_method',
        clientSecret: 'seti_123_secret_private',
        metadata: { orderId: 'private' },
        futureSensitiveField: 'must-not-be-logged',
      },
      error: {
        errorSource: 'native',
        stripeError: {
          name: 'StripeError',
          message: 'Setup failed',
          code: 'DECLINED_BY_STRIPE_API',
          nativeErrorCode: 'api_error',
          metadata: { private: 'value' },
        },
      },
    });

    expect(logged).toEqual({
      setupIntent: {
        id: 'seti_123',
        status: 'requires_payment_method',
        clientSecret: REDACTED,
        metadata: REDACTED,
      },
      error: {
        errorSource: 'native',
        stripeError: {
          name: 'StripeError',
          message: 'Setup failed',
          code: 'DECLINED_BY_STRIPE_API',
          nativeErrorCode: 'api_error',
          metadata: REDACTED,
        },
      },
    });
  });

  it('redacts collected input values with an exhaustive result policy', () => {
    expect(
      parsedResponse('collectInputs', {
        collectInputResults: [
          {
            skipped: false,
            formType: 'email',
            toggles: ['enabled'],
            email: 'private@example.com',
          },
        ],
      })
    ).toEqual({
      collectInputResults: [
        {
          skipped: false,
          formType: 'email',
          toggles: ['enabled'],
          email: REDACTED,
        },
      ],
    });
  });

  it('fails closed when a response cannot be inspected', () => {
    const malformed = Object.defineProperty({}, 'paymentIntent', {
      enumerable: true,
      get: () => {
        throw new Error('must not escape response redaction');
      },
    });

    expect(parsedResponse('createPaymentIntent', malformed)).toBe(REDACTED);
  });

  it('freezes the response policy registry', () => {
    expect(Object.isFrozen(RESPONSE_POLICIES)).toBe(true);
  });

  it('reuses the same model policies for requests and responses', () => {
    expect(REQUEST_POLICIES.collectPaymentMethod.fields.paymentIntent).toBe(
      RESPONSE_POLICIES.createPaymentIntent.fields.paymentIntent
    );
    expect(REQUEST_POLICIES.connectReader.fields.reader).toBe(
      RESPONSE_POLICIES.connectReader.fields.reader
    );
    expect(
      REQUEST_POLICIES.collectSetupIntentPaymentMethod.fields.setupIntent
    ).toBe(RESPONSE_POLICIES.createSetupIntent.fields.setupIntent);
  });
});

describe('response redaction policy', () => {
  it('reviews every exported API function that produces a traced response', () => {
    const functionsSource = fs.readFileSync(
      nodePath.resolve(__dirname, '../../functions.ts'),
      'utf8'
    );
    const sourceFile = ts.createSourceFile(
      'functions.ts',
      functionsSource,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );
    const apiMethods: string[] = [];

    sourceFile.forEachChild((node) => {
      if (
        ts.isFunctionDeclaration(node) &&
        node.modifiers?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
        ) &&
        node.name?.text !== 'setConnectionToken'
      ) {
        apiMethods.push(node.name!.text);
      }
    });

    expect(Object.keys(RESPONSE_POLICIES).sort()).toEqual(apiMethods.sort());
  });
});
