import { useNavigation } from '@react-navigation/core';
import React, { useContext, useState } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  useStripeTerminal,
  CollectDataType,
  type CustomerCancellation,
} from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import { LogContext } from '../components/LogContext';
import { DevAppError } from '../errors/DevAppError';

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import List from '../components/List';
import ListItem from '../components/ListItem';
import type { NavigationProp } from '@react-navigation/native';
import type { RouteParamList } from '../App';

const CUSTOMER_CANCELLATION = [
  { value: 'unspecified', label: 'unspecified' },
  { value: 'enableIfAvailable', label: 'enableIfAvailable' },
  { value: 'disableIfAvailable', label: 'disableIfAvailable' },
];

export default function CollectDataScreen() {
  const { addLogs, clearLogs, setCancel } = useContext(LogContext);
  const navigation = useNavigation<NavigationProp<RouteParamList>>();
  const [customerCancellation, setCustomerCancellation] =
    useState<CustomerCancellation>('unspecified');

  const { collectData, cancelCollectData } = useStripeTerminal();

  const _collectMagstripeData = async () => {
    clearLogs();
    setCancel({
      label: 'Cancel CollectData',
      isDisabled: false,
      action: cancelCollectData,
    });
    navigation.navigate('LogListScreen', {});

    addLogs({
      name: 'Collect Data',
      events: [
        {
          name: 'Collect Data',
          description: 'terminal.collectData',
          onBack: cancelCollectData,
        },
      ],
    });

    let collectDataType = CollectDataType.MAGSTRIPE;

    const { collectedData, error } = await collectData({
      collectDataType: collectDataType,
      customerCancellation: customerCancellation,
    });

    if (error) {
      const devError = DevAppError.fromStripeError(error);
      addLogs({
        name: 'Collect Data',
        events: [
          {
            name: 'Failed',
            description: 'terminal.collectData',
            metadata: devError.toJSON(),
          },
        ],
      });
    } else if (collectedData) {
      addLogs({
        name: 'Collect Data',
        events: [
          {
            name: 'Created',
            description: 'terminal.collectData',
            metadata: {
              stripeId: collectedData.stripeId,
              nfcUid: collectedData.nfcUid,
              created: collectedData.created,
              livemode: String(collectedData.livemode),
            },
          },
        ],
      });
    }
  };

  const _collectNfcUid = async () => {
    clearLogs();
    setCancel({
      label: 'Cancel CollectData',
      isDisabled: false,
      action: cancelCollectData,
    });
    navigation.navigate('LogListScreen', {});

    addLogs({
      name: 'Collect Data',
      events: [
        {
          name: 'Collect Data',
          description: 'terminal.collectData',
          onBack: cancelCollectData,
        },
      ],
    });

    let collectDataType = CollectDataType.NFC_UID;

    const { collectedData, error } = await collectData({
      collectDataType: collectDataType,
      customerCancellation: customerCancellation,
    });

    if (error) {
      const devError = DevAppError.fromStripeError(error);
      addLogs({
        name: 'Collect Data',
        events: [
          {
            name: 'Failed',
            description: 'terminal.collectData',
            metadata: devError.toJSON(),
          },
        ],
      });
    } else if (collectedData) {
      addLogs({
        name: 'Collect Data',
        events: [
          {
            name: 'Created',
            description: 'terminal.collectData',
            metadata: {
              stripeId: collectedData.stripeId,
              nfcUid: collectedData.nfcUid,
              created: collectedData.created,
              livemode: String(collectedData.livemode),
            },
          },
        ],
      });
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      keyboardShouldPersistTaps="always"
      testID="collect-data-scroll-view"
    >
      <List bolded={false} topSpacing={false} title=" ">
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
        <ListItem
          color={colors.blue}
          title="Collect magstripe data"
          onPress={_collectMagstripeData}
        />
        <ListItem
          color={colors.blue}
          title="Collect NFC UID"
          onPress={_collectNfcUid}
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
