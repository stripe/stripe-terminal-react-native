jest.mock('../logger', () => {
  const actual = jest.requireActual('../logger');
  const instance = {
    _collector: {
      pushTrace: jest.fn(),
      pushProxyEvent: jest.fn(),
    },
  };
  // Exercise the real tracing/public-error boundary without starting uploads.
  actual.default.getInstance = jest.fn(() => instance);
  return actual;
});

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

const mockOfflineStatus = {
  sdk: {
    networkStatus: 'online',
    offlinePaymentsCount: 0,
    offlinePaymentAmountsByCurrency: {},
  },
};

function expectPublicStripeError(error: any) {
  expect(error).toBeInstanceOf(Error);
  for (const field of ['error_source', 'errorSource', 'stripeError']) {
    expect(error).not.toHaveProperty(field);
    expect(Object.keys(error)).not.toContain(field);
    expect({ ...error }).not.toHaveProperty(field);
    expect(JSON.parse(JSON.stringify(error))).not.toHaveProperty(field);
  }
}

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
        getOfflineStatus: jest.fn().mockResolvedValue(mockOfflineStatus),
        getPaymentStatus: jest.fn().mockResolvedValue('ready'),
        getConnectionStatus: jest.fn().mockResolvedValue('connected'),
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
          initParams: {
            logLevel: 'verbose',
            localeConfig: { type: 'cardLanguagePreferenceIfAvailable' },
          },
          useAppsOnDevicesConnectionTokenProvider: false,
        })
      ).resolves.toEqual({
        reader: mockReader,
      });
    });

    it('initialize rejects a missing localeConfig before calling the native bridge', async () => {
      const functions = require('../functions');
      const StripeTerminalSdk = require('../StripeTerminalSdk');
      StripeTerminalSdk.initialize.mockClear();

      const result = await functions.initialize({
        initParams: { logLevel: 'verbose' },
        useAppsOnDevicesConnectionTokenProvider: false,
      } as any);

      expect(result.reader).toBeUndefined();
      expect(result.error.errorSource).toBe('rn');
      expect(result.error.stripeError.code).toBe('INVALID_REQUIRED_PARAMETER');
      expect(result.error.stripeError.message).toBe(
        'You must provide a localeConfig.'
      );
      expect(StripeTerminalSdk.initialize).not.toHaveBeenCalled();
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

    it.each([
      ['getOfflineStatus', mockOfflineStatus],
      ['getPaymentStatus', 'ready'],
      ['getConnectionStatus', 'connected'],
    ])('%s returns the native value unchanged', async (method, expected) => {
      const functions = require('../functions');

      await expect(functions[method]()).resolves.toEqual(expected);
    });

    it('initialize preserves the internal error for invalid localeConfig type', async () => {
      const helpers = require('../Errors/StripeErrorHelpers');
      const create = jest.spyOn(helpers, 'createInternalStripeError');
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

      expect(create).toHaveBeenCalledTimes(1);
      expect(create.mock.results[0].value.errorSource).toBe('rn');
      expect(result.error).toBe(create.mock.results[0].value);
      create.mockRestore();
      expect(result.reader).toBeUndefined();
      expect(result.error.stripeError.code).toBe('INVALID_REQUIRED_PARAMETER');
      expect(result.error.stripeError.message).toBe(
        "Invalid localeConfig.type. Expected 'hardcoded' or 'cardLanguagePreferenceIfAvailable'."
      );
      expect(StripeTerminalSdk.initialize).not.toHaveBeenCalled();
    });

    it('discoverReaders returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.discoverReaders({} as any)).resolves.toEqual({
        error: undefined,
      });
    });

    it('cancelDiscovering returns success and records one correctly named metric', async () => {
      const functions = require('../functions');
      const Logger = require('../logger').default;
      const { pushProxyEvent } = Logger.getInstance()._collector;
      pushProxyEvent.mockClear();

      await expect(functions.cancelDiscovering()).resolves.toEqual({
        error: undefined,
      });

      expect(pushProxyEvent).toHaveBeenCalledTimes(1);
      expect(pushProxyEvent.mock.calls[0][0]).toStrictEqual({
        origin_role: 'pos-rn',
        origin_id: Logger.posId,
        event: {
          domain: 'terminal_request',
          scope: 'terminal',
          event: 'cancelDiscovering',
          result: 'OK',
          duration: expect.any(Number),
        },
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

  describe('setConnectionToken', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.doMock('../StripeTerminalSdk', () => ({
        setConnectionToken: jest.fn(),
      }));
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('forwards the token and waits for native completion', async () => {
      const functions = require('../functions');
      const sdk = require('../StripeTerminalSdk');
      const Logger = require('../logger').default;
      const { pushTrace, pushProxyEvent } = Logger.getInstance()._collector;
      let complete!: () => void;
      sdk.setConnectionToken.mockReturnValue(
        new Promise<void>((resolve) => {
          complete = resolve;
        })
      );

      const pending = functions.setConnectionToken('pst_test_secret');
      const onResolved = jest.fn();
      const completion = pending.then(onResolved);
      expect(sdk.setConnectionToken).toHaveBeenCalledTimes(1);
      expect(sdk.setConnectionToken).toHaveBeenCalledWith({
        token: 'pst_test_secret',
        error: undefined,
      });
      await Promise.resolve();
      expect(onResolved).not.toHaveBeenCalled();
      expect(pushTrace).not.toHaveBeenCalled();
      expect(pushProxyEvent).not.toHaveBeenCalled();

      complete();
      await expect(pending).resolves.toBeUndefined();
      await completion;

      expect(onResolved).toHaveBeenCalledTimes(1);
      expect(pushProxyEvent).not.toHaveBeenCalled();
      expect(pushTrace).not.toHaveBeenCalled();
    });

    it.each([
      [undefined, 'Provider failure details'],
      ['', undefined],
    ])('forwards token %p and error %p without tracing', async (token, error) => {
      const functions = require('../functions');
      const sdk = require('../StripeTerminalSdk');
      const Logger = require('../logger').default;
      const { pushTrace, pushProxyEvent } = Logger.getInstance()._collector;
      sdk.setConnectionToken.mockResolvedValue(undefined);

      await expect(
        functions.setConnectionToken(token, error)
      ).resolves.toBeUndefined();

      expect(sdk.setConnectionToken).toHaveBeenCalledTimes(1);
      expect(sdk.setConnectionToken).toHaveBeenCalledWith({
        token,
        error,
      });
      expect(pushProxyEvent).not.toHaveBeenCalled();
      expect(pushTrace).not.toHaveBeenCalled();
    });

    it.each([
      {
        name: 'synchronous bridge invocation failure',
        error: new TypeError('Bridge method is unavailable'),
        synchronous: true,
      },
      {
        name: 'marked native rejection',
        error: {
          code: 'CONNECTION_TOKEN_PROVIDER_ERROR',
          message: 'Native rejected the connection token',
          error_source: 'native',
          metadata: { connectionToken: 'pst_test_secret' },
        },
        synchronous: false,
      },
      {
        name: 'unmarked JS rejection',
        error: new Error('Bridge invocation failed: pst_test_secret'),
        synchronous: false,
      },
    ])(
      'logs a fixed warning and swallows $name without tracing',
      async ({ error, synchronous }) => {
        const functions = require('../functions');
        const sdk = require('../StripeTerminalSdk');
        const Logger = require('../logger').default;
        const { pushTrace, pushProxyEvent } = Logger.getInstance()._collector;
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        sdk.setConnectionToken.mockImplementation(() => {
          if (synchronous) throw error;
          return Promise.reject(error);
        });

        await expect(
          functions.setConnectionToken('pst_test_secret')
        ).resolves.toBeUndefined();

        expect(sdk.setConnectionToken).toHaveBeenCalledTimes(1);
        expect(sdk.setConnectionToken).toHaveBeenCalledWith({
          token: 'pst_test_secret',
          error: undefined,
        });
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn).toHaveBeenCalledWith(
          'Unexpected error setting connection token.'
        );
        expect(pushProxyEvent).not.toHaveBeenCalled();
        expect(pushTrace).not.toHaveBeenCalled();
      }
    );
  });

  describe('Functions error results', () => {
    const mockBridgeError = {
      code: 'CANCELED',
      message: 'The operation was canceled.',
      nativeErrorCode: 'canceled',
      metadata: {},
    };

    function expectStripeError(error: any) {
      expectPublicStripeError(error);
      expect(error.name).toBe('StripeError');
      expect(error.code).toBe('CANCELED');
      expect(error.message).toBe('The operation was canceled.');
    }

    beforeAll(() => {
      jest.resetModules();
      const resolve = () => ({
        error: { ...mockBridgeError, error_source: 'native' },
      });
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

    it('initialize preserves the native error container for Provider logging', async () => {
      const functions = require('../functions');
      const result = await functions.initialize({
        initParams: {
          logLevel: 'verbose',
          localeConfig: { type: 'cardLanguagePreferenceIfAvailable' },
        },
        useAppsOnDevicesConnectionTokenProvider: false,
      });
      const { InternalStripeError } = require('../Errors/InternalStripeError');
      expect(result.error).toBeInstanceOf(InternalStripeError);
      expect(result.error.errorSource).toBe('native');
      expectStripeError(result.error.stripeError);
    });

    it('discoverReaders returns a proper value', async () => {
      const functions = require('../functions');
      const result = await functions.discoverReaders({} as any);
      expectStripeError(result.error);
    });

    it('cancelDiscovering returns an error and records one correctly named metric', async () => {
      const functions = require('../functions');
      const Logger = require('../logger').default;
      const { pushProxyEvent } = Logger.getInstance()._collector;
      pushProxyEvent.mockClear();

      const result = await functions.cancelDiscovering();
      expectStripeError(result.error);

      expect(pushProxyEvent).toHaveBeenCalledTimes(1);
      expect(pushProxyEvent.mock.calls[0][0]).toStrictEqual({
        origin_role: 'pos-rn',
        origin_id: Logger.posId,
        event: {
          domain: 'terminal_request',
          scope: 'terminal',
          event: 'cancelDiscovering',
          result: 'ERROR',
          duration: expect.any(Number),
          outcome: 'CANCELED',
          tags: { error_source: 'native' },
        },
      });
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
      expect(Object.prototype.hasOwnProperty.call(result, 'error')).toBe(true);
    });

    it('success path with data returns error as undefined', async () => {
      const functions = require('../functions');
      const result = await functions.createPaymentIntent({} as any);
      expect(result.error).toBeUndefined();
      expect(Object.prototype.hasOwnProperty.call(result, 'error')).toBe(true);
      expect(result.paymentIntent).toEqual({ id: 'pi_123' });
    });

    it('native method returning undefined yields UNEXPECTED_SDK_ERROR StripeError', async () => {
      const functions = require('../functions');
      const result = await functions.clearCachedCredentials();
      expectPublicStripeError(result.error);
      expect(result.error?.name).toBe('StripeError');
      expect(result.error?.code).toBe('UNEXPECTED_SDK_ERROR');
      expect(result.error?.message).toBe(
        'Native bridge returned null or undefined'
      );
    });

    it('catch path returns a proper StripeError instance', async () => {
      const functions = require('../functions');
      const result = await functions.cancelInstallingUpdate();
      expectPublicStripeError(result.error);
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

  describe('getConnectedReader', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.doMock('../StripeTerminalSdk', () => ({
        getConnectedReader: jest.fn(),
      }));
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('returns the connected reader without an error', async () => {
      const sdk = require('../StripeTerminalSdk');
      const functions = require('../functions');
      sdk.getConnectedReader.mockResolvedValue({
        reader: mockReader,
      });

      const result = await functions.getConnectedReader();

      expect(result).toBe(mockReader);
    });

    it('returns null and records success when no reader is connected', async () => {
      const sdk = require('../StripeTerminalSdk');
      const functions = require('../functions');
      const Logger = require('../logger').default;
      sdk.getConnectedReader.mockResolvedValue({
        reader: null,
      });

      await expect(functions.getConnectedReader()).resolves.toBeNull();
      expect(Logger.getInstance()._collector.pushProxyEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: expect.objectContaining({
            event: 'getConnectedReader',
            result: 'OK',
          }),
        })
      );
    });

    it('rejects an error resolved by the bridge as a public StripeError', async () => {
      const sdk = require('../StripeTerminalSdk');
      const functions = require('../functions');
      sdk.getConnectedReader.mockResolvedValue({
        error: {
          name: 'StripeError',
          code: 'UNEXPECTED_SDK_ERROR',
          nativeErrorCode: 'UNEXPECTED_SDK_ERROR',
          message: 'Reader lookup failed.',
          metadata: {},
          error_source: 'rn',
        },
      });

      const result = functions.getConnectedReader();

      await expect(result).rejects.toMatchObject({
        code: 'UNEXPECTED_SDK_ERROR',
        message: 'Reader lookup failed.',
      });
      await result.catch(expectPublicStripeError);
    });

    it('rejects unexpected bridge failures as a public StripeError', async () => {
      const sdk = require('../StripeTerminalSdk');
      const functions = require('../functions');
      sdk.getConnectedReader.mockRejectedValue(new TypeError('Reader lookup failed'));

      const result = functions.getConnectedReader();

      await expect(result).rejects.toMatchObject({
        code: 'UNEXPECTED_SDK_ERROR',
        underlyingError: {
          code: 'TypeError',
          message: 'Reader lookup failed',
        },
      });
      await result.catch(expectPublicStripeError);
    });

    it.each([{}, { reader: undefined }])(
      'rejects a missing reader field instead of treating it as a disconnected reader: %p',
      async (nativeResult) => {
        const sdk = require('../StripeTerminalSdk');
        const functions = require('../functions');
        sdk.getConnectedReader.mockResolvedValue(nativeResult);

        await expect(functions.getConnectedReader()).rejects.toMatchObject({
          code: 'UNEXPECTED_SDK_ERROR',
        });
      }
    );
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
            error_source: 'native',
          },
        })),
      }));
    });

    it('rehydrates apiError on StripeError from resolve path', async () => {
      const functions = require('../functions');
      const result = await functions.confirmPaymentIntent({} as any);

      expectPublicStripeError(result.error);
      expect(result.error.name).toBe('StripeError');
      expect(result.error.code).toBe('DECLINED_BY_STRIPE_API');
      expect(result.error.apiError).toEqual(mockApiError);
    });
  });

  describe('callBridge errors with native-associated resources', () => {
    const paymentIntent = {
      id: 'pi_partial',
      amount: 1000,
      status: 'requires_payment_method',
    };
    const setupIntent = {
      id: 'seti_partial',
      status: 'requires_payment_method',
    };
    const refund = {
      id: 're_partial',
      amount: 1000,
      status: 'failed',
    };

    const nativeError = (message: string) => ({
      code: 'DECLINED_BY_STRIPE_API',
      nativeErrorCode: 'STRIPE_API_ERROR',
      message,
      metadata: {},
      error_source: 'native',
    });

    beforeAll(() => {
      jest.resetModules();
      jest.mock('../StripeTerminalSdk', () => ({
        collectPaymentMethod: jest.fn(),
        processPaymentIntent: jest.fn(),
        confirmSetupIntent: jest.fn(),
        processSetupIntent: jest.fn(),
        processRefund: jest.fn(),
      }));
    });

    const cases = [
      {
        method: 'collectPaymentMethod',
        args: [{}],
        resourceKey: 'paymentIntent',
        resource: paymentIntent,
      },
      {
        method: 'processPaymentIntent',
        args: [{}],
        resourceKey: 'paymentIntent',
        resource: paymentIntent,
      },
      {
        method: 'confirmSetupIntent',
        args: [{}],
        resourceKey: 'setupIntent',
        resource: setupIntent,
      },
      {
        method: 'processSetupIntent',
        args: [{}],
        resourceKey: 'setupIntent',
        resource: setupIntent,
      },
      {
        method: 'processRefund',
        args: [{}],
        resourceKey: 'refund',
        resource: refund,
      },
    ];

    it.each(cases)(
      '$method rehydrates the native $resourceKey on StripeError',
      async ({ method, args, resourceKey, resource }) => {
        const functions = require('../functions');
        const sdk = require('../StripeTerminalSdk');
        sdk[method].mockResolvedValueOnce({
          error: {
            ...nativeError(`${method} failed`),
            [resourceKey]: resource,
          },
        });

        const result = await functions[method](...args);

        expectPublicStripeError(result.error);
        expect(result.error.code).toBe('DECLINED_BY_STRIPE_API');
        expect(result.error[resourceKey]).toEqual(resource);
        expect(result[resourceKey]).toBeUndefined();
      }
    );

    it('returns only error when processSetupIntent fails', async () => {
      const functions = require('../functions');
      const sdk = require('../StripeTerminalSdk');
      sdk.processSetupIntent.mockResolvedValueOnce({
        error: {
          ...nativeError('Process setup failed'),
          setupIntent,
        },
      });

      const result = await functions.processSetupIntent({} as any);

      expect(Object.keys(result)).toEqual(['error']);
      expect(result.error.setupIntent).toEqual(setupIntent);
    });
  });

  describe('InternalStripeError public boundaries', () => {
    let traceError: jest.SpyInstance;
    beforeEach(() => {
      jest.resetModules();
      const Logger = require('../logger').default;
      traceError = jest.spyOn(Logger, 'traceError');
      jest.doMock('../StripeTerminalSdk', () => ({
        disconnectReader: jest.fn(),
        getOfflineStatus: jest.fn(),
        getPaymentStatus: jest.fn(),
        getConnectionStatus: jest.fn(),
        getConnectedReader: jest.fn(),
        setTapToPayUxConfiguration: jest.fn(),
        getReaderSettings: jest.fn(),
        setReaderSettings: jest.fn(),
      }));
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    function expectTracedInternalError(internalError: any, publicError: any) {
      const { InternalStripeError } = require('../Errors/InternalStripeError');
      expect(internalError).toBeInstanceOf(InternalStripeError);
      expect(traceError).toHaveBeenCalledTimes(1);
      expect(traceError.mock.calls[0][1].error).toBe(internalError);
      expect(publicError).toBe(internalError.stripeError);
      expectPublicStripeError(publicError);
    }

    it('passes the native error container to Logger and returns its public error', async () => {
      const helpers = require('../Errors/StripeErrorHelpers');
      const rehydrate = jest.spyOn(helpers, 'rehydrateBridgeError');
      const sdk = require('../StripeTerminalSdk');
      const functions = require('../functions');
      sdk.disconnectReader.mockResolvedValue({
        error: {
          code: 'CANCELED',
          nativeErrorCode: 'canceled',
          message: 'The operation was canceled.',
          metadata: {},
          error_source: 'native',
        },
      });

      const result = await functions.disconnectReader();

      expect(rehydrate).toHaveBeenCalledTimes(1);
      const internalError = rehydrate.mock.results[0].value;
      expect(internalError.errorSource).toBe('native');
      expectTracedInternalError(internalError, result.error);
      expect(Object.keys(result)).toEqual(['error']);
      expect(sdk.disconnectReader).toHaveBeenCalledTimes(1);
    });

    it('preserves the resolved-error contract for an unmarked JS bridge rejection', async () => {
      const helpers = require('../Errors/StripeErrorHelpers');
      const rehydrate = jest.spyOn(helpers, 'rehydrateBridgeError');
      const sdk = require('../StripeTerminalSdk');
      const functions = require('../functions');
      sdk.disconnectReader.mockRejectedValue(
        new TypeError('Network request failed')
      );

      const result = await functions.disconnectReader();

      expect(rehydrate).toHaveBeenCalledTimes(1);
      const internalError = rehydrate.mock.results[0].value;
      expect(internalError.errorSource).toBe('rn');
      expectTracedInternalError(internalError, result.error);
      expect(result.error.underlyingError).toEqual({
        code: 'TypeError',
        message: 'Network request failed',
      });
      expect(sdk.disconnectReader).toHaveBeenCalledTimes(1);
    });

    it.each([
      'getOfflineStatus',
      'getPaymentStatus',
      'getConnectionStatus',
      'getConnectedReader',
    ])(
      '%s rehydrates native errors and rejects public StripeError',
      async (method) => {
        const helpers = require('../Errors/StripeErrorHelpers');
        const rehydrate = jest.spyOn(helpers, 'rehydrateBridgeError');
        const sdk = require('../StripeTerminalSdk');
        const functions = require('../functions');
        const bridgeError = {
          code: 'CANCELED',
          nativeErrorCode: 'canceled',
          message: 'Bridge invocation failed',
          metadata: {},
          error_source: 'native',
        };
        sdk[method].mockRejectedValue(bridgeError);

        let rejectedError: unknown;
        try {
          await functions[method]();
        } catch (error) {
          rejectedError = error;
        }

        expect(rehydrate).toHaveBeenCalledTimes(1);
        expect(rehydrate).toHaveBeenCalledWith(bridgeError);
        const internalError = rehydrate.mock.results[0].value;
        expect(internalError.errorSource).toBe('native');
        expect(rejectedError).toBe(internalError.stripeError);
        expectPublicStripeError(rejectedError);
        expect(sdk[method]).toHaveBeenCalledTimes(1);
      }
    );

    it.each([
      { method: 'getOfflineStatus', nativeResult: null, resultType: 'null' },
      {
        method: 'getOfflineStatus',
        nativeResult: undefined,
        resultType: 'undefined',
      },
      { method: 'getPaymentStatus', nativeResult: null, resultType: 'null' },
      {
        method: 'getPaymentStatus',
        nativeResult: undefined,
        resultType: 'undefined',
      },
      { method: 'getConnectionStatus', nativeResult: null, resultType: 'null' },
      {
        method: 'getConnectionStatus',
        nativeResult: undefined,
        resultType: 'undefined',
      },
      { method: 'getConnectedReader', nativeResult: null, resultType: 'null' },
      {
        method: 'getConnectedReader',
        nativeResult: undefined,
        resultType: 'undefined',
      },
    ])(
      '$method rejects a resolved $resultType result with public UNEXPECTED_SDK_ERROR',
      async ({ method, nativeResult }) => {
        const helpers = require('../Errors/StripeErrorHelpers');
        const create = jest.spyOn(helpers, 'createInternalStripeError');
        const sdk = require('../StripeTerminalSdk');
        const functions = require('../functions');
        sdk[method].mockResolvedValue(nativeResult);

        let rejectedError: unknown;
        try {
          await functions[method]();
        } catch (error) {
          rejectedError = error;
        }

        expect(create).toHaveBeenCalledWith(
          {
            code: 'UNEXPECTED_SDK_ERROR',
            message: 'Native bridge returned null or undefined',
          },
          'rn'
        );
        const internalError = create.mock.results[0].value;
        expect(rejectedError).toBe(internalError.stripeError);
        expectPublicStripeError(rejectedError);
        expect(rejectedError).toMatchObject({
          code: 'UNEXPECTED_SDK_ERROR',
          message: 'Native bridge returned null or undefined',
        });
        expect(sdk[method]).toHaveBeenCalledTimes(1);
      }
    );

    it('unwraps the RN error for an unsupported iOS operation', async () => {
      const helpers = require('../Errors/StripeErrorHelpers');
      const create = jest.spyOn(helpers, 'createInternalStripeError');
      const { Platform } = require('react-native');
      const platform = jest.replaceProperty(Platform, 'OS', 'ios');
      const sdk = require('../StripeTerminalSdk');
      const functions = require('../functions');
      const Logger = require('../logger').default;
      const { pushTrace, pushProxyEvent } = Logger.getInstance()._collector;

      const result = await functions.setTapToPayUxConfiguration({});

      expect(create).toHaveBeenCalledTimes(1);
      const internalError = create.mock.results[0].value;
      expect(internalError.errorSource).toBe('rn');
      expectTracedInternalError(internalError, result.error);
      expect(result.error.code).toBe('UNSUPPORTED_OPERATION');
      expect(pushTrace).toHaveBeenCalledTimes(1);
      expect(pushProxyEvent).toHaveBeenCalledTimes(1);
      expect(pushProxyEvent.mock.calls[0][0].event).toStrictEqual({
        domain: 'terminal_request',
        scope: 'terminal',
        event: 'setTapToPayUxConfiguration',
        result: 'ERROR',
        duration: pushTrace.mock.calls[0][0].trace.total_time_ms,
        outcome: 'UNSUPPORTED_OPERATION',
        tags: { error_source: 'rn' },
      });
      expect(sdk.setTapToPayUxConfiguration).not.toHaveBeenCalled();
      platform.restore();
    });

    it.each(['getReaderSettings', 'setReaderSettings'])(
      '%s removes wire source while keeping nested errors as plain objects',
      async (method) => {
        const Logger = require('../logger').default;
        const tracePromise = jest.spyOn(Logger, 'tracePromise');
        const sdk = require('../StripeTerminalSdk');
        const functions = require('../functions');
        const metadata = { domain: 'com.stripe-terminal', isStripeError: true };
        const fields = {
          name: 'StripeError',
          code: 'UNSUPPORTED_OPERATION',
          nativeErrorCode: 'UNSUPPORTED_OPERATION',
          message: 'This reader does not support this setting',
          metadata,
        };
        const rawError = { ...fields, error_source: 'native' };
        sdk[method].mockResolvedValue({
          accessibility: { error: rawError },
          buzzerVolume: { error: rawError },
        });
        const params = { buzzerVolume: { level: 'high' } };

        const result = await functions[method](params);

        expect(traceError).not.toHaveBeenCalled();
        expect(tracePromise).toHaveBeenCalledTimes(1);
        expect(await tracePromise.mock.calls[0][1]).toBe(result);
        const { pushTrace, pushProxyEvent } = Logger.getInstance()._collector;
        expect(pushTrace).toHaveBeenCalledTimes(1);
        const trace = pushTrace.mock.calls[0][0].trace;
        expect(trace.method).toBe(method);
        const loggedError = { ...fields, metadata: '<REDACTED>' };
        expect(JSON.parse(trace.response)).toEqual({
          accessibility: { error: loggedError },
          buzzerVolume: { error: loggedError },
        });
        expect(pushProxyEvent).toHaveBeenCalledTimes(1);
        expect(pushProxyEvent.mock.calls[0][0].event).toMatchObject({
          event: method,
          result: 'OK',
        });
        for (const setting of [result.accessibility, result.buzzerVolume]) {
          expect(setting.error).not.toBeInstanceOf(Error);
          expect(Object.getPrototypeOf(setting.error)).toBe(Object.prototype);
          expect(setting.error).toEqual(fields);
          expect(setting.error.metadata).toBe(metadata);
          expect(Object.keys(setting.error)).toContain('message');
          expect({ ...setting.error }).toEqual(fields);
          expect(JSON.parse(JSON.stringify(setting.error))).toEqual(fields);
          expect(setting.error).not.toHaveProperty('error_source');
          expect(setting.error).not.toHaveProperty('errorSource');
          expect(setting.error).not.toHaveProperty('stripeError');
        }
        expect(result.error).toBeUndefined();
        expect(Object.prototype.hasOwnProperty.call(result, 'error')).toBe(
          true
        );
        expect(rawError.error_source).toBe('native');
        expect(sdk[method]).toHaveBeenCalledTimes(1);
        if (method === 'setReaderSettings') {
          expect(sdk[method]).toHaveBeenCalledWith(params);
        }
      }
    );

    it.each(['getReaderSettings', 'setReaderSettings'])(
      '%s preserves successful settings and their error-key presence',
      async (method) => {
        const sdk = require('../StripeTerminalSdk');
        const functions = require('../functions');
        const accessibility = { textToSpeechStatus: 'off' };
        const buzzerVolume = {
          currentVolume: 3,
          maxVolume: 10,
          error: undefined,
        };
        sdk[method].mockResolvedValue({ accessibility, buzzerVolume });

        const result = await functions[method]({
          buzzerVolume: { level: 'high' },
        });

        expect(result).toEqual({
          accessibility,
          buzzerVolume,
          error: undefined,
        });
        expect(result.accessibility).toBe(accessibility);
        expect(result.buzzerVolume).toBe(buzzerVolume);
        expect(
          Object.prototype.hasOwnProperty.call(result.accessibility, 'error')
        ).toBe(false);
        expect(
          Object.prototype.hasOwnProperty.call(result.buzzerVolume, 'error')
        ).toBe(true);
        expect(Object.prototype.hasOwnProperty.call(result, 'error')).toBe(
          true
        );
      }
    );

    it.each(['getReaderSettings', 'setReaderSettings'])(
      '%s still rehydrates a top-level settings failure',
      async (method) => {
        const helpers = require('../Errors/StripeErrorHelpers');
        const rehydrate = jest.spyOn(helpers, 'rehydrateBridgeError');
        const sdk = require('../StripeTerminalSdk');
        const functions = require('../functions');
        sdk[method].mockResolvedValue({
          error: {
            code: 'NOT_CONNECTED_TO_READER',
            message: 'No reader is connected',
            nativeErrorCode: 'NOT_CONNECTED_TO_READER',
            metadata: {},
            error_source: 'native',
          },
        });

        const result = await functions[method]({
          buzzerVolume: { level: 'high' },
        });

        expect(rehydrate).toHaveBeenCalledTimes(1);
        const internalError = rehydrate.mock.results[0].value;
        expect(internalError.errorSource).toBe('native');
        expectTracedInternalError(internalError, result.error);
        expect(result.error.code).toBe('NOT_CONNECTED_TO_READER');
        expect(Object.keys(result)).toEqual(['error']);
      }
    );
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
