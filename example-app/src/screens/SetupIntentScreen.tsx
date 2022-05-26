import { RouteProp, useNavigation, useRoute } from '@react-navigation/core';
import React, { useCallback, useContext, useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import {
  SetupIntent,
  useStripeTerminal,
  CommonError,
  StripeError,
} from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import { LogContext } from '../components/LogContext';
import { AppContext } from '../AppContext';

import type { RouteParamList } from '../App';

export default function SetupIntentScreen() {
  const { api } = useContext(AppContext);
  const { addLogs, clearLogs } = useContext(LogContext);
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RouteParamList, 'SetupIntent'>>();
  const { discoveryMethod } = params;

  const {
    createSetupIntent,
    collectSetupIntentPaymentMethod,
    confirmSetupIntent,
    retrieveSetupIntent,
    cancelCollectSetupIntent,
  } = useStripeTerminal({
    onDidRequestReaderInput: (input) => {
      addLogs({
        name: 'Collect Setup Intent',
        events: [
          {
            name: input.join(' / '),
            description: 'terminal.didRequestReaderInput',
            onBack: cancelCollectSetupIntent,
          },
        ],
      });
    },
    onDidRequestReaderDisplayMessage: (message) => {
      addLogs({
        name: 'Collect Setup Intent',
        events: [
          {
            name: message,
            description: 'terminal.didRequestReaderDisplayMessage',
          },
        ],
      });
    },
  });

  const _processPayment = useCallback(
    async (setupIntentId: string) => {
      addLogs({
        name: 'Process Payment',
        events: [
          {
            name: 'Process',
            description: 'terminal.confirmSetupIntent',
            metadata: { setupIntentId },
          },
        ],
      });
      const { setupIntent, error } = await confirmSetupIntent(setupIntentId);
      if (error) {
        addLogs({
          name: 'Process Payment',
          events: [
            {
              name: 'Failed',
              description: 'terminal.confirmSetupIntent',
              metadata: {
                errorCode: error.code,
                errorMessage: error.message,
              },
            },
          ],
        });
        return;
      }

      if (!setupIntent || !setupIntent.paymentMethodId) {
        addLogs({
          name: 'Process Payment',
          events: [
            {
              name: 'Failed',
              description: 'terminal.confirmSetupIntent',
              metadata: {
                errorCode: 'no_code',
                errorMessage: 'setup intent is null!',
              },
            },
          ],
        });
        return;
      }

      addLogs({
        name: 'Process Payment',
        events: [
          {
            name: 'Finished',
            description: 'terminal.confirmSetupIntent',
            metadata: { setupIntentId: setupIntent?.id },
          },
        ],
      });
    },
    [addLogs, confirmSetupIntent]
  );

  const _collectPaymentMethod = useCallback(
    async (setupIntentId: string) => {
      addLogs({
        name: 'Collect Setup Intent',
        events: [
          {
            name: 'Collect',
            description: 'terminal.collectSetupIntentPaymentMethod',
            metadata: { setupIntentId },
            onBack: cancelCollectSetupIntent,
          },
        ],
      });
      const { setupIntent, error } = await collectSetupIntentPaymentMethod({
        setupIntentId: setupIntentId,
        customerConsentCollected: true,
      });
      if (error) {
        addLogs({
          name: 'Collect Setup Intent',
          events: [
            {
              name: 'Failed',
              description: 'terminal.collectSetupIntentPaymentMethod',
              metadata: {
                errorCode: error.code,
                errorMessage: error.message,
              },
            },
          ],
        });
      } else if (setupIntent) {
        addLogs({
          name: 'Collect Setup Intent',
          events: [
            {
              name: 'Created',
              description: 'terminal.collectSetupIntentPaymentMethod',
              metadata: { setupIntentId: setupIntent.id },
            },
          ],
        });
        await _processPayment(setupIntentId);
      }
    },
    [
      _processPayment,
      addLogs,
      cancelCollectSetupIntent,
      collectSetupIntentPaymentMethod,
    ]
  );

  const _createSetupIntent = useCallback(async () => {
    clearLogs();
    navigation.navigate('LogListScreen');

    addLogs({
      name: 'Create Setup Intent',
      events: [
        {
          name: 'Create',
          description: 'terminal.createSetupIntent',
        },
      ],
    });

    let setupIntent: SetupIntent.Type | undefined;
    let setupIntentError: StripeError<CommonError> | undefined;

    if (discoveryMethod === 'internet') {
      const resp = await api.createSetupIntent({});

      if ('error' in resp) {
        console.error(resp.error);
        addLogs({
          name: 'Create Setup Intent',
          events: [
            {
              name: 'Failed',
              description: 'terminal.createSetupIntent',
              metadata: {
                errorCode: resp.error.code,
                errorMessage: resp.error.message,
              },
            },
          ],
        });
        return;
      }

      if (!resp?.client_secret) {
        console.error('no client secret returned!');
        addLogs({
          name: 'Create Setup Intent',
          events: [
            {
              name: 'Failed',
              description: 'terminal.createSetupIntent',
              metadata: {
                errorCode: 'no_code',
                errorMessage: 'no client secret returned!',
              },
            },
          ],
        });
        return;
      }

      const response = await retrieveSetupIntent(resp.client_secret);

      setupIntent = response.setupIntent;
      setupIntentError = response.error;
    } else {
      const response = await createSetupIntent({});
      setupIntent = response.setupIntent;
      setupIntentError = response.error;
    }

    if (setupIntentError) {
      addLogs({
        name: 'Create Setup Intent',
        events: [
          {
            name: 'Failed',
            description: 'terminal.createSetupIntent',
            metadata: {
              errorCode: setupIntentError.code,
              errorMessage: setupIntentError.message,
            },
          },
        ],
      });
    } else if (setupIntent) {
      await _collectPaymentMethod(setupIntent.id);
    }
  }, [
    api,
    _collectPaymentMethod,
    createSetupIntent,
    addLogs,
    clearLogs,
    discoveryMethod,
    navigation,
    retrieveSetupIntent,
  ]);

  useEffect(() => {
    _createSetupIntent();
  }, [_createSetupIntent]);

  return <ScrollView contentContainerStyle={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light_gray,
    height: '100%',
    paddingVertical: 22,
  },
  json: {
    paddingHorizontal: 16,
  },
});
