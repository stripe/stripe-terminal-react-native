import * as React from 'react';
import { withStripeTerminal } from '../withStripeTerminal';
import { render } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';

// Mock NativeEventEmitter properly
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
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
});

describe('withStripeTerminal.tsx', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', async () => {
    const MockComponent = ({ }) => {
      return (
        <TouchableOpacity>
          <Text>test</Text>
        </TouchableOpacity>
      );
    };

    const WithStripeTerminalComponent = withStripeTerminal(MockComponent);

    const { toJSON, findByText } = render(<WithStripeTerminalComponent />);

    const childText = await findByText('test');
    expect(childText).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });
});
