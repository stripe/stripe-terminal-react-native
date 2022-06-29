import * as React from 'react';
import { useStripeTerminal } from '../useStripeTerminal';
import { act, renderHook } from '@testing-library/react-native';
import { StripeTerminalContext } from '../../components/StripeTerminalContext';
import * as functions from '../../functions';

jest.mock(
  '../../../node_modules/react-native/Libraries/EventEmitter/NativeEventEmitter'
);

function spyAllFunctions({ returnWith = null }: { returnWith?: any } = {}) {
  const createSetupIntent = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'createSetupIntent')
    .mockImplementation(createSetupIntent);
  //
  const connectBluetoothReader = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'connectBluetoothReader')
    .mockImplementation(connectBluetoothReader);
  //
  const discoverReaders = jest.fn(() => returnWith);
  jest.spyOn(functions, 'discoverReaders').mockImplementation(discoverReaders);
  //
  const cancelDiscovering = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'cancelDiscovering')
    .mockImplementation(cancelDiscovering);
  //
  const connectInternetReader = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'connectInternetReader')
    .mockImplementation(connectInternetReader);
  //
  const connectUsbReader = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'connectUsbReader')
    .mockImplementation(connectUsbReader);
  //
  const createPaymentIntent = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'createPaymentIntent')
    .mockImplementation(createPaymentIntent);
  //
  const collectPaymentMethod = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'collectPaymentMethod')
    .mockImplementation(collectPaymentMethod);
  //
  const retrievePaymentIntent = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'retrievePaymentIntent')
    .mockImplementation(retrievePaymentIntent);
  //
  const getLocations = jest.fn(() => returnWith);
  jest.spyOn(functions, 'getLocations').mockImplementation(getLocations);
  //
  const processPayment = jest.fn(() => returnWith);
  jest.spyOn(functions, 'processPayment').mockImplementation(processPayment);
  //
  const cancelPaymentIntent = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'cancelPaymentIntent')
    .mockImplementation(cancelPaymentIntent);
  //
  const disconnectReader = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'disconnectReader')
    .mockImplementation(disconnectReader);
  //

  const installAvailableUpdate = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'installAvailableUpdate')
    .mockImplementation(installAvailableUpdate);
  //
  const cancelInstallingUpdate = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'cancelInstallingUpdate')
    .mockImplementation(cancelInstallingUpdate);
  //
  const setReaderDisplay = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'setReaderDisplay')
    .mockImplementation(setReaderDisplay);

  //
  const clearReaderDisplay = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'clearReaderDisplay')
    .mockImplementation(clearReaderDisplay);

  //
  const retrieveSetupIntent = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'retrieveSetupIntent')
    .mockImplementation(retrieveSetupIntent);

  //
  const collectSetupIntentPaymentMethod = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'collectSetupIntentPaymentMethod')
    .mockImplementation(collectSetupIntentPaymentMethod);

  //
  const cancelSetupIntent = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'cancelSetupIntent')
    .mockImplementation(cancelSetupIntent);

  //
  const confirmSetupIntent = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'confirmSetupIntent')
    .mockImplementation(confirmSetupIntent);

  //
  const simulateReaderUpdate = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'simulateReaderUpdate')
    .mockImplementation(simulateReaderUpdate);

  //
  const collectRefundPaymentMethod = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'collectRefundPaymentMethod')
    .mockImplementation(collectRefundPaymentMethod);

  //
  const processRefund = jest.fn(() => returnWith);
  jest.spyOn(functions, 'processRefund').mockImplementation(processRefund);

  //
  const readReusableCard = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'readReusableCard')
    .mockImplementation(readReusableCard);

  //
  const cancelCollectPaymentMethod = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'cancelCollectPaymentMethod')
    .mockImplementation(cancelCollectPaymentMethod);

  //
  const cancelCollectRefundPaymentMethod = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'cancelCollectRefundPaymentMethod')
    .mockImplementation(cancelCollectRefundPaymentMethod);

  //
  const cancelCollectSetupIntent = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'cancelCollectSetupIntent')
    .mockImplementation(cancelCollectSetupIntent);

  //
  const cancelReadReusableCard = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'cancelReadReusableCard')
    .mockImplementation(cancelReadReusableCard);

  //
  const connectEmbeddedReader = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'connectEmbeddedReader')
    .mockImplementation(connectEmbeddedReader);

  //
  const connectHandoffReader = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'connectHandoffReader')
    .mockImplementation(connectHandoffReader);

  //
  const connectLocalMobileReader = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'connectLocalMobileReader')
    .mockImplementation(connectLocalMobileReader);

  //
  const setSimulatedCard = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'setSimulatedCard')
    .mockImplementation(setSimulatedCard);

  return {
    discoverReaders,
    cancelDiscovering,
    connectBluetoothReader,
    disconnectReader,
    connectInternetReader,
    connectUsbReader,
    createPaymentIntent,
    collectPaymentMethod,
    retrievePaymentIntent,
    getLocations,
    processPayment,
    createSetupIntent,
    cancelPaymentIntent,
    installAvailableUpdate,
    cancelInstallingUpdate,
    setReaderDisplay,
    clearReaderDisplay,
    retrieveSetupIntent,
    collectSetupIntentPaymentMethod,
    cancelSetupIntent,
    confirmSetupIntent,
    simulateReaderUpdate,
    collectRefundPaymentMethod,
    processRefund,
    readReusableCard,
    cancelCollectPaymentMethod,
    cancelCollectRefundPaymentMethod,
    cancelCollectSetupIntent,
    cancelReadReusableCard,
    connectEmbeddedReader,
    connectHandoffReader,
    connectLocalMobileReader,
    setSimulatedCard,
  };
}

const createContextWrapper =
  (providerProps: any): React.FC =>
  ({ children }) =>
    (
      <StripeTerminalContext.Provider
        value={{
          isInitialized: false,
          loading: false,
          discoveredReaders: [],
          setConnectedReader: jest.fn(),
          log: jest.fn(),
          setDiscoveredReaders: jest.fn(),
          setIsInitialized: jest.fn(),
          setLoading: jest.fn(),
          connectedReader: null,
          emitter: undefined,
          initialize: jest.fn(),
          ...providerProps,
        }}
      >
        {children}
      </StripeTerminalContext.Provider>
    );

describe('useStripeTerminal.test.tsx', () => {
  describe('Public API snapshot', () => {
    it('ensure there are no unexpected changes to the hook exports', () => {
      const { result } = renderHook(() => useStripeTerminal(), {
        wrapper: createContextWrapper({}),
      });

      expect(result).toMatchSnapshot();
    });
  });

  it('should use context values', () => {
    const { result } = renderHook(() => useStripeTerminal(), {
      wrapper: createContextWrapper({
        isInitialized: true,
        loading: false,
        connectedReader: { id: 12 },
        discoveredReaders: [{ id: 12 }, { id: 15 }],
      }),
    });

    const { isInitialized, loading, connectedReader, discoveredReaders } =
      result.current;

    expect(isInitialized).toEqual(true);
    expect(loading).toEqual(loading);
    expect(connectedReader).toMatchObject({ id: 12 });
    expect(discoveredReaders).toMatchObject([{ id: 12 }, { id: 15 }]);
  });

  describe('Public methods are called properly', () => {
    it('clearCachedCredentials is called', () => {
      const clearCachedCredentials = jest.fn();
      jest
        .spyOn(functions, 'clearCachedCredentials')
        .mockImplementation(clearCachedCredentials);

      const ContextWrapper = createContextWrapper({});
      const { result } = renderHook(() => useStripeTerminal(), {
        wrapper: ContextWrapper,
      });

      act(() => {
        result.current.clearCachedCredentials();
      });

      expect(clearCachedCredentials).toBeCalled();
    });

    it('initialized method is called', () => {
      const initializeFn = jest.fn();
      const ContextWrapper = createContextWrapper({ initialize: initializeFn });
      const { result } = renderHook(() => useStripeTerminal(), {
        wrapper: ContextWrapper,
      });

      act(() => {
        result.current.initialize();
      });

      expect(initializeFn).toBeCalled();
    });

    it('public methods are called when it is initialized', () => {
      const fns = spyAllFunctions();

      const ContextWrapper = createContextWrapper({ isInitialized: true });
      const { result } = renderHook(() => useStripeTerminal(), {
        wrapper: ContextWrapper,
      });

      act(() => {
        result.current.connectBluetoothReader({} as any);
        result.current.discoverReaders({} as any);
        result.current.cancelCollectPaymentMethod();
        result.current.cancelDiscovering();
        result.current.cancelCollectRefundPaymentMethod();
        result.current.cancelInstallingUpdate();
        result.current.cancelPaymentIntent('');
        result.current.cancelReadReusableCard();
        result.current.cancelSetupIntent('');
        result.current.clearCachedCredentials();
        result.current.clearReaderDisplay();
        result.current.collectPaymentMethod({} as any);
        result.current.collectRefundPaymentMethod({} as any);
        result.current.collectSetupIntentPaymentMethod({} as any);
        result.current.confirmSetupIntent('');
        result.current.connectBluetoothReader({} as any);
        result.current.connectEmbeddedReader({} as any);
        result.current.connectHandoffReader({} as any);
        result.current.connectInternetReader({} as any);
        result.current.connectLocalMobileReader({} as any);
        result.current.connectUsbReader({} as any);
        result.current.createPaymentIntent({} as any);
        result.current.createSetupIntent({} as any);
        result.current.disconnectReader();
        result.current.retrievePaymentIntent('');
        result.current.getLocations({} as any);
        result.current.processPayment('');
        result.current.retrieveSetupIntent('');
        result.current.simulateReaderUpdate({} as any);
        result.current.readReusableCard({} as any);
        result.current.setSimulatedCard('');
        result.current.installAvailableUpdate();
        result.current.setReaderDisplay({} as any);
        result.current.processRefund();
        result.current.cancelCollectSetupIntent();
      });

      Object.values(fns).forEach((fn) => {
        expect(fn).toBeCalled();
      });
    });

    it('public methods are not called when it is not initialized', () => {
      const fns = spyAllFunctions();
      console.error = jest.fn();

      const ContextWrapper = createContextWrapper({ isInitialized: false });
      const { result } = renderHook(() => useStripeTerminal(), {
        wrapper: ContextWrapper,
      });

      act(() => {
        result.current.connectBluetoothReader({} as any);
        result.current.discoverReaders({} as any);
        result.current.cancelCollectPaymentMethod();
        result.current.cancelDiscovering();
        result.current.cancelCollectRefundPaymentMethod();
        result.current.cancelInstallingUpdate();
        result.current.cancelPaymentIntent('');
        result.current.cancelReadReusableCard();
        result.current.cancelSetupIntent('');
        result.current.clearReaderDisplay();
        result.current.collectPaymentMethod({} as any);
        result.current.collectRefundPaymentMethod({} as any);
        result.current.collectSetupIntentPaymentMethod({} as any);
        result.current.confirmSetupIntent('');
        result.current.connectBluetoothReader({} as any);
        result.current.connectEmbeddedReader({} as any);
        result.current.connectHandoffReader({} as any);
        result.current.connectInternetReader({} as any);
        result.current.connectLocalMobileReader({} as any);
        result.current.connectUsbReader({} as any);
        result.current.createPaymentIntent({} as any);
        result.current.createSetupIntent({} as any);
        result.current.disconnectReader();
        result.current.retrievePaymentIntent('');
        result.current.getLocations({} as any);
        result.current.processPayment('');
        result.current.retrieveSetupIntent('');
        result.current.simulateReaderUpdate({} as any);
        result.current.readReusableCard({} as any);
        result.current.setSimulatedCard('');
        result.current.installAvailableUpdate();
        result.current.setReaderDisplay({} as any);
        result.current.processRefund();
        result.current.cancelCollectSetupIntent();
      });

      Object.values(fns).forEach((fn) => {
        expect(fn).not.toBeCalled();
      });
      expect(console.error).toBeCalledWith(
        'First initialize the Stripe Terminal SDK before performing any action'
      );
      expect(console.error).toBeCalledTimes(34);
    });

    it('public methods are returns with mocked value', async () => {
      spyAllFunctions({ returnWith: '_value' });

      const ContextWrapper = createContextWrapper({ isInitialized: true });
      const { result } = renderHook(() => useStripeTerminal(), {
        wrapper: ContextWrapper,
      });

      await expect(
        result.current.connectBluetoothReader({} as any)
      ).resolves.toEqual('_value');
      await expect(result.current.discoverReaders({} as any)).resolves.toEqual(
        '_value'
      );
      await expect(
        result.current.cancelCollectPaymentMethod()
      ).resolves.toEqual('_value');
      await expect(result.current.cancelDiscovering()).resolves.toEqual(
        '_value'
      );
      await expect(
        result.current.cancelCollectRefundPaymentMethod()
      ).resolves.toEqual('_value');
      await expect(result.current.cancelInstallingUpdate()).resolves.toEqual(
        '_value'
      );
      await expect(
        result.current.cancelPaymentIntent({} as any)
      ).resolves.toEqual('_value');
      await expect(result.current.cancelReadReusableCard()).resolves.toEqual(
        '_value'
      );
      await expect(
        result.current.cancelSetupIntent({} as any)
      ).resolves.toEqual('_value');
      await expect(result.current.clearReaderDisplay()).resolves.toEqual(
        '_value'
      );
      await expect(
        result.current.collectPaymentMethod({} as any)
      ).resolves.toEqual('_value');
      await expect(
        result.current.collectRefundPaymentMethod({} as any)
      ).resolves.toEqual('_value');
      await expect(
        result.current.collectSetupIntentPaymentMethod({} as any)
      ).resolves.toEqual('_value');
      await expect(
        result.current.confirmSetupIntent({} as any)
      ).resolves.toEqual('_value');
      await expect(
        result.current.connectEmbeddedReader({} as any)
      ).resolves.toEqual('_value');
      await expect(
        result.current.connectHandoffReader({} as any)
      ).resolves.toEqual('_value');
      await expect(
        result.current.connectInternetReader({} as any)
      ).resolves.toEqual('_value');
      await expect(
        result.current.connectLocalMobileReader({} as any)
      ).resolves.toEqual('_value');
      await expect(result.current.connectUsbReader({} as any)).resolves.toEqual(
        '_value'
      );
      await expect(
        result.current.createPaymentIntent({} as any)
      ).resolves.toEqual('_value');
      await expect(
        result.current.createSetupIntent({} as any)
      ).resolves.toEqual('_value');
      await expect(result.current.disconnectReader()).resolves.toEqual(
        '_value'
      );
      await expect(
        result.current.retrievePaymentIntent({} as any)
      ).resolves.toEqual('_value');
      await expect(result.current.getLocations({} as any)).resolves.toEqual(
        '_value'
      );
      await expect(result.current.processPayment({} as any)).resolves.toEqual(
        '_value'
      );
      await expect(
        result.current.retrieveSetupIntent({} as any)
      ).resolves.toEqual('_value');
      await expect(
        result.current.simulateReaderUpdate({} as any)
      ).resolves.toEqual('_value');
      await expect(result.current.readReusableCard({} as any)).resolves.toEqual(
        '_value'
      );
      await expect(result.current.setSimulatedCard({} as any)).resolves.toEqual(
        '_value'
      );
      await expect(result.current.installAvailableUpdate()).resolves.toEqual(
        '_value'
      );
      await expect(result.current.setReaderDisplay({} as any)).resolves.toEqual(
        '_value'
      );
      await expect(result.current.processRefund()).resolves.toEqual('_value');
      await expect(result.current.cancelCollectSetupIntent()).resolves.toEqual(
        '_value'
      );
    });
  });
});
