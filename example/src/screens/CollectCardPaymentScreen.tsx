import { useNavigation, useRoute } from '@react-navigation/core';
import React, { useState, useContext } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
} from 'react-native';
import {
  useStripeTerminal,
  PaymentIntent,
  StripeError,
  CommonError,
} from 'stripe-terminal-react-native';
import { colors } from '../colors';
import List from '../components/List';
import ListItem from '../components/ListItem';
import { LogContext } from '../components/LogContext';
import { API_URL } from '../Config';

export default function CollectCardPaymentScreen() {
  const [inputValues, setInputValues] = useState<{
    amount: string;
    currency: string;
  }>({
    amount: '20000',
    currency: 'USD',
  });
  const [enableInterac, setEnableInterac] = useState(false);
  const { params } = useRoute();
  const { simulated, discoveryMethod } = params as Record<string, any>;
  const { addLogs, clearLogs } = useContext(LogContext);
  const navigation = useNavigation();

  const {
    createPaymentIntent,
    collectPaymentMethod,
    processPayment,
    retrievePaymentIntent,
  } = useStripeTerminal({
    onDidRequestReaderInput: (input) => {
      addLogs({
        name: 'Collect Payment Method',
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
        name: 'Collect Payment Method',
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

  const createServerPaymentIntent = async () => {
    const response = await fetch(`${API_URL}/create_payment_intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const { client_secret, id } = await response.json();
    return { client_secret, id, error: null };
  };

  const _createPaymentIntent = async () => {
    clearLogs();
    navigation.navigate('LogScreen');
    addLogs({
      name: 'Create Payment Intent',
      events: [{ name: 'Create', description: 'terminal.createPaymentIntent' }],
    });
    const paymentMethods = ['card_present'];
    if (enableInterac) {
      paymentMethods.push('interac_present');
    }
    let paymentIntent: PaymentIntent.Type | undefined;
    let paymentIntentError: StripeError<CommonError> | undefined;
    if (discoveryMethod === 'internet') {
      const { client_secret } = await createServerPaymentIntent();

      const response = await retrievePaymentIntent(client_secret);
      paymentIntent = response.paymentIntent;
      paymentIntentError = response.error;
    } else {
      const response = await createPaymentIntent({
        amount: Number(inputValues.amount),
        currency: inputValues.currency,
        paymentMethodTypes: paymentMethods,
        setupFutureUsage: 'off_session',
      });
      paymentIntent = response.paymentIntent;
      paymentIntentError = response.error;
    }

    if (paymentIntentError) {
      addLogs({
        name: 'Create Payment Intent',
        events: [
          {
            name: paymentIntentError.code,
            description: paymentIntentError.message,
          },
        ],
      });
    } else if (paymentIntent) {
      addLogs({
        name: 'Create Payment Intent',
        events: [
          {
            name: 'Created',
            description: 'terminal.paymentIntentId: ' + paymentIntent.id,
          },
        ],
      });
      await _collectPaymentMethod(paymentIntent.id);
    }
  };

  const _collectPaymentMethod = async (paymentIntentId: string) => {
    addLogs({
      name: 'Collect Payment Method',
      events: [
        { name: 'Collect', description: 'terminal.collectPaymentMethod' },
      ],
    });
    const { paymentIntent, error } = await collectPaymentMethod(
      paymentIntentId
    );

    if (error) {
      addLogs({
        name: 'Collect Payment Method',
        events: [
          {
            name: error.code,
            description: error.message,
          },
        ],
      });
    } else if (paymentIntent) {
      addLogs({
        name: 'Collect Payment Method',
        events: [
          {
            name: 'Collected',
            description: 'terminal.paymentIntentId: ' + paymentIntent.id,
          },
        ],
      });
      await _processPayment(paymentIntentId);
    }
  };

  const _processPayment = async (paymentIntentId: string) => {
    addLogs({
      name: 'Process Payment',
      events: [{ name: 'Process', description: 'terminal.processPayment' }],
    });

    const { paymentIntent, error } = await processPayment(paymentIntentId);
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
    } else if (paymentIntent) {
      addLogs({
        name: 'Process Payment',
        events: [
          {
            name: 'Finished',
            description: 'terminal.paymentIntentId: ' + paymentIntent.id,
          },
        ],
      });
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="always"
    >
      <List bolded={false} topSpacing={false} title="AMOUNT">
        <TextInput
          testID="amount-text-field"
          style={styles.input}
          value={inputValues.amount}
          onChangeText={(value: string) =>
            setInputValues((state) => ({ ...state, amount: value }))
          }
          placeholder="amount"
        />
      </List>
      <List bolded={false} topSpacing={false} title="CURRENCY">
        <TextInput
          testID="currency-text-field"
          style={styles.input}
          value={inputValues.currency}
          onChangeText={(value: string) =>
            setInputValues((state) => ({ ...state, currency: value }))
          }
          placeholder="currency"
        />
      </List>

      {Platform.OS === 'ios' && (
        <List bolded={false} topSpacing={false} title="PAYMENT METHOD">
          <ListItem
            title="Enable Interac Present"
            rightElement={
              <Switch
                value={enableInterac}
                onValueChange={(value) => setEnableInterac(value)}
              />
            }
          />
        </List>
      )}

      <List
        bolded={false}
        topSpacing={false}
        title={`${(Number(inputValues.amount) / 100).toFixed(2)} ${
          inputValues.currency
        }`}
      >
        <ListItem
          color={colors.blue}
          title="Collect payment"
          onPress={_createPaymentIntent}
        />
        {simulated ? (
          <Text style={styles.info}>
            Collect a card payment using a simulated reader
          </Text>
        ) : (
          <Text style={styles.info}>
            Collect a card payment using a physical Stripe test card and reader
          </Text>
        )}
      </List>
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
  input: {
    height: 44,
    backgroundColor: colors.white,
    color: colors.dark_gray,
    paddingLeft: 16,
    marginBottom: 12,
    borderBottomColor: colors.gray,
    ...Platform.select({
      ios: {
        borderBottomWidth: StyleSheet.hairlineWidth,
      },
      android: {
        borderBottomWidth: 1,
        borderBottomColor: `${colors.gray}66`,
      },
    }),
  },
  enableInteracContainer: {
    flexDirection: 'row',
    marginVertical: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    color: colors.dark_gray,
    paddingHorizontal: 16,
    marginVertical: 16,
  },
});
