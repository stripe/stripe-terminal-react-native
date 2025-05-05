import { useNavigation } from '@react-navigation/core';
import React, { useContext, useState } from 'react';
import { StyleSheet, Switch } from 'react-native';
import {
  useStripeTerminal,
  CollectDataType,
} from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import { LogContext } from '../components/LogContext';

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import List from '../components/List';
import ListItem from '../components/ListItem';
import type { NavigationProp } from '@react-navigation/native';
import type { RouteParamList } from '../App';

export default function CollectDataScreen() {
  const { addLogs, clearLogs } = useContext(LogContext);
  const navigation = useNavigation<NavigationProp<RouteParamList>>();
  const [enableCustomerCancellation, setEnableCustomerCancellation] =
    useState(false);

  const { collectData } = useStripeTerminal();

  const _collectMagstripeData = async () => {
    clearLogs();
    navigation.navigate('LogListScreen', {});

    addLogs({
      name: 'Collect Data',
      events: [
        {
          name: 'Collect Data',
          description: 'terminal.collectData',
        },
      ],
    });

    let collectDataType = CollectDataType.MAGSTRIPE;

    const { collectedData, error } = await collectData({
      collectDataType: collectDataType,
      enableCustomerCancellation: enableCustomerCancellation,
    });

    if (error) {
      addLogs({
        name: 'Collect Data',
        events: [
          {
            name: 'Failed',
            description: 'terminal.collectData',
            metadata: {
              errorCode: error.code,
              errorMessage: error.message,
            },
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
    navigation.navigate('LogListScreen', {});

    addLogs({
      name: 'Collect Data',
      events: [
        {
          name: 'Collect Data',
          description: 'terminal.collectData',
        },
      ],
    });

    let collectDataType = CollectDataType.NFC_UID;

    const { collectedData, error } = await collectData({
      collectDataType: collectDataType,
      enableCustomerCancellation: enableCustomerCancellation,
    });

    if (error) {
      addLogs({
        name: 'Collect Data',
        events: [
          {
            name: 'Failed',
            description: 'terminal.collectData',
            metadata: {
              errorCode: error.code,
              errorMessage: error.message,
            },
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
              onValueChange={(value) =>
                setEnableCustomerCancellation(value)
              }
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
