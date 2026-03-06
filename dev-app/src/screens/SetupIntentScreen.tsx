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
  type CustomerCancellation,
  type MotoConfiguration,
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

const CUSTOMER_CANCELLATION = [
  { value: 'unspecified', label: 'unspecified' },
  { value: 'enableIfAvailable', label: 'enableIfAvailable' },
  { value: 'disableIfAvailable', label: 'disableIfAvailable' },
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
  const { discoveryMethod } = params;
  const [customerCancellation, setCustomerCancellation] =
    useState<CustomerCancellation>('unspecified');
  const [collectReason, setCollectReason] =
    useState<CollectionReason>('unspecified');
  const [motoConfiguration, setMotoConfiguration] = useState<
    MotoConfiguration | undefined
  >(undefined);

  const [allowRedisplay, setAllowRedisplay] =
    useState<AllowRedisplay>('always');

  const {
    createSetupIntent,
    collectSetupIntentPaymentMethod,
    confirmSetupIntent,
    processSetupIntent,
    cancelConfirmSetupIntent,
    cancelCollectSetupIntent,
    cancelProcessSetupIntent,
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
      customerCancellation: customerCancellation,
      motoConfiguration: motoConfiguration,
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

  const _processSetupIntent = async () => {
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
    if (motoConfiguration != undefined) {
      parameter = {
        customer: resp.id,
        paymentMethodTypes: ['card'],
      };
    } else {
      parameter = {
        customer: resp.id,
      };
    }
    const createdSetupIntentResponse = await createSetupIntent(parameter);
    setupIntent = createdSetupIntentResponse.setupIntent;
    setupIntentError = createdSetupIntentResponse.error;

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
      return;
    }

    if (!setupIntent) {
      return;
    }

    addLogs({
      name: 'Process Setup Intent',
      events: [
        {
          name: 'Process',
          onBack: cancelProcessSetupIntent,
          description: 'terminal.processSetupIntent',
          metadata: { setupIntentId: setupIntent.id },
        },
      ],
    });

    const { setupIntent: processedSetupIntent, error } =
      await processSetupIntent({
        setupIntent: setupIntent,
        allowRedisplay: allowRedisplay,
        customerCancellation: customerCancellation,
        motoConfiguration: motoConfiguration,
        collectionReason: collectReason,
      });

    if (error) {
      addLogs({
        name: 'Process Setup Intent',
        events: [
          {
            name: 'Failed',
            description: 'terminal.processSetupIntent',
            metadata: {
              errorCode: error.code,
              errorMessage: error.message,
              si: processedSetupIntent
                ? JSON.stringify(processedSetupIntent, undefined, 2)
                : undefined,
            },
          },
        ],
      });
    } else if (processedSetupIntent) {
      addLogs({
        name: 'Process Setup Intent',
        events: [
          {
            name: 'Finished',
            description: 'terminal.processSetupIntent',
            metadata: {
              setupIntentId: processedSetupIntent.id,
              si: JSON.stringify(processedSetupIntent, undefined, 2),
            },
          },
        ],
      });
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
    if (motoConfiguration != undefined) {
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
          <List bolded={false} topSpacing={false} title="Customer Cancellation">
            <Picker
              selectedValue={customerCancellation}
              style={styles.picker}
              itemStyle={styles.pickerItem}
              testID="select-cancellation"
              onValueChange={(value) =>
                setCustomerCancellation(value as CustomerCancellation)
              }
            >
              {CUSTOMER_CANCELLATION.map((a) => (
                <Picker.Item
                  key={a.value}
                  label={a.label}
                  testID={a.value}
                  value={a.value}
                />
              ))}
            </Picker>
          </List>
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
              value={motoConfiguration != undefined}
              onValueChange={(value) => {
                if (value) {
                  setMotoConfiguration({});
                } else {
                  setMotoConfiguration(undefined);
                }
              }}
            />
          }
        />
        <ListItem
          title="Skip Cvc"
          visible={motoConfiguration != undefined}
          rightElement={
            <Switch
              testID="motoSkipCvc"
              value={motoConfiguration?.skipCvc == true}
              onValueChange={(value) =>
                setMotoConfiguration((state) => ({
                  ...state,
                  skipCvc: value,
                }))
              }
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
      <ListItem
        color={colors.blue}
        testID="process-setup-intent-button"
        title="Process setupIntent"
        onPress={_processSetupIntent}
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
