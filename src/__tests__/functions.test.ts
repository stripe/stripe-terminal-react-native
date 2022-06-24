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

const mockPaymentMethod = {
  id: 3,
  customer: '_cus',
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
        clearCachedCredentials: jest.fn(),

        discoverReaders: jest.fn().mockImplementation(() => ({})),
        cancelDiscovering: jest.fn().mockImplementation(() => ({})),
        connectBluetoothReader: jest
          .fn()
          .mockImplementation(() => ({ reader: mockReader })),
        connectHandoffReader: jest
          .fn()
          .mockImplementation(() => ({ reader: mockReader })),
        connectInternetReader: jest
          .fn()
          .mockImplementation(() => ({ reader: mockReader })),
        connectUsbReader: jest
          .fn()
          .mockImplementation(() => ({ reader: mockReader })),
        connectLocalMobileReader: jest
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
        processPayment: jest
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
        processRefund: jest
          .fn()
          .mockImplementation(() => ({ refund: mockRefund })),
        readReusableCard: jest
          .fn()
          .mockImplementation(() => ({ paymentMethod: mockPaymentMethod })),
        cancelCollectPaymentMethod: jest.fn().mockImplementation(() => ({})),
        cancelCollectRefundPaymentMethod: jest
          .fn()
          .mockImplementation(() => ({})),
        cancelCollectSetupIntent: jest.fn().mockImplementation(() => ({})),
        cancelReadReusableCard: jest.fn().mockImplementation(() => ({})),
        connectEmbeddedReader: jest
          .fn()
          .mockImplementation(() => ({ reader: mockReader })),
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

    it('connectBluetoothReader returns a proper value', async () => {
      const functions = require('../functions');
      await expect(
        functions.connectBluetoothReader({} as any)
      ).resolves.toEqual({
        error: undefined,
        reader: mockReader,
      });
    });

    it('connectHandoffReader returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.connectHandoffReader({} as any)).resolves.toEqual({
        error: undefined,
        reader: mockReader,
      });
    });

    it('connectInternetReader returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.connectInternetReader({} as any)).resolves.toEqual(
        {
          error: undefined,
          reader: mockReader,
        }
      );
    });

    it('connectUsbReader returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.connectUsbReader({} as any)).resolves.toEqual({
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

    it('processPayment returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.processPayment({} as any)).resolves.toEqual({
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

    it('processRefund returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.processRefund()).resolves.toEqual({
        error: undefined,
        refund: mockRefund,
      });
    });

    it('clearCachedCredentials returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.clearCachedCredentials()).resolves.toEqual({});
    });

    it('readReusableCard returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.readReusableCard({} as any)).resolves.toEqual({
        error: undefined,
        paymentMethod: mockPaymentMethod,
      });
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

    it('cancelReadReusableCard returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.cancelReadReusableCard()).resolves.toEqual({});
    });

    it('connectEmbeddedReader returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.connectEmbeddedReader({} as any)).resolves.toEqual(
        {
          error: undefined,
          reader: mockReader,
        }
      );
    });

    it('connectLocalMobileReader returns a proper value', async () => {
      const functions = require('../functions');
      await expect(
        functions.connectLocalMobileReader({} as any)
      ).resolves.toEqual({
        error: undefined,
        reader: mockReader,
      });
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
        connectBluetoothReader: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        connectHandoffReader: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        disconnectReader: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        connectInternetReader: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        connectUsbReader: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        connectLocalMobileReader: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
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
        processPayment: jest
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
        processRefund: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        readReusableCard: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),

        cancelCollectSetupIntent: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        cancelReadReusableCard: jest
          .fn()
          .mockImplementation(() => ({ error: '_error' })),
        connectEmbeddedReader: jest
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

    it('connectBluetoothReader returns a proper value', async () => {
      const functions = require('../functions');
      await expect(
        functions.connectBluetoothReader({} as any)
      ).resolves.toEqual({
        error: '_error',
      });
    });

    it('connectHandoffReader returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.connectHandoffReader({} as any)).resolves.toEqual({
        error: '_error',
      });
    });

    it('connectInternetReader returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.connectInternetReader({} as any)).resolves.toEqual(
        {
          error: '_error',
        }
      );
    });

    it('connectUsbReader returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.connectUsbReader({} as any)).resolves.toEqual({
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

    it('processPayment returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.processPayment({} as any)).resolves.toEqual({
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

    it('processRefund returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.processRefund()).resolves.toEqual({
        error: '_error',
        refund: undefined,
      });
    });

    it('readReusableCard returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.readReusableCard({} as any)).resolves.toEqual({
        error: '_error',
        paymentMethod: undefined,
      });
    });

    it('connectEmbeddedReader returns a proper value', async () => {
      const functions = require('../functions');
      await expect(functions.connectEmbeddedReader({} as any)).resolves.toEqual(
        {
          error: '_error',
          reader: undefined,
        }
      );
    });

    it('connectLocalMobileReader returns a proper value', async () => {
      const functions = require('../functions');
      await expect(
        functions.connectLocalMobileReader({} as any)
      ).resolves.toEqual({
        error: '_error',
        reader: undefined,
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
