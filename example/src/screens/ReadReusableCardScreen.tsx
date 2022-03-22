import { useNavigation } from '@react-navigation/core';
import React, { useContext, useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useStripeTerminal } from 'stripe-terminal-react-native';
import { colors } from '../colors';
import { LogContext } from '../components/LogContext';
import { fetchCustomerId } from '../utils';

export default function ReadReusableCardScreen() {
  const { addLogs, clearLogs } = useContext(LogContext);
  const navigation = useNavigation();

  const { readReusableCard } = useStripeTerminal({
    onDidRequestReaderInput: (input) => {
      addLogs({
        name: 'Read Reusable Card',
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
        name: 'Read Reusable Card',
        events: [
          {
            name: message,
            description: 'terminal.didRequestReaderDisplayMessage',
          },
        ],
      });
      console.log('message', message);
    },
  });

  useEffect(() => {
    _readReusableCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const _readReusableCard = async () => {
    clearLogs();
    navigation.navigate('LogListScreen');

    addLogs({
      name: 'Read Reusable Card',
      events: [
        {
          name: 'Start',
          description: 'terminal.readReusableCard',
        },
      ],
    });

    const { error: customerError, id: customerId } = await fetchCustomerId();

    if (customerError) {
      console.log(customerError);
    }

    const { paymentMethod, error } = await readReusableCard({
      customer: customerId,
    });
    if (error) {
      addLogs({
        name: 'Read Reusable Card',
        events: [
          {
            name: 'Failed',
            description: 'terminal.readReusableCard',
            metadata: {
              errorCode: error.code,
              errorMessage: error.message,
            },
          },
        ],
      });
    } else if (paymentMethod) {
      addLogs({
        name: 'Read Reusable Card',
        events: [
          {
            name: 'Finished',
            description: 'terminal.readReusableCard',
            metadata: {
              customerId: customerId || 'no customer',
              paymentMethodId: paymentMethod.id,
            },
          },
        ],
      });
    }
  };

  return <ScrollView contentContainerStyle={styles.container} />;
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
