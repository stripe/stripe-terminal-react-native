import { useNavigation, useRoute, RouteProp, type NavigationProp } from '@react-navigation/core';
import React, { useContext, useState } from 'react';
import { Platform, StyleSheet, Switch, Text, TextInput } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useStripeTerminal } from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import List from '../components/List';
import ListItem from '../components/ListItem';
import { LogContext } from '../components/LogContext';
import { AppContext } from '../AppContext';
import type { RouteParamList } from '../App';
import { formatAmountForDisplay } from '../util/currencyUtils';

export default function RefundPaymentScreen() {
  const { lastSuccessfulChargeId } = useContext(AppContext);
  const [inputValues, setInputValues] = useState<{
    chargeId: string;
    paymentIntentId: string;
    amount: string;
    currency: string;
    refundApplicationFee?: boolean;
    reverseTransfer?: boolean;
    enableCustomerCancellation?: boolean;
  }>({
    chargeId: lastSuccessfulChargeId || '',
    paymentIntentId: '',
    amount: '100',
    currency: 'CAD',
    refundApplicationFee: false,
    reverseTransfer: false,
    enableCustomerCancellation: false,
  });
  const navigation = useNavigation<NavigationProp<RouteParamList>>();
  const { params } = useRoute<RouteProp<RouteParamList, 'RefundPaymentScreen'>>();
  const [testCardNumber, setTestCardNumber] = useState('4506445006931933');

  const { simulated, discoveryMethod } = params;
  const { addLogs, clearLogs } = useContext(LogContext);

  const {
    collectRefundPaymentMethod,
    cancelCollectRefundPaymentMethod,
    confirmRefund,
    setSimulatedCard,
  } = useStripeTerminal({
    onDidRequestReaderInput: (input) => {
      addLogs({
        name: 'Collect Refund Payment Method',
        events: [
          {
            name: input.join(' / '),
            description: 'terminal.didRequestReaderInput',
            onBack: cancelCollectRefundPaymentMethod,
          },
        ],
      });
    },
    onDidRequestReaderDisplayMessage: (message) => {
      addLogs({
        name: 'Collect Refund Payment Method',
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

  const _collectRefundPaymentMethod = async () => {
    clearLogs();

    if (simulated) {
      await setSimulatedCard(testCardNumber);
    }

    navigation.navigate('LogListScreen', {});
    addLogs({
      name: 'Collect Refund Payment Method',
      events: [
        {
          name: 'Collect',
          description: 'terminal.collectRefundPaymentMethod',
          metadata: _refundMetadata,
          onBack: cancelCollectRefundPaymentMethod,
        },
      ],
    });
    const { error } = await collectRefundPaymentMethod({
      ...inputValues,
      amount: parseInt(inputValues.amount || '0', 10),
    });

    if (error) {
      addLogs({
        name: 'Collect Refund Payment Method',
        events: [
          {
            name: 'Failed',
            description: 'terminal.collectRefundPaymentMethod',
            metadata: {
              errorCode: error.code,
              errorMessage: error.message,
            },
          },
        ],
      });
    } else {
      addLogs({
        name: 'Collect Refund Payment Method',
        events: [
          {
            name: 'Collected',
            description: 'terminal.collectRefundPaymentMethod',
            metadata: _refundMetadata,
          },
        ],
      });
      _confirmRefund();
    }
  };

  const _confirmRefund = async () => {
    addLogs({
      name: 'Confirm Refund',
      events: [
        {
          name: 'Processing',
          description: 'terminal.confirmRefund',
          metadata: _refundMetadata,
        },
      ],
    });
    const { error, refund } = await confirmRefund();
    if (error) {
      addLogs({
        name: 'Confirm Refund',
        events: [
          {
            name: 'Failed',
            description: 'terminal.confirmRefund',
            metadata: {
              errorCode: error.code,
              errorMessage: error.message,
            },
          },
        ],
      });
    } else if (refund && refund.status === 'succeeded') {
      addLogs({
        name: 'Confirm Refund',
        events: [
          {
            name: 'Succeeded',
            description: 'terminal.confirmRefund',
            metadata: _refundMetadata,
          },
        ],
      });
    } else {
      addLogs({
        name: 'Confirm Refund',
        events: [
          {
            name: 'Pending or unsuccessful',
            description: 'terminal.confirmRefund',
            metadata: _refundMetadata,
          },
        ],
      });
    }
  };

  const _refundMetadata = {
    amount: inputValues.amount,
    chargeId: inputValues.chargeId,
    currency: inputValues.currency,
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      keyboardShouldPersistTaps="always"
      testID="refund-scroll-view"
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
      <List bolded={false} topSpacing={false} title="CHARGE ID">
        <TextInput
          style={styles.input}
          value={inputValues.chargeId}
          testID="charge-id-text-field"
          onChangeText={(value: string) =>
            setInputValues((state) => ({ ...state, chargeId: value }))
          }
          placeholder="Charge ID"
        />
      </List>
      <List bolded={false} topSpacing={false} title="AMOUNT">
        <TextInput
          style={styles.input}
          value={inputValues.amount}
          testID="amount-text-field"
          onChangeText={(value: string) =>
            setInputValues((state) => ({ ...state, amount: value }))
          }
          keyboardType="number-pad"
          placeholder="Amount"
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

      <List bolded={false} topSpacing={false} title="REFUND APPLICATION FEE">
        <ListItem
          title="Refund Application Fee"
          rightElement={
            <Switch
              testID="refund-application-fee"
              value={inputValues.refundApplicationFee}
              onValueChange={(value) => {
                setInputValues((state) => ({
                  ...state,
                  refundApplicationFee: value,
                }));
              }}
            />
          }
        />
      </List>

      <List bolded={false} topSpacing={false} title="REVERSE TRANSFER">
        <ListItem
          title="Reverse Transfer"
          rightElement={
            <Switch
              testID="reverse-transfer"
              value={inputValues.reverseTransfer}
              onValueChange={(value) =>
                setInputValues((state) => ({
                  ...state,
                  reverseTransfer: value,
                }))
              }
            />
          }
        />
      </List>

      {discoveryMethod === 'internet' && (
        <List bolded={false} topSpacing={false} title="TRANSACTION FEATURES">
          <ListItem
            title="Customer cancellation"
            rightElement={
              <Switch
                testID="enable-cancellation"
                value={inputValues.enableCustomerCancellation}
                onValueChange={(value) =>
                  setInputValues((state) => ({
                    ...state,
                    enableCustomerCancellation: value,
                  }))
                }
              />
            }
          />
        </List>
      )}

      <List
        bolded={false}
        topSpacing={false}
        title={`${formatAmountForDisplay(inputValues.amount, inputValues.currency)} ${
          inputValues.currency.toUpperCase()
        }`}
      >
        <ListItem
          color={colors.blue}
          testID="collect-refund-button"
          title="Collect refund"
          onPress={_collectRefundPaymentMethod}
        />

        <Text style={styles.info}>
          Refund a payment using a physical Interac test card. In- person
          refunds can only be processed if the payment method requires an
          in-person refund; if not, use the Stripe API.
        </Text>
      </List>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light_gray,
    paddingBottom: 22,
    height: '100%',
  },
  buttonWrapper: {
    marginBottom: 60,
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
  info: {
    color: colors.dark_gray,
    paddingHorizontal: 16,
    marginVertical: 16,
  },
});
