import { useNavigation } from '@react-navigation/core';
import React, { useContext, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SetupIntent, useStripeTerminal } from 'stripe-terminal-react-native';
import { colors } from '../colors';
import { LogContext } from '../components/LogContext';

export default function SetupIntentScreen() {
  const [_setupIntent, setSetupIntent] = useState<SetupIntent.Type>();
  const { addLogs, clearLogs } = useContext(LogContext);
  const navigation = useNavigation();

  const {
    createSetupIntent,
    collectSetupIntentPaymentMethod,
    confirmSetupIntent,
  } = useStripeTerminal({
    onDidRequestReaderInput: (input) => {
      addLogs({
        name: 'Collect Setup Intent',
        events: [
          {
            name: input.join(' / '),
            description: 'terminal.didRequestReaderInput',
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

  useEffect(() => {
    _createPaymentIntent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const _createPaymentIntent = async () => {
    clearLogs();
    navigation.navigate('LogScreen');
    addLogs({
      name: 'Create Setup Intent',
      events: [
        {
          name: 'Create',
          description: 'terminal.createSetupIntent',
        },
      ],
    });
    const { setupIntent, error } = await createSetupIntent({
      customerId: 'cus_KU9GGvjgrRF7Tv',
    });
    if (error) {
      addLogs({
        name: 'Create Setup Intent',
        events: [
          {
            name: error.code,
            description: error.message,
          },
        ],
      });
    } else if (setupIntent) {
      setSetupIntent(setupIntent);
      await _collectPaymentMethod(setupIntent.id);
    }
  };

  const _collectPaymentMethod = async (setupIntentId: string) => {
    addLogs({
      name: 'Collect Setup Intent',
      events: [
        {
          name: 'Collect',
          description: 'terminal.collectSetupIntentPaymentMethod',
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
            name: error.code,
            description: error.message,
          },
        ],
      });
    } else if (setupIntent) {
      setSetupIntent(setupIntent);
      addLogs({
        name: 'Collect Setup Intent',
        events: [
          {
            name: 'Created',
            description: 'terminal.setupIntentId: ' + setupIntent.id,
          },
        ],
      });
      await _processPayment(setupIntentId);
    }
  };

  const _processPayment = async (setupIntentId: string) => {
    addLogs({
      name: 'Process Payment',
      events: [
        {
          name: 'Process',
          description: 'terminal.confirmSetupIntent',
        },
      ],
    });
    const { setupIntent, error } = await confirmSetupIntent(setupIntentId);
    if (error) {
      addLogs({
        name: 'Process Payment',
        events: [
          {
            name: error.code,
            description: error.message,
          },
        ],
      });
    } else if (setupIntent) {
      setSetupIntent(setupIntent);
      addLogs({
        name: 'Process Payment',
        events: [
          {
            name: 'Finished',
            description: 'terminal.setupIntentId: ' + setupIntent.id,
          },
        ],
      });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* TODO: remove when log screen is ready */}
      <Text style={styles.json}>{JSON.stringify(_setupIntent)}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light_gray,
    flex: 1,
    paddingVertical: 22,
  },
  json: {
    paddingHorizontal: 16,
  },
});
