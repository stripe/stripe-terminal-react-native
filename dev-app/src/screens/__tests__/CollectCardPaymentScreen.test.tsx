import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useStripeTerminal } from '@stripe/stripe-terminal-react-native';
import type { PaymentIntent, StripeError } from '../../../../src/types';
import CollectCardPaymentScreen from '../CollectCardPaymentScreen';
import { LogContext } from '../../components/LogContext';

// The dev app has its own dependencies. Use the test renderer's React and RN.
jest.mock('../../../node_modules/react', () =>
  jest.requireActual('../../../../node_modules/react')
);
jest.mock('../../../node_modules/react-native', () =>
  jest.requireActual('../../../../node_modules/react-native')
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
    useNavigation: () => ({ navigate: jest.fn() }),
    useRoute: () => ({
      params: { simulated: false, discoveryMethod: 'internet' },
    }),
  }),
  { virtual: true }
);
jest.mock(
  'react-native-keyboard-aware-scroll-view',
  () => ({
    KeyboardAwareScrollView: jest.requireActual(
      '../../../../node_modules/react-native'
    ).ScrollView,
  }),
  { virtual: true }
);
jest.mock('../../api/api', () => ({ Api: class {} }));
jest.mock(
  '@react-native-picker/picker',
  () => {
    const ReactForPicker = jest.requireActual<typeof import('react')>(
      '../../../../node_modules/react'
    );
    const { View, Text } = jest.requireActual(
      '../../../../node_modules/react-native'
    );
    const Picker = Object.assign(
      ReactForPicker.forwardRef((props: any, ref) => {
        ReactForPicker.useImperativeHandle(ref, () => ({ focus: jest.fn() }));
        return ReactForPicker.createElement(View, {
          ...props,
          testID: props.testID ?? `mock-picker-${props.selectedValue}`,
        });
      }),
      {
        Item: ({ label }: { label: string }) =>
          ReactForPicker.createElement(Text, {}, label),
      }
    );
    Picker.displayName = 'MockPicker';
    return { Picker };
  },
  { virtual: true }
);

const initialIntent: PaymentIntent.Type = {
  id: 'pi_recollect',
  sdkUuid: 'same-native-handle',
  amount: 20000,
  currency: 'usd',
  created: '0',
  livemode: false,
  status: 'requiresPaymentMethod',
};
const visaIntent = {
  ...initialIntent,
  status: 'requiresConfirmation',
  paymentMethod: { cardPresentDetails: { brand: 'visa' } },
} as PaymentIntent.Type;
const acceptedIntent = {
  ...visaIntent,
  paymentMethod: { cardPresentDetails: { brand: 'mastercard' } },
} as PaymentIntent.Type;
const cancelError = Object.assign(new Error('Reader cancellation failed'), {
  name: 'StripeError' as const,
  code: 'CANCEL_FAILED' as const,
  nativeErrorCode: 'CancelFailedUnavailable',
  metadata: { readerMessage: 'Cannot cancel yet' },
}) satisfies StripeError;

const sdk = {
  createPaymentIntent: jest.fn(),
  collectPaymentMethod: jest.fn(),
  cancelCollectPaymentMethod: jest.fn(),
  confirmPaymentIntent: jest.fn(),
  getOfflineStatus: jest.fn(),
};
const addLogs = jest.fn();

function renderPaymentScreen(recollect: boolean) {
  const screen = render(
    <LogContext.Provider
      value={{
        logs: [],
        addLogs,
        clearLogs: jest.fn(),
        cancel: null,
        setCancel: jest.fn(),
      }}
    >
      <CollectCardPaymentScreen />
    </LogContext.Provider>
  );
  fireEvent(
    screen.getByTestId('enable-update-paymentIntent'),
    'valueChange',
    true
  );
  fireEvent.press(screen.getByTestId('decline_card_brand'));
  fireEvent(screen.getByTestId('mock-picker-None'), 'valueChange', 'visa');
  fireEvent.press(screen.getByTestId('close-picker'));
  fireEvent(screen.getByTestId('enable-recollect'), 'valueChange', recollect);
  return screen;
}

describe('dev-app card-brand rejection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useStripeTerminal as jest.Mock).mockReturnValue(sdk);
    sdk.createPaymentIntent.mockResolvedValue({ paymentIntent: initialIntent });
    sdk.collectPaymentMethod
      .mockReset()
      .mockResolvedValueOnce({ paymentIntent: visaIntent })
      .mockResolvedValue({ paymentIntent: acceptedIntent });
    sdk.cancelCollectPaymentMethod.mockReset().mockResolvedValue({});
    sdk.confirmPaymentIntent.mockResolvedValue({
      paymentIntent: { ...acceptedIntent, status: 'succeeded' },
    });
    sdk.getOfflineStatus.mockResolvedValue({
      sdk: {
        networkStatus: 'online',
        offlinePaymentsCount: 0,
        offlinePaymentAmountsByCurrency: {},
      },
    });
  });

  it.each([true, false])(
    'logs cancellation failure and stops (recollect=%s)',
    async (recollect) => {
      sdk.cancelCollectPaymentMethod.mockResolvedValue({ error: cancelError });
      const screen = renderPaymentScreen(recollect);
      await act(async () => {
        fireEvent.press(screen.getByTestId('collect-payment-button'));
      });

      expect(sdk.cancelCollectPaymentMethod).toHaveBeenCalledTimes(1);
      expect(sdk.collectPaymentMethod).toHaveBeenCalledTimes(1);
      expect(sdk.confirmPaymentIntent).not.toHaveBeenCalled();
      expect(addLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          events: [
            expect.objectContaining({
              name: 'Failed',
              description: 'terminal.cancelCollectPaymentMethod',
              metadata: expect.objectContaining({
                errorCode: 'CANCEL_FAILED',
                nativeErrorCode: 'CancelFailedUnavailable',
                errorContext: expect.stringContaining('Cannot cancel yet'),
              }),
            }),
          ],
        })
      );
    }
  );

  it('waits for cancellation success before recollecting the latest intent', async () => {
    let finishCancellation!: (result: {}) => void;
    sdk.cancelCollectPaymentMethod.mockReturnValue(
      new Promise((resolve) => {
        finishCancellation = resolve;
      })
    );
    const screen = renderPaymentScreen(true);
    await act(async () => {
      fireEvent.press(screen.getByTestId('collect-payment-button'));
    });

    expect(sdk.cancelCollectPaymentMethod).toHaveBeenCalledTimes(1);
    expect(sdk.collectPaymentMethod).toHaveBeenCalledTimes(1);
    expect(sdk.confirmPaymentIntent).not.toHaveBeenCalled();

    await act(async () => finishCancellation({}));
    await waitFor(() =>
      expect(sdk.confirmPaymentIntent).toHaveBeenCalledTimes(1)
    );
    expect(sdk.collectPaymentMethod).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        paymentIntent: visaIntent,
        updatePaymentIntent: true,
      })
    );
    expect(sdk.confirmPaymentIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentIntent: acceptedIntent,
      })
    );
    expect(addLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        events: [
          expect.objectContaining({
            name: 'Canceled',
            description: 'terminal.cancelCollectPaymentMethod',
          }),
        ],
      })
    );
  });

  it('cancels without recollecting or confirming when recollect is disabled', async () => {
    const screen = renderPaymentScreen(false);
    await act(async () => {
      fireEvent.press(screen.getByTestId('collect-payment-button'));
    });

    expect(sdk.cancelCollectPaymentMethod).toHaveBeenCalledTimes(1);
    expect(sdk.collectPaymentMethod).toHaveBeenCalledTimes(1);
    expect(sdk.confirmPaymentIntent).not.toHaveBeenCalled();
  });

  it('confirms an accepted card without canceling it', async () => {
    sdk.collectPaymentMethod
      .mockReset()
      .mockResolvedValue({ paymentIntent: acceptedIntent });
    const screen = renderPaymentScreen(true);
    await act(async () => {
      fireEvent.press(screen.getByTestId('collect-payment-button'));
    });

    expect(sdk.collectPaymentMethod).toHaveBeenCalledTimes(1);
    expect(sdk.cancelCollectPaymentMethod).not.toHaveBeenCalled();
    expect(sdk.confirmPaymentIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentIntent: acceptedIntent,
      })
    );
  });
});
