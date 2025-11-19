import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/core';
import React, { useContext, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useStripeTerminal } from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import { DevAppError } from '../errors/DevAppError';
import List from '../components/List';
import ListItem from '../components/ListItem';
import { LogContext } from '../components/LogContext';
import { AppContext } from '../AppContext';
import type { RouteParamList } from '../App';
import { formatAmountForDisplay } from '../util/currencyUtils';
import { Picker } from '@react-native-picker/picker';
import type { NavigationProp } from '@react-navigation/native';

export default function RefundPaymentScreen() {
  const {
    lastSuccessfulAmount,
    lastSuccessfulChargeId,
    lastSuccessfulPaymentIntentId,
  } = useContext(AppContext);
  const [inputValues, setInputValues] = useState<{
    chargeId: string;
    paymentIntentId: string;
    amount: string;
    currency: string;
    refundApplicationFee?: boolean;
    reverseTransfer?: boolean;
    enableCustomerCancellation?: boolean;
    addMetadata: boolean;
  }>({
    chargeId: lastSuccessfulChargeId || '',
    paymentIntentId: lastSuccessfulPaymentIntentId || '',
    amount: lastSuccessfulAmount || '',
    currency: 'CAD',
    refundApplicationFee: false,
    reverseTransfer: false,
    enableCustomerCancellation: false,
    addMetadata: false,
  });
  const navigation = useNavigation<NavigationProp<RouteParamList>>();
  const { params } =
    useRoute<RouteProp<RouteParamList, 'RefundPaymentScreen'>>();
  const [testCardNumber, setTestCardNumber] = useState('4506445006931933');

  const { simulated, discoveryMethod } = params;
  const { addLogs, clearLogs } = useContext(LogContext);

  const {
    collectRefundPaymentMethod,
    cancelCollectRefundPaymentMethod,
    confirmRefund,
    cancelConfirmRefund,
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
      chargeId: selectedRefundIdType === 'chargeId' ? inputValues.chargeId : '',
      paymentIntentId:
        selectedRefundIdType === 'chargeId' ? '' : inputValues.paymentIntentId,
      metadata: inputValues.addMetadata
        ? {
            meta_key1: 'meta_value1',
            meta_key2: 'meta_value2',
          }
        : undefined,
    });

    if (error) {
      const devError = DevAppError.fromStripeError(error);
      addLogs({
        name: 'Collect Refund Payment Method',
        events: [
          {
            name: 'Failed',
            description: 'terminal.collectRefundPaymentMethod',
            metadata: devError.toJSON(),
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
          onBack: cancelConfirmRefund,
          description: 'terminal.confirmRefund',
          metadata: _refundMetadata,
        },
      ],
    });
    const { error, refund } = await confirmRefund();
    if (error) {
      const devError = DevAppError.fromStripeError(error);
      addLogs({
        name: 'Confirm Refund',
        events: [
          {
            name: 'Failed',
            description: 'terminal.confirmRefund',
            metadata: devError.toJSON(),
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
            metadata: { ..._refundMetadata, raw: JSON.stringify(refund) },
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
            metadata: { ..._refundMetadata, raw: JSON.stringify(refund) },
          },
        ],
      });
    }
  };

  const _refundMetadata = {
    amount: inputValues.amount,
    chargeId: inputValues.chargeId,
    paymentIntentId: inputValues.paymentIntentId,
    currency: inputValues.currency,
  };

  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<Picker<string>>(null);
  const REFUND_ID_TYPE = ['chargeId', 'paymentIntentId'];
  const [selectedRefundIdType, setSelectedRefundIdType] =
    useState<string>('chargeId');

  const handleChangeRefundIdType = async (type: string) => {
    setSelectedRefundIdType(type);
  };

  function mapToDisplayName(type: string) {
    switch (type) {
      case 'chargeId':
        return 'Charge ID';
      case 'paymentIntentId':
        return 'PaymentIntent ID';
      default:
        return '';
    }
  }

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
      <List bolded={false} topSpacing={false} title="REFUND ID">
        <ListItem
          testID="refund-id-type-picker"
          onPress={() => {
            setShowPicker(true);
            // Android workaround for instant diplaying options list
            setTimeout(() => {
              pickerRef.current?.focus();
            }, 100);
          }}
          title={mapToDisplayName(selectedRefundIdType)}
        />
        <TextInput
          style={styles.input}
          value={
            selectedRefundIdType === 'chargeId'
              ? inputValues.chargeId
              : inputValues.paymentIntentId
          }
          testID="charge-id-text-field"
          onChangeText={(value: string) => {
            if (selectedRefundIdType === 'chargeId') {
              setInputValues((state) => ({ ...state, chargeId: value }));
            } else {
              setInputValues((state) => ({ ...state, paymentIntentId: value }));
            }
          }}
          placeholder={
            selectedRefundIdType === 'chargeId'
              ? 'Charge ID'
              : 'PaymentIntent ID'
          }
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

      <List bolded={false} topSpacing={false} title="Metadata">
        <ListItem
          title="Add extra metadata"
          rightElement={
            <Switch
              testID="add-metadata"
              value={inputValues.addMetadata}
              onValueChange={(value) =>
                setInputValues((state) => ({
                  ...state,
                  addMetadata: value,
                }))
              }
            />
          }
        />
      </List>
      <List
        bolded={false}
        topSpacing={false}
        title={`${formatAmountForDisplay(
          inputValues.amount,
          inputValues.currency
        )} ${inputValues.currency.toUpperCase()}`}
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

      <Modal visible={showPicker} transparent>
        <TouchableWithoutFeedback
          testID="close-picker"
          onPress={() => {
            setShowPicker(false);
          }}
        >
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.pickerContainer} testID="picker-container">
          <Picker
            selectedValue={selectedRefundIdType}
            ref={pickerRef as any}
            style={styles.picker}
            itemStyle={styles.pickerItem}
            onValueChange={(itemValue: string) => {
              handleChangeRefundIdType(itemValue);
              if (Platform.OS === 'android') {
                setShowPicker(false);
              }
            }}
          >
            {REFUND_ID_TYPE.map((type) => (
              <Picker.Item
                key={type}
                label={mapToDisplayName(type)}
                testID={type}
                value={type}
              />
            ))}
          </Picker>
        </View>
      </Modal>
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
    color: colors.slate,
  },
  pickerContainer: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: colors.white,
    left: 0,
    width: '100%',
    ...Platform.select({
      ios: {
        height: 200,
      },
    }),
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
});
