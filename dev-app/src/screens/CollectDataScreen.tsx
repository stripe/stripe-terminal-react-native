import { useNavigation } from '@react-navigation/core';
import React, { useContext } from 'react';
import { StyleSheet } from 'react-native';
import {
  useStripeTerminal,
  CollectDataType,
} from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import { LogContext } from '../components/LogContext';

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import List from '../components/List';
import ListItem from '../components/ListItem';

export default function CollectDataScreen() {
  const { addLogs, clearLogs } = useContext(LogContext);
  const navigation = useNavigation();

  const { collectData } = useStripeTerminal();

  const _collectMagstripeData = async () => {
    clearLogs();
    navigation.navigate('LogListScreen');

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
          color={colors.blue}
          title="Collect magstripe data"
          onPress={_collectMagstripeData}
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
