jest.mock('../logger', () => ({
  __esModule: true,
  default: {
    setLogLevel: () => {},
    traceSdkMethod: (fn: (...args: any[]) => any | Promise<any>) => {
      return function (this: any, ...args: any[]) {
        const response = fn.apply(this, args);
        return response;
      };
    },
  },
}));

const mockReader = {
  id: 1,
  label: '_reader',
  batteryLevel: 99,
  serialNumber: '_serial',
};

const mockPaymentIntent = {
  id: 1,
  amount: 33,
  currency: 'USD',
};

const mockLastPaymentError = {
  code: 'card_declined',
  message: 'Your card was declined.',
  declineCode: 'generic_decline',
  type: 'card_error',
  charge: 'ch_123',
  docUrl: 'https://stripe.com/docs/error-codes/card-declined',
  param: 'card_number',
};

const mockPaymentIntentWithLastPaymentError = {
  ...mockPaymentIntent,
  lastPaymentError: mockLastPaymentError,
};

const mockSetupIntent = {
  id: 2,
  status: 'succeeded',
};

const mockLastSetupError = {
  code: 'setup_intent_authentication_failure',
  message: 'The setup failed because authentication failed.',
  declineCode: 'authentication_required',
  type: 'invalid_request_error',
};

const mockSetupIntentWithLastSetupError = {
  ...mockSetupIntent,
  lastSetupError: mockLastSetupError,
};

const mockRefund = {
  id: 4,
  amount: 502,
  chargeId: '_chargeId',
};

const mockLocations = [
  {
    id: 5,
    displayName: 'loc_01',
  },
  {
    id: 6,
    displayName: 'loc_02',
  },
];

describe('functions.test.ts', () => {
  describe('Functions snapshot', () => {
    it('ensure there are no unexpected changes to the functions exports', () => {
      expect(require('../functions')).toMatchSnapshot();
    });
  });

  describe('Functions success results', () => {
    beforeAll(() => {
      jest.resetModules();
      jest.mock('../StripeTerminalSdk', () => ({
        initialize: jest.fn().mockImplementation(() => ({
          reader: mockReader,
        })),
        setConnectionToken: jest.fn(),
        disconnectReader: jest.fn(),
        rebootReader: jest.fn(),
        clearCachedCredentials: jest.fn().mockImplementation(() => ({})),

        discoverReaders: jest.fn().mockImplementation(() => ({})),
        cancelDiscovering: jest.fn().mockImplementation(() => ({})),
        connectReader: jest
          .fn()
          .mockImplementation(() => ({ reader: mockReader })),
        createPaymentIntent: jest
          .fn()
          .mockImplementation(() => ({ paymentIntent: mockPaymentIntent })),
        collectPaymentMethod: jest
          .fn()
          .mockImplementation(() => ({ paymentIntent: mockPaymentIntent })),
        retrievePaymentIntent: jest
          .fn()
          .mockImplementation(() => ({ paymentIntent: mockPaymentIntent })),
        getLocations: jest.fn().mockImplementation(() => ({
          locations: mockLocations,
          hasMore: true,
        })),
        confirmPaymentIntent: jest
          .fn()
          .mockImplementation(() => ({ paymentIntent: mockPaymentIntent })),
        processPaymentIntent: jest
          .fn()
          .mockImplementation(() => ({ paymentIntent: mockPaymentIntent })),
        createSetupIntent: jest
          .fn()
          .mockImplementation(() => ({ setupIntent: mockSetupIntent })),
        cancelPaymentIntent: jest
          .fn()
          .mockImplementation(() => ({ paymentIntent: mockPaymentIntent })),
        installAvailableUpdate: jest.fn().mockImplementation(() => ({})),
        cancelInstallingUpdate: jest.fn().mockImplementation(() => ({})),
        setReaderDisplay: jest.fn().mockImplementation(() => ({})),
        clearReaderDisplay: jest.fn().mockImplementation(() => ({})),
        retrieveSetupIntent: jest
          .fn()
          .mockImplementation(() => ({ setupIntent: mockSetupIntent })),
        collectSetupIntentPaymentMethod: jest
          .fn()
          .mockImplementation(() => ({ setupIntent: mockSetupIntent })),
        cancelSetupIntent: jest
          .fn()
          .mockImplementation(() => ({ setupIntent: mockSetupIntent })),
        confirmSetupIntent: jest
          .fn()
          .mockImplementation(() => ({ setupIntent: mockSetupIntent })),
        processRefund: jest
          .fn()
          .mockImplementation(() => ({ refund: mockRefund })),
        cancelCollectPaymentMethod: jest.fn().mockImplementation(() => ({})),
        cancelProcessRefund: jest.fn().mockImplementation(() => ({})),
        cancelCollectSetupIntent: jest.fn().mockImplementation(() => ({})),
        setSimulatedCard: jest.fn().mockImplementation(() => ({})),
        print: jest.fn().mockImplementation(() => ({})),
      }));
    });

    it('initialize returns a proper value', async () => {
      const functions = require('../functions');
      await expect(
        functions.initialize({
          initParams: { logLevel: 'verbose' },
          useAppsOnDevicesConnectionTokenProvider: false,
        })
      ).resolves.toEqual({
        reader: mockReader,
      });
    });

    it('initialize passes localeConfig to the native bridge', async () => {
      const functions = require('../functions');
      const StripeTerminalSdk = require('../StripeTerminalSdk');
      const localeConfig = { type: 'hardcoded', locale: 'fr-FR' };

      await functions.initialize({
        initParams: { logLevel: 'verbose', localeConfig },
        useAppsOnDevicesConnectionTokenProvider: false,
      });

      expect(StripeTerminalSdk.initialize).toHaveBeenCalledWith({
        reactNativeVersion: expect.any(String),
        logLevel: 'verbose',
        localeConfig,
        useAppsOnDevicesConnectionTokenProvider: false,
      });
    });

    it('initialize passes card language preference localeConfig to the native bridge', async () => {
      const functions = require('../functions');
      const StripeTerminalSdk = require('../StripeTerminalSdk');
      const localeConfig = { type: 'cardLanguagePreferenceIfAvailable' };

      await functions.initialize({
        initParams: { logLevel: 'verbose', localeConfig },
        useAppsOnDevicesConnectionTokenProvider: false,
      });

      expect(StripeTerminalSdk.initialize).toHaveBeenCalledWith({
        reactNativeVersion: expect.any(String),
        logLevel: 'verbose',
        localeConfig,
        useAppsOnDevicesConnectionTokenProvider: false,
      });
    });

    it('initialize returns an error for invalid localeConfig type', async () => {
      const functions = require('../functions');
      const StripeTerminalSdk = require('../StripeTerminalSdk');
      StripeTerminalSdk.initialize.mockClear();

      const result = await functions.initialize({
        initParams: {
          logLevel: 'verbose',
          localeConfig: { type: 'unknown' },
        },
        useAppsOnDevicesConnectionTokenProvider: false,
      } as any);

      expect(result.reader).toBeUndefined();
      expect(result.error?.code).toBe('INVALID_REQUIRED_PARAMETER');
      expect(result.error?.message).toBe(
        "Invalid localeConfig.type. Expected 'hardcoded' or 'cardLanguagePreferenceIfAvailable'."
      );
      expect(StripeTerminalSdk.initialize).not.toHaveBeenCalled();
    });

    it('setConnectionToken returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.setConnectionToken()).resolves.toEqual(undefined);
    });

    it('discoverReaders returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.discoverReaders({} as any)).resolves.toEqual({
        error: undefined,
      });
    });

    it('cancelDiscovering returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.cancelDiscovering()).resolves.toEqual({
        error: undefined,
      });
    });

    it('connectReader returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.connectReader({} as any)).resolves.toEqual({
        error: undefined,
        reader: mockReader,
      });
    });

    it('createPaymentIntent returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.createPaymentIntent({} as any)).resolves.toEqual({
        error: undefined,
        paymentIntent: mockPaymentIntent,
      });
    });

    it('collectPaymentMethod returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.collectPaymentMethod({} as any)).resolves.toEqual({
        error: undefined,
        paymentIntent: mockPaymentIntent,
      });
    });

    it('retrievePaymentIntent returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.retrievePaymentIntent({} as any)).resolves.toEqual(
        {
          error: undefined,
          paymentIntent: mockPaymentIntent,
        }
      );
    });

    it('getLocations returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.getLocations({} as any)).resolves.toEqual({
        locations: mockLocations,
        hasMore: true,
        error: undefined,
      });
    });

    it('confirmPaymentIntent returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.confirmPaymentIntent({} as any)).resolves.toEqual({
        error: undefined,
        paymentIntent: mockPaymentIntent,
      });
    });

    it('processPaymentIntent returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.processPaymentIntent({} as any)).resolves.toEqual({
        error: undefined,
        paymentIntent: mockPaymentIntent,
      });
    });

    it('createSetupIntent returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.createSetupIntent({} as any)).resolves.toEqual({
        error: undefined,
        setupIntent: mockSetupIntent,
      });
    });

    it('cancelPaymentIntent returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.cancelPaymentIntent('_id')).resolves.toEqual({
        error: undefined,
        paymentIntent: mockPaymentIntent,
      });
    });

    it('installAvailableUpdate returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.installAvailableUpdate()).resolves.toEqual({});
    });

    it('cancelInstallingUpdate returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.cancelInstallingUpdate()).resolves.toEqual({});
    });

    it('setReaderDisplay returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.setReaderDisplay({} as any)).resolves.toEqual({
        error: undefined,
      });
    });

    it('clearReaderDisplay returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.clearReaderDisplay()).resolves.toEqual({
        error: undefined,
      });
    });

    it('retrieveSetupIntent returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.retrieveSetupIntent('')).resolves.toEqual({
        error: undefined,
        setupIntent: mockSetupIntent,
      });
    });

    it('collectSetupIntentPaymentMethod returns a proper value', async () => {
      const functions = require('../functions');
      await expect(
        functions.collectSetupIntentPaymentMethod({} as any)
      ).resolves.toEqual({
        error: undefined,
        setupIntent: mockSetupIntent,
      });
    });

    it('cancelSetupIntent returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.cancelSetupIntent('')).resolves.toEqual({
        error: undefined,
        setupIntent: mockSetupIntent,
      });
    });

    it('confirmSetupIntent returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.confirmSetupIntent('_secret')).resolves.toEqual({
        error: undefined,
        setupIntent: mockSetupIntent,
      });
    });

    it('processRefund returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.processRefund({})).resolves.toEqual({
        error: undefined,
        refund: mockRefund,
      });
    });

    it('clearCachedCredentials returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.clearCachedCredentials()).resolves.toEqual({});
    });

    it('cancelCollectPaymentMethod returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.cancelCollectPaymentMethod()).resolves.toEqual({});
    });

    it('cancelProcessRefund returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.cancelProcessRefund()).resolves.toEqual({});
    });

    it('cancelCollectSetupIntent returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.cancelCollectSetupIntent()).resolves.toEqual({});
    });

    it('setSimulatedCard returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.setSimulatedCard('_number')).resolves.toEqual({});
    });

    it('print returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.print({} as any)).resolves.toEqual({});
    });
  });

  describe('Functions error results', () => {
    const mockBridgeError = {
      code: 'CANCELED',
      message: 'The operation was canceled.',
      nativeErrorCode: 'canceled',
      metadata: {},
    };

    function expectStripeError(error: any) {
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('StripeError');
      expect(error.code).toBe('CANCELED');
      expect(error.message).toBe('The operation was canceled.');
    }

    beforeAll(() => {
      jest.resetModules();
      const resolve = () => ({ error: mockBridgeError });
      const reject = mockBridgeError;
      jest.mock('../StripeTerminalSdk', () => ({
        discoverReaders: jest.fn().mockImplementation(resolve),
        cancelDiscovering: jest.fn().mockImplementation(resolve),
        connectReader: jest.fn().mockImplementation(resolve),
        disconnectReader: jest.fn().mockImplementation(resolve),
        rebootReader: jest.fn().mockImplementation(resolve),
        createPaymentIntent: jest.fn().mockImplementation(resolve),
        collectPaymentMethod: jest.fn().mockImplementation(resolve),
        retrievePaymentIntent: jest.fn().mockImplementation(resolve),
        getLocations: jest.fn().mockImplementation(resolve),
        confirmPaymentIntent: jest.fn().mockImplementation(resolve),
        processPaymentIntent: jest.fn().mockImplementation(resolve),
        createSetupIntent: jest.fn().mockImplementation(resolve),
        cancelPaymentIntent: jest.fn().mockImplementation(resolve),
        setReaderDisplay: jest.fn().mockImplementation(resolve),
        clearReaderDisplay: jest.fn().mockImplementation(resolve),
        retrieveSetupIntent: jest.fn().mockImplementation(resolve),
        collectSetupIntentPaymentMethod: jest.fn().mockImplementation(resolve),
        cancelSetupIntent: jest.fn().mockImplementation(resolve),
        confirmSetupIntent: jest.fn().mockImplementation(resolve),
        processRefund: jest.fn().mockImplementation(resolve),
        cancelCollectSetupIntent: jest.fn().mockImplementation(resolve),
        cancelReadReusableCard: jest.fn().mockImplementation(resolve),
        print: jest.fn().mockImplementation(resolve),
        clearCachedCredentials: jest.fn().mockRejectedValue(reject),
        cancelProcessRefund: jest.fn().mockRejectedValue(reject),
        cancelCollectPaymentMethod: jest.fn().mockRejectedValue(reject),
        setSimulatedCard: jest.fn().mockRejectedValue(reject),
        cancelInstallingUpdate: jest.fn().mockRejectedValue(reject),
        installAvailableUpdate: jest.fn().mockRejectedValue(reject),
        initialize: jest.fn().mockImplementation(resolve),
      }));
    });

    it('initialize returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.initialize({
        initParams: { logLevel: 'verbose' },
        useAppsOnDevicesConnectionTokenProvider: false,
      });
      expectStripeError(result.error);
    });

    it('discoverReaders returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.discoverReaders({} as any);
      expectStripeError(result.error);
    });

    it('cancelDiscovering returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.cancelDiscovering();
      expectStripeError(result.error);
    });

    it('connectReader returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.connectReader({} as any);
      expectStripeError(result.error);
    });

    it('createPaymentIntent returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.createPaymentIntent({} as any);
      expectStripeError(result.error);
    });

    it('collectPaymentMethod returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.collectPaymentMethod({} as any);
      expectStripeError(result.error);
    });

    it('retrievePaymentIntent returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.retrievePaymentIntent({} as any);
      expectStripeError(result.error);
    });

    it('getLocations returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.getLocations({} as any);
      expectStripeError(result.error);
      expect(result.locations).toBeUndefined();
      expect(result.hasMore).toBeUndefined();
    });

    it('confirmPaymentIntent returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.confirmPaymentIntent({} as any);
      expectStripeError(result.error);
    });

    it('processPaymentIntent returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.processPaymentIntent({} as any);
      expectStripeError(result.error);
    });

    it('createSetupIntent returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.createSetupIntent({} as any);
      expectStripeError(result.error);
    });

    it('cancelPaymentIntent returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.cancelPaymentIntent('_id');
      expectStripeError(result.error);
    });

    it('setReaderDisplay returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.setReaderDisplay({} as any);
      expectStripeError(result.error);
    });

    it('clearReaderDisplay returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.clearReaderDisplay();
      expectStripeError(result.error);
    });

    it('retrieveSetupIntent returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.retrieveSetupIntent('');
      expectStripeError(result.error);
      expect(result.setupIntent).toBeUndefined();
    });

    it('collectSetupIntentPaymentMethod returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.collectSetupIntentPaymentMethod(
        {} as any
      );
      expectStripeError(result.error);
      expect(result.setupIntent).toBeUndefined();
    });

    it('cancelSetupIntent returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.cancelSetupIntent('');
      expectStripeError(result.error);
      expect(result.setupIntent).toBeUndefined();
    });

    it('confirmSetupIntent returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.confirmSetupIntent('_secret');
      expectStripeError(result.error);
      expect(result.setupIntent).toBeUndefined();
    });

    it('processRefund returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.processRefund();
      expectStripeError(result.error);
      expect(result.refund).toBeUndefined();
    });

    it('clearCachedCredentials returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.clearCachedCredentials();
      expectStripeError(result.error);
    });

    it('cancelProcessRefund returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.cancelProcessRefund();
      expectStripeError(result.error);
    });

    it('cancelInstallingUpdate returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.cancelInstallingUpdate();
      expectStripeError(result.error);
    });

    it('setSimulatedCard returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.setSimulatedCard('_number');
      expectStripeError(result.error);
    });

    it('installAvailableUpdate returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.installAvailableUpdate();
      expectStripeError(result.error);
    });

    it('print returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.print({} as any);
      expectStripeError(result.error);
    });
  });

  describe('callBridge error rehydration behavior', () => {
    beforeAll(() => {
      jest.resetModules();
      jest.mock('../StripeTerminalSdk', () => ({
        discoverReaders: jest.fn().mockImplementation(() => ({})),
        createPaymentIntent: jest
          .fn()
          .mockImplementation(() => ({ paymentIntent: { id: 'pi_123' } })),
        clearCachedCredentials: jest.fn().mockResolvedValue(undefined),
        cancelInstallingUpdate: jest
          .fn()
          .mockRejectedValue(new TypeError('Network request failed')),
      }));
    });

    it('success path returns error as undefined, not an Error instance', async () => {
      const functions = require('../functions');
      const result = await functions.discoverReaders({} as any);
      expect(result.error).toBeUndefined();
    });

    it('success path with data returns error as undefined', async () => {
      const functions = require('../functions');
      const result = await functions.createPaymentIntent({} as any);
      expect(result.error).toBeUndefined();
      expect(result.paymentIntent).toEqual({ id: 'pi_123' });
    });

    it('native method returning undefined yields UNEXPECTED_SDK_ERROR StripeError', async () => {
      const functions = require('../functions');
      const result = await functions.clearCachedCredentials();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.name).toBe('StripeError');
      expect(result.error?.code).toBe('UNEXPECTED_SDK_ERROR');
      expect(result.error?.message).toBe(
        'Native bridge returned null or undefined'
      );
    });

    it('catch path returns a proper StripeError instance', async () => {
      const functions = require('../functions');
      const result = await functions.cancelInstallingUpdate();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.name).toBe('StripeError');
    });

    it('catch path preserves unexpected error info in underlyingError', async () => {
      const functions = require('../functions');
      const result = await functions.cancelInstallingUpdate();
      expect(result.error.underlyingError).toBeDefined();
      expect(result.error.underlyingError.code).toBe('TypeError');
      expect(result.error.underlyingError.message).toBe(
        'Network request failed'
      );
    });
  });

  describe('callBridge error rehydration with apiError', () => {
    const mockApiError = {
      code: 'card_declined',
      message: 'Your card was declined.',
      declineCode: 'generic_decline',
      type: 'card_error',
      charge: 'ch_123',
      docUrl: 'https://stripe.com/docs/error-codes/card-declined',
      param: 'card_number',
      requestLogUrl: 'https://dashboard.stripe.com/logs/req_abc',
      adviceCode: '01',
      networkAdviceCode: 'Z1',
      networkDeclineCode: '05',
      localizationResult: {
        requestedLocale: 'fr-FR',
        resolvedLocale: 'fr',
      },
    };

    beforeAll(() => {
      jest.resetModules();
      jest.mock('../StripeTerminalSdk', () => ({
        confirmPaymentIntent: jest.fn().mockImplementation(() => ({
          error: {
            code: 'DECLINED_BY_STRIPE_API',
            nativeErrorCode: 'STRIPE_API_ERROR',
            message: 'Payment was declined',
            metadata: {},
            apiError: mockApiError,
          },
        })),
      }));
    });

    it('rehydrates apiError on StripeError from resolve path', async () => {
      const functions = require('../functions');
      const result = await functions.confirmPaymentIntent({} as any);

      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.name).toBe('StripeError');
      expect(result.error.code).toBe('DECLINED_BY_STRIPE_API');
      expect(result.error.apiError).toEqual(mockApiError);
    });
  });

  describe('callBridge error with paymentIntent coexistence', () => {
    beforeAll(() => {
      jest.resetModules();
      jest.mock('../StripeTerminalSdk', () => ({
        collectPaymentMethod: jest.fn().mockImplementation(() => ({
          error: {
            code: 'CANCELED',
            nativeErrorCode: 'canceled',
            message: 'The operation was canceled.',
            metadata: {},
          },
          paymentIntent: { id: 'pi_partial', amount: 1000, status: 'requires_payment_method' },
        })),
        confirmSetupIntent: jest.fn().mockImplementation(() => ({
          error: {
            code: 'DECLINED_BY_STRIPE_API',
            nativeErrorCode: 'STRIPE_API_ERROR',
            message: 'Setup failed',
            metadata: {},
          },
          setupIntent: { id: 'seti_partial', status: 'requires_payment_method' },
        })),
      }));
    });

    it('returns both error and paymentIntent when native provides both', async () => {
      const functions = require('../functions');
      const result = await functions.collectPaymentMethod({} as any);

      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.name).toBe('StripeError');
      expect(result.error.code).toBe('CANCELED');
      expect(result.paymentIntent).toBeUndefined();
    });

    it('returns both error and setupIntent when native provides both', async () => {
      const functions = require('../functions');
      const result = await functions.confirmSetupIntent('_secret');

      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.name).toBe('StripeError');
      expect(result.error.code).toBe('DECLINED_BY_STRIPE_API');
      expect(result.setupIntent).toBeUndefined();
    });
  });

  describe('PaymentIntent with lastPaymentError', () => {
    beforeAll(() => {
      jest.resetModules();
      jest.mock('../StripeTerminalSdk', () => ({
        createPaymentIntent: jest.fn().mockImplementation(() => ({
          paymentIntent: mockPaymentIntentWithLastPaymentError,
        })),
        collectPaymentMethod: jest.fn().mockImplementation(() => ({
          paymentIntent: mockPaymentIntentWithLastPaymentError,
        })),
        retrievePaymentIntent: jest.fn().mockImplementation(() => ({
          paymentIntent: mockPaymentIntentWithLastPaymentError,
        })),
        confirmPaymentIntent: jest.fn().mockImplementation(() => ({
          paymentIntent: mockPaymentIntentWithLastPaymentError,
        })),
        processPaymentIntent: jest.fn().mockImplementation(() => ({
          paymentIntent: mockPaymentIntentWithLastPaymentError,
        })),
        cancelPaymentIntent: jest.fn().mockImplementation(() => ({
          paymentIntent: mockPaymentIntentWithLastPaymentError,
        })),
      }));
    });

    it('createPaymentIntent includes lastPaymentError when present', async () => {
      const functions = require('../functions');
      const result = await functions.createPaymentIntent({} as any);
      expect(result.paymentIntent.lastPaymentError).toEqual(
        mockLastPaymentError
      );
    });

    it('collectPaymentMethod includes lastPaymentError when present', async () => {
      const functions = require('../functions');
      const result = await functions.collectPaymentMethod({} as any);
      expect(result.paymentIntent.lastPaymentError).toEqual(
        mockLastPaymentError
      );
    });

    it('retrievePaymentIntent includes lastPaymentError when present', async () => {
      const functions = require('../functions');
      const result = await functions.retrievePaymentIntent('_secret');
      expect(result.paymentIntent.lastPaymentError).toEqual(
        mockLastPaymentError
      );
    });

    it('confirmPaymentIntent includes lastPaymentError when present', async () => {
      const functions = require('../functions');
      const result = await functions.confirmPaymentIntent({} as any);
      expect(result.paymentIntent.lastPaymentError).toEqual(
        mockLastPaymentError
      );
    });

    it('processPaymentIntent includes lastPaymentError when present', async () => {
      const functions = require('../functions');
      const result = await functions.processPaymentIntent({} as any);
      expect(result.paymentIntent.lastPaymentError).toEqual(
        mockLastPaymentError
      );
    });

    it('cancelPaymentIntent includes lastPaymentError when present', async () => {
      const functions = require('../functions');
      const result = await functions.cancelPaymentIntent({} as any);
      expect(result.paymentIntent.lastPaymentError).toEqual(
        mockLastPaymentError
      );
    });

    it('lastPaymentError contains all expected fields', async () => {
      const functions = require('../functions');
      const result = await functions.createPaymentIntent({} as any);
      const lastPaymentError = result.paymentIntent.lastPaymentError;

      // Required fields
      expect(lastPaymentError.code).toBe('card_declined');
      expect(lastPaymentError.message).toBe('Your card was declined.');
      expect(lastPaymentError.declineCode).toBe('generic_decline');

      // Optional fields
      expect(lastPaymentError.type).toBe('card_error');
      expect(lastPaymentError.charge).toBe('ch_123');
      expect(lastPaymentError.docUrl).toBe(
        'https://stripe.com/docs/error-codes/card-declined'
      );
      expect(lastPaymentError.param).toBe('card_number');
    });
  });

  describe('PaymentIntent without lastPaymentError', () => {
    beforeAll(() => {
      jest.resetModules();
      jest.mock('../StripeTerminalSdk', () => ({
        createPaymentIntent: jest.fn().mockImplementation(() => ({
          paymentIntent: mockPaymentIntent,
        })),
      }));
    });

    it('createPaymentIntent returns undefined lastPaymentError when not present', async () => {
      const functions = require('../functions');
      const result = await functions.createPaymentIntent({} as any);
      expect(result.paymentIntent.lastPaymentError).toBeUndefined();
    });
  });

  describe('SetupIntent with lastSetupError', () => {
    beforeAll(() => {
      jest.resetModules();
      jest.mock('../StripeTerminalSdk', () => ({
        createSetupIntent: jest.fn().mockImplementation(() => ({
          setupIntent: mockSetupIntentWithLastSetupError,
        })),
        collectSetupIntentPaymentMethod: jest.fn().mockImplementation(() => ({
          setupIntent: mockSetupIntentWithLastSetupError,
        })),
        retrieveSetupIntent: jest.fn().mockImplementation(() => ({
          setupIntent: mockSetupIntentWithLastSetupError,
        })),
        confirmSetupIntent: jest.fn().mockImplementation(() => ({
          setupIntent: mockSetupIntentWithLastSetupError,
        })),
        cancelSetupIntent: jest.fn().mockImplementation(() => ({
          setupIntent: mockSetupIntentWithLastSetupError,
        })),
      }));
    });

    it('createSetupIntent includes lastSetupError when present', async () => {
      const functions = require('../functions');
      const result = await functions.createSetupIntent({} as any);
      expect(result.setupIntent.lastSetupError).toEqual(mockLastSetupError);
    });

    it('collectSetupIntentPaymentMethod includes lastSetupError when present', async () => {
      const functions = require('../functions');
      const result = await functions.collectSetupIntentPaymentMethod({} as any);
      expect(result.setupIntent.lastSetupError).toEqual(mockLastSetupError);
    });

    it('retrieveSetupIntent includes lastSetupError when present', async () => {
      const functions = require('../functions');
      const result = await functions.retrieveSetupIntent('_secret');
      expect(result.setupIntent.lastSetupError).toEqual(mockLastSetupError);
    });

    it('confirmSetupIntent includes lastSetupError when present', async () => {
      const functions = require('../functions');
      const result = await functions.confirmSetupIntent({} as any);
      expect(result.setupIntent.lastSetupError).toEqual(mockLastSetupError);
    });

    it('cancelSetupIntent includes lastSetupError when present', async () => {
      const functions = require('../functions');
      const result = await functions.cancelSetupIntent({} as any);
      expect(result.setupIntent.lastSetupError).toEqual(mockLastSetupError);
    });

    it('lastSetupError contains all expected fields', async () => {
      const functions = require('../functions');
      const result = await functions.createSetupIntent({} as any);
      const lastSetupError = result.setupIntent.lastSetupError;

      // Required fields
      expect(lastSetupError.code).toBe('setup_intent_authentication_failure');
      expect(lastSetupError.message).toBe(
        'The setup failed because authentication failed.'
      );
      expect(lastSetupError.declineCode).toBe('authentication_required');

      // Optional fields
      expect(lastSetupError.type).toBe('invalid_request_error');
    });
  });

  describe('SetupIntent without lastSetupError', () => {
    beforeAll(() => {
      jest.resetModules();
      jest.mock('../StripeTerminalSdk', () => ({
        createSetupIntent: jest.fn().mockImplementation(() => ({
          setupIntent: mockSetupIntent,
        })),
      }));
    });

    it('createSetupIntent returns undefined lastSetupError when not present', async () => {
      const functions = require('../functions');
      const result = await functions.createSetupIntent({} as any);
      expect(result.setupIntent.lastSetupError).toBeUndefined();
    });
  });
});

// workaround to avoiding producing d.ts files that introduces types conflicts
// https://backbencher.dev/articles/typescript-solved-cannot-redeclare-block-scoped-variable-name
export {};
