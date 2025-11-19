import { useNavigation, useRoute, RouteProp, type NavigationProp } from '@react-navigation/core';
import React, { useState, useContext } from 'react';
import { Picker } from '@react-native-picker/picker';
import { Platform, StyleSheet, Switch, Text, TextInput } from 'react-native';
import {
  useStripeTerminal,
  PaymentIntent,
  StripeError,
} from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import List from '../components/List';
import ListItem from '../components/ListItem';
import { LogContext } from '../components/LogContext';
import type { RouteParamList } from '../App';
import { AppContext } from '../AppContext';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  DEFAULT_ENABLED_PAYMENT_METHOD_TYPES,
  PAYMENT_METHOD_TYPES,
} from '../util/paymentMethodTypes';
import { formatAmountForDisplay } from '../util/currencyUtils';

const CURRENCIES = [
  { value: 'usd', label: 'USD' },
  { value: 'aed', label: 'AED' },
  { value: 'aud', label: 'AUD' },
  { value: 'bgn', label: 'BGN'},
  { value: 'cad', label: 'CAD' },
  { value: 'chf', label: 'CHF' },
  { value: 'czk', label: 'CZK' },
  { value: 'dkk', label: 'DKK' },
  { value: 'eur', label: 'EUR' },
  { value: 'gbp', label: 'GBP' },
  { value: 'gip', label: 'GIP' },
  { value: 'hkd', label: 'HKD' },
  { value: 'huf', label: 'HUF' },
  { value: 'jpy', label: 'JPY' },
  { value: 'myr', label: 'MYR' },
  { value: 'nok', label: 'NOK' },
  { value: 'nzd', label: 'NZD' },
  { value: 'pln', label: 'PLN' },
  { value: 'ron', label: 'RON' },
  { value: 'sek', label: 'SEK' },
  { value: 'sgd', label: 'SGD' },
];

const CAPTURE_METHODS = [
  { value: 'automatic', label: 'automatic' },
  { value: 'manual', label: 'manual' },
];

const ROUTING_PRIORITY = [
  { value: '', label: 'default' },
  { value: 'domestic', label: 'domestic' },
  { value: 'international', label: 'international' },
];

const OFFLINE_BEHAVIOR = [
  { value: 'prefer_online', label: 'prefer_online' },
  { value: 'require_online', label: 'require_online' },
  { value: 'force_offline', label: 'force_offline' },
];

export default function CollectCardPaymentScreen() {
  const { api, setLastSuccessfulChargeId } = useContext(AppContext);

  const [inputValues, setInputValues] = useState<{
    amount: string;
    currency: string;
    connectedAccountId?: string;
    applicationFeeAmount?: string;
    requestExtendedAuthorization?: boolean;
    requestIncrementalAuthorizationSupport?: boolean;
    captureMethod: 'automatic' | 'manual';
    requestedPriority: 'domestic' | 'international' | '';
    offlineBehavior: 'prefer_online' | 'require_online' | 'force_offline';
    offlineModeTransactionLimit: string;
    offlineModeStoredTransactionLimit: string;
  }>({
    amount: '20000',
    currency: 'usd',
    captureMethod: 'manual',
    requestedPriority: '',
    offlineBehavior: 'prefer_online',
    offlineModeTransactionLimit: '20000',
    offlineModeStoredTransactionLimit: '50000',
  });
  const [testCardNumber, setTestCardNumber] = useState('4242424242424242');
  const [enableInterac, setEnableInterac] = useState(false);
  const [enableConnect, setEnableConnect] = useState(false);
  const [skipTipping, setSkipTipping] = useState(false);
  const [enableUpdatePaymentIntent, setEnableUpdatePaymentIntent] =
    useState(false);
  const [enableCustomerCancellation, setEnableCustomerCancellation] =
    useState(false);
  const [tipEligibleAmount, setTipEligibleAmount] = useState('');
  const paymentMethodTypes = PAYMENT_METHOD_TYPES;
  const [enabledPaymentMethodTypes, setEnabledPaymentMethodTypes] = useState(
    DEFAULT_ENABLED_PAYMENT_METHOD_TYPES
  );
  const { params } =
    useRoute<RouteProp<RouteParamList, 'CollectCardPaymentScreen'>>();
  const { simulated, discoveryMethod } = params;
  const { addLogs, clearLogs } = useContext(LogContext);
  const navigation = useNavigation<NavigationProp<RouteParamList>>();

  const {
    createPaymentIntent,
    collectPaymentMethod,
    confirmPaymentIntent,
    retrievePaymentIntent,
    cancelCollectPaymentMethod,
    setSimulatedCard,
    getOfflineStatus,
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
    navigation.navigate('LogListScreen', {});
    addLogs({
      name: 'Create Payment Intent',
      events: [{ name: 'Create', description: 'terminal.createPaymentIntent' }],
    });
    const resolvedPaymentMethodTypes = enabledPaymentMethodTypes;
    if (
      enableInterac &&
      !resolvedPaymentMethodTypes.includes('interac_present')
    ) {
      resolvedPaymentMethodTypes.push('interac_present');
    }
    const routingPriority = {
      requested_priority: inputValues.requestedPriority,
    };
    const paymentMethodOptions = {
      card_present: {
        request_extended_authorization:
          inputValues.requestExtendedAuthorization,
        request_incremental_authorization_support:
          inputValues.requestIncrementalAuthorizationSupport,
        routing: routingPriority,
      },
    };
    let paymentIntent: PaymentIntent.Type | undefined;
    let paymentIntentError: StripeError | undefined;
    if (discoveryMethod === 'internet') {
      const resp = await api.createPaymentIntent({
        amount: Number(inputValues.amount),
        currency: inputValues.currency,
        payment_method_types: resolvedPaymentMethodTypes,
        payment_method_options: paymentMethodOptions,
        capture_method: inputValues?.captureMethod,
        on_behalf_of: inputValues?.connectedAccountId,
        application_fee_amount: Number(inputValues.applicationFeeAmount),
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
      const offlineStatus = await getOfflineStatus();
      let storedPaymentAmount = 0;
      for (let currency in offlineStatus.sdk.offlinePaymentAmountsByCurrency) {
        if (currency === inputValues.currency) {
          storedPaymentAmount =
            offlineStatus.sdk.offlinePaymentAmountsByCurrency[currency];
        }
      }
      if (
        Number(inputValues.amount) >
          Number(inputValues.offlineModeTransactionLimit) ||
        storedPaymentAmount >
          Number(inputValues.offlineModeStoredTransactionLimit)
      ) {
        inputValues.offlineBehavior = 'require_online';
      }
      const response = await createPaymentIntent({
        amount: Number(inputValues.amount),
        currency: inputValues.currency,
        paymentMethodTypes: resolvedPaymentMethodTypes,
        onBehalfOf: inputValues.connectedAccountId,
        transferDataDestination: inputValues.connectedAccountId,
        applicationFeeAmount: inputValues.applicationFeeAmount
          ? Number(inputValues.applicationFeeAmount)
          : undefined,
        paymentMethodOptions: {
          requestExtendedAuthorization:
            inputValues.requestExtendedAuthorization,
          requestIncrementalAuthorizationSupport:
            inputValues.requestIncrementalAuthorizationSupport,
          requestedPriority: inputValues.requestedPriority,
        },
        captureMethod: inputValues?.captureMethod,
        offlineBehavior: inputValues?.offlineBehavior,
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

    if (!paymentIntent) {
      addLogs({
        name: 'Create Payment Intent',
        events: [
          {
            name: 'Failed',
            description: 'terminal.createPaymentIntent',
            metadata: {
              errorCode: 'no_code',
              errorMessage: 'PaymentIntent is null!',
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

    return await _collectPaymentMethod(paymentIntent);
  };

  const _collectPaymentMethod = async (pi: PaymentIntent.Type) => {
    addLogs({
      name: 'Collect Payment Method',
      events: [
        {
          name: 'Collect',
          description: 'terminal.collectPaymentMethod',
          metadata: { paymentIntentId: pi.id },
          onBack: cancelCollectPaymentMethod,
        },
      ],
    });
    const { paymentIntent, error } = await collectPaymentMethod({
      paymentIntent: pi,
      skipTipping: skipTipping,
      tipEligibleAmount: tipEligibleAmount
        ? Number(tipEligibleAmount)
        : undefined,
      updatePaymentIntent: enableUpdatePaymentIntent,
      enableCustomerCancellation: enableCustomerCancellation,
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
      await _confirmPaymentIntent(paymentIntent);
    }
  };

  const _confirmPaymentIntent = async (
    collectedPaymentIntent: PaymentIntent.Type
  ) => {
    addLogs({
      name: 'Confirm Payment Intent',
      events: [
        {
          name: 'Process',
          description: 'terminal.confirmPaymentIntent',
          metadata: { paymentIntentId: collectedPaymentIntent.id },
        },
      ],
    });

    const { paymentIntent, error } = await confirmPaymentIntent({
      paymentIntent: collectedPaymentIntent,
    });

    if (error) {
      addLogs({
        name: 'Confirm Payment Intent',
        events: [
          {
            name: 'Failed',
            description: 'terminal.confirmPaymentIntent',
            metadata: {
              errorCode: error.code,
              errorMessage: error.message,
            },
          },
        ],
      });
      return;
    }

    addLogs({
      name: 'Confirm Payment Intent',
      events: [
        {
          name: 'Confirmed',
          description: 'terminal.confirmPaymentIntent',
          metadata: {
            paymententIntentId: paymentIntent.id ? paymentIntent.id : 'null',
            chargeId: paymentIntent?.charges[0]?.id
              ? paymentIntent.charges[0].id
              : 'null',
          },
        },
      ],
    });

    // Set last successful charge Id in context for refunding later
    if (paymentIntent?.charges[0]?.id) {
      setLastSuccessfulChargeId(paymentIntent.charges[0].id);
    }

    if (paymentIntent?.status === 'succeeded') {
      return;
    }

    if (paymentIntent.id) {
      _capturePayment(paymentIntent.id);
    }
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

      <List bolded={false} topSpacing={false} title="CAPTURE METHOD">
        <Picker
          selectedValue={inputValues?.captureMethod}
          style={styles.picker}
          itemStyle={styles.pickerItem}
          testID="select-capture-method-picker"
          onValueChange={(value) =>
            setInputValues((state) => ({ ...state, captureMethod: value }))
          }
        >
          {CAPTURE_METHODS.map((a) => (
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

      <List bolded={false} topSpacing={false} title="PAYMENT METHOD TYPES">
        <ListItem
          title={enabledPaymentMethodTypes.join(', ')}
          testID="payment-method-button"
          onPress={() =>
            navigation.navigate('PaymentMethodSelectScreen', {
              paymentMethodTypes: paymentMethodTypes,
              enabledPaymentMethodTypes: enabledPaymentMethodTypes,
              onChange: (newPaymentMethodTypes: string[]) => {
                setEnabledPaymentMethodTypes(newPaymentMethodTypes);
              },
            })
          }
        />
      </List>

      <List bolded={false} topSpacing={false} title="ROUTING PRIORITY">
        <Picker
          selectedValue={inputValues?.requestedPriority}
          style={styles.picker}
          itemStyle={styles.pickerItem}
          testID="select-routing-priority-picker"
          onValueChange={(value) =>
            setInputValues((state) => ({ ...state, requestedPriority: value }))
          }
        >
          {ROUTING_PRIORITY.map((a) => (
            <Picker.Item
              key={a.value}
              label={a.label}
              testID={a.value}
              value={a.value}
            />
          ))}
        </Picker>
      </List>

      <List bolded={false} topSpacing={false} title="CONNECT">
        <ListItem
          title="Enable Connect"
          rightElement={
            <Switch
              testID="enable-connect"
              value={enableConnect}
              onValueChange={(value) => setEnableConnect(value)}
            />
          }
        />
      </List>
      {enableConnect && (
        <>
          <List bolded={false} topSpacing={false} title="DESTINATION CHARGE">
            <TextInput
              testID="destination-charge"
              style={styles.input}
              value={inputValues.connectedAccountId}
              onChangeText={(value: string) =>
                setInputValues((state) => ({
                  ...state,
                  connectedAccountId: value,
                }))
              }
              placeholder="Connected Stripe Account ID"
            />
          </List>

          <List
            bolded={false}
            topSpacing={false}
            title="APPLICATION FEE AMOUNT"
          >
            <TextInput
              testID="application-fee-amount"
              style={styles.input}
              value={inputValues.applicationFeeAmount}
              onChangeText={(value: string) =>
                setInputValues((state) => ({
                  ...state,
                  applicationFeeAmount: value,
                }))
              }
              placeholder="Application Fee Amount"
            />
          </List>
        </>
      )}

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

      <List bolded={false} topSpacing={false} title="TIP-ELIGIBLE AMOUNT">
        <TextInput
          testID="tip-eligible-amount"
          keyboardType={Platform.select({
            ios: 'numbers-and-punctuation',
            android: 'numeric',
            default: 'numeric',
          })}
          style={styles.input}
          value={tipEligibleAmount}
          onChangeText={(value: string) => setTipEligibleAmount(value)}
          placeholder="Tip-eligible amount"
        />
      </List>

      <List bolded={false} topSpacing={false} title="EXTENDED AUTH">
        <ListItem
          title="Request Extended Authorization"
          rightElement={
            <Switch
              testID="extended-auth"
              value={inputValues.requestExtendedAuthorization}
              onValueChange={(value) =>
                setInputValues((state) => ({
                  ...state,
                  requestExtendedAuthorization: value,
                }))
              }
            />
          }
        />
      </List>

      <List bolded={false} topSpacing={false} title="INCREMENTAL AUTH">
        <ListItem
          title="Request Incremental Authorization Support"
          rightElement={
            <Switch
              testID="incremental-auth"
              value={inputValues.requestIncrementalAuthorizationSupport}
              onValueChange={(value) =>
                setInputValues((state) => ({
                  ...state,
                  requestIncrementalAuthorizationSupport: value,
                }))
              }
            />
          }
        />
      </List>

      <List bolded={false} topSpacing={false} title="UPDATE PAYMENTINTENT">
        <ListItem
          title="Enable Update PaymentIntent"
          rightElement={
            <Switch
              testID="enable-update-paymentIntent"
              value={enableUpdatePaymentIntent}
              onValueChange={(value) => setEnableUpdatePaymentIntent(value)}
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
                value={enableCustomerCancellation}
                onValueChange={(value) => setEnableCustomerCancellation(value)}
              />
            }
          />
        </List>
      )}

      <List
        bolded={false}
        topSpacing={false}
        title="OFFLINE MODE TRANSACTION LIMIT"
      >
        <TextInput
          testID="limit-text-field"
          keyboardType="numeric"
          style={styles.input}
          value={inputValues.offlineModeTransactionLimit}
          onChangeText={(value) =>
            setInputValues((state) => ({
              ...state,
              offlineModeTransactionLimit: value,
            }))
          }
          placeholder="amount"
        />
      </List>

      <List
        bolded={false}
        topSpacing={false}
        title="OFFLINE MODE STORED TRANSACTION LIMIT"
      >
        <TextInput
          testID="store-limit-text-field"
          keyboardType="numeric"
          style={styles.input}
          value={inputValues.offlineModeStoredTransactionLimit}
          onChangeText={(value) =>
            setInputValues((state) => ({
              ...state,
              offlineModeStoredTransactionLimit: value,
            }))
          }
          placeholder="amount"
        />
      </List>

      <List bolded={false} topSpacing={false} title="OFFLINE BEHAVIOR">
        <Picker
          selectedValue={inputValues?.offlineBehavior}
          style={styles.picker}
          itemStyle={styles.pickerItem}
          testID="select-offline-behavior-picker"
          onValueChange={(value) =>
            setInputValues((state) => ({ ...state, offlineBehavior: value }))
          }
        >
          {OFFLINE_BEHAVIOR.map((a) => (
            <Picker.Item
              key={a.value}
              label={a.label}
              testID={a.value}
              value={a.value}
            />
          ))}
        </Picker>
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
