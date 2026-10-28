import {
  REQUEST_POLICIES,
  Rule,
  SCALAR_ARG_METHODS,
  stringifyRedactedRequest,
} from '../redactionPolicies';
import fs from 'fs';
import nodePath from 'path';
import ts from 'typescript';

const REDACTED = '<REDACTED>';
const redactedArgs = (method: string, args: readonly unknown[]) =>
  JSON.parse(stringifyRedactedRequest(method, args))['rn-args'];
const expectAllRedacted = (values: Record<string, unknown>) =>
  expect(values).toEqual(
    Object.fromEntries(Object.keys(values).map((key) => [key, REDACTED]))
  );

describe('stringifyRedactedRequest', () => {
  it('allows reviewed fields and omits unknown runtime fields', () => {
    const [request] = redactedArgs('createPaymentIntent', [
      {
        amount: 1000,
        currency: 'usd',
        captureMethod: 'automatic',
        setupFutureUsage: 'off_session',
        onBehalfOf: 'acct_123',
        transferDataDestination: 'acct_456',
        applicationFeeAmount: 100,
        customer: 'cus_123',
        transferGroup: 'order_123',
        paymentMethodOptions: {
          requestExtendedAuthorization: true,
          requestIncrementalAuthorizationSupport: true,
          requestedPriority: 'domestic',
          requestPartialAuthorization: 'if_available',
          requestReauthorization: 'if_available',
          captureMethod: 'automatic_delayed',
          captureDelayDays: 5,
        requestMulticapture: 'if_available',
        installments: { enabled: true },
        },
        offlineBehavior: 'prefer_online',
        paymentMethodTypes: ['cardPresent', 'interacPresent'],
        description: 'customer-controlled text',
        statementDescriptor: 'private descriptor',
        statementDescriptorSuffix: 'private suffix',
        receiptEmail: 'customer@example.com',
        metadata: { orderId: 'customer-controlled-key' },
        futureField: 'not reviewed',
      },
    ]);

    expect(request).toEqual({
      amount: 1000,
      currency: 'usd',
      captureMethod: 'automatic',
      setupFutureUsage: 'off_session',
      onBehalfOf: 'acct_123',
      transferDataDestination: 'acct_456',
      applicationFeeAmount: 100,
      customer: 'cus_123',
      transferGroup: 'order_123',
      paymentMethodOptions: {
        requestExtendedAuthorization: true,
        requestIncrementalAuthorizationSupport: true,
        requestedPriority: 'domestic',
        requestPartialAuthorization: 'if_available',
        requestReauthorization: 'if_available',
        captureMethod: 'automatic_delayed',
        captureDelayDays: 5,
          requestMulticapture: 'if_available',
          installments: { enabled: true },
      },
      offlineBehavior: 'prefer_online',
      paymentMethodTypes: ['cardPresent', 'interacPresent'],
      description: REDACTED,
      statementDescriptor: REDACTED,
      statementDescriptorSuffix: REDACTED,
      receiptEmail: REDACTED,
      metadata: REDACTED,
    });
    expect(request).not.toHaveProperty('futureField');
  });

  it('allows nested payment-method options on intent responses', () => {
    const responseOptions = {
      cardPresent: {
        requestExtendedAuthorization: true,
        requestIncrementalAuthorizationSupport: false,
        requestPartialAuthorization: 'if_available',
        requestReauthorization: 'never',
        futureCardPresentField: 'not reviewed',
      },
      futurePaymentMethodOptionsField: 'not reviewed',
    };
    const [paymentRequest] = redactedArgs('collectPaymentMethod', [
      { paymentIntent: { paymentMethodOptions: responseOptions } },
    ]);
    const [setupRequest] = redactedArgs('collectSetupIntentPaymentMethod', [
      { setupIntent: { paymentMethodOptions: responseOptions } },
    ]);
    const expected = {
      cardPresent: {
        requestExtendedAuthorization: true,
        requestIncrementalAuthorizationSupport: false,
        requestPartialAuthorization: 'if_available',
        requestReauthorization: 'never',
      },
    };

    expect(paymentRequest.paymentIntent.paymentMethodOptions).toEqual(expected);
    expect(setupRequest.setupIntent.paymentMethodOptions).toEqual(expected);
  });

  it('uses the method and declared request type instead of field names alone', () => {
    const [createRequest] = redactedArgs('createPaymentIntent', [
      { amount: 1000, description: 'redacted here' },
    ]);
    const [collectInputsRequest] = redactedArgs('collectInputs', [
      {
        inputs: [
          {
            formType: 'text',
            required: true,
            title: 'redacted here',
            description: 'also redacted here',
          },
        ],
      },
    ]);

    expect(createRequest.amount).toBe(1000);
    expect(createRequest.description).toBe(REDACTED);
    expect(collectInputsRequest.inputs[0]).toEqual({
      formType: 'text',
      required: true,
      title: REDACTED,
      description: REDACTED,
    });
  });

  it('matches [] against every array element', () => {
    const [request] = redactedArgs('collectInputs', [
      {
        inputs: [
          {
            formType: 'selection',
            title: 'Choose',
            selectionButtons: [
              { style: 'primary', id: 'private-id', text: 'Private choice' },
              { style: 'secondary', id: 'other-id', text: 'Other choice' },
            ],
          },
          'not-an-input-object',
          ['not', 'an', 'input'],
          null,
        ],
      },
    ]);

    expect(request.inputs[0].selectionButtons).toEqual([
      { style: 'primary', id: REDACTED, text: REDACTED },
      { style: 'secondary', id: REDACTED, text: REDACTED },
    ]);
    expect(request.inputs.slice(1)).toEqual([REDACTED, REDACTED, null]);
  });

  it('does not invoke application-provided array map methods', () => {
    const inputs = [{ formType: 'text', title: 'must-not-log' }];
    const customMap = jest.fn(() => inputs);
    Object.defineProperty(inputs, 'map', { value: customMap });

    expect(redactedArgs('collectInputs', [{ inputs }])).toEqual([
      {
        inputs: [{ formType: 'text', title: REDACTED }],
      },
    ]);
    expect(customMap).not.toHaveBeenCalled();
  });

  it('matches [] only against actual array elements', () => {
    const [validArray] = redactedArgs('connectReader', [
      {
        testReaderUpdate: {
          components: [
            'firmware',
            'config',
            { attackerKey: 'must-not-log' },
            ['nested-array-must-not-log'],
            null,
          ],
        },
      },
    ]);
    const [malformedBoundObject] = redactedArgs('connectReader', [
      {
        testReaderUpdate: [{ components: ['firmware'] }],
      },
    ]);
    const [malformedObject] = redactedArgs('collectInputs', [
      {
        inputs: {
          attackerKey: {
            formType: 'secret that must not match inputs[].formType',
          },
        },
      },
    ]);

    expect(validArray.testReaderUpdate.components).toEqual([
      'firmware',
      'config',
      REDACTED,
      REDACTED,
      null,
    ]);
    expect(malformedBoundObject.testReaderUpdate).toBe(REDACTED);
    expect(malformedObject).toEqual({
      inputs: REDACTED,
    });
  });

  it('explicitly classifies reader fields and connection callbacks', () => {
    const [request] = redactedArgs('connectReader', [
      {
        discoveryMethod: 'bluetoothScan',
        locationId: 'tml_123',
        reader: {
          id: 'tmr_123',
          serialNumber: 'CHB123',
          label: 'Front desk',
          ipAddress: '192.0.2.1',
          location: { id: 'tml_123', displayName: 'Private shop name' },
          status: 'online',
          deviceType: 'chipper1X',
          locationStatus: 'set',
          batteryStatus: 'nominal',
        },
        onPaymentMethodSelectionRequired: () => undefined,
        onQrCodeDisplayRequired: () => undefined,
        attackerKey: 'must-not-log',
      },
    ]);

    expect(request).toEqual({
      discoveryMethod: 'bluetoothScan',
      locationId: 'tml_123',
      reader: {
        id: 'tmr_123',
        serialNumber: 'CHB123',
        label: REDACTED,
        ipAddress: REDACTED,
        location: REDACTED,
        status: 'online',
        deviceType: 'chipper1X',
        locationStatus: 'set',
        batteryStatus: 'nominal',
      },
      onPaymentMethodSelectionRequired: REDACTED,
      onQrCodeDisplayRequired: REDACTED,
    });
  });

  it('uses v6 Tap to Pay UX configuration field names', () => {
    const [request] = redactedArgs('setTapToPayUxConfiguration', [
      {
        theme: 'system',
        colorScheme: {
          primary: '#112233',
          success: '#445566',
          error: '#778899',
          attackerKey: 'must-not-log',
        },
        darkMode: 'light',
        colors: { primary: '#000000' },
      },
    ]);

    expect(request).toEqual({
      theme: 'system',
      colorScheme: {
        primary: '#112233',
        success: '#445566',
        error: '#778899',
      },
    });
  });

  it('uses Proto-first policy plus Android @Redacted for an embedded PaymentIntent', () => {
    const [request] = redactedArgs('collectPaymentMethod', [
      {
        paymentIntent: {
          application: 'ca_test',
          clientSecret: 'pi_123_secret_abc',
          metadata: { orderId: '123' },
          description: 'customer-controlled description',
          statementDescriptor: 'private descriptor',
          statementDescriptorSuffix: 'private suffix',
          latestChargeId: 'ch_latest',
          review: 'prv_test',
          paymentMethodId: 'pm_123',
          paymentMethod: {
            id: 'pm_123',
            type: 'cardPresent',
            livemode: false,
            metadata: { orderId: 'private' },
            cardPresentDetails: {
              brand: 'visa',
              brandProduct: 'visa_signature',
              last4: '4242',
              expMonth: 12,
              cardholderName: 'Private Name',
              iin: '424242',
              networks: {
                available: ['visa', 'cartes_bancaires'],
                preferred: 'visa',
              },
              paymentAccountReference: 'private-par',
              readMethod: 'contact_emv',
            },
          },
          offlineDetails: {
            storedAtMs: '1724659200000',
            requiresUpload: true,
            cardPresentDetails: {
              brand: 'visa',
              last4: '4242',
              readMethod: 'contactEmv',
              expMonth: 12,
              expYear: 2030,
              cardholderName: 'Private Name',
              receiptDetails: {
                authorizationCode: '123456',
                applicationCryptogram: 'private-cryptogram',
              },
            },
            amountDetails: { tip: { amount: 200 } },
          },
          latestCharge: {
            generatedFrom: {
              charge: 'ch_source',
              paymentMethodDetails: {
                cardPresentDetails: {
                  last4: '4242',
                  expMonth: '12',
                  expYear: '2030',
                  readMethod: 'contact_emv',
                  cardholderName: 'Private Name',
                  emvAuthData: 'private-emv-data',
                  paymentAccountReference: 'private-charge-par',
                  receipt: {
                    applicationCryptogram: 'private-cryptogram',
                    authorizationCode: '123456',
                  },
                },
                cardDetails: {
                  authorizationCode: 'moto_auth_code',
                  expMonth: 12,
                  expYear: 2030,
                  last4: '4242',
                  generatedFrom: {
                    charge: 'ch_nested',
                    paymentMethodDetails: { type: 'cardPresent' },
                  },
                },
              },
            },
            description: 'private charge description',
            metadata: { orderId: '123' },
            receiptEmail: 'customer@example.com',
          },
          lastPaymentError: {
            code: 'card_declined',
            type: 'card_error',
            paymentMethodType: 'cardPresent',
            paymentMethod: { id: 'pm_private' },
          },
        },
        skipTipping: true,
        surchargeNotice: 'customer-facing text',
      },
    ]);

    const paymentIntent = request.paymentIntent;
    const charge = paymentIntent.latestCharge;
    const generatedDetails = charge.generatedFrom.paymentMethodDetails;
    const cardPresent = generatedDetails.cardPresentDetails;
    const cardDetails = generatedDetails.cardDetails;

    expect(charge.generatedFrom.charge).toBe('ch_source');
    expect(cardPresent.readMethod).toBe('contact_emv');
    expect(cardPresent.receipt.authorizationCode).toBe('123456');
    expect(cardDetails.authorizationCode).toBe('moto_auth_code');
    expect(cardDetails.generatedFrom.charge).toBe('ch_nested');
    expect(paymentIntent.lastPaymentError.code).toBe('card_declined');
    expect(paymentIntent.lastPaymentError.type).toBe('card_error');
    expect(paymentIntent.lastPaymentError.paymentMethodType).toBe(
      'cardPresent'
    );
    expect(paymentIntent.lastPaymentError.paymentMethod.id).toBe('pm_private');
    expect(paymentIntent.paymentMethodId).toBe('pm_123');
    expect(paymentIntent.application).toBe('ca_test');
    expect(paymentIntent.latestChargeId).toBe('ch_latest');
    expect(paymentIntent.review).toBe('prv_test');
    expect(paymentIntent.paymentMethod.id).toBe('pm_123');
    expect(paymentIntent.paymentMethod.cardPresentDetails.brandProduct).toBe(
      'visa_signature'
    );
    expect(paymentIntent.paymentMethod.cardPresentDetails.networks).toEqual({
      available: ['visa', 'cartes_bancaires'],
      preferred: 'visa',
    });
    expect(paymentIntent.paymentMethod.cardPresentDetails.readMethod).toBe(
      'contact_emv'
    );
    expect(paymentIntent.offlineDetails.storedAtMs).toBe('1724659200000');
    expect(paymentIntent.offlineDetails.requiresUpload).toBe(true);
    expect(
      paymentIntent.offlineDetails.cardPresentDetails.receiptDetails
        .authorizationCode
    ).toBe('123456');
    expect(paymentIntent.offlineDetails.amountDetails.tip.amount).toBe(200);
    expectAllRedacted({
      clientSecret: paymentIntent.clientSecret,
      paymentIntentMetadata: paymentIntent.metadata,
      paymentIntentDescription: paymentIntent.description,
      statementDescriptor: paymentIntent.statementDescriptor,
      statementDescriptorSuffix: paymentIntent.statementDescriptorSuffix,
      cardPresentLast4: cardPresent.last4,
      cardPresentExpMonth: cardPresent.expMonth,
      cardPresentExpYear: cardPresent.expYear,
      cardholderName: cardPresent.cardholderName,
      emvAuthData: cardPresent.emvAuthData,
      applicationCryptogram: cardPresent.receipt.applicationCryptogram,
      cardExpMonth: cardDetails.expMonth,
      cardExpYear: cardDetails.expYear,
      cardLast4: cardDetails.last4,
      recursivePaymentMethodDetails:
        cardDetails.generatedFrom.paymentMethodDetails,
      chargeDescription: charge.description,
      chargeMetadata: charge.metadata,
      receiptEmail: charge.receiptEmail,
      surchargeNotice: request.surchargeNotice,
      paymentMethodMetadata: paymentIntent.paymentMethod.metadata,
      paymentMethodLast4: paymentIntent.paymentMethod.cardPresentDetails.last4,
      paymentMethodIin: paymentIntent.paymentMethod.cardPresentDetails.iin,
      paymentMethodExpMonth:
        paymentIntent.paymentMethod.cardPresentDetails.expMonth,
      paymentMethodAccountReference:
        paymentIntent.paymentMethod.cardPresentDetails.paymentAccountReference,
      chargePaymentAccountReference: cardPresent.paymentAccountReference,
      offlineLast4: paymentIntent.offlineDetails.cardPresentDetails.last4,
      offlineExpMonth: paymentIntent.offlineDetails.cardPresentDetails.expMonth,
      offlineExpYear: paymentIntent.offlineDetails.cardPresentDetails.expYear,
      offlineCardholderName:
        paymentIntent.offlineDetails.cardPresentDetails.cardholderName,
      offlineApplicationCryptogram:
        paymentIntent.offlineDetails.cardPresentDetails.receiptDetails
          .applicationCryptogram,
    });
    expect(request.skipTipping).toBe(true);
  });

  it('uses Proto-first policy plus explicit native redaction for setup intents and refunds', () => {
    const [setupIntent] = redactedArgs('createSetupIntent', [
      {
        customer: 'cus_123',
        usage: 'offSession',
        description: 'private description',
        onBehalfOf: 'acct_123',
        paymentMethodTypes: ['card'],
        metadata: { orderId: 'private' },
      },
    ]);
    const [refund] = redactedArgs('processRefund', [
      {
        chargeId: 'ch_123',
        paymentIntentId: 'pi_123',
        amount: 1000,
        currency: 'usd',
        refundApplicationFee: true,
        reverseTransfer: true,
        customerCancellation: true,
        clientSecret: 'pi_123_secret_abc',
      },
    ]);

    expect(setupIntent).toEqual({
      customer: 'cus_123',
      usage: 'offSession',
      description: REDACTED,
      onBehalfOf: 'acct_123',
      paymentMethodTypes: ['card'],
      metadata: REDACTED,
    });
    expect(refund).toEqual({
      chargeId: 'ch_123',
      paymentIntentId: 'pi_123',
      amount: 1000,
      currency: 'usd',
      refundApplicationFee: true,
      reverseTransfer: true,
      customerCancellation: true,
      clientSecret: REDACTED,
    });
  });

  it('reuses the shared ApiErrorInformation policy throughout SetupIntent', () => {
    const [request] = redactedArgs('collectSetupIntentPaymentMethod', [
      {
        setupIntent: {
          id: 'seti_123',
          sdkUuid: 'local-uuid',
          nextAction: {
            type: 'redirectToUrl',
            redirectToUrl: {
              url: 'https://example.com/auth',
              returnUrl: 'my-app://return',
            },
            wechatPayDisplayQrCode: {
              data: 'setup-intents-do-not-define-this-field',
            },
          },
          clientSecret: 'seti_123_secret_abc',
          description: 'customer-controlled description',
          metadata: { orderId: '123' },
          paymentMethod: {
            id: 'pm_123',
            type: 'cardPresent',
            metadata: { private: 'value' },
            cardPresentDetails: {
              brand: 'visa',
              brandProduct: 'visa_signature',
              last4: '4242',
              expMonth: 12,
              paymentAccountReference: 'private-par',
              readMethod: 'contact_emv',
            },
          },
          latestAttempt: {
            id: 'setatt_123',
            status: 'succeeded',
            paymentMethodDetails: {
              type: 'cardPresent',
              cardPresent: {
                generatedCard: 'pm_generated',
                emvAuthData: 'private-emv-data',
              },
            },
            setupError: {
              code: 'card_declined',
              message: 'The card was declined',
              type: 'card_error',
              charge: 'ch_not_defined_on_setup_error',
              requestLogUrl: 'https://example.com/request-log',
              paymentMethodType: 'cardPresent',
              localizationResult: {
                requestedLocale: 'en',
                resolvedLocale: 'en-US',
              },
              paymentMethod: {
                id: 'pm_private',
                type: 'cardPresent',
                metadata: { private: 'value' },
                cardPresentDetails: {
                  brand: 'visa',
                  last4: '4242',
                  cardholderName: 'Private Name',
                  readMethod: 'contact_emv',
                },
              },
            },
          },
          lastSetupError: {
            code: 'card_declined',
            message: 'The card was declined',
            type: 'card_error',
            paymentMethodType: 'cardPresent',
            paymentMethod: { id: 'pm_private' },
          },
        },
      },
    ]);

    const setupIntent = request.setupIntent;
    const paymentMethod = setupIntent.paymentMethod;
    const latestAttempt = setupIntent.latestAttempt;
    const setupError = latestAttempt.setupError;

    expect(setupIntent.id).toBe('seti_123');
    expect(setupIntent.sdkUuid).toBe('local-uuid');
    expect(setupIntent.nextAction.redirectToUrl.url).toBe(
      'https://example.com/auth'
    );
    expect(paymentMethod.id).toBe('pm_123');
    expect(paymentMethod.cardPresentDetails.brandProduct).toBe(
      'visa_signature'
    );
    expect(paymentMethod.cardPresentDetails.readMethod).toBe('contact_emv');
    expect(setupError.code).toBe('card_declined');
    expect(setupError.type).toBe('card_error');
    expect(setupError.charge).toBe('ch_not_defined_on_setup_error');
    expect(setupError.requestLogUrl).toBe(
      'https://example.com/request-log'
    );
    expect(setupError.localizationResult).toEqual({
      requestedLocale: 'en',
      resolvedLocale: 'en-US',
    });
    expect(setupError.paymentMethodType).toBe('cardPresent');
    expect(setupError.paymentMethod.id).toBe('pm_private');
    expect(setupIntent.lastSetupError.code).toBe('card_declined');
    expect(setupIntent.lastSetupError.type).toBe('card_error');
    expect(setupIntent.lastSetupError.paymentMethodType).toBe('cardPresent');
    expect(setupIntent.lastSetupError.paymentMethod.id).toBe('pm_private');
    expectAllRedacted({
      setupOnlyWechatQrCode:
        setupIntent.nextAction.wechatPayDisplayQrCode,
      clientSecret: setupIntent.clientSecret,
      setupIntentDescription: setupIntent.description,
      setupIntentMetadata: setupIntent.metadata,
      paymentMethodMetadata: paymentMethod.metadata,
      paymentMethodLast4: paymentMethod.cardPresentDetails.last4,
      paymentMethodExpMonth: paymentMethod.cardPresentDetails.expMonth,
      paymentMethodAccountReference:
        paymentMethod.cardPresentDetails.paymentAccountReference,
      setupAttemptEmvAuthData:
        latestAttempt.paymentMethodDetails.cardPresent.emvAuthData,
      setupAttemptGeneratedCard:
        latestAttempt.paymentMethodDetails.cardPresent.generatedCard,
      setupErrorPaymentMethodMetadata: setupError.paymentMethod.metadata,
      setupErrorLast4: setupError.paymentMethod.cardPresentDetails.last4,
      setupErrorCardholderName:
        setupError.paymentMethod.cardPresentDetails.cardholderName,
    });
  });

  it('redacts all non-null positional request arguments', () => {
    expect(
      redactedArgs('retrievePaymentIntent', ['pi_123_secret_abc'])
    ).toEqual([REDACTED]);
    expect(
      redactedArgs('retrieveSetupIntent', ['seti_123_secret_abc'])
    ).toEqual([REDACTED]);
    expect(
      redactedArgs('failPaymentMethodSelection', [
        'Customer email: private@example.com',
      ])
    ).toEqual([REDACTED]);
    expect(
      redactedArgs('failQrCodeDisplay', [
        'Customer email: private@example.com',
      ])
    ).toEqual([REDACTED]);
    expect(redactedArgs('selectPaymentOption', ['card'])).toEqual([REDACTED]);
    expect(redactedArgs('setSimulatedOfflineMode', [true])).toEqual([
      REDACTED,
    ]);
    expect(
      redactedArgs('setSimulatedCollectInputsResult', ['succeed'])
    ).toEqual([REDACTED]);
    expect(redactedArgs('print', ['base64-image-data'])).toEqual([REDACTED]);
    expect(redactedArgs('retrievePaymentIntent', [null])).toEqual([null]);
  });

  it('allows the reviewed buzzer volume reader settings paths', () => {
    expect(
      redactedArgs('setReaderSettings', [
        { buzzerVolume: { level: 'custom', volume: 3 } },
      ])
    ).toEqual([{ buzzerVolume: { level: 'custom', volume: 3 } }]);
  });

  it('does not confuse malformed scalar arguments with object requests', () => {
    expect(
      redactedArgs('selectPaymentOption', [
        { paymentOptionType: 'must-not-match-the-scalar-path' },
      ])
    ).toEqual([REDACTED]);
    expect(
      redactedArgs('setSimulatedOfflineMode', [{ simulatedOffline: true }])
    ).toEqual([REDACTED]);
    expect(
      redactedArgs('setSimulatedCollectInputsResult', [
        { simulatedCollectInputsBehavior: 'must-not-log' },
      ])
    ).toEqual([REDACTED]);
    expect(redactedArgs('selectPaymentOption', ['card', 'extra'])).toEqual([
      REDACTED,
      REDACTED,
    ]);
    expect(
      redactedArgs('getLocations', [{ limit: 1 }, { limit: 2 }])
    ).toEqual([REDACTED, REDACTED]);
  });

  it('fails closed for malformed scalar field shapes and preserves empty values', () => {
    const [request] = redactedArgs('createPaymentIntent', [
      {
        amount: { attackerKey: 1000 },
        currency: ['usd'],
        metadata: null,
        description: undefined,
      },
    ]);

    expect(request).toEqual({
      amount: REDACTED,
      currency: REDACTED,
      metadata: null,
    });
  });

  it.each(['newUnreviewedApi', 'constructor', 'toString', '__proto__'])(
    'fails closed for unreviewed method %s',
    (method) => {
      expect(redactedArgs(method, [{ safe: true }])).toEqual([REDACTED]);
    }
  );

  it('omits prototype-named fields that have no policy rule', () => {
    expect(
      redactedArgs('createPaymentIntent', [
        {
          amount: 1000,
          constructor: { attackerKey: 'must-not-log' },
          toString: { attackerKey: 'must-not-log' },
          ['__proto__']: { attackerKey: 'must-not-log' },
        },
      ])
    ).toEqual([{ amount: 1000 }]);
  });

  it.each([
    ['a non-JSON primitive', { amount: BigInt(1000) }],
    [
      'a throwing getter',
      Object.defineProperty({}, 'amount', {
        enumerable: true,
        get: () => {
          throw new Error('must not escape request redaction');
        },
      }),
    ],
  ])('falls back to a fully redacted request for %s', (_name, request) => {
    expect(redactedArgs('createPaymentIntent', [request])).toEqual([
      REDACTED,
    ]);
  });

  it('uses the RN-specific empty args envelope for methods without request arguments', () => {
    expect(
      JSON.parse(stringifyRedactedRequest('disconnectReader', []))
    ).toEqual({
      'rn-args': [],
    });
  });

});

describe('request redaction policy', () => {
  it('reviews every traced API that passes request arguments', () => {
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
    const tracedMethodsWithArguments: string[] = [];
    const visit = (node: ts.Node): void => {
      if (
        ts.isCallExpression(node) &&
        ts.isCallExpression(node.expression) &&
        node.arguments.length > 0
      ) {
        const traceCall = node.expression;
        if (
          ts.isPropertyAccessExpression(traceCall.expression) &&
          traceCall.expression.name.text === 'traceSdkMethod'
        ) {
          const methodName = traceCall.arguments[1];
          if (methodName && ts.isStringLiteral(methodName)) {
            tracedMethodsWithArguments.push(methodName.text);
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);

    const reviewedMethods = [
      ...Object.keys(REQUEST_POLICIES),
      ...SCALAR_ARG_METHODS,
    ];
    expect(new Set(reviewedMethods).size).toBe(reviewedMethods.length);
    expect(tracedMethodsWithArguments.sort()).toEqual(reviewedMethods.sort());
  });

  it('freezes every reachable rule and policy', () => {
    type RuntimeRule = {
      readonly kind: string;
      readonly fields?: Readonly<Record<string, unknown>>;
      readonly element?: unknown;
    };
    const visited = new Set<RuntimeRule>();
    const visitRule = (rule: RuntimeRule): void => {
      if (visited.has(rule)) return;
      visited.add(rule);
      expect(Object.isFrozen(rule)).toBe(true);

      if (rule.fields) {
        expect(Object.isFrozen(rule.fields)).toBe(true);
        Object.values(rule.fields).forEach((fieldRule) =>
          visitRule(fieldRule as RuntimeRule)
        );
      }
      if (rule.element) visitRule(rule.element as RuntimeRule);
    };

    expect(Object.isFrozen(Rule)).toBe(true);
    expect(Object.isFrozen(Rule.allow)).toBe(true);
    expect(Object.isFrozen(Rule.redact)).toBe(true);
    expect(Object.isFrozen(REQUEST_POLICIES)).toBe(true);
    Object.values(REQUEST_POLICIES).forEach((root) => visitRule(root));
  });
});
