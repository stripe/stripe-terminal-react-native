import * as React from 'react';
import { withStripeTerminal } from '../withStripeTerminal';
import { render } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';

jest.mock(
  '../../../node_modules/react-native/Libraries/EventEmitter/NativeEventEmitter'
);

describe('withStripeTerminal.tsx', () => {
  it('renders correctly', () => {
    const MockComponent = ({}) => {
      return (
        <TouchableOpacity>
          <Text>test</Text>
        </TouchableOpacity>
      );
    };

    const WithStripeTerminalComponent = withStripeTerminal(MockComponent);

    const { toJSON, findByText } = render(<WithStripeTerminalComponent />);

    const childText = findByText('test');
    expect(childText).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });
});
