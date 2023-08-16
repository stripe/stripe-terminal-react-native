import { useNavigation, useRoute, RouteProp } from '@react-navigation/core';
import React, { useState, useContext } from 'react';
import { Picker } from '@react-native-picker/picker';
import { Platform, StyleSheet, Switch, Text, TextInput } from 'react-native';
import {
  useStripeTerminal,
  PaymentIntent,
  StripeError,
  CommonError,
} from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import List from '../components/List';
import ListItem from '../components/ListItem';
import { LogContext } from '../components/LogContext';
import type { RouteParamList } from '../App';
import { AppContext } from '../AppContext';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const CURRENCIES = [
  { value: 'usd', label: 'USD' },
  { value: 'gbp', label: 'GBP' },
  { value: 'cad', label: 'CAD' },
  { value: 'sgd', label: 'SGD' },
  { value: 'eur', label: 'EUR' },
  { value: 'aud', label: 'AUD' },
  { value: 'nzd', label: 'NZD' },
  { value: 'dkk', label: 'DKK' },
  { value: 'sek', label: 'SEK' },
];

export default function CollectCardPaymentScreen() {
  const { api, setLastSuccessfulChargeId } = useContext(AppContext);

  const [inputValues, setInputValues] = useState<{
    amount: string;
    currency: string;
    connectedAccountId?: string;
    applicationFeeAmount?: string;
  }>({
    amount: '20000',
    currency: 'usd',
  });
  const [testCardNumber, setTestCardNumber] = useState('4242424242424242');
  const [enableInterac, setEnableInterac] = useState(false);
  const [skipTipping, setSkipTipping] = useState(false);
  const { params } =
    useRoute<RouteProp<RouteParamList, 'CollectCardPayment'>>();
  const { simulated, discoveryMethod } = params;
  const { addLogs, clearLogs } = useContext(LogContext);
  const navigation = useNavigation();

  const {
    createPaymentIntent,
    collectPaymentMethod,
    processPayment,
    retrievePaymentIntent,
    cancelCollectPaymentMethod,
    setSimulatedCard,
  } = useStripeTerminal({
    onDidRequestReaderInput: (input) => {
      addLogs({
        name: 'Collect Payment Method',
        events: [
          {
            name: input.join(' / '),
            description: 'terminal.didRequestReaderInput',
            onBack: cancelCollectPaymentMethod,
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

  const _createPaymentIntent = async () => {
    if (simulated) {
      await setSimulatedCard(testCardNumber);
    }

    clearLogs();
    navigation.navigate('LogListScreen');
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
      const resp = await api.createPaymentIntent({
        amount: Number(inputValues.amount),
        currency: inputValues.currency,
        payment_method_types: paymentMethods,
      });

      if ('error' in resp) {
        addLogs({
          name: 'Create Payment Intent',
          events: [
            {
              name: 'Failed',
              description: 'terminal.createPaymentIntent',
              metadata: {
                errorCode: resp.error?.code,
                errorMessage: resp.error?.message,
              },
            },
          ],
        });
        return;
      }

      if (!resp.client_secret) {
        return Promise.resolve({
          error: { message: 'no client_secret returned!' },
        });
      }

      const response = await retrievePaymentIntent(resp.client_secret);
      paymentIntent = response.paymentIntent;
      paymentIntentError = response.error;
    } else {
      const response = await createPaymentIntent({
        amount: Number(inputValues.amount),
        currency: inputValues.currency,
        paymentMethodTypes: paymentMethods,
        onBehalfOf: inputValues.connectedAccountId,
        transferDataDestination: inputValues.connectedAccountId,
        applicationFeeAmount: inputValues.applicationFeeAmount
          ? Number(inputValues.applicationFeeAmount)
          : undefined,
      });
      paymentIntent = response.paymentIntent;
      paymentIntentError = response.error;
    }

    if (paymentIntentError) {
      addLogs({
        name: 'Create Payment Intent',
        events: [
          {
            name: 'Failed',
            description: 'terminal.createPaymentIntent',
            metadata: {
              errorCode: paymentIntentError?.code,
              errorMessage: paymentIntentError?.message,
            },
          },
        ],
      });
      return;
    }

    if (!paymentIntent?.id) {
      addLogs({
        name: 'Create Payment Intent',
        events: [
          {
            name: 'Failed',
            description: 'terminal.createPaymentIntent',
            metadata: {
              errorCode: 'no_code',
              errorMessage: 'No payment id returned!',
            },
          },
        ],
      });
      return;
    }

    addLogs({
      name: 'Create Payment Intent',
      events: [
        {
          name: 'Created',
          description: 'terminal.createPaymentIntent',
          metadata: { paymentIntentId: paymentIntent.id },
        },
      ],
    });

    return await _collectPaymentMethod(paymentIntent.id);
  };

  const _collectPaymentMethod = async (paymentIntentId: string) => {
    addLogs({
      name: 'Collect Payment Method',
      events: [
        {
          name: 'Collect',
          description: 'terminal.collectPaymentMethod',
          metadata: { paymentIntentId },
          onBack: cancelCollectPaymentMethod,
        },
      ],
    });
    const { paymentIntent, error } = await collectPaymentMethod({
      paymentIntentId: paymentIntentId,
      skipTipping: skipTipping,
    });

    if (error) {
      addLogs({
        name: 'Collect Payment Method',
        events: [
          {
            name: 'Failed',
            description: 'terminal.collectPaymentMethod',
            metadata: {
              errorCode: error.code,
              errorMessage: error.message,
            },
          },
        ],
      });
    } else if (paymentIntent) {
      addLogs({
        name: 'Collect Payment Method',
        events: [
          {
            name: 'Collected',
            description: 'terminal.collectPaymentMethod',
            metadata: { paymentIntentId: paymentIntent.id },
          },
        ],
      });
      await _processPayment(paymentIntentId);
    }
  };

  const _processPayment = async (paymentIntentId: string) => {
    addLogs({
      name: 'Process Payment',
      events: [
        {
          name: 'Process',
          description: 'terminal.processPayment',
          metadata: { paymentIntentId },
        },
      ],
    });

    const { paymentIntent, error } = await processPayment(paymentIntentId);

    if (error) {
      addLogs({
        name: 'Process Payment',
        events: [
          {
            name: 'Failed',
            description: 'terminal.processPayment',
            metadata: {
              errorCode: error.code,
              errorMessage: error.message,
            },
          },
        ],
      });
      return;
    }

    if (!paymentIntent) {
      addLogs({
        name: 'Process Payment',
        events: [
          {
            name: 'Failed',
            description: 'terminal.processPayment',
            metadata: {
              errorCode: 'no_code',
              errorMessage: 'no payment intent id returned!',
            },
          },
        ],
      });
      return;
    }

    addLogs({
      name: 'Process Payment',
      events: [
        {
          name: 'Processed',
          description: 'terminal.processPayment',
          metadata: {
            paymententIntentId: paymentIntentId,
            chargeId: paymentIntent.charges[0].id,
          },
        },
      ],
    });

    // Set last successful charge Id in context for refunding later
    setLastSuccessfulChargeId(paymentIntent.charges[0].id);

    if (paymentIntent?.status === 'succeeded') {
      return;
    }

    _capturePayment(paymentIntentId);
  };

  const _capturePayment = async (paymentIntentId: string) => {
    addLogs({
      name: 'Capture Payment',
      events: [{ name: 'Capture', description: 'terminal.capturePayment' }],
    });

    const resp = await api.capturePaymentIntent(paymentIntentId);

    if ('error' in resp) {
      addLogs({
        name: 'Capture Payment',
        events: [
          {
            name: 'Failed',
            description: 'terminal.capturePayment',
            metadata: {
              errorCode: resp.error.code,
              errorMessage: resp.error.message,
            },
          },
        ],
      });
      return;
    }

    addLogs({
      name: 'Capture Payment',
      events: [
        {
          name: 'Captured',
          description: 'terminal.paymentIntentId: ' + resp.id,
        },
      ],
    });
  };

  return (
    <KeyboardAwareScrollView
      testID="collect-scroll-view"
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="always"
    >
      {simulated && (
        <List bolded={false} topSpacing={false} title="CARD NUMBER">
          <TextInput
            testID="card-number-text-field"
            keyboardType="numeric"
            style={styles.input}
            value={testCardNumber}
            onChangeText={(value) => setTestCardNumber(value)}
            placeholder="card number"
          />
        </List>
      )}
      <List bolded={false} topSpacing={false} title="AMOUNT">
        <TextInput
          testID="amount-text-field"
          keyboardType="numeric"
          style={styles.input}
          value={inputValues.amount}
          onChangeText={(value) =>
            setInputValues((state) => ({ ...state, amount: value }))
          }
          placeholder="amount"
        />
      </List>
      <List bolded={false} topSpacing={false} title="CURRENCY">
        <Picker
          selectedValue={inputValues?.currency}
          style={styles.picker}
          itemStyle={styles.pickerItem}
          testID="select-currency-picker"
          onValueChange={(value) =>
            setInputValues((state) => ({ ...state, currency: value }))
          }
        >
          {CURRENCIES.map((a) => (
            <Picker.Item
              key={a.value}
              label={a.label}
              testID={a.value}
              value={a.value}
            />
          ))}
        </Picker>
      </List>

      <List bolded={false} topSpacing={false} title="INTERAC">
        <ListItem
          title="Enable Interac Present"
          rightElement={
            <Switch
              testID="enable-interac"
              value={enableInterac}
              onValueChange={(value) => setEnableInterac(value)}
            />
          }
        />
      </List>

      <List bolded={false} topSpacing={false} title="SKIP TIPPING">
        <ListItem
          title="Skip Tipping"
          rightElement={
            <Switch
              testID="skip-tipping"
              value={skipTipping}
              onValueChange={(value) => setSkipTipping(value)}
            />
          }
        />
      </List>

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
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light_gray,
    paddingVertical: 22,
    flexGrow: 1,
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
        color: colors.dark_gray,
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
  },
});
