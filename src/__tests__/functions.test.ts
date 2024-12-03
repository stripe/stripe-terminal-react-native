jest.mock('../logger', () => ({
  traceSdkMethod: (fn: (...args: any[]) => any | Promise<any>) => {
    return function (this: any, ...args: any[]) {
      const response = fn.apply(this, args);
      return response;
    };
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

const mockSetupIntent = {
  id: 2,
  status: 'succeeded',
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
        simulateReaderUpdate: jest.fn(),
        disconnectReader: jest.fn(),
        rebootReader: jest.fn(),
        clearCachedCredentials: jest.fn(),

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
        collectRefundPaymentMethod: jest.fn().mockImplementation(() => ({})),
        confirmRefund: jest
          .fn()
          .mockImplementation(() => ({ refund: mockRefund })),
        cancelCollectPaymentMethod: jest.fn().mockImplementation(() => ({})),
        cancelCollectRefundPaymentMethod: jest
          .fn()
          .mockImplementation(() => ({})),
        cancelCollectSetupIntent: jest.fn().mockImplementation(() => ({})),
        setSimulatedCard: jest.fn(),
      }));
    });

    it('initialize returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.initialize()).resolves.toEqual({
        reader: mockReader,
      });
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
      await expect(
        functions.connectReader({} as any, 'bluetooth')
      ).resolves.toEqual({
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

    it('simulateReaderUpdate returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.simulateReaderUpdate({} as any)).resolves.toEqual({
        error: undefined,
      });
    });

    it('collectRefundPaymentMethod returns a proper value', async () => {
      const functions = require('../functions');
      await expect(
        functions.collectRefundPaymentMethod({} as any)
      ).resolves.toEqual({
        error: undefined,
      });
    });

    it('confirmRefund returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.confirmRefund()).resolves.toEqual({
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

    it('cancelCollectRefundPaymentMethod returns a proper value', async () => {
      const functions = require('../functions');
      await expect(
        functions.cancelCollectRefundPaymentMethod()
      ).resolves.toEqual({});
    });

    it('cancelCollectSetupIntent returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.cancelCollectSetupIntent()).resolves.toEqual({});
    });

    it('setSimulatedCard returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.setSimulatedCard('_number')).resolves.toEqual({});
    });
  });

  describe('Functions error results', () => {
    beforeAll(() => {
      jest.resetModules();
      jest.mock('../StripeTerminalSdk', () => ({
        discoverReaders: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        cancelDiscovering: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        connectReader: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        disconnectReader: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        rebootReader: jest.fn().mockImplementation(() => ({ error: '_error' })),
        createPaymentIntent: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        collectPaymentMethod: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        retrievePaymentIntent: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        getLocations: jest.fn().mockImplementation(() => ({
          error: '_error',
        })),
        confirmPaymentIntent: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        createSetupIntent: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        cancelPaymentIntent: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),

        setReaderDisplay: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        clearReaderDisplay: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        retrieveSetupIntent: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        collectSetupIntentPaymentMethod: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        cancelSetupIntent: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        confirmSetupIntent: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        collectRefundPaymentMethod: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        confirmRefund: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        cancelCollectSetupIntent: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        cancelReadReusableCard: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),

        simulateReaderUpdate: jest.fn().mockRejectedValue('_error'),
        clearCachedCredentials: jest.fn().mockRejectedValue('_error'),
        cancelCollectRefundPaymentMethod: jest.fn().mockRejectedValue('_error'),
        cancelCollectPaymentMethod: jest.fn().mockRejectedValue('_error'),
        setSimulatedCard: jest.fn().mockRejectedValue('_error'),
        cancelInstallingUpdate: jest.fn().mockRejectedValue('_error'),
        installAvailableUpdate: jest.fn().mockRejectedValue('_error'),
        initialize: jest.fn().mockImplementation(() => ({ error: '_error' })),
      }));
    });

    it('initialize returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.initialize()).resolves.toEqual({
        error: '_error',
      });
    });

    it('discoverReaders returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.discoverReaders({} as any)).resolves.toEqual({
        error: '_error',
      });
    });

    it('cancelDiscovering returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.cancelDiscovering()).resolves.toEqual({
        error: '_error',
      });
    });

    it('connectReader returns a proper value', async () => {
      const functions = require('../functions');
      await expect(
        functions.connectReader({} as any, 'bluetooth')
      ).resolves.toEqual({
        error: '_error',
      });
    });

    it('createPaymentIntent returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.createPaymentIntent({} as any)).resolves.toEqual({
        error: '_error',
      });
    });

    it('collectPaymentMethod returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.collectPaymentMethod({} as any)).resolves.toEqual({
        error: '_error',
      });
    });

    it('retrievePaymentIntent returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.retrievePaymentIntent({} as any)).resolves.toEqual(
        {
          error: '_error',
        }
      );
    });

    it('getLocations returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.getLocations({} as any)).resolves.toEqual({
        locations: undefined,
        hasMore: undefined,
        error: '_error',
      });
    });

    it('confirmPaymentIntent returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.confirmPaymentIntent({} as any)).resolves.toEqual({
        error: '_error',
      });
    });

    it('createSetupIntent returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.createSetupIntent({} as any)).resolves.toEqual({
        error: '_error',
      });
    });

    it('cancelPaymentIntent returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.cancelPaymentIntent('_id')).resolves.toEqual({
        error: '_error',
      });
    });

    it('setReaderDisplay returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.setReaderDisplay({} as any)).resolves.toEqual({
        error: '_error',
      });
    });

    it('clearReaderDisplay returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.clearReaderDisplay()).resolves.toEqual({
        error: '_error',
      });
    });

    it('retrieveSetupIntent returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.retrieveSetupIntent('')).resolves.toEqual({
        error: '_error',
        setupIntent: undefined,
      });
    });

    it('collectSetupIntentPaymentMethod returns a proper value', async () => {
      const functions = require('../functions');
      await expect(
        functions.collectSetupIntentPaymentMethod({} as any)
      ).resolves.toEqual({
        error: '_error',
        setupIntent: undefined,
      });
    });

    it('cancelSetupIntent returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.cancelSetupIntent('')).resolves.toEqual({
        error: '_error',
        setupIntent: undefined,
      });
    });

    it('confirmSetupIntent returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.confirmSetupIntent('_secret')).resolves.toEqual({
        error: '_error',
        setupIntent: undefined,
      });
    });

    it('collectRefundPaymentMethod returns a proper value', async () => {
      const functions = require('../functions');
      await expect(
        functions.collectRefundPaymentMethod({} as any)
      ).resolves.toEqual({
        error: '_error',
      });
    });

    it('confirmRefund returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.confirmRefund()).resolves.toEqual({
        error: '_error',
        refund: undefined,
      });
    });

    it('simulateReaderUpdate returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.simulateReaderUpdate({} as any)).resolves.toEqual({
        error: '_error',
      });
    });

    it('clearCachedCredentials returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.clearCachedCredentials()).resolves.toEqual({
        error: '_error',
      });
    });

    it('cancelCollectRefundPaymentMethod returns a proper value', async () => {
      const functions = require('../functions');
      await expect(
        functions.cancelCollectRefundPaymentMethod()
      ).resolves.toEqual({ error: '_error' });
    });

    it('cancelInstallingUpdate returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.cancelInstallingUpdate()).resolves.toEqual({
        error: '_error',
      });
    });

    it('setSimulatedCard returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.setSimulatedCard('_number')).resolves.toEqual({
        error: '_error',
      });
    });

    it('installAvailableUpdate returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.installAvailableUpdate()).resolves.toEqual({
        error: '_error',
      });
    });
  });
});

// workaround to avoiding producing d.ts files that introduces types conflicts
// https://backbencher.dev/articles/typescript-solved-cannot-redeclare-block-scoped-variable-name
export {};
