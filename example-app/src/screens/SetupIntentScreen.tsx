import { RouteProp, useNavigation, useRoute, type NavigationProp } from '@react-navigation/core';
import React, { useCallback, useContext, useState } from 'react';
import { StyleSheet, Switch } from 'react-native';
import {
  SetupIntent,
  useStripeTerminal,
  StripeError,
} from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import { LogContext } from '../components/LogContext';
import { AppContext } from '../AppContext';

import type { RouteParamList } from '../App';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import List from '../components/List';
import ListItem from '../components/ListItem';

export default function SetupIntentScreen() {
  const { api } = useContext(AppContext);
  const { addLogs, clearLogs } = useContext(LogContext);
  const navigation = useNavigation<NavigationProp<RouteParamList>>();
  const { params } = useRoute<RouteProp<RouteParamList, 'SetupIntentScreen'>>();
  const { discoveryMethod } = params;
  const [enableCustomerCancellation, setEnableCustomerCancellation] =
    useState(false);

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

  const _confirmSetupIntent = useCallback(
    async (si: SetupIntent.Type) => {
      addLogs({
        name: 'Process Payment',
        events: [
          {
            name: 'Process',
            description: 'terminal.confirmSetupIntent',
            metadata: { setupIntentId: si.id },
          },
        ],
      });
      const { setupIntent, error } = await confirmSetupIntent({
        setupIntent: si,
      });
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
    async (si: SetupIntent.Type) => {
      addLogs({
        name: 'Collect Setup Intent',
        events: [
          {
            name: 'Collect',
            description: 'terminal.collectSetupIntentPaymentMethod',
            metadata: { setupIntentId: si.id },
            onBack: cancelCollectSetupIntent,
          },
        ],
      });
      const { setupIntent, error } = await collectSetupIntentPaymentMethod({
        setupIntent: si,
        allowRedisplay: 'always',
        enableCustomerCancellation: enableCustomerCancellation,
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
        await _confirmSetupIntent(setupIntent);
      }
    },
    [
      enableCustomerCancellation,
      _confirmSetupIntent,
      addLogs,
      cancelCollectSetupIntent,
      collectSetupIntentPaymentMethod,
    ]
  );

  const _createSetupIntent = useCallback(async () => {
    clearLogs();
    navigation.navigate('LogListScreen', {});

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
    let setupIntentError: StripeError | undefined;

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
      await _collectPaymentMethod(setupIntent);
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

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      keyboardShouldPersistTaps="always"
      testID="setup-intent-scroll-view"
    >
      {discoveryMethod === 'internet' && (
        <List bolded={false} topSpacing={false} title="TRANSACTION FEATURES">
          <ListItem
            title="Customer cancellation"
            rightElement={
              <Switch
                testID="enable-cancellation"
                value={enableCustomerCancellation}
                onValueChange={(value) => setEnableCustomerCancellation(value)}
              />
            }
          />
        </List>
      )}
      <List bolded={false} topSpacing={false} title=" ">
        <ListItem
          color={colors.blue}
          title="Collect setupIntent"
          onPress={_createSetupIntent}
        />
      </List>
    </KeyboardAwareScrollView>
  );
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
