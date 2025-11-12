import {
  type RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/core';
import React, { useCallback, useContext, useState } from 'react';
import { StyleSheet, Switch, Platform } from 'react-native';
import {
  type SetupIntent,
  useStripeTerminal,
  type StripeError,
  type AllowRedisplay,
  type CollectionReason,
} from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import { LogContext } from '../components/LogContext';
import { AppContext } from '../AppContext';
import { DevAppError } from '../errors/DevAppError';

import type { RouteParamList } from '../App';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import List from '../components/List';
import ListItem from '../components/ListItem';
import { Picker } from '@react-native-picker/picker';
import type { NavigationProp } from '@react-navigation/native';
import type { CreateSetupIntentParams } from 'lib/typescript/src';

const ALLOW_REDISPLAY = [
  { value: 'unspecified', label: 'unspecified' },
  { value: 'limited', label: 'limited' },
  { value: 'always', label: 'always' },
];

const COLLECTION_REASON = [
  { value: 'unspecified', label: 'unspecified' },
  { value: 'saveCard', label: 'saveCard' },
  { value: 'verify', label: 'verify' },
];

export default function SetupIntentScreen() {
  const { api } = useContext(AppContext);
  const { addLogs, clearLogs } = useContext(LogContext);
  const navigation = useNavigation<NavigationProp<RouteParamList>>();
  const { params } = useRoute<RouteProp<RouteParamList, 'SetupIntentScreen'>>();
  const { deviceType, discoveryMethod } = params;
  const [enableCustomerCancellation, setEnableCustomerCancellation] =
    useState(false);
  const [collectReason, setCollectReason] =
    useState<CollectionReason>('unspecified');
  const [moto, setMoto] = useState(false);

  const [allowRedisplay, setAllowRedisplay] =
    useState<AllowRedisplay>('always');

  const {
    createSetupIntent,
    collectSetupIntentPaymentMethod,
    confirmSetupIntent,
    cancelConfirmSetupIntent,
    retrieveSetupIntent,
    cancelCollectSetupIntent,
  } = useStripeTerminal({
    onDidRequestReaderInput: (input) => {
      addLogs({
        name: 'Collect Setup Intent',
        events: [
          {
            name: input.sort().join(' / '),
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
            onBack: cancelConfirmSetupIntent,
            description: 'terminal.confirmSetupIntent',
            metadata: { setupIntentId: si.id },
          },
        ],
      });
      const { setupIntent, error } = await confirmSetupIntent({
        setupIntent: si,
      });
      if (error) {
        const devError = DevAppError.fromStripeError(error);
        addLogs({
          name: 'Process Payment',
          events: [
            {
              name: 'Failed',
              description: 'terminal.confirmSetupIntent',
              metadata: devError.toJSON(),
            },
          ],
        });
      } else if (setupIntent) {
        addLogs({
          name: 'Process Payment',
          events: [
            {
              name: 'Finished',
              description: 'terminal.confirmSetupIntent',
              metadata: {
                setupIntentId: setupIntent.id,
                si: JSON.stringify(setupIntent, undefined, 2),
              },
            },
          ],
        });
      }
    },
    [addLogs, confirmSetupIntent, cancelConfirmSetupIntent]
  );

  const _collectSetupMethod = async (si: SetupIntent.Type) => {
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
      allowRedisplay: allowRedisplay,
      enableCustomerCancellation: enableCustomerCancellation,
      moto: moto,
      collectionReason: collectReason,
    });
    if (error) {
      const devError = DevAppError.fromStripeError(error);
      addLogs({
        name: 'Collect Setup Intent',
        events: [
          {
            name: 'Failed',
            description: 'terminal.collectSetupIntentPaymentMethod',
            metadata: devError.toJSON(),
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
  };

  const _createSetupIntent = async () => {
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

    if (deviceType === 'verifoneP400') {
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
        const error = new DevAppError(
          'NO_CLIENT_SECRET',
          'No client_secret returned from API',
          {
            context: {
              step: 'createSetupIntent',
              apiResponse: resp,
            },
          }
        );

        addLogs({
          name: 'Create Setup Intent',
          events: [
            {
              name: 'Failed',
              description: 'terminal.createSetupIntent',
              metadata: error.toJSON(),
            },
          ],
        });
        return;
      }

      const response = await retrieveSetupIntent(resp.client_secret);

      setupIntent = response.setupIntent;
      setupIntentError = response.error;
    } else {
      const resp = await api.lookupOrCreateExampleCustomer();

      if ('error' in resp) {
        console.log(resp.error);
        addLogs({
          name: 'Lookup / Create Customer',
          events: [
            {
              name: 'Failed',
              description: 'terminal.lookupOrCreateExampleCustomer',
              metadata: {
                errorCode: resp.error.code,
                errorMessage: resp.error.message,
              },
            },
          ],
        });
        return;
      }
      let parameter: CreateSetupIntentParams;
      if (moto) {
        parameter = {
          customer: resp.id,
          paymentMethodTypes: ['card'],
        };
      } else {
        parameter = {
          customer: resp.id,
        };
      }
      const response = await createSetupIntent(parameter);
      setupIntent = response.setupIntent;
      setupIntentError = response.error;
    }

    if (setupIntentError) {
      const devError = DevAppError.fromStripeError(setupIntentError);
      addLogs({
        name: 'Create Setup Intent',
        events: [
          {
            name: 'Failed',
            description: 'terminal.createSetupIntent',
            metadata: devError.toJSON(),
          },
        ],
      });
    } else if (setupIntent) {
      await _collectSetupMethod(setupIntent);
    }
  };

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
      <List bolded={false} topSpacing={false} title="Set Allow Redisplay">
        <Picker
          selectedValue={allowRedisplay}
          style={styles.picker}
          itemStyle={styles.pickerItem}
          testID="select-allow-redisplay"
          onValueChange={(value) => setAllowRedisplay(value as AllowRedisplay)}
        >
          {ALLOW_REDISPLAY.map((a) => (
            <Picker.Item
              key={a.value}
              label={a.label}
              testID={a.value}
              value={a.value}
            />
          ))}
        </Picker>
      </List>
      <List bolded={false} topSpacing={false} title="Set Collection Reason">
        <Picker
          selectedValue={collectReason}
          style={styles.picker}
          itemStyle={styles.pickerItem}
          testID="select-collection-reason"
          onValueChange={(value) => setCollectReason(value as CollectionReason)}
        >
          {COLLECTION_REASON.map((a) => (
            <Picker.Item
              key={a.value}
              label={a.label}
              testID={a.value}
              value={a.value}
            />
          ))}
        </Picker>
      </List>
      <List bolded={false} topSpacing={false} title="Moto">
        <ListItem
          title="Enable Moto"
          rightElement={
            <Switch
              testID="moto"
              value={moto}
              onValueChange={(value) => setMoto(value)}
            />
          }
        />
      </List>
      <ListItem
        color={colors.blue}
        testID="collect-setup-intent-button"
        title="Collect setupIntent"
        onPress={_createSetupIntent}
      />
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
  picker: {
    width: '100%',
    ...Platform.select({
      android: {
        color: colors.slate,
        fontSize: 13,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.white,
      },
    }),
  },
  pickerItem: {
    fontSize: 16,
    color: colors.slate,
  },
});
