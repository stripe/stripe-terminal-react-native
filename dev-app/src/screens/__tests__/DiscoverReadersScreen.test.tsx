import React from 'react';
import { Platform } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { useStripeTerminal } from '@stripe/stripe-terminal-react-native';
import type { Reader } from '../../../../src/types';
import DiscoverReadersScreen from '../DiscoverReadersScreen';

// Share React and RN with the renderer, regardless of dependency hoisting.
jest.mock('react', () =>
  jest.requireActual(
    require.resolve('react', {
      paths: [require.resolve('@testing-library/react-native')],
    })
  )
);
jest.mock('react-native', () =>
  jest.requireActual(
    require.resolve('react-native', {
      paths: [require.resolve('@testing-library/react-native')],
    })
  )
);
jest.mock(
  '@stripe/stripe-terminal-react-native',
  () => ({
    ...jest.requireActual('../../../../src/types'),
    useStripeTerminal: jest.fn(),
  }),
  { virtual: true }
);
jest.mock(
  '@react-navigation/core',
  () => ({
    useNavigation: () => mockNavigation,
    useRoute: () => ({
      params: { discoveryMethod: 'tapToPay', simulated: true },
    }),
  }),
  { virtual: true }
);
jest.mock(
  'react-native-safe-area-context',
  () => ({
    SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  }),
  { virtual: true }
);
jest.mock('../../AppContext', () => ({
  AppContext: jest.requireMock<typeof import('react')>('react').createContext({
    autoReconnectOnUnexpectedDisconnect: true,
    setAutoReconnectOnUnexpectedDisconnect: jest.fn(),
  }),
}));
jest.mock('../../util/errorHandling', () => ({ showErrorAlert: jest.fn() }));
jest.mock('../../components/QrModalContext', () => ({
  useQrModal: () => ({ showQrModal: jest.fn() }),
}));

const mockNavigation = {
  setOptions: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  canGoBack: () => false,
};
const reader: Reader.Type = {
  serialNumber: 'tap-to-pay-reader',
  deviceType: 'tapToPay',
  locationStatus: 'set',
  location: { id: 'tml_test' },
  status: 'online',
  simulated: true,
};

const originalPlatform = Platform.OS;
afterEach(() => {
  Platform.OS = originalPlatform;
  jest.clearAllMocks();
});

it.each(['ios', 'android'] as const)(
  'registers both payment interaction callbacks when connecting Tap to Pay on %s',
  async (platform) => {
    Platform.OS = platform;
    const connectReader = jest.fn().mockResolvedValue({ reader });
    (useStripeTerminal as jest.Mock).mockReturnValue({
      connectReader,
      discoverReaders: jest.fn().mockResolvedValue({}),
      discoveredReaders: [reader],
      cancelDiscovering: jest.fn(),
    });
    const screen = render(<DiscoverReadersScreen />);
    await act(async () => {
      fireEvent.press(screen.getByTestId('reader-0'));
    });

    expect(connectReader).toHaveBeenCalledTimes(1);
    expect(connectReader).toHaveBeenCalledWith({
      discoveryMethod: 'tapToPay',
      reader,
      locationId: 'tml_test',
      autoReconnectOnUnexpectedDisconnect: true,
      onPaymentMethodSelectionRequired: expect.any(Function),
      onQrCodeDisplayRequired: expect.any(Function),
      ...(platform === 'ios' ? { testReaderUpdate: undefined } : {}),
    });
    if (platform === 'android') {
      expect(connectReader.mock.calls[0][0]).not.toHaveProperty('testReaderUpdate');
    }
  }
);
