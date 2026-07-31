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
import {
  createStripeError,
  rehydrateBridgeError,
} from './Errors/StripeErrorHelpers';
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

async function callBridge<T extends Record<string, unknown>>(
  method: () => Promise<T>
): Promise<Omit<T, 'error'> & { error?: StripeError }> {
  try {
    const result = await method();
    if (result == null) {
      return { error: createStripeError({
        code: ErrorCode.UNEXPECTED_SDK_ERROR,
        message: 'Native bridge returned null or undefined',
      })} as Omit<T, 'error'> & { error: StripeError };
    }
    return {
      ...result,
      error: result.error ? rehydrateBridgeError(result.error) : undefined,
    };
  } catch (error) {
    return { error: rehydrateBridgeError(error) } as Omit<T, 'error'> & {
      error: StripeError;
    };
  }
}

export async function initialize(params: {
  initParams: InitParams;
  useAppsOnDevicesConnectionTokenProvider: boolean;
}): Promise<InitializeResultType> {
  Logger.setLogLevel(params.initParams.logLevel);

  const { localeConfig } = params.initParams;
  if (
    localeConfig &&
    localeConfig.type !== 'hardcoded' &&
    localeConfig.type !== 'cardLanguagePreferenceIfAvailable'
  ) {
    return {
      error: createStripeError({
        code: ErrorCode.INVALID_REQUIRED_PARAMETER,
        message:
          "Invalid localeConfig.type. Expected 'hardcoded' or 'cardLanguagePreferenceIfAvailable'.",
      }),
      reader: undefined,
    };
  }

  const internalInitParams = {
    reactNativeVersion: PackageJson.version,
    logLevel: params.initParams.logLevel,
    localeConfig,
    useAppsOnDevicesConnectionTokenProvider: params.useAppsOnDevicesConnectionTokenProvider,
  };

  const { error, reader } = await callBridge(() =>
    StripeTerminalSdk.initialize(internalInitParams)
  );

  if (error) {
    return { error, reader: undefined };
  }
  return { error: undefined, reader };
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
    return callBridge(() => StripeTerminalSdk.discoverReaders(innerParams));
  }, 'discoverReaders')(params);
}

export async function easyConnect(
  params: EasyConnectParams
): Promise<ConnectReaderResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    const { error, reader } = await callBridge(() =>
      StripeTerminalSdk.easyConnect(innerParams)
    );
    if (error) return { error, reader: undefined };
    return { reader: reader!, error: undefined };
  }, 'easyConnect')(params);
}

export async function cancelEasyConnect(): Promise<CancelDiscoveringResultType> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.cancelEasyConnect());
  }, 'cancelEasyConnect')();
}

export async function cancelDiscovering(): Promise<CancelDiscoveringResultType> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.cancelDiscovering());
  }, 'cancelDiscoverReaders')();
}

export async function connectReader(
  params: ConnectReaderParams
): Promise<ConnectReaderResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
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

      const { error, reader } = await callBridge(() =>
        StripeTerminalSdk.connectReader(nativeParams)
      );

      if (error) return { error, reader: undefined };
      return { reader: reader!, error: undefined };
  }, 'connectReader')(params);
}

export async function disconnectReader(): Promise<DisconnectReaderResultType> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.disconnectReader());
  }, 'disconnectReader')();
}

export async function rebootReader(): Promise<RebootReaderResultType> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.rebootReader());
  }, 'rebootReader')();
}

export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    const { error, paymentIntent } = await callBridge(() =>
      StripeTerminalSdk.createPaymentIntent(innerParams)
    );
    if (error) return { error, paymentIntent: undefined };
    return { paymentIntent: paymentIntent!, error: undefined };
  }, 'createPaymentIntent')(params);
}

export async function createSetupIntent(
  params: CreateSetupIntentParams
): Promise<SetupIntentResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    const { error, setupIntent } = await callBridge(() =>
      StripeTerminalSdk.createSetupIntent(innerParams)
    );
    if (error) return { error, setupIntent: undefined };
    return { setupIntent: setupIntent!, error: undefined };
  }, 'createSetupIntent')(params);
}

export async function collectPaymentMethod(
  params: CollectPaymentMethodParams
): Promise<PaymentIntentResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    const { error, paymentIntent } = await callBridge(() =>
      StripeTerminalSdk.collectPaymentMethod(innerParams)
    );
    if (error) return { error, paymentIntent: undefined };
    return { paymentIntent: paymentIntent!, error: undefined };
  }, 'collectPaymentMethod')(params);
}

export async function retrievePaymentIntent(
  clientSecret: string
): Promise<PaymentIntentResultType> {
  return Logger.traceSdkMethod(async (innerClientSecret) => {
    const { error, paymentIntent } = await callBridge(() =>
      StripeTerminalSdk.retrievePaymentIntent(innerClientSecret)
    );
    if (error) return { error, paymentIntent: undefined };
    return { paymentIntent: paymentIntent!, error: undefined };
  }, 'retrievePaymentIntent')(clientSecret);
}

export async function getLocations(
  params: GetLocationsParams
): Promise<GetLocationsResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    const { error, locations, hasMore } = await callBridge(() =>
      StripeTerminalSdk.getLocations(innerParams)
    );
    if (error) return { error, locations: undefined, hasMore: undefined };
    return { locations: locations!, hasMore: hasMore || false, error: undefined };
  }, 'getLocations')(params);
}

export async function confirmPaymentIntent(
  params: ConfirmPaymentMethodParams
): Promise<PaymentIntentResultType> {
  return Logger.traceSdkMethod(async (innerparams) => {
    const { error, paymentIntent: confirmedPaymentIntent } = await callBridge(() =>
      StripeTerminalSdk.confirmPaymentIntent(innerparams)
    );
    if (error) return { error, paymentIntent: undefined };
    return { paymentIntent: confirmedPaymentIntent!, error: undefined };
  }, 'confirmPaymentIntent')(params);
}

export async function processPaymentIntent(
  params: ProcessPaymentIntentParams
): Promise<PaymentIntentResultType> {
  return Logger.traceSdkMethod(async (innerparams) => {
    const { error, paymentIntent: processedPaymentIntent } = await callBridge(() =>
      StripeTerminalSdk.processPaymentIntent(innerparams)
    );
    if (error) return { error, paymentIntent: undefined };
    return { paymentIntent: processedPaymentIntent!, error: undefined };
  }, 'processPaymentIntent')(params);
}

export async function cancelPaymentIntent(
  params: CancelPaymentMethodParams
): Promise<PaymentIntentResultType> {
  return Logger.traceSdkMethod(async (innerparams) => {
    const { paymentIntent: canceledPaymentIntent, error } = await callBridge(() =>
      StripeTerminalSdk.cancelPaymentIntent(innerparams)
    );
    if (error) return { error, paymentIntent: undefined };
    return { paymentIntent: canceledPaymentIntent!, error: undefined };
  }, 'cancelPaymentIntent')(params);
}

export async function selectPaymentOption(paymentOptionType: string): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(async () => { await StripeTerminalSdk.selectPaymentOption(paymentOptionType); return {}; });
  }, 'selectPaymentOption')();
}

export async function failPaymentMethodSelection(errorMessage?: string): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(async () => { await StripeTerminalSdk.failPaymentMethodSelection(errorMessage); return {}; });
  }, 'failPaymentMethodSelection')();
}

export async function confirmQrCodeDisplayed(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(async () => { await StripeTerminalSdk.confirmQrCodeDisplayed(); return {}; });
  }, 'confirmQrCodeDisplayed')();
}

export async function failQrCodeDisplay(errorMessage?: string): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(async () => { await StripeTerminalSdk.failQrCodeDisplay(errorMessage); return {}; });
  }, 'failQrCodeDisplay')();
}

export async function installAvailableUpdate(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(async () => { await StripeTerminalSdk.installAvailableUpdate(); return {}; });
  }, 'installAvailableUpdate')();
}

export async function setReaderDisplay(
  cart: Cart
): Promise<{ error?: StripeError }> {
  return Logger.traceSdkMethod(async (innerCart) => {
    return callBridge(() => StripeTerminalSdk.setReaderDisplay(innerCart));
  }, 'setReaderDisplay')(cart);
}

export async function cancelInstallingUpdate(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.cancelInstallingUpdate());
  }, 'cancelInstallingUpdate')();
}

export async function retrieveSetupIntent(
  clientSecret: string
): Promise<SetupIntentResultType> {
  return Logger.traceSdkMethod(async (innerClientSecret) => {
    const { error, setupIntent } = await callBridge(() =>
      StripeTerminalSdk.retrieveSetupIntent(innerClientSecret)
    );
    if (error) return { error, setupIntent: undefined };
    return { setupIntent: setupIntent!, error: undefined };
  }, 'retrieveSetupIntent')(clientSecret);
}

export async function collectSetupIntentPaymentMethod(
  params: CollectSetupIntentPaymentMethodParams
): Promise<SetupIntentResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    const { error, setupIntent } = await callBridge(() =>
      StripeTerminalSdk.collectSetupIntentPaymentMethod(innerParams)
    );
    if (error) return { error, setupIntent: undefined };
    return { setupIntent: setupIntent!, error: undefined };
  }, 'collectSetupIntentPaymentMethod')(params);
}

export async function clearReaderDisplay(): Promise<ClearReaderDisplayResultType> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.clearReaderDisplay());
  }, 'clearReaderDisplay')();
}

export async function cancelSetupIntent(
  params: CancelSetupIntentMethodParams
): Promise<SetupIntentResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    const { setupIntent: canceledSetupIntent, error } = await callBridge(() =>
      StripeTerminalSdk.cancelSetupIntent(innerParams)
    );
    if (error) return { error, setupIntent: undefined };
    return { setupIntent: canceledSetupIntent!, error: undefined };
  }, 'cancelSetupIntent')(params);
}

export async function confirmSetupIntent(
  params: ConfirmSetupIntentMethodParams
): Promise<SetupIntentResultType> {
  return Logger.traceSdkMethod(async (innerparams) => {
    const { setupIntent: confirmedSetupIntent, error } = await callBridge(() =>
      StripeTerminalSdk.confirmSetupIntent(innerparams)
    );
    if (error) return { error, setupIntent: undefined };
    return { setupIntent: confirmedSetupIntent!, error: undefined };
  }, 'confirmSetupIntent')(params);
}

export async function processSetupIntent(
  params: ProcessSetupIntentParams
): Promise<SetupIntentResultType> {
  return Logger.traceSdkMethod(async (innerparams) => {
    const { setupIntent: processedSetupIntent, error } = await callBridge(() =>
      StripeTerminalSdk.processSetupIntent(innerparams)
    );
    if (error) return { error, setupIntent: processedSetupIntent };
    return { setupIntent: processedSetupIntent!, error: undefined };
  }, 'processSetupIntent')(params);
}

export async function setSimulatedCard(
  cardNumber: string
): Promise<{ error?: StripeError }> {
  return Logger.traceSdkMethod(async (innerCardNumber) => {
    return callBridge(() => StripeTerminalSdk.setSimulatedCard(innerCardNumber));
  }, 'setSimulatedCard')(cardNumber);
}

export async function setSimulatedOfflineMode(
  simulatedOffline: boolean
): Promise<{ error?: StripeError }> {
  return Logger.traceSdkMethod(async (innerSimulatedOffline) => {
    return callBridge(() => StripeTerminalSdk.setSimulatedOfflineMode(innerSimulatedOffline));
  }, 'setSimulatedOfflineMode')(simulatedOffline);
}

export async function setSimulatedCollectInputsResult(
  simulatedCollectInputsBehavior: string
): Promise<{ error?: StripeError }> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.setSimulatedCollectInputsResult(simulatedCollectInputsBehavior));
  }, 'setSimulatedCollectInputsResult')(simulatedCollectInputsBehavior);
}

export async function processRefund(
  params: RefundParams
): Promise<ProcessRefundResultType> {
  return Logger.traceSdkMethod(async (innerParams) => {
    const { error, refund } = await callBridge(() =>
      StripeTerminalSdk.processRefund(innerParams)
    );
    if (error) return { error, refund: undefined };
    return { refund: refund!, error: undefined };
  }, 'processRefund')(params);
}

export async function clearCachedCredentials(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.clearCachedCredentials());
  }, 'clearCachedCredentials')();
}

export async function cancelCollectPaymentMethod(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.cancelCollectPaymentMethod());
  }, 'cancelCollectPaymentMethod')();
}

export async function cancelProcessRefund(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.cancelProcessRefund());
  }, 'cancelProcessRefund')();
}

export async function cancelCollectSetupIntent(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.cancelCollectSetupIntent());
  }, 'cancelCollectSetupIntent')();
}

export async function cancelConfirmPaymentIntent(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.cancelConfirmPaymentIntent());
  }, 'cancelConfirmPaymentIntent')();
}

export async function cancelProcessPaymentIntent(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.cancelProcessPaymentIntent());
  }, 'cancelProcessPaymentIntent')();
}

export async function cancelConfirmSetupIntent(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.cancelConfirmSetupIntent());
  }, 'cancelConfirmSetupIntent')();
}

export async function cancelProcessSetupIntent(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.cancelProcessSetupIntent());
  }, 'cancelProcessSetupIntent')();
}

export async function getOfflineStatus(): Promise<OfflineStatus> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.getOfflineStatus());
  }, 'getOfflineStatus')();
}

export async function getPaymentStatus(): Promise<PaymentStatus> {
  return Logger.traceSdkMethod(async () => {
    try {
      const paymentStatus = await StripeTerminalSdk.getPaymentStatus();
      return paymentStatus;
    } catch (error) {
      return {
        error: rehydrateBridgeError(error),
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
        error: rehydrateBridgeError(error),
      };
    }
  }, 'getConnectionStatus')();
}

export async function getConnectedReader(): Promise<Reader.Type> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.getConnectedReader());
  }, 'getConnectedReader')();
}

export async function getReaderSettings(): Promise<Reader.ReaderSettings> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.getReaderSettings());
  }, 'getReaderSettings')();
}

export async function setReaderSettings(
  params: Reader.ReaderSettingsParameters
): Promise<Reader.ReaderSettings> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.setReaderSettings(params));
  }, 'setReaderSettings')();
}

export async function collectInputs(
  params: ICollectInputsParameters
): Promise<ICollectInputsResults> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.collectInputs(params));
  }, 'collectInputs')();
}

export async function cancelCollectInputs(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.cancelCollectInputs());
  }, 'cancelCollectInputs')();
}

export async function collectData(
  params: CollectDataParams
): Promise<CollectDataResultType> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.collectData(params));
  }, 'collectData')();
}

export async function cancelCollectData(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.cancelCollectData());
  }, 'cancelCollectData')();
}

export async function print(content: PrintContent): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.print(content));
  }, 'print')();
}

export async function cancelReaderReconnection(): Promise<{
  error?: StripeError;
}> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.cancelReaderReconnection());
  }, 'cancelReaderReconnection')();
}

export async function supportsReadersOfType(
  params: Reader.ReaderSupportParams
): Promise<Reader.ReaderSupportResult> {
  return Logger.traceSdkMethod(async () => {
    return callBridge(() => StripeTerminalSdk.supportsReadersOfType(params));
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
    return callBridge(async () => {
      await StripeTerminalSdk.setTapToPayUxConfiguration(params);
      return {};
    });
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
