import * as React from 'react';
import { StripeTerminalProvider } from '../StripeTerminalProvider';
import { fireEvent, render } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { useStripeTerminal } from '../../hooks/useStripeTerminal';

jest.mock(
  '../../../node_modules/react-native/Libraries/EventEmitter/NativeEventEmitter'
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
    expect(tokenProvider).not.toBeCalled();
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

    fireEvent.press(await findByText('init'));

    expect(tokenProvider).toBeCalled();
    expect(tokenProvider).toReturnWith('_token');
  });
});
