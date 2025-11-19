import {
  useNavigation,
  useRoute,
  type RouteProp,
  type NavigationProp,
} from '@react-navigation/core';
import React, { useState, useContext, useRef } from 'react';
import { Picker } from '@react-native-picker/picker';
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  useStripeTerminal,
  type PaymentIntent,
  type StripeError,
  type AllowRedisplay,
} from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import List from '../components/List';
import ListItem from '../components/ListItem';
import { LogContext } from '../components/LogContext';
import type { RouteParamList } from '../App';
import { AppContext } from '../AppContext';
import { DevAppError } from '../errors/DevAppError';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Modal } from 'react-native';
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

const CARD_PRESENT_CAPTURE_METHODS = [
  { value: undefined, label: 'default' },
  { value: 'manual', label: 'manual' },
  { value: 'manual_preferred', label: 'manual_preferred' },
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

const PARTIAL_AUTH = [
  { value: 'unspecified', label: 'unspecified' },
  { value: 'if_available', label: 'if_available' },
  { value: 'never', label: 'never' },
];

const ALLOW_REDISPLAY = [
  { value: 'unspecified', label: 'unspecified' },
  { value: 'limited', label: 'limited' },
  { value: 'always', label: 'always' },
];

export default function CollectCardPaymentScreen() {
  const {
    api,
    setLastSuccessfulChargeId,
    setLastSuccessfulPaymentIntentId,
    setLastSuccessfulAmount,
    account,
  } = useContext(AppContext);

  const [inputValues, setInputValues] = useState<{
    amount: string;
    currency: string;
    connectedAccountId?: string;
    applicationFeeAmount?: string;
    requestExtendedAuthorization?: boolean;
    requestIncrementalAuthorizationSupport?: boolean;
    requestPartialAuthorization?: string;
    captureMethod: 'automatic' | 'manual';
    requestedPriority: 'domestic' | 'international' | '';
    offlineBehavior: 'prefer_online' | 'require_online' | 'force_offline';
    offlineModeTransactionLimit: string;
    offlineModeStoredTransactionLimit: string;
    cardPresentCaptureMethod?: 'manual' | 'manual_preferred';
  }>({
    amount: '20000',
    currency: account?.default_currency || 'usd',
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
  const [recollectAfterCardBrandDecline, setRecollectAfterCardBrandDecline] =
    useState(false);
  const [enableCustomerCancellation, setEnableCustomerCancellation] =
    useState(false);
  const [requestDcc, setRequestDcc] = useState(false);
  const [surchargeNotice, setSurchargeNotice] = useState('');
  const [tipEligibleAmount, setTipEligibleAmount] = useState('');
  const [surcharge, setSurcharge] = useState<{
    amount: string;
    consent: {
      notice: string;
      collection: 'disabled' | 'enabled';
    } | null;
  }>({
    amount: '',
    consent: null,
  });
  const [returnUrl, setReturnUrl] = useState('');
  const paymentMethodTypes = PAYMENT_METHOD_TYPES;
  const [enabledPaymentMethodTypes, setEnabledPaymentMethodTypes] = useState(
    DEFAULT_ENABLED_PAYMENT_METHOD_TYPES
  );
  const [allowRedisplay, setAllowRedisplay] =
    useState<AllowRedisplay>('unspecified');
  const [moto, setMoto] = useState(false);
  const { params } =
    useRoute<RouteProp<RouteParamList, 'CollectCardPaymentScreen'>>();
  const { simulated, discoveryMethod, deviceType } = params;
  const { addLogs, clearLogs, setCancel } = useContext(LogContext);
  const navigation = useNavigation<NavigationProp<RouteParamList>>();

  const {
    createPaymentIntent,
    collectPaymentMethod,
    confirmPaymentIntent,
    retrievePaymentIntent,
    cancelCollectPaymentMethod,
    cancelConfirmPaymentIntent,
    setSimulatedCard,
    getOfflineStatus,
  } = useStripeTerminal({
    onDidRequestReaderInput: (input) => {
      // @ts-ignore
      setCancel((prev) => ({ ...prev, isDisabled: false }));
      addLogs({
        name: 'Collect Payment Method',
        events: [
          {
            name: input.sort().join(' / '),
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
            onBack: cancelCollectPaymentMethod,
          },
        ],
      });
    },
  });

  const _createPaymentIntent = async () => {
    if (simulated) {
      await setSimulatedCard(testCardNumber);
    }

    clearLogs();
    setCancel({
      label: 'Cancel Payment',
      isDisabled: false,
      action: cancelCollectPaymentMethod,
    });
    navigation.navigate('LogListScreen', {});
    addLogs({
      name: 'Create Payment Intent',
      events: [
        {
          name: 'Create',
          description: 'terminal.createPaymentIntent',
          onBack: cancelCollectPaymentMethod,
        },
      ],
    });

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
        capture_method: inputValues?.cardPresentCaptureMethod,
      },
    };
    let paymentIntent: PaymentIntent.Type | undefined;
    let paymentIntentError: StripeError | undefined;

    if (deviceType === 'verifoneP400') {
      const resp = await api.createPaymentIntent({
        amount: Number(inputValues.amount),
        currency: inputValues.currency,
        payment_method_types: enabledPaymentMethodTypes,
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
              onBack: cancelCollectPaymentMethod,
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
        const error = new DevAppError(
          'NO_CLIENT_SECRET',
          'No client_secret returned from API',
          {
            context: {
              step: 'createPaymentIntent',
              apiResponse: resp,
            },
          }
        );
        return Promise.resolve({ error });
      }

      const response = await retrievePaymentIntent(resp.client_secret);
      paymentIntent = response.paymentIntent;
      paymentIntentError = response.error;
    } else {
      const offlineStatus = await getOfflineStatus();
      let sdkStoredPaymentAmount = 0;
      for (let currency in offlineStatus.sdk.offlinePaymentAmountsByCurrency) {
        if (currency === inputValues.currency) {
          sdkStoredPaymentAmount =
            offlineStatus.sdk.offlinePaymentAmountsByCurrency[currency];
        }
      }
      let readerStoredPaymentAmount = 0;
      if (offlineStatus.reader) {
        for (let currency in offlineStatus.reader
          .offlinePaymentAmountsByCurrency) {
          if (currency === inputValues.currency) {
            readerStoredPaymentAmount =
              offlineStatus.reader.offlinePaymentAmountsByCurrency[currency];
          }
        }
      }
      if (
        Number(inputValues.amount) >
          Number(inputValues.offlineModeTransactionLimit) ||
        sdkStoredPaymentAmount >
          Number(inputValues.offlineModeStoredTransactionLimit) ||
        readerStoredPaymentAmount >
          Number(inputValues.offlineModeStoredTransactionLimit)
      ) {
        inputValues.offlineBehavior = 'require_online';
      }

      const response = await createPaymentIntent({
        amount: Number(inputValues.amount),
        currency: inputValues.currency,
        paymentMethodTypes: enabledPaymentMethodTypes,
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
          requestPartialAuthorization: inputValues.requestPartialAuthorization,
          captureMethod: inputValues?.cardPresentCaptureMethod,
        },
        captureMethod: inputValues?.captureMethod,
        offlineBehavior: inputValues?.offlineBehavior,
      });
      paymentIntent = response.paymentIntent;
      paymentIntentError = response.error;
    }

    if (paymentIntentError) {
      const devError = DevAppError.fromStripeError(paymentIntentError);
      addLogs({
        name: 'Create Payment Intent',
        events: [
          {
            name: 'Failed',
            description: 'terminal.createPaymentIntent',
            onBack: cancelCollectPaymentMethod,
            metadata: devError.toJSON(),
          },
        ],
      });
      return;
    }

    if (!paymentIntent) {
      const error = new DevAppError(
        'NO_PAYMENT_INTENT',
        'PaymentIntent is null after creation',
        {
          context: {
            step: 'createPaymentIntent',
            paymentIntentError: paymentIntentError
              ? JSON.stringify(paymentIntentError)
              : null,
          },
        }
      );

      addLogs({
        name: 'Create Payment Intent',
        events: [
          {
            name: 'Failed',
            description: 'terminal.createPaymentIntent',
            onBack: cancelCollectPaymentMethod,
            metadata: error.toJSON(),
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
          onBack: cancelCollectPaymentMethod,
          metadata: {
            paymentIntentId: paymentIntent.id,
            paymentIntent: JSON.stringify(paymentIntent, null, 2),
          },
        },
      ],
    });

    return await _collectPaymentMethod(paymentIntent);
  };

  const _collectPaymentMethod = async (pi: PaymentIntent.Type) => {
    // @ts-ignore
    setCancel((prev) => ({ ...prev, isDisabled: false }));
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
      requestDynamicCurrencyConversion: requestDcc,
      surchargeNotice: surchargeNotice ? surchargeNotice : undefined,
      allowRedisplay: allowRedisplay,
      moto: moto,
    });

    if (error) {
      const devError = DevAppError.fromStripeError(error);
      addLogs({
        name: 'Collect Payment Method',
        events: [
          {
            name: 'Failed',
            description: 'terminal.collectPaymentMethod',
            onBack: cancelCollectPaymentMethod,
            metadata: devError.toJSON(),
          },
        ],
      });
    } else if (paymentIntent) {
      if (enableUpdatePaymentIntent) {
        let cardBrand = paymentIntent.paymentMethod?.cardPresentDetails?.brand;

        if (cardBrand && cardBrand === declineCardBrand) {
          const integrationError = new DevAppError(
            'CARD_BRAND_REJECTED',
            `Card brand '${cardBrand}' rejected by integration logic`,
            {
              context: {
                step: 'collectPaymentMethod',
                cardBrand,
                declineCardBrand,
                paymentIntentId: paymentIntent.id,
                paymentIntentStatus: paymentIntent.status,
                reason: 'card_brand_rejection',
              },
            }
          );

          addLogs({
            name: 'Collect Payment Method',
            events: [
              {
                name: 'Failed',
                description: 'terminal.collectPaymentMethod',
                onBack: cancelCollectPaymentMethod,
                metadata: {
                  errorCode: integrationError.code,
                  errorMessage: integrationError.message,
                  errorContext: JSON.stringify(integrationError.context),
                },
              },
            ],
          });
          if (recollectAfterCardBrandDecline) {
            await cancelCollectPaymentMethod();
            await _collectPaymentMethod(pi);
            return;
          } else {
            let result = await cancelCollectPaymentMethod();
            if (!result.error) {
              addLogs({
                name: 'Collect Payment Method',
                events: [
                  {
                    name: 'Canceled',
                    description: 'terminal.cancelCollectPaymentMethod',
                    onBack: cancelCollectPaymentMethod,
                    metadata: { paymentIntentId: pi.id },
                  },
                ],
              });
            }
            return;
          }
        }
      }
      addLogs({
        name: 'Collect Payment Method',
        events: [
          {
            name: 'Collected',
            onBack: cancelCollectPaymentMethod,
            description: 'terminal.collectPaymentMethod',
            metadata: {
              paymentIntentId: paymentIntent.id,
              pi: JSON.stringify(paymentIntent, undefined, 2),
            },
          },
        ],
      });
      await _confirmPaymentIntent(paymentIntent);
    }
  };

  const _confirmPaymentIntent = async (
    collectedPaymentIntent: PaymentIntent.Type
  ) => {
    // @ts-ignore
    setCancel((prev) => ({ ...prev, isDisabled: true }));
    addLogs({
      name: 'Confirm Payment Intent',
      events: [
        {
          name: 'Process',
          onBack: cancelConfirmPaymentIntent,
          description: 'terminal.confirmPaymentIntent',
          metadata: {
            paymentIntentId: collectedPaymentIntent.id,
            surcharge: JSON.stringify(surcharge, undefined, 2),
          },
        },
      ],
    });

    const { paymentIntent, error } = await confirmPaymentIntent({
      paymentIntent: collectedPaymentIntent,
      surcharge: surcharge.amount
        ? {
            amount: Number(surcharge.amount),
            consent:
              surcharge?.consent?.notice ||
              surcharge?.consent?.collection != null
                ? {
                    notice: surcharge.consent.notice || '',
                    collection: surcharge.consent.collection ?? 'disabled',
                  }
                : null,
          }
        : undefined,
      returnUrl: returnUrl.trim() ? returnUrl : undefined,
    });

    if (error) {
      const devError = DevAppError.fromStripeError(error);
      addLogs({
        name: 'Confirm Payment Intent',
        events: [
          {
            name: 'Failed',
            description: 'terminal.confirmPaymentIntent',
            metadata: devError.toJSON(),
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
            pi: JSON.stringify(paymentIntent, undefined, 2),
          },
        },
      ],
    });

    // Set last successful charge Id in context for refunding later
    if (paymentIntent?.charges[0]?.id) {
      setLastSuccessfulChargeId(paymentIntent.charges[0].id);
      setLastSuccessfulPaymentIntentId(paymentIntent.id);
      setLastSuccessfulAmount(paymentIntent.amount.toString());
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
      events: [
        {
          name: 'Capture',
          description: 'terminal.capturePayment',
          onBack: cancelCollectPaymentMethod,
        },
      ],
    });

    const resp = await api.capturePaymentIntent(paymentIntentId, {});

    if ('error' in resp) {
      addLogs({
        name: 'Capture Payment',
        events: [
          {
            name: 'Failed',
            description: 'terminal.capturePayment',
            onBack: cancelCollectPaymentMethod,
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
          onBack: cancelCollectPaymentMethod,
          description: 'terminal.paymentIntentId: ' + resp.id,
        },
      ],
    });
  };

  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<Picker<string>>(null);
  const DECLINE_CARD_BRAND = [
    'None',
    'visa',
    'amex',
    'mastercard',
    'discover',
    'jcb',
    'diners',
    'interac',
    'unionpay',
    'eftpos_au',
  ];
  const [declineCardBrand, setDeclineCardBrand] = useState<string>('None');

  const handleChangeDeclineCardBrand = async (type: string) => {
    setDeclineCardBrand(type);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView
        testID="collect-scroll-view"
        contentContainerStyle={styles.scrollContainer}
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

        <List
          bolded={false}
          topSpacing={false}
          title="CARD PRESENT CAPTURE METHOD"
        >
          <Picker
            selectedValue={inputValues?.cardPresentCaptureMethod}
            style={styles.picker}
            itemStyle={styles.pickerItem}
            testID="select-card-present-capture-method-picker"
            onValueChange={(value) =>
              setInputValues((state) => ({
                ...state,
                cardPresentCaptureMethod: value,
              }))
            }
          >
            {CARD_PRESENT_CAPTURE_METHODS.map((a) => (
              <Picker.Item
                key={a.label}
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
                onValueChange={(value) => {
                  setEnableInterac(value);
                  if (
                    value &&
                    !enabledPaymentMethodTypes.includes('interac_present')
                  ) {
                    setEnabledPaymentMethodTypes([
                      ...enabledPaymentMethodTypes,
                      'interac_present',
                    ]);
                  } else if (
                    !value &&
                    enabledPaymentMethodTypes.includes('interac_present')
                  ) {
                    setEnabledPaymentMethodTypes(
                      enabledPaymentMethodTypes.filter(
                        (type) => type !== 'interac_present'
                      )
                    );
                  }
                }}
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
                  setEnableInterac(
                    newPaymentMethodTypes.includes('interac_present')
                  );
                },
              })
            }
          />
        </List>
        <List bolded={false} topSpacing={false} title="Set Allow Redisplay">
          <Picker
            selectedValue={allowRedisplay}
            style={styles.picker}
            itemStyle={styles.pickerItem}
            testID="select-allow-redisplay"
            onValueChange={(value) =>
              setAllowRedisplay(value as AllowRedisplay)
            }
          >
            {ALLOW_REDISPLAY.map((a) => (
              <Picker.Item
                key={a.value}
                label={a.label}
                testID={a.value}
                value={a.value}
              />
            ))}
          </Picker>
        </List>
        <List bolded={false} topSpacing={false} title="Moto">
          <ListItem
            title="Enable Moto"
            rightElement={
              <Switch
                testID="moto"
                value={moto}
                onValueChange={(value) => setMoto(value)}
              />
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
              setInputValues((state) => ({
                ...state,
                requestedPriority: value,
              }))
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

        <List bolded={false} topSpacing={false} title="REQUEST PARTIAL AUTH">
          <Picker
            selectedValue={inputValues?.requestPartialAuthorization}
            style={styles.picker}
            itemStyle={styles.pickerItem}
            testID="select-partial-auth-picker"
            onValueChange={(value) =>
              setInputValues((state) => ({
                ...state,
                requestPartialAuthorization: value,
              }))
            }
          >
            {PARTIAL_AUTH.map((a) => (
              <Picker.Item
                key={a.value}
                label={a.label}
                testID={a.value}
                value={a.value}
              />
            ))}
          </Picker>
        </List>

        <List bolded={false} topSpacing={false} title="SURCHARGE NOTICE">
          <TextInput
            testID="Surcharge Notice"
            style={styles.input}
            value={surchargeNotice}
            onChangeText={(value: string) => setSurchargeNotice(value)}
            placeholder="Surcharge Notice"
          />
        </List>

        <List bolded={false} topSpacing={false} title="SURCHARGE CONFIGURATION">
          <TextInput
            testID="Surcharge Amount"
            keyboardType="numeric"
            style={styles.input}
            value={surcharge.amount}
            onChangeText={(value: string) =>
              setSurcharge((prev) => ({ ...prev, amount: value }))
            }
            placeholder="Surcharge Amount"
          />
          <ListItem
            title="Enable Surcharge Consent Configuration"
            rightElement={
              <Switch
                testID="toggle-surcharge-consent"
                value={surcharge.consent !== null}
                onValueChange={(enabled) =>
                  setSurcharge((prev) => ({
                    ...prev,
                    consent: enabled
                      ? { notice: '', collection: 'disabled' }
                      : null,
                  }))
                }
              />
            }
          />
          {surcharge.consent !== null ? (
            <View>
              <ListItem
                title="Enable Collecting User Consent"
                rightElement={
                  <Switch
                    testID="enable-collecting-user-consent"
                    value={surcharge.consent.collection === 'enabled'}
                    onValueChange={(value) =>
                      setSurcharge((prev) => ({
                        ...prev,
                        consent: {
                          ...prev.consent!,
                          collection: value ? 'enabled' : 'disabled',
                        },
                      }))
                    }
                  />
                }
              />

              <TextInput
                testID="Surcharge Consent Notice"
                style={styles.input}
                value={surcharge.consent.notice}
                onChangeText={(value) =>
                  setSurcharge((prev) => ({
                    ...prev,
                    consent: {
                      ...prev.consent!,
                      notice: value || '',
                    },
                  }))
                }
                placeholder="Surcharge Consent Notice"
              />
            </View>
          ) : (
            <View />
          )}
        </List>

        <List bolded={false} topSpacing={false} title="RETURN URL">
          <TextInput
            testID="Return URL"
            keyboardType="default"
            style={styles.input}
            value={returnUrl}
            onChangeText={(value: string) => setReturnUrl(value)}
            autoCorrect={false}
            autoCapitalize={'none'}
          />
        </List>

        <List bolded={false} topSpacing={false} title="UPDATE PAYMENTINTENT">
          <ListItem
            title="Enable Update PaymentIntent"
            rightElement={
              <Switch
                testID="enable-update-paymentIntent"
                value={enableUpdatePaymentIntent}
                onValueChange={(value) => {
                  setEnableUpdatePaymentIntent(value);
                  if (!value) {
                    setRequestDcc(false);
                  }
                }}
              />
            }
          />
          <ListItem
            visible={enableUpdatePaymentIntent}
            testID="decline_card_brand"
            onPress={() => {
              setShowPicker(true);

              // Android workaround for instant diplaying options list
              setTimeout(() => {
                pickerRef.current?.focus();
              }, 100);
            }}
            title={declineCardBrand}
          />
          <ListItem
            visible={enableUpdatePaymentIntent}
            title="Recollect After Card Brand Decline"
            rightElement={
              <Switch
                testID="enable-recollect"
                value={recollectAfterCardBrandDecline}
                onValueChange={(value) =>
                  setRecollectAfterCardBrandDecline(value)
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
                  value={enableCustomerCancellation}
                  onValueChange={(value) =>
                    setEnableCustomerCancellation(value)
                  }
                />
              }
            />
            <ListItem
              title="Request DCC (requires Update PaymentIntent)"
              rightElement={
                <Switch
                  disabled={!enableUpdatePaymentIntent}
                  testID="request-dynamic-currency-conversion"
                  value={requestDcc}
                  onValueChange={(value) => setRequestDcc(value)}
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
              selectedValue={declineCardBrand}
              ref={pickerRef as any}
              style={styles.picker}
              itemStyle={styles.pickerItem}
              onValueChange={(itemValue: string) => {
                handleChangeDeclineCardBrand(itemValue);
                if (Platform.OS === 'android') {
                  setShowPicker(false);
                }
              }}
            >
              {DECLINE_CARD_BRAND.map((type) => (
                <Picker.Item
                  key={type}
                  label={type}
                  testID={type}
                  value={type}
                />
              ))}
            </Picker>
          </View>
        </Modal>
      </KeyboardAwareScrollView>
      <View style={styles.footer}>
        <List
          bolded={false}
          topSpacing={false}
          title={`${formatAmountForDisplay(
            inputValues.amount,
            inputValues.currency
          )} ${inputValues.currency.toUpperCase()}`}
        >
          <ListItem
            testID="collect-payment-button"
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
              Collect a card payment using a physical Stripe test card and
              reader
            </Text>
          )}
        </List>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
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
  footer: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
