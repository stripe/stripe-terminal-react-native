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
  const connectReader = jest.fn(() => returnWith);
  jest.spyOn(functions, 'connectReader').mockImplementation(connectReader);
  //
  const discoverReaders = jest.fn(() => returnWith);
  jest.spyOn(functions, 'discoverReaders').mockImplementation(discoverReaders);
  //
  const cancelDiscovering = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'cancelDiscovering')
    .mockImplementation(cancelDiscovering);
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
  const confirmPaymentIntent = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'confirmPaymentIntent')
    .mockImplementation(confirmPaymentIntent);
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
  const rebootReader = jest.fn(() => returnWith);
  jest.spyOn(functions, 'rebootReader').mockImplementation(rebootReader);
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
  const confirmRefund = jest.fn(() => returnWith);
  jest.spyOn(functions, 'confirmRefund').mockImplementation(confirmRefund);

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
  const setSimulatedCard = jest.fn(() => returnWith);
  jest
    .spyOn(functions, 'setSimulatedCard')
    .mockImplementation(setSimulatedCard);

  return {
    discoverReaders,
    cancelDiscovering,
    connectReader,
    disconnectReader,
    rebootReader,
    createPaymentIntent,
    collectPaymentMethod,
    retrievePaymentIntent,
    getLocations,
    confirmPaymentIntent,
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
    confirmRefund,
    cancelCollectPaymentMethod,
    cancelCollectRefundPaymentMethod,
    cancelCollectSetupIntent,
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
      const fns = spyAllFunctions({ returnWith: '_value' });

      const ContextWrapper = createContextWrapper({ isInitialized: true });
      const { result } = renderHook(() => useStripeTerminal(), {
        wrapper: ContextWrapper,
      });

      act(() => {
        try {
          result.current.discoverReaders({} as any);
          result.current.cancelCollectPaymentMethod();
          result.current.cancelDiscovering();
          result.current.cancelCollectRefundPaymentMethod();
          result.current.cancelInstallingUpdate();
          result.current.cancelPaymentIntent({} as any);
          result.current.cancelSetupIntent({} as any);
          result.current.clearCachedCredentials();
          result.current.clearReaderDisplay();
          result.current.collectPaymentMethod({} as any);
          result.current.collectRefundPaymentMethod({} as any);
          result.current.collectSetupIntentPaymentMethod({} as any);
          result.current.confirmSetupIntent({} as any);
          result.current.connectReader({} as any, {} as any);
          result.current.createPaymentIntent({} as any);
          result.current.createSetupIntent({} as any);
          result.current.disconnectReader();
          result.current.rebootReader();
          result.current.retrievePaymentIntent('');
          result.current.getLocations({} as any);
          result.current.confirmPaymentIntent({} as any);
          result.current.retrieveSetupIntent('');
          result.current.simulateReaderUpdate({} as any);
          result.current.setSimulatedCard('');
          result.current.installAvailableUpdate();
          result.current.setReaderDisplay({} as any);
          result.current.confirmRefund();
          result.current.cancelCollectSetupIntent();
        } catch (error) {
          console.error(error);
        }
      });

      Object.values(fns).forEach((fn) => {
        expect(fn).toBeCalled();
      });
    });

    it('public methods are not called when it is not initialized', async () => {
      const fns = spyAllFunctions();
      console.error = jest.fn();

      const ContextWrapper = createContextWrapper({ isInitialized: false });
      const { result } = renderHook(() => useStripeTerminal(), {
        wrapper: ContextWrapper,
      });

      try {
        await result.current.connectReader({} as any, {} as any);
        await result.current.discoverReaders({} as any);
        await result.current.cancelCollectPaymentMethod();
        await result.current.cancelDiscovering();
        await result.current.cancelCollectRefundPaymentMethod();
        await result.current.cancelInstallingUpdate();
        await result.current.cancelPaymentIntent({} as any);
        await result.current.cancelSetupIntent({} as any);
        await result.current.clearReaderDisplay();
        await result.current.collectPaymentMethod({} as any);
        await result.current.collectRefundPaymentMethod({} as any);
        await result.current.collectSetupIntentPaymentMethod({} as any);
        await result.current.confirmSetupIntent({} as any);
        await result.current.connectReader({} as any, {} as any);
        await result.current.createPaymentIntent({} as any);
        await result.current.createSetupIntent({} as any);
        await result.current.disconnectReader();
        await result.current.rebootReader();
        await result.current.retrievePaymentIntent('');
        await result.current.getLocations({} as any);
        await result.current.confirmPaymentIntent({} as any);
        await result.current.retrieveSetupIntent('');
        await result.current.simulateReaderUpdate({} as any);
        await result.current.setSimulatedCard('');
        await result.current.installAvailableUpdate();
        await result.current.setReaderDisplay({} as any);
        await result.current.confirmRefund();
        await result.current.cancelCollectSetupIntent();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.message).toEqual(
            'First initialize the Stripe Terminal SDK before performing any action'
          );
        }
      }

      Object.values(fns).forEach((fn) => {
        expect(fn).not.toBeCalled();
      });
      expect(console.error).toBeCalledWith(
        'First initialize the Stripe Terminal SDK before performing any action'
      );
      expect(console.error).toBeCalledTimes(1);
    });

    it('public methods are returns with mocked value', async () => {
      spyAllFunctions({ returnWith: '_value' });

      const ContextWrapper = createContextWrapper({ isInitialized: true });
      const { result } = renderHook(() => useStripeTerminal(), {
        wrapper: ContextWrapper,
      });

      await expect(
        result.current.connectReader({} as any, {} as any)
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
        result.current.createPaymentIntent({} as any)
      ).resolves.toEqual('_value');
      await expect(
        result.current.createSetupIntent({} as any)
      ).resolves.toEqual('_value');
      await expect(result.current.disconnectReader()).resolves.toEqual(
        '_value'
      );
      await expect(result.current.rebootReader()).resolves.toEqual('_value');
      await expect(
        result.current.retrievePaymentIntent({} as any)
      ).resolves.toEqual('_value');
      await expect(result.current.getLocations({} as any)).resolves.toEqual(
        '_value'
      );
      await expect(
        result.current.confirmPaymentIntent({} as any)
      ).resolves.toEqual('_value');
      await expect(
        result.current.retrieveSetupIntent({} as any)
      ).resolves.toEqual('_value');
      await expect(
        result.current.simulateReaderUpdate({} as any)
      ).resolves.toEqual('_value');
      await expect(result.current.setSimulatedCard({} as any)).resolves.toEqual(
        '_value'
      );
      await expect(result.current.installAvailableUpdate()).resolves.toEqual(
        '_value'
      );
      await expect(result.current.setReaderDisplay({} as any)).resolves.toEqual(
        '_value'
      );
      await expect(result.current.confirmRefund()).resolves.toEqual('_value');
      await expect(result.current.cancelCollectSetupIntent()).resolves.toEqual(
        '_value'
      );
    });
  });
});
