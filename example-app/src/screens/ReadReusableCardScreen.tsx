import { useNavigation } from '@react-navigation/core';
import React, { useContext, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useStripeTerminal } from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import { LogContext } from '../components/LogContext';
import { AppContext } from '../AppContext';

export default function ReadReusableCardScreen() {
  const { api } = useContext(AppContext);
  const { addLogs, clearLogs } = useContext(LogContext);
  const navigation = useNavigation();

  const { readReusableCard, cancelReadReusableCard } = useStripeTerminal({
    onDidRequestReaderInput: (input) => {
      addLogs({
        name: 'Read Reusable Card',
        events: [
          {
            name: input.join(' / '),
            description: 'terminal.didRequestReaderInput',
            onBack: cancelReadReusableCard,
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

  const _readReusableCard = useCallback(async () => {
    clearLogs();
    navigation.navigate('LogListScreen');

    addLogs({
      name: 'Read Reusable Card',
      events: [
        {
          name: 'Start',
          description: 'terminal.readReusableCard',
          onBack: cancelReadReusableCard,
        },
      ],
    });

    const { paymentMethod, error } = await readReusableCard({});

    if (error || !paymentMethod) {
      addLogs({
        name: 'Read Reusable Card',
        events: [
          {
            name: 'Failed',
            description: 'terminal.readReusableCard',
            metadata: {
              errorCode: error?.code,
              errorMessage: error?.message,
            },
          },
        ],
      });
      return;
    }

    // attach PM to customer
    await api.savePaymentMethodToCustomer({
      paymentMethodId: paymentMethod.id,
    });

    addLogs({
      name: 'Read Reusable Card',
      events: [
        {
          name: 'Finished',
          description: 'terminal.readReusableCard',
          metadata: {
            customerId: 'no customer',
            paymentMethodId: paymentMethod?.id,
          },
        },
      ],
    });
  }, [
    api,
    clearLogs,
    navigation,
    addLogs,
    cancelReadReusableCard,
    readReusableCard,
  ]);

  useEffect(() => {
    _readReusableCard();
  }, [_readReusableCard]);

  return <ScrollView contentContainerStyle={styles.container} />;
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
