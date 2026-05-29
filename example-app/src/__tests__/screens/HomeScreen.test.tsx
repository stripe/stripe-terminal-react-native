import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../../screens/HomeScreen';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

// Mock Stripe Terminal
const mockDisconnectReader = jest.fn();
jest.mock('@stripe/stripe-terminal-react-native', () => ({
  useStripeTerminal: jest.fn(() => ({
    disconnectReader: mockDisconnectReader,
    connectedReader: null,
  })),
  requestNeededAndroidPermissions: jest.fn(),
}));

// Mock storage
jest.mock('../../util/merchantStorage', () => ({
  getDiscoveryMethod: jest.fn(() => Promise.resolve(null)),
  setDiscoveryMethod: jest.fn(() => Promise.resolve()),
}));

// Mock toast
jest.mock('react-native-root-toast', () => ({
  show: jest.fn(() => 1),
  hide: jest.fn(),
  durations: { LONG: 3500 },
  positions: { BOTTOM: -100 },
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { getByTestId } = render(<HomeScreen />);
    expect(getByTestId('home-screen')).toBeTruthy();
  });

  it('shows Discover Readers button when not connected', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Discover Readers')).toBeTruthy();
  });

  it('shows Register Internet Reader button when not connected', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Register Internet Reader')).toBeTruthy();
  });

  it('shows Database button when not connected', () => {
    const { getByTestId } = render(<HomeScreen />);
    expect(getByTestId('database')).toBeTruthy();
  });

  it('navigates to DiscoverReadersScreen on press', () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Discover Readers'));
    expect(mockNavigate).toHaveBeenCalledWith('DiscoverReadersScreen', expect.any(Object));
  });

  it('navigates to RegisterInternetReaderScreen on press', () => {
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Register Internet Reader'));
    expect(mockNavigate).toHaveBeenCalledWith('RegisterInternetReaderScreen', {});
  });

  it('navigates to DatabaseScreen on database press', () => {
    const { getByTestId } = render(<HomeScreen />);
    fireEvent.press(getByTestId('database'));
    expect(mockNavigate).toHaveBeenCalledWith('DatabaseScreen', {});
  });

  it('shows discovery method button', () => {
    const { getByTestId } = render(<HomeScreen />);
    expect(getByTestId('discovery-method-button')).toBeTruthy();
  });

  it('shows connected reader UI when reader is connected', () => {
    const { useStripeTerminal } = require('@stripe/stripe-terminal-react-native');
    useStripeTerminal.mockReturnValue({
      disconnectReader: mockDisconnectReader,
      connectedReader: {
        deviceType: 'chipper2X',
        batteryLevel: 0.8,
        isCharging: false,
      },
    });

    const { getByText, getByTestId } = render(<HomeScreen />);
    expect(getByText('chipper2X')).toBeTruthy();
    expect(getByText(/Connected/)).toBeTruthy();
    expect(getByTestId('disconnect-button')).toBeTruthy();
  });

  it('calls disconnectReader when Disconnect is pressed', () => {
    const { useStripeTerminal } = require('@stripe/stripe-terminal-react-native');
    useStripeTerminal.mockReturnValue({
      disconnectReader: mockDisconnectReader,
      connectedReader: {
        deviceType: 'chipper2X',
        batteryLevel: 0.5,
        isCharging: false,
      },
    });

    const { getByTestId } = render(<HomeScreen />);
    fireEvent.press(getByTestId('disconnect-button'));
    expect(mockDisconnectReader).toHaveBeenCalled();
  });
});
