import { useNavigation } from '@react-navigation/core';
import React, { useContext, useState } from 'react';
import { StyleSheet, Switch } from 'react-native';
import {
  useStripeTerminal,
  CollectDataType,
} from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import { LogContext } from '../components/LogContext';
import { DevAppError } from '../errors/DevAppError';

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import List from '../components/List';
import ListItem from '../components/ListItem';
import type { NavigationProp } from '@react-navigation/native';
import type { RouteParamList } from '../App';

export default function CollectDataScreen() {
  const { addLogs, clearLogs, setCancel } = useContext(LogContext);
  const navigation = useNavigation<NavigationProp<RouteParamList>>();
  const [enableCustomerCancellation, setEnableCustomerCancellation] =
    useState(false);

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
      enableCustomerCancellation: enableCustomerCancellation,
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
      enableCustomerCancellation: enableCustomerCancellation,
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
});
