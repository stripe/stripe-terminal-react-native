import * as React from 'react';
import { useStripeTerminal } from '../useStripeTerminal';
import { act, renderHook } from '@testing-library/react-native';
import { StripeTerminalContext } from '../../components/StripeTerminalContext';
import * as functions from '../../functions';

jest.mock(
  '../../../node_modules/react-native/Libraries/EventEmitter/NativeEventEmitter'
);

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
      const connectBluetoothReaderFn = jest.fn();
      const discoverReadersFn = jest.fn();
      const cancelDiscoveringFn = jest.fn();

      jest
        .spyOn(functions, 'connectBluetoothReader')
        .mockImplementation(connectBluetoothReaderFn);
      jest
        .spyOn(functions, 'discoverReaders')
        .mockImplementation(discoverReadersFn);
      jest
        .spyOn(functions, 'cancelDiscovering')
        .mockImplementation(cancelDiscoveringFn);

      const ContextWrapper = createContextWrapper({ isInitialized: true });
      const { result } = renderHook(() => useStripeTerminal(), {
        wrapper: ContextWrapper,
      });

      act(() => {
        result.current.connectBluetoothReader({} as any);
        result.current.discoverReaders({} as any);
        result.current.cancelDiscovering();
      });

      expect(connectBluetoothReaderFn).toBeCalled();
      expect(discoverReadersFn).toBeCalled();
      expect(cancelDiscoveringFn).toBeCalled();
    });

    it('public methods are not called when it is not initialized', () => {
      const connectBluetoothReaderFn = jest.fn();
      const discoverReadersFn = jest.fn();
      const cancelDiscoveringFn = jest.fn();

      jest
        .spyOn(functions, 'connectBluetoothReader')
        .mockImplementation(connectBluetoothReaderFn);
      jest
        .spyOn(functions, 'discoverReaders')
        .mockImplementation(discoverReadersFn);
      jest
        .spyOn(functions, 'cancelDiscovering')
        .mockImplementation(cancelDiscoveringFn);

      console.error = jest.fn();

      const ContextWrapper = createContextWrapper({ isInitialized: false });
      const { result } = renderHook(() => useStripeTerminal(), {
        wrapper: ContextWrapper,
      });

      act(() => {
        result.current.connectBluetoothReader({} as any);
        result.current.discoverReaders({} as any);
        result.current.cancelDiscovering();
      });

      expect(connectBluetoothReaderFn).not.toBeCalled();
      expect(discoverReadersFn).not.toBeCalled();
      expect(cancelDiscoveringFn).not.toBeCalled();
      expect(console.error).toBeCalledWith(
        'First initialize the Stripe Terminal SDK before performing any action'
      );
      expect(console.error).toBeCalledTimes(3);
    });
  });
});
