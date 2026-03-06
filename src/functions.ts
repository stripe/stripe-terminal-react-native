import Logger from './logger';
import StripeTerminalSdk from './StripeTerminalSdk';
import * as PackageJson from '../package.json';
import type {
  InitParams,
  InitializeResultType,
  DiscoverReadersParams,
  DiscoverReadersResultType,
  EasyConnectParams,
  CancelDiscoveringResultType,
  DisconnectReaderResultType,
  RebootReaderResultType,
  CreatePaymentIntentParams,
  CollectSetupIntentPaymentMethodParams,
  PaymentIntentResultType,
  GetLocationsParams,
  GetLocationsResultType,
  Cart,
  CreateSetupIntentParams,
  ClearReaderDisplayResultType,
  SetupIntentResultType,
  Reader,
  RefundParams,
  ProcessRefundResultType,
  ConnectReaderResultType,
  CollectPaymentMethodParams,
  OfflineStatus,
  ICollectInputsParameters,
  ICollectInputsResults,
  PaymentStatus,
  ConnectionStatus,
  ConfirmPaymentMethodParams,
  ProcessPaymentIntentParams,
  ConfirmSetupIntentMethodParams,
  ProcessSetupIntentParams,
  CancelSetupIntentMethodParams,
  CancelPaymentMethodParams,
  CollectDataParams,
  CollectDataResultType,
  TapToPayUxConfiguration,
  ConnectReaderParams,
  PrintContent,
  PaymentMethodSelectionHandler,
  QrCodeDisplayHandler,
  PaymentIntent,
  QrCodeDisplayData,
  PaymentOption,
} from './types';
import type { StripeError } from './types/StripeError';
import { createStripeError } from './Errors/StripeErrorHelpers';
import { ErrorCode } from './Errors/ErrorCodes';
import { Platform, NativeModules, NativeEventEmitter } from 'react-native';

const { StripeTerminalReactNative } = NativeModules;

let eventEmitter: NativeEventEmitter | null = null;
function getEventEmitter() {
  if (!eventEmitter) {
    eventEmitter = new NativeEventEmitter(StripeTerminalReactNative);
  }
  return eventEmitter;
}

let storedOnPaymentMethodSelectionRequired: PaymentMethodSelectionHandler | null = null;
let storedOnQrCodeDisplayRequired: QrCodeDisplayHandler | null = null;
let paymentMethodSelectionSubscription: { remove: () => void } | null = null;
let qrCodeDisplaySubscription: { remove: () => void } | null = null;

function setupPaymentMethodSelectionListener() {
  if (paymentMethodSelectionSubscription) {
    paymentMethodSelectionSubscription.remove();
  }

  if (storedOnPaymentMethodSelectionRequired) {
    paymentMethodSelectionSubscription = getEventEmitter().addListener(
      'onPaymentMethodSelectionRequired',
      ({ paymentIntent, availablePaymentOptions }: { paymentIntent: PaymentIntent.Type; availablePaymentOptions: PaymentOption[] }) => {
        if (storedOnPaymentMethodSelectionRequired) {
          storedOnPaymentMethodSelectionRequired(paymentIntent, availablePaymentOptions, {
            selectPaymentOption: (optionType: string) => selectPaymentOption(optionType),
            failPaymentMethodSelection: (error?: string) => failPaymentMethodSelection(error),
          });
        }
      }
    );
  }
}

function setupQrCodeDisplayListener() {
  if (qrCodeDisplaySubscription) {
    qrCodeDisplaySubscription.remove();
  }

  if (storedOnQrCodeDisplayRequired) {
    qrCodeDisplaySubscription = getEventEmitter().addListener(
      'onQrCodeDisplayRequired',
      ({ paymentIntent, qrData }: { paymentIntent: PaymentIntent.Type; qrData: QrCodeDisplayData }) => {
        if (storedOnQrCodeDisplayRequired) {
          storedOnQrCodeDisplayRequired(paymentIntent, qrData, {
            confirmQrCodeDisplayed: () => confirmQrCodeDisplayed(),
            failQrCodeDisplay: (error?: string) => failQrCodeDisplay(error),
          });
        }
      }
    );
  }
}

function hasError<T extends object>(
  response: T
): response is T & { error: StripeError } {
  return 'error' in response && !!(response as any).error;
}

export async function initialize(params: {
  initParams: InitParams;
  useAppsOnDevicesConnectionTokenProvider: boolean;
}): Promise<InitializeResultType> {
  try {
    const internalInitParams = {
      reactNativeVersion: PackageJson.version,
      logLevel: params.initParams.logLevel,
      useAppsOnDevicesConnectionTokenProvider: params.useAppsOnDevicesConnectionTokenProvider,
    };

    const { error, reader } =
      await StripeTerminalSdk.initialize(internalInitParams);

    if (error) {
      return {
        error: error,
        reader: undefined,
      };
    } else {
      return {
        error: undefined,
        reader,
      };
    }
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function setConnectionToken(
  token?: string,
  error?: string
): Promise<void> {
  try {
    await StripeTerminalSdk.setConnectionToken({ token, error });
  } catch (e) {
    console.warn('Unexpected error:', e);
  }
}

export async function discoverReaders(
  params: DiscoverReadersParams
): Promise<DiscoverReadersResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { error } = await StripeTerminalSdk.discoverReaders(innerParams);

      return {
        error: error,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'discoverReaders')(params);
}

export async function easyConnect(
  params: EasyConnectParams
): Promise<ConnectReaderResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { error, reader } = await StripeTerminalSdk.easyConnect(
        innerParams
      );

      return {
        error: error,
        reader,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'easyConnect')(params);
}

export async function cancelEasyConnect(): Promise<CancelDiscoveringResultType> {
  return Logger.traceSdkMethod(async () => {
    try {
      const { error } = await StripeTerminalSdk.cancelEasyConnect();

      return {
        error: error,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'cancelEasyConnect')();
}

export async function cancelDiscovering(): Promise<CancelDiscoveringResultType> {
  return Logger.traceSdkMethod(async () => {
    try {
      const { error } = await StripeTerminalSdk.cancelDiscovering();

      return {
        error: error,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'cancelDiscoverReaders')();
}

export async function connectReader(
  params: ConnectReaderParams
): Promise<ConnectReaderResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { onPaymentMethodSelectionRequired, onQrCodeDisplayRequired, ...restParams } = innerParams as any;

      storedOnPaymentMethodSelectionRequired = onPaymentMethodSelectionRequired || null;
      storedOnQrCodeDisplayRequired = onQrCodeDisplayRequired || null;

      setupPaymentMethodSelectionListener();
      setupQrCodeDisplayListener();

      const nativeParams = {
        ...restParams,
        hasPaymentMethodSelectionCallback: !!onPaymentMethodSelectionRequired,
        hasQrCodeDisplayCallback: !!onQrCodeDisplayRequired,
      };

      const { error, reader } = await StripeTerminalSdk.connectReader(
        nativeParams
      );

      if (error) {
        return {
          error,
          reader: undefined,
        };
      }
      return {
        reader: reader!,
        error: undefined,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'connectReader')(params);
}

export async function disconnectReader(): Promise<DisconnectReaderResultType> {
  return Logger.traceSdkMethod(async () => {
    try {
      const { error } = await StripeTerminalSdk.disconnectReader();

      return {
        error: error,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'disconnectReader')();
}

export async function rebootReader(): Promise<RebootReaderResultType> {
  return Logger.traceSdkMethod(async () => {
    try {
      const { error } = await StripeTerminalSdk.rebootReader();

      return {
        error: error,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'rebootReader')();
}

export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { error, paymentIntent } =
        await StripeTerminalSdk.createPaymentIntent(innerParams);

      if (error) {
        if (paymentIntent) {
          return {
            error,
            paymentIntent,
          };
        }
        return {
          error,
          paymentIntent: undefined,
        };
      }
      return {
        paymentIntent: paymentIntent!,
        error: undefined,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'createPaymentIntent')(params);
}

export async function createSetupIntent(
  params: CreateSetupIntentParams
): Promise<SetupIntentResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { error, setupIntent } = await StripeTerminalSdk.createSetupIntent(
        innerParams
      );

      if (error) {
        return {
          error,
          setupIntent: undefined,
        };
      }
      return {
        setupIntent: setupIntent!,
        error: undefined,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'createSetupIntent')(params);
}

export async function collectPaymentMethod(
  params: CollectPaymentMethodParams
): Promise<PaymentIntentResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { error, paymentIntent } =
        await StripeTerminalSdk.collectPaymentMethod(innerParams);

      if (error) {
        if (paymentIntent) {
          return {
            error,
            paymentIntent,
          };
        }
        return {
          error,
          paymentIntent: undefined,
        };
      }
      return {
        paymentIntent: paymentIntent!,
        error: undefined,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'collectPaymentMethod')(params);
}

export async function retrievePaymentIntent(
  clientSecret: string
): Promise<PaymentIntentResultType> {
  return Logger.traceSdkMethod(async (innerClientSecret) => {
    try {
      const { error, paymentIntent } =
        await StripeTerminalSdk.retrievePaymentIntent(innerClientSecret);

      if (error) {
        return {
          error,
          paymentIntent: undefined,
        };
      }
      return {
        paymentIntent: paymentIntent!,
        error: undefined,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'retrievePaymentIntent')(clientSecret);
}

export async function getLocations(
  params: GetLocationsParams
): Promise<GetLocationsResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { error, locations, hasMore } =
        await StripeTerminalSdk.getLocations(innerParams);

      if (error) {
        return {
          error,
          locations: undefined,
          hasMore: undefined,
        };
      }
      return {
        locations: locations!,
        hasMore: hasMore || false,
        error: undefined,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'getLocations')(params);
}

export async function confirmPaymentIntent(
  params: ConfirmPaymentMethodParams
): Promise<PaymentIntentResultType> {
  return Logger.traceSdkMethod(async (innerparams) => {
    try {
      const { error, paymentIntent: confirmedPaymentIntent } =
        await StripeTerminalSdk.confirmPaymentIntent(innerparams);

      if (error) {
        if (confirmedPaymentIntent) {
          return {
            error,
            paymentIntent: confirmedPaymentIntent,
          };
        }
        return {
          error,
          paymentIntent: undefined,
        };
      }
      return {
        paymentIntent: confirmedPaymentIntent!,
        error: undefined,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'confirmPaymentIntent')(params);
}

export async function processPaymentIntent(
  params: ProcessPaymentIntentParams
): Promise<PaymentIntentResultType> {
  return Logger.traceSdkMethod(async (innerparams) => {
    try {
      const { error, paymentIntent: processedPaymentIntent } =
        await StripeTerminalSdk.processPaymentIntent(innerparams);

      if (error) {
        if (processedPaymentIntent) {
          return {
            error,
            paymentIntent: processedPaymentIntent,
          };
        }
        return {
          error,
          paymentIntent: undefined,
        };
      }
      return {
        paymentIntent: processedPaymentIntent!,
        error: undefined,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'processPaymentIntent')(params);
}

export async function cancelPaymentIntent(
  params: CancelPaymentMethodParams
): Promise<PaymentIntentResultType> {
  return Logger.traceSdkMethod(async (innerparams) => {
    try {
      const { paymentIntent: canceledPaymentIntent, error } =
        await StripeTerminalSdk.cancelPaymentIntent(innerparams);

      if (error) {
        return {
          error,
          paymentIntent: undefined,
        };
      }
      return {
        paymentIntent: canceledPaymentIntent!,
        error: undefined,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'cancelPaymentIntent')(params);
}

export async function selectPaymentOption(paymentOptionType: string): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      await StripeTerminalSdk.selectPaymentOption(paymentOptionType);
      return {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'selectPaymentOption')();
}

export async function failPaymentMethodSelection(errorMessage?: string): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      await StripeTerminalSdk.failPaymentMethodSelection(errorMessage);
      return {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'failPaymentMethodSelection')();
}

export async function confirmQrCodeDisplayed(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      await StripeTerminalSdk.confirmQrCodeDisplayed();
      return {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'confirmQrCodeDisplayed')();
}

export async function failQrCodeDisplay(errorMessage?: string): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      await StripeTerminalSdk.failQrCodeDisplay(errorMessage);
      return {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'failQrCodeDisplay')();
}

export async function installAvailableUpdate(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      await StripeTerminalSdk.installAvailableUpdate();
      return {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'installAvailableUpdate')();
}

export async function setReaderDisplay(
  cart: Cart
): Promise<{ error?: StripeError }> {
  return Logger.traceSdkMethod(async (innerCart) => {
    try {
      const { error } = await StripeTerminalSdk.setReaderDisplay(innerCart);

      if (error) {
        return {
          error,
        };
      }
      return {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'setReaderDisplay')(cart);
}

export async function cancelInstallingUpdate(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      const { error } = await StripeTerminalSdk.cancelInstallingUpdate();
      return error ? { error } : {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'cancelInstallingUpdate')();
}

export async function retrieveSetupIntent(
  clientSecret: string
): Promise<SetupIntentResultType> {
  return Logger.traceSdkMethod(async (innerClientSecret) => {
    try {
      const { error, setupIntent } =
        await StripeTerminalSdk.retrieveSetupIntent(innerClientSecret);
      if (error) {
        return {
          setupIntent: undefined,
          error,
        };
      }
      return {
        setupIntent: setupIntent!,
        error: undefined,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'retrieveSetupIntent')(clientSecret);
}

export async function collectSetupIntentPaymentMethod(
  params: CollectSetupIntentPaymentMethodParams
): Promise<SetupIntentResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { error, setupIntent } =
        await StripeTerminalSdk.collectSetupIntentPaymentMethod(innerParams);
      if (error) {
        return {
          setupIntent: undefined,
          error,
        };
      }
      return {
        setupIntent: setupIntent!,
        error: undefined,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'collectSetupIntentPaymentMethod')(params);
}

export async function clearReaderDisplay(): Promise<ClearReaderDisplayResultType> {
  return Logger.traceSdkMethod(async () => {
    try {
      const { error } = await StripeTerminalSdk.clearReaderDisplay();

      return {
        error: error,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'clearReaderDisplay')();
}

export async function cancelSetupIntent(
  params: CancelSetupIntentMethodParams
): Promise<SetupIntentResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { setupIntent: canceledSetupIntent, error } =
        await StripeTerminalSdk.cancelSetupIntent(innerParams);

      if (error) {
        return {
          error,
          setupIntent: undefined,
        };
      }
      return {
        setupIntent: canceledSetupIntent!,
        error: undefined,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'cancelSetupIntent')(params);
}

export async function confirmSetupIntent(
  params: ConfirmSetupIntentMethodParams
): Promise<SetupIntentResultType> {
  return Logger.traceSdkMethod(async (innerparams) => {
    try {
      const { setupIntent: confirmedSetupIntent, error } =
        await StripeTerminalSdk.confirmSetupIntent(innerparams);

      if (error) {
        return {
          error,
          setupIntent: undefined,
        };
      }
      return {
        setupIntent: confirmedSetupIntent!,
        error: undefined,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'confirmSetupIntent')(params);
}

export async function processSetupIntent(
  params: ProcessSetupIntentParams
): Promise<SetupIntentResultType> {
  return Logger.traceSdkMethod(async (innerparams) => {
    try {
      const { setupIntent: processedSetupIntent, error } =
        await StripeTerminalSdk.processSetupIntent(innerparams);

      if (error) {
        return {
          error,
          setupIntent: processedSetupIntent,
        };
      }
      return {
        setupIntent: processedSetupIntent!,
        error: undefined,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'processSetupIntent')(params);
}

export async function simulateReaderUpdate(
  update: Reader.SimulateUpdateType
): Promise<{ error?: StripeError }> {
  try {
    await StripeTerminalSdk.simulateReaderUpdate(update);

    return {};
  } catch (error) {
    return {
      error: error as any,
    };
  }
}

export async function setSimulatedCard(
  cardNumber: string
): Promise<{ error?: StripeError }> {
  return Logger.traceSdkMethod(async (innerCardNumber) => {
    try {
      const { error } = await StripeTerminalSdk.setSimulatedCard(
        innerCardNumber
      );
      return error ? { error } : {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'setSimulatedCard')(cardNumber);
}

export async function setSimulatedOfflineMode(
  simulatedOffline: boolean
): Promise<{ error?: StripeError }> {
  return Logger.traceSdkMethod(async (innerSimulatedOffline) => {
    try {
      const { error } = await StripeTerminalSdk.setSimulatedOfflineMode(
        innerSimulatedOffline
      );
      return error ? { error } : {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'setSimulatedOfflineMode')(simulatedOffline);
}

export async function setSimulatedCollectInputsResult(
  simulatedCollectInputsBehavior: string
): Promise<{ error?: StripeError }> {
  return Logger.traceSdkMethod(async () => {
    try {
      const { error } = await StripeTerminalSdk.setSimulatedCollectInputsResult(
        simulatedCollectInputsBehavior
      );
      return error ? { error } : {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'setSimulatedCollectInputsResult')(simulatedCollectInputsBehavior);
}

export async function processRefund(
  params: RefundParams
): Promise<ProcessRefundResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    try {
      const { refund, error } = await StripeTerminalSdk.processRefund(
        innerParams
      );
      return {
        refund,
        error,
      };
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'processRefund')(params);
}

export async function clearCachedCredentials(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      await StripeTerminalSdk.clearCachedCredentials();
      return {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'clearCachedCredentials')();
}

export async function cancelCollectPaymentMethod(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      const { error } = await StripeTerminalSdk.cancelCollectPaymentMethod();
      return error ? { error } : {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'cancelCollectPaymentMethod')();
}

export async function cancelProcessRefund(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      const { error } = await StripeTerminalSdk.cancelProcessRefund();
      return error ? { error } : {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'cancelProcessRefund')();
}

export async function cancelCollectSetupIntent(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      const { error } = await StripeTerminalSdk.cancelCollectSetupIntent();
      return error ? { error } : {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'cancelCollectSetupIntent')();
}

export async function cancelConfirmPaymentIntent(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      const { error } = await StripeTerminalSdk.cancelConfirmPaymentIntent();
      return error ? { error } : {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'cancelConfirmPaymentIntent')();
}

export async function cancelProcessPaymentIntent(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      await StripeTerminalSdk.cancelProcessPaymentIntent();
      return {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'cancelProcessPaymentIntent')();
}

export async function cancelConfirmSetupIntent(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      const { error } = await StripeTerminalSdk.cancelConfirmSetupIntent();
      return error ? { error } : {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'cancelConfirmSetupIntent')();
}

export async function cancelProcessSetupIntent(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      await StripeTerminalSdk.cancelProcessSetupIntent();
      return {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'cancelProcessSetupIntent')();
}

export async function getOfflineStatus(): Promise<OfflineStatus> {
  return Logger.traceSdkMethod(async () => {
    try {
      const offlineStatus = await StripeTerminalSdk.getOfflineStatus();
      return offlineStatus;
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'getOfflineStatus')();
}

export async function getPaymentStatus(): Promise<PaymentStatus> {
  return Logger.traceSdkMethod(async () => {
    try {
      const paymentStatus = await StripeTerminalSdk.getPaymentStatus();
      return paymentStatus;
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'getPaymentStatus')();
}

export async function getConnectionStatus(): Promise<ConnectionStatus> {
  return Logger.traceSdkMethod(async () => {
    try {
      const connectionStatus = await StripeTerminalSdk.getConnectionStatus();
      return connectionStatus;
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'getConnectionStatus')();
}

export async function getConnectedReader(): Promise<Reader.Type> {
  return Logger.traceSdkMethod(async () => {
    try {
      const connectedReader = await StripeTerminalSdk.getConnectedReader();
      return connectedReader;
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'getConnectedReader')();
}

export async function getReaderSettings(): Promise<Reader.ReaderSettings> {
  return Logger.traceSdkMethod(async () => {
    try {
      const response = await StripeTerminalSdk.getReaderSettings();
      if (hasError(response)) {
        return { error: response.error };
      }
      return response;
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'getReaderSettings')();
}

export async function setReaderSettings(
  params: Reader.ReaderSettingsParameters
): Promise<Reader.ReaderSettings> {
  return Logger.traceSdkMethod(async () => {
    try {
      const response = await StripeTerminalSdk.setReaderSettings(params);
      if (hasError(response)) {
        return { error: response.error };
      }
      return response;
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'setReaderSettings')();
}

export async function collectInputs(
  params: ICollectInputsParameters
): Promise<ICollectInputsResults> {
  return Logger.traceSdkMethod(async () => {
    try {
      const response = await StripeTerminalSdk.collectInputs(params);
      if (hasError(response)) {
        return { error: response.error };
      }
      return response;
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'collectInputs')();
}

export async function cancelCollectInputs(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      const { error } = await StripeTerminalSdk.cancelCollectInputs();
      return error ? { error } : {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'cancelCollectInputs')();
}

export async function collectData(
  params: CollectDataParams
): Promise<CollectDataResultType> {
  return Logger.traceSdkMethod(async () => {
    try {
      const response = await StripeTerminalSdk.collectData(params);
      if (hasError(response)) {
        return { error: response.error };
      }
      return response;
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'collectData')();
}

export async function cancelCollectData(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      const { error } = await StripeTerminalSdk.cancelCollectData();
      return error ? { error } : {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'cancelCollectData')();
}

export async function print(content: PrintContent): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      const { error } = await StripeTerminalSdk.print(content);
      if (error) {
        return {
          error,
        };
      }
      return {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'print')();
}

export async function cancelReaderReconnection(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    try {
      const { error } = await StripeTerminalSdk.cancelReaderReconnection();
      return error ? { error } : {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'cancelReaderReconnection')();
}

export async function supportsReadersOfType(
  params: Reader.ReaderSupportParams
): Promise<Reader.ReaderSupportResult> {
  return Logger.traceSdkMethod(async () => {
    try {
      const supportReaderResult = await StripeTerminalSdk.supportsReadersOfType(
        params
      );
      return supportReaderResult;
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'supportsReadersOfType')();
}

export async function setTapToPayUxConfiguration(
  params: TapToPayUxConfiguration
): Promise<{
  error?: StripeError;
}> {
  if (Platform.OS === 'ios') {
    return {
      error: createStripeError({
        message: "'setTapToPayUxConfiguration' is unsupported on iOS",
        code: ErrorCode.UNSUPPORTED_OPERATION,
      }),
    };
  }

  return Logger.traceSdkMethod(async () => {
    try {
      await StripeTerminalSdk.setTapToPayUxConfiguration(params);
      return {};
    } catch (error) {
      return {
        error: error as any,
      };
    }
  }, 'setTapToPayUxConfiguration')();
}

export async function getNativeSdkVersion(): Promise<string> {
  return Logger.traceSdkMethod(async () => {
    try {
      return await StripeTerminalSdk.getNativeSdkVersion();
    } catch {
      return '';
    }
  }, 'getNativeSdkVersion')();
}
