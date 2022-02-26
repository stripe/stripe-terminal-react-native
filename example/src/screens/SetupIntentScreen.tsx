import { useNavigation, useRoute } from '@react-navigation/core';
import React, { useContext, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import {
  SetupIntent,
  useStripeTerminal,
  CommonError,
  StripeError,
} from 'stripe-terminal-react-native';
import { colors } from '../colors';
import { LogContext } from '../components/LogContext';
import { API_URL } from '../Config';
import { fetchCustomerId } from '../utils';

export default function SetupIntentScreen() {
  const [_setupIntent, setSetupIntent] = useState<SetupIntent.Type>();
  const { addLogs, clearLogs } = useContext(LogContext);
  const navigation = useNavigation();
  const { params } = useRoute();
  const { discoveryMethod } = params as Record<string, any>;

  const {
    createSetupIntent,
    collectSetupIntentPaymentMethod,
    confirmSetupIntent,
    retrieveSetupIntent,
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
    _createSetupIntent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createServerSetupIntent = async () => {
    try {
      const response = await fetch(`${API_URL}/create_setup_intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const { client_secret } = await response.json();
      return { client_secret };
    } catch (error) {
      return { error };
    }
  };

  const _createSetupIntent = async () => {
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
    let setupIntent: SetupIntent.Type | undefined;
    let setupIntentError: StripeError<CommonError> | undefined;

    if (discoveryMethod === 'internet') {
      const { client_secret, error } = await createServerSetupIntent();

      if (error) {
        console.error(error);
        return;
      }

      const response = await retrieveSetupIntent(client_secret);

      setupIntent = response.setupIntent;
      setupIntentError = response.error;
    } else {
      const { error: customerError, id: customerId } = await fetchCustomerId();

      if (customerError) {
        console.error(customerError);
      }

      const response = await createSetupIntent({
        customerId,
      });
      setupIntent = response.setupIntent;
      setupIntentError = response.error;
    }

    if (setupIntentError) {
      addLogs({
        name: 'Create Setup Intent',
        events: [
          {
            name: setupIntentError.code,
            description: setupIntentError.message,
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
