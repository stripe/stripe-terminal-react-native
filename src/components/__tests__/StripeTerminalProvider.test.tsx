import * as React from 'react';
import {
  StripeTerminalProvider,
  AppsOnDevicesConnectionTokenProvider,
} from '../StripeTerminalProvider';
import {
  fireEvent,
  render,
  renderHook,
  waitFor,
} from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { useStripeTerminal } from '../../hooks/useStripeTerminal';
import { act } from '@testing-library/react-native';
import * as errorHelpers from '../../Errors/StripeErrorHelpers';
import StripeTerminalSdk from '../../StripeTerminalSdk';
import Logger from '../../logger';
import { StripeTerminalContext } from '../StripeTerminalContext';

jest.mock('../../StripeTerminalSdk', () => ({
  __esModule: true,
  default: { initialize: jest.fn() },
}));

jest.mock('../../logger', () => {
  const actual = jest.requireActual('../../logger');
  const instance = {
    _collector: {
      pushTrace: jest.fn(),
      pushProxyEvent: jest.fn(),
    },
  };
  actual.default.getInstance = jest.fn(() => instance);
  return actual;
});

const nativeInitialize = StripeTerminalSdk.initialize as jest.Mock;
const defaultLocaleConfig = {
  type: 'cardLanguagePreferenceIfAvailable' as const,
};

// Mock NativeEventEmitter properly
jest.mock(
  '../../../node_modules/react-native/Libraries/EventEmitter/NativeEventEmitter',
  () => {
    const listeners = new Map<string, (mockEvent: unknown) => void>();
    const mockAddListener = jest.fn(
      (name: string, listener: (mockEvent: unknown) => void) => {
        listeners.set(name, listener);
        return {
          remove: jest.fn(() => {
            if (listeners.get(name) === listener) {
              listeners.delete(name);
            }
          }),
        };
      }
    );

    class MockNativeEventEmitter {
      addListener = mockAddListener;
      removeAllListeners = jest.fn();
      removeSubscription = jest.fn();
    }
    return {
      __esModule: true,
      default: MockNativeEventEmitter,
      mockNativeEventListeners: listeners,
      mockAddListener,
    };
  }
);

const { mockNativeEventListeners, mockAddListener } = jest.requireMock<{
  mockNativeEventListeners: Map<string, (event: unknown) => void>;
  mockAddListener: jest.Mock;
}>(
  '../../../node_modules/react-native/Libraries/EventEmitter/NativeEventEmitter'
);

const emitNativeEvent = (name: string, event: unknown) => {
  const listener = mockNativeEventListeners.get(name);
  if (!listener) {
    throw new Error(`No native listener registered for ${name}`);
  }

  act(() => {
    listener(event);
  });
};

describe('StripeTerminalProvider.tsx', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNativeEventListeners.clear();
    nativeInitialize.mockReset().mockResolvedValue({});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Logger.setLogLevel(undefined);
  });

  it('renders children correctly', () => {
    const tokenProvider = jest.fn();
    const { toJSON, findByText } = render(
      <StripeTerminalProvider
        tokenProvider={tokenProvider}
        logLevel="error"
        localeConfig={defaultLocaleConfig}
      >
        <Text>test text</Text>
      </StripeTerminalProvider>
    );
    const childText = findByText('test text');
    expect(toJSON()).toMatchSnapshot();
    expect(childText).toBeTruthy();
  });

  it('ensure tokenProvider is not called on render', () => {
    const tokenProvider = jest.fn();
    render(
      <StripeTerminalProvider
        tokenProvider={tokenProvider}
        logLevel="error"
        localeConfig={defaultLocaleConfig}
        children={<></>}
      />
    );
    expect(tokenProvider).not.toHaveBeenCalled();
  });

  describe('provider console logging', () => {
    const forwardedPaymentIntent = {
      id: 'pi_123',
      clientSecret: 'pi_123_secret_private',
      receiptEmail: 'private@example.com',
      metadata: { orderId: 'private-order' },
      offlineDetails: {
        cardPresentDetails: {
          cardholderName: 'Private Name',
          iin: '424242',
          last4: '4242',
          generatedCard: 'pm_generated',
          emvAuthData: 'private-emv-data',
          receiptDetails: {
            applicationCryptogram: 'private-cryptogram',
          },
        },
      },
    };

    it('logs only the event name for a forwarded PaymentIntent in verbose mode', () => {
      const consoleLog = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      render(
        <StripeTerminalProvider
          tokenProvider={jest.fn()}
          logLevel="verbose"
          localeConfig={defaultLocaleConfig}
        >
          <Text>test text</Text>
        </StripeTerminalProvider>
      );

      emitNativeEvent('FORWARD_PAYMENT_INTENT', {
        result: forwardedPaymentIntent,
        error: undefined,
      });

      expect(consoleLog).toHaveBeenCalledTimes(1);
      expect(consoleLog).toHaveBeenCalledWith(
        '[Stripe terminal] didForwardPaymentIntent'
      );
      for (const sensitiveValue of [
        'pi_123_secret_private',
        'private@example.com',
        'private-order',
        'Private Name',
        '424242',
        '4242',
        'pm_generated',
        'private-emv-data',
        'private-cryptogram',
      ]) {
        expect(JSON.stringify(consoleLog.mock.calls)).not.toContain(
          sensitiveValue
        );
      }
    });

    it('does not log a forwarded PaymentIntent when logLevel is omitted', () => {
      const consoleLog = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      render(
        <StripeTerminalProvider
          tokenProvider={jest.fn()}
          localeConfig={defaultLocaleConfig}
        >
          <Text>test text</Text>
        </StripeTerminalProvider>
      );

      emitNativeEvent('FORWARD_PAYMENT_INTENT', {
        result: forwardedPaymentIntent,
        error: undefined,
      });

      expect(consoleLog).not.toHaveBeenCalled();
    });
  });

  it('forwards callback payloads through the class-component emitter', () => {
    const reader = { id: 'tmr_test', serialNumber: 'TEST_READER' };
    const update = {
      deviceSoftwareVersion: '1.2.3',
      estimatedUpdateTime: 'estimateLessThan1Minute',
      requiredAt: '0',
      components: [],
      isTestUpdate: true,
    };
    const listeners = {
      reconnectStarted: jest.fn(),
      reconnectFailed: jest.fn(),
      updateStarted: jest.fn(),
      updateFinished: jest.fn(),
    };
    let observedConnectedReader: unknown;

    const EventSubscriber = () => {
      const { emitter, connectedReader } = React.useContext(StripeTerminalContext);
      observedConnectedReader = connectedReader;

      React.useEffect(() => {
        const subscriptions = [
          emitter?.addListener(
            'START_READER_RECONNECT',
            listeners.reconnectStarted
          ),
          emitter?.addListener(
            'READER_RECONNECT_FAIL',
            listeners.reconnectFailed
          ),
          emitter?.addListener(
            'START_INSTALLING_UPDATE',
            listeners.updateStarted
          ),
          emitter?.addListener(
            'FINISH_INSTALLING_UPDATE',
            listeners.updateFinished
          ),
        ];

        return () =>
          subscriptions.forEach((subscription) => subscription?.remove());
      }, [emitter]);

      return null;
    };

    render(
      <StripeTerminalProvider
        tokenProvider={jest.fn()}
        localeConfig={defaultLocaleConfig}
      >
        <EventSubscriber />
      </StripeTerminalProvider>
    );

    emitNativeEvent('START_INSTALLING_UPDATE', { result: update, reader });
    emitNativeEvent('START_INSTALLING_UPDATE', { result: update });
    expect(listeners.updateStarted).toHaveBeenNthCalledWith(1, update, reader);
    expect(listeners.updateStarted).toHaveBeenNthCalledWith(2, update, undefined);
    expect(observedConnectedReader).toBeUndefined();

    emitNativeEvent('START_READER_RECONNECT', {
      reader,
      reason: 'bluetoothSignalLost',
    });
    emitNativeEvent('READER_RECONNECT_FAIL', { reader });
    emitNativeEvent('FINISH_INSTALLING_UPDATE', {
      result: update,
      error: {
        code: 'READER_SOFTWARE_UPDATE_FAILED',
        nativeErrorCode: 'READER_SOFTWARE_UPDATE_FAILED',
        message: 'update failed',
        metadata: {},
        error_source: 'native',
      },
    });

    expect(listeners.reconnectStarted).toHaveBeenCalledWith(
      reader,
      'bluetoothSignalLost'
    );
    expect(listeners.reconnectFailed).toHaveBeenCalledWith(reader);
    expect(listeners.updateFinished).toHaveBeenCalledWith(
      update,
      expect.objectContaining({
        code: 'READER_SOFTWARE_UPDATE_FAILED',
        message: 'update failed',
      })
    );
  });

  it('records one successful initialize across token preflight and native completion', async () => {
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
    const tokenProvider = jest.fn().mockImplementation(async () => {
      clock.mockReturnValue(1_000_200);
      return 'private_connection_token';
    });
    const reader = { id: 'tmr_test', serialNumber: 'TEST_READER' };
    nativeInitialize.mockImplementation(async () => {
      clock.mockReturnValue(1_000_500);
      return { reader };
    });
    const wrapper = ({ children }: { children: React.ReactElement }) => (
      <StripeTerminalProvider
        tokenProvider={tokenProvider}
        logLevel="error"
        localeConfig={defaultLocaleConfig}
      >
        {children}
      </StripeTerminalProvider>
    );
    const { result } = renderHook(() => useStripeTerminal(), { wrapper });
    let response: Awaited<ReturnType<typeof result.current.initialize>>;

    await act(async () => {
      response = await result.current.initialize();
    });

    expect(tokenProvider).toHaveBeenCalledTimes(1);
    expect(nativeInitialize).toHaveBeenCalledTimes(1);
    expect(response!).toEqual({ reader, error: undefined });
    expect(response!.reader).toBe(reader);
    expect(result.current.connectedReader).toBe(reader);
    expect(result.current.isInitialized).toBe(true);
    expect(result.current.loading).toBe(false);
    const { pushTrace, pushProxyEvent } = Logger.getInstance()._collector;
    expect(pushTrace).toHaveBeenCalledTimes(1);
    const trace = jest.mocked(pushTrace).mock.calls[0][0].trace;
    expect(trace.method).toBe('initialize');
    expect(trace.total_time_ms).toBe(500);
    expect(trace.additional_context.serial_number).toBe('TEST_READER');
    expect(JSON.parse(trace.request)).toEqual({ 'rn-args': [] });
    expect(pushProxyEvent).toHaveBeenCalledTimes(1);
    expect(jest.mocked(pushProxyEvent).mock.calls[0][0].event).toStrictEqual({
      domain: 'terminal_request',
      scope: 'terminal',
      event: 'initialize',
      result: 'OK',
      duration: trace.total_time_ms,
    });
    expect(
      JSON.stringify([
        jest.mocked(pushTrace).mock.calls,
        jest.mocked(pushProxyEvent).mock.calls,
      ])
    ).not.toContain('private_connection_token');
  });

  it('keeps the token provider listener registered across rerenders', () => {
    const tokenProvider = jest.fn();
    const children = <></>;
    const { rerender } = render(
      <StripeTerminalProvider
        tokenProvider={tokenProvider}
        localeConfig={defaultLocaleConfig}
      >
        {children}
      </StripeTerminalProvider>
    );
    const getTokenProviderListenerCalls = () =>
      mockAddListener.mock.calls.filter(
        ([eventName]) => eventName === 'FETCH_TOKEN_PROVIDER'
      );
    const tokenProviderListenerCallIndex = mockAddListener.mock.calls.findIndex(
      ([eventName]) => eventName === 'FETCH_TOKEN_PROVIDER'
    );
    const tokenProviderSubscription =
      mockAddListener.mock.results[tokenProviderListenerCallIndex].value;

    expect(getTokenProviderListenerCalls()).toHaveLength(1);

    rerender(
      <StripeTerminalProvider
        tokenProvider={tokenProvider}
        localeConfig={defaultLocaleConfig}
      >
        {children}
      </StripeTerminalProvider>
    );

    expect(getTokenProviderListenerCalls()).toHaveLength(1);
    expect(tokenProviderSubscription.remove).not.toHaveBeenCalled();
  });

  it('unwraps the RN preflight error when the token provider rejects', async () => {
    const tokenProvider = jest
      .fn()
      .mockRejectedValue(new Error('private_token_provider_failure'));
    const create = jest.spyOn(errorHelpers, 'createInternalStripeError');
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const wrapper = ({ children }: { children: React.ReactElement }) => (
      <StripeTerminalProvider
        tokenProvider={tokenProvider}
        localeConfig={defaultLocaleConfig}
      >
        {children}
      </StripeTerminalProvider>
    );
    const { result } = renderHook(() => useStripeTerminal(), { wrapper });
    let response: Awaited<ReturnType<typeof result.current.initialize>>;

    try {
      await act(async () => {
        response = await result.current.initialize();
      });

      expect(create).toHaveBeenCalledTimes(1);
      const internalError = create.mock.results[0].value;
      expect(internalError.errorSource).toBe('rn');
      expect(response!.error).toBe(internalError.stripeError);
      expect(response!.error).toBeInstanceOf(Error);
      expect(response!.error?.code).toBe('CONNECTION_TOKEN_PROVIDER_ERROR');
      expect(response!.error?.message).toBe(
        "Couldn't fetch connection token. Please check your tokenProvider method"
      );
      for (const field of ['error_source', 'errorSource', 'stripeError']) {
        expect(response!.error).not.toHaveProperty(field);
        expect(Object.keys(response!.error!)).not.toContain(field);
        expect({ ...response!.error }).not.toHaveProperty(field);
        expect(JSON.parse(JSON.stringify(response!.error))).not.toHaveProperty(
          field
        );
      }
      expect(tokenProvider).toHaveBeenCalledTimes(1);
      expect(nativeInitialize).not.toHaveBeenCalled();
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.loading).toBe(false);
      const { pushTrace, pushProxyEvent } = Logger.getInstance()._collector;
      expect(pushTrace).toHaveBeenCalledTimes(1);
      const trace = jest.mocked(pushTrace).mock.calls[0][0].trace;
      expect(JSON.parse(trace.request)).toEqual({ 'rn-args': [] });
      expect(pushProxyEvent).toHaveBeenCalledTimes(1);
      expect(jest.mocked(pushProxyEvent).mock.calls[0][0].event).toStrictEqual({
        domain: 'terminal_request',
        scope: 'terminal',
        event: 'initialize',
        result: 'ERROR',
        duration: trace.total_time_ms,
        outcome: 'CONNECTION_TOKEN_PROVIDER_ERROR',
        tags: { error_source: 'rn' },
      });
      expect(
        JSON.stringify([
          jest.mocked(pushTrace).mock.calls,
          jest.mocked(pushProxyEvent).mock.calls,
        ])
      ).not.toContain('private_token_provider_failure');
      expect(consoleError).toHaveBeenCalledTimes(1);
      expect(consoleError).toHaveBeenCalledWith(
        "Couldn't fetch connection token. Please check your tokenProvider method"
      );
      expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
        'private_token_provider_failure'
      );
    } finally {
      create.mockRestore();
      consoleError.mockRestore();
    }
  });

  it('records a native initialize error and returns its public error', async () => {
    const tokenProvider = jest
      .fn()
      .mockResolvedValue('private_connection_token');
    nativeInitialize.mockResolvedValue({
      error: {
        code: 'CANCELED',
        nativeErrorCode: 'canceled',
        message: 'Initialization was canceled.',
        metadata: {},
        error_source: 'native',
      },
    });
    const rehydrate = jest.spyOn(errorHelpers, 'rehydrateBridgeError');
    const wrapper = ({ children }: { children: React.ReactElement }) => (
      <StripeTerminalProvider
        tokenProvider={tokenProvider}
        localeConfig={defaultLocaleConfig}
      >
        {children}
      </StripeTerminalProvider>
    );
    const { result } = renderHook(() => useStripeTerminal(), { wrapper });
    let response: Awaited<ReturnType<typeof result.current.initialize>>;

    await act(async () => {
      response = await result.current.initialize();
    });

    expect(tokenProvider).toHaveBeenCalledTimes(1);
    expect(nativeInitialize).toHaveBeenCalledTimes(1);
    expect(rehydrate).toHaveBeenCalledTimes(1);
    const internalError = rehydrate.mock.results[0].value;
    expect(internalError.errorSource).toBe('native');
    expect(response!).toEqual({
      error: internalError.stripeError,
      reader: undefined,
    });
    expect(response!.error).toBe(internalError.stripeError);
    expect(response!.error).toBeInstanceOf(Error);
    for (const field of ['error_source', 'errorSource', 'stripeError']) {
      expect(response!.error).not.toHaveProperty(field);
    }
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.loading).toBe(false);
    const { pushTrace, pushProxyEvent } = Logger.getInstance()._collector;
    expect(pushTrace).toHaveBeenCalledTimes(1);
    const trace = jest.mocked(pushTrace).mock.calls[0][0].trace;
    expect(pushProxyEvent).toHaveBeenCalledTimes(1);
    expect(jest.mocked(pushProxyEvent).mock.calls[0][0].event).toStrictEqual({
      domain: 'terminal_request',
      scope: 'terminal',
      event: 'initialize',
      result: 'ERROR',
      duration: trace.total_time_ms,
      outcome: 'CANCELED',
      tags: { error_source: 'native' },
    });
    expect(
      JSON.stringify([
        jest.mocked(pushTrace).mock.calls,
        jest.mocked(pushProxyEvent).mock.calls,
      ])
    ).not.toContain('private_connection_token');
  });

  describe('useAppsOnDevicesConnectionTokenProvider parameter', () => {
    it('passes useAppsOnDevicesConnectionTokenProvider: true when AppsOnDevicesConnectionTokenProvider is used', async () => {
      const ChildImpl = () => {
        const { initialize } = useStripeTerminal();

        return (
          <TouchableOpacity onPress={() => initialize()}>
            <Text>init</Text>
          </TouchableOpacity>
        );
      };

      const { findByText } = render(
        <StripeTerminalProvider
          tokenProvider={AppsOnDevicesConnectionTokenProvider}
          logLevel="verbose"
          localeConfig={defaultLocaleConfig}
        >
          <ChildImpl />
        </StripeTerminalProvider>
      );

      await act(async () => {
        fireEvent.press(await findByText('init'));
      });

      await waitFor(() => {
        expect(nativeInitialize).toHaveBeenCalledWith({
          reactNativeVersion: expect.any(String),
          logLevel: 'verbose',
          localeConfig: defaultLocaleConfig,
          useAppsOnDevicesConnectionTokenProvider: true,
        });
      });
      expect(nativeInitialize).toHaveBeenCalledTimes(1);
      const { pushTrace, pushProxyEvent } = Logger.getInstance()._collector;
      expect(pushTrace).toHaveBeenCalledTimes(1);
      const trace = jest.mocked(pushTrace).mock.calls[0][0].trace;
      expect(pushProxyEvent).toHaveBeenCalledTimes(1);
      expect(jest.mocked(pushProxyEvent).mock.calls[0][0].event).toStrictEqual({
        domain: 'terminal_request',
        scope: 'terminal',
        event: 'initialize',
        result: 'OK',
        duration: trace.total_time_ms,
      });
    });

    it('passes useAppsOnDevicesConnectionTokenProvider: false when standard tokenProvider is used', async () => {
      const standardTokenProvider = jest
        .fn()
        .mockResolvedValue('test_connection_token');

      const ChildImpl = () => {
        const { initialize } = useStripeTerminal();

        return (
          <TouchableOpacity onPress={() => initialize()}>
            <Text>init</Text>
          </TouchableOpacity>
        );
      };

      const { findByText } = render(
        <StripeTerminalProvider
          tokenProvider={standardTokenProvider}
          logLevel="verbose"
          localeConfig={defaultLocaleConfig}
        >
          <ChildImpl />
        </StripeTerminalProvider>
      );

      await act(async () => {
        fireEvent.press(await findByText('init'));
      });

      await waitFor(() => {
        expect(nativeInitialize).toHaveBeenCalledWith({
          reactNativeVersion: expect.any(String),
          logLevel: 'verbose',
          localeConfig: defaultLocaleConfig,
          useAppsOnDevicesConnectionTokenProvider: false,
        });
      });
    });

    it('passes localeConfig through initParams', async () => {
      const standardTokenProvider = jest
        .fn()
        .mockResolvedValue('test_connection_token');
      const localeConfig = { type: 'hardcoded' as const, locale: 'fr-FR' };

      const ChildImpl = () => {
        const { initialize } = useStripeTerminal();

        return (
          <TouchableOpacity onPress={() => initialize()}>
            <Text>init</Text>
          </TouchableOpacity>
        );
      };

      const { findByText } = render(
        <StripeTerminalProvider
          tokenProvider={standardTokenProvider}
          logLevel="verbose"
          localeConfig={localeConfig}
        >
          <ChildImpl />
        </StripeTerminalProvider>
      );

      await act(async () => {
        fireEvent.press(await findByText('init'));
      });

      await waitFor(() => {
        expect(nativeInitialize).toHaveBeenCalledWith({
          reactNativeVersion: expect.any(String),
          logLevel: 'verbose',
          localeConfig,
          useAppsOnDevicesConnectionTokenProvider: false,
        });
      });
    });
  });
});
