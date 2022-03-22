import { useNavigation } from '@react-navigation/core';
import React, { useContext, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { useStripeTerminal } from 'stripe-terminal-react-native';
import { colors } from '../colors';
import List from '../components/List';
import ListItem from '../components/ListItem';
import { LogContext } from '../components/LogContext';

export default function RefundPaymentScreen() {
  const [inputValues, setInputValues] = useState<{
    chargeId: string;
    amount: string;
    currency: string;
  }>({
    chargeId: '',
    amount: '100',
    currency: 'USD',
  });
  const navigation = useNavigation();
  const { addLogs, clearLogs } = useContext(LogContext);

  const { collectRefundPaymentMethod, processRefund } = useStripeTerminal();

  const _collectRefundPaymentMethod = async () => {
    clearLogs();
    navigation.navigate('LogListScreen');
    addLogs({
      name: 'Collect Refund Payment Method',
      events: [
        {
          name: 'Collect',
          description: 'terminal.collectRefundPaymentMethod',
          metadata: _refundMetadata,
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
      _processRefund();
    }
  };

  const _processRefund = async () => {
    addLogs({
      name: 'Process Refund',
      events: [
        {
          name: 'Processing',
          description: 'terminal.processRefund',
          metadata: _refundMetadata,
        },
      ],
    });
    const { error, refund } = await processRefund();
    if (error) {
      addLogs({
        name: 'Process Refund',
        events: [
          {
            name: 'Failed',
            description: 'terminal.processRefund',
            metadata: {
              errorCode: error.code,
              errorMessage: error.message,
            },
          },
        ],
      });
    } else if (refund && refund.status === 'succeeded') {
      addLogs({
        name: 'Process Refund',
        events: [
          {
            name: 'Succeeded',
            description: 'terminal.processRefund',
            metadata: _refundMetadata,
          },
        ],
      });
    } else {
      addLogs({
        name: 'Process Refund',
        events: [
          {
            name: 'Pending or unsuccessful',
            description: 'terminal.processRefund',
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
    <ScrollView style={styles.container} keyboardShouldPersistTaps="always">
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

      <List
        bolded={false}
        topSpacing={false}
        title={`${(Number(inputValues.amount) / 100).toFixed(2)} ${
          inputValues.currency
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light_gray,
    flex: 1,
    paddingVertical: 22,
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
