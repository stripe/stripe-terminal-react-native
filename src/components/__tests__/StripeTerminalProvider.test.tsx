import * as React from 'react';
import {
  StripeTerminalProvider,
  AppsOnDevicesConnectionTokenProvider,
} from '../StripeTerminalProvider';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { useStripeTerminal } from '../../hooks/useStripeTerminal';
import { act } from '@testing-library/react-native';
import * as functions from '../../functions';

// Mock NativeEventEmitter properly
jest.mock(
  '../../../node_modules/react-native/Libraries/EventEmitter/NativeEventEmitter',
  () => {
    class MockNativeEventEmitter {
      addListener = jest.fn(() => ({
        remove: jest.fn(),
      }));
      removeAllListeners = jest.fn();
      removeSubscription = jest.fn();
    }
    return {
      __esModule: true,
      default: MockNativeEventEmitter,
    };
  }
);

describe('StripeTerminalProvider.tsx', () => {
  it('renders children correctly', () => {
    const tokenProvider = jest.fn();
    const { toJSON, findByText } = render(
      <StripeTerminalProvider tokenProvider={tokenProvider} logLevel="error">
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
        children={<></>}
      />
    );
    expect(tokenProvider).not.toHaveBeenCalled();
  });

  it('trigger tokenProvider on init', async () => {
    const tokenProvider = jest.fn().mockReturnValue('_token');

    const ChildImpl = () => {
      const { initialize } = useStripeTerminal();

      return (
        <TouchableOpacity onPress={() => initialize()}>
          <Text>init</Text>
        </TouchableOpacity>
      );
    };

    const { findByText } = render(
      <StripeTerminalProvider tokenProvider={tokenProvider} logLevel="error">
        <ChildImpl />
      </StripeTerminalProvider>
    );

    await act(async () => {
      fireEvent.press(await findByText('init'));
    });

    expect(tokenProvider).toHaveBeenCalled();
    expect(tokenProvider).toHaveReturnedWith('_token');
  });

  describe('useAppsOnDevicesConnectionTokenProvider parameter', () => {
    let initializeSpy: jest.SpyInstance;

    beforeEach(() => {
      initializeSpy = jest
        .spyOn(functions, 'initialize')
        .mockResolvedValue({ reader: undefined, error: undefined });
    });

    afterEach(() => {
      initializeSpy.mockRestore();
    });

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
        >
          <ChildImpl />
        </StripeTerminalProvider>
      );

      await act(async () => {
        fireEvent.press(await findByText('init'));
      });

      await waitFor(() => {
        expect(initializeSpy).toHaveBeenCalledWith({
          initParams: { logLevel: 'verbose' },
          useAppsOnDevicesConnectionTokenProvider: true,
        });
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
        >
          <ChildImpl />
        </StripeTerminalProvider>
      );

      await act(async () => {
        fireEvent.press(await findByText('init'));
      });

      await waitFor(() => {
        expect(initializeSpy).toHaveBeenCalledWith({
          initParams: { logLevel: 'verbose' },
          useAppsOnDevicesConnectionTokenProvider: false,
        });
      });
    });
  });
});
