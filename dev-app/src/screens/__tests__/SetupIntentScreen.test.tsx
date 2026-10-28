import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { useStripeTerminal } from '@stripe/stripe-terminal-react-native';
import type { SetupIntent } from '../../../../src/types';
import SetupIntentScreen from '../SetupIntentScreen';
import { api } from '../../AppContext';
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
    useRoute: () => ({ params: { discoveryMethod: 'internet' } }),
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
jest.mock('../../api/api', () => ({
  Api: class {
    lookupOrCreateExampleCustomer = jest.fn();
  },
}));
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
      (props: any) => ReactForPicker.createElement(View, props),
      {
        Item: ({ label }: { label: string }) =>
          ReactForPicker.createElement(Text, {}, label),
      }
    );
    return { Picker };
  },
  { virtual: true }
);

// An offline SetupIntent has a local SDK handle, but no Stripe ID yet.
const createdIntent: SetupIntent.Type = {
  sdkUuid: 'offline-setup-intent',
  livemode: false,
  status: 'requiresPaymentMethod',
};
const collectedIntent: SetupIntent.Type = {
  ...createdIntent,
  status: 'requiresConfirmation',
};
const sdk = {
  createSetupIntent: jest.fn(),
  collectSetupIntentPaymentMethod: jest.fn(),
  confirmSetupIntent: jest.fn(),
  processSetupIntent: jest.fn(),
  cancelCollectSetupIntent: jest.fn(),
  cancelConfirmSetupIntent: jest.fn(),
  cancelProcessSetupIntent: jest.fn(),
};
const addLogs = jest.fn();

function renderSetupScreen() {
  return render(
    <LogContext.Provider
      value={{
        logs: [],
        addLogs,
        clearLogs: jest.fn(),
        cancel: null,
        setCancel: jest.fn(),
      }}
    >
      <SetupIntentScreen />
    </LogContext.Provider>
  );
}

describe('dev-app offline SetupIntents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useStripeTerminal as jest.Mock).mockReturnValue(sdk);
    // A hotspot can stay connected while API requests never finish.
    (api.lookupOrCreateExampleCustomer as jest.Mock).mockReturnValue(
      new Promise(() => {})
    );
    sdk.createSetupIntent.mockResolvedValue({ setupIntent: createdIntent });
    sdk.collectSetupIntentPaymentMethod.mockResolvedValue({
      setupIntent: collectedIntent,
    });
    sdk.confirmSetupIntent.mockResolvedValue({ setupIntent: collectedIntent });
    sdk.processSetupIntent.mockResolvedValue({ setupIntent: collectedIntent });
  });

  it.each(['collect', 'process'])(
    'starts the %s flow without waiting for an online customer lookup',
    async (flow) => {
      const screen = renderSetupScreen();
      await act(async () => {
        fireEvent.press(screen.getByTestId(`${flow}-setup-intent-button`));
      });

      expect(api.lookupOrCreateExampleCustomer).not.toHaveBeenCalled();
      expect(sdk.createSetupIntent).toHaveBeenCalledWith({});
      const collectParams = expect.objectContaining({
        setupIntent: createdIntent,
        allowRedisplay: 'always',
      });
      if (flow === 'collect') {
        expect(sdk.collectSetupIntentPaymentMethod).toHaveBeenCalledWith(
          collectParams
        );
        expect(sdk.confirmSetupIntent).toHaveBeenCalledWith({
          setupIntent: collectedIntent,
        });
      } else {
        expect(sdk.processSetupIntent).toHaveBeenCalledWith(collectParams);
      }
    }
  );

  it.each(['collect', 'process'])(
    'preserves MOTO parameters in the %s flow',
    async (flow) => {
      const screen = renderSetupScreen();
      fireEvent(screen.getByTestId('moto'), 'valueChange', true);
      await act(async () => {
        fireEvent.press(screen.getByTestId(`${flow}-setup-intent-button`));
      });

      expect(sdk.createSetupIntent).toHaveBeenCalledWith({
        paymentMethodTypes: ['card'],
      });
      const collection =
        flow === 'collect'
          ? sdk.collectSetupIntentPaymentMethod
          : sdk.processSetupIntent;
      expect(collection).toHaveBeenCalledWith(
        expect.objectContaining({ motoConfiguration: {} })
      );
    }
  );

  it.each(['collect', 'process'])(
    'logs creation errors and stops the %s flow',
    async (flow) => {
      sdk.createSetupIntent.mockResolvedValue({
        error: { code: 'NOT_CONNECTED_TO_READER', message: 'Connect a reader.' },
      });
      const screen = renderSetupScreen();
      await act(async () => {
        fireEvent.press(screen.getByTestId(`${flow}-setup-intent-button`));
      });

      expect(sdk.collectSetupIntentPaymentMethod).not.toHaveBeenCalled();
      expect(sdk.confirmSetupIntent).not.toHaveBeenCalled();
      expect(sdk.processSetupIntent).not.toHaveBeenCalled();
      expect(addLogs).toHaveBeenCalledWith({
        name: 'Create Setup Intent',
        events: [
          expect.objectContaining({
            name: 'Failed',
            metadata: expect.objectContaining({
              errorCode: 'NOT_CONNECTED_TO_READER',
              errorMessage: 'Connect a reader.',
            }),
          }),
        ],
      });
    }
  );
});
