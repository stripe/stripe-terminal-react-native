import { useCallback, useContext } from 'react';
import type {
  DiscoverReadersParams,
  EasyConnectParams,
  Reader,
  CreatePaymentIntentParams,
  GetLocationsParams,
  Cart,
  CreateSetupIntentParams,
  CollectSetupIntentPaymentMethodParams,
  RefundParams,
  CollectPaymentMethodParams,
  ConnectionStatus,
  PaymentStatus,
  UserCallbacks,
  EventResult,
  PaymentIntent,
  SetupIntent,
  OfflineStatus,
  ICollectInputsParameters,
  ReaderEvent,
  ConfirmPaymentMethodParams,
  ProcessPaymentIntentParams,
  ConfirmSetupIntentMethodParams,
  ProcessSetupIntentParams,
  CancelSetupIntentMethodParams,
  CancelPaymentMethodParams,
  CollectDataParams,
  TapToPayUxConfiguration,
  ConnectReaderParams,
  PrintContent,
} from '../types';
import type { StripeError } from '../types/StripeError';
import {
  discoverReaders,
  cancelDiscovering,
  easyConnect,
  cancelEasyConnect,
  connectReader,
  disconnectReader,
  rebootReader,
  createPaymentIntent,
  collectPaymentMethod,
  retrievePaymentIntent,
  getLocations,
  confirmPaymentIntent,
  processPaymentIntent,
  createSetupIntent,
  cancelPaymentIntent,
  installAvailableUpdate,
  cancelInstallingUpdate,
  setReaderDisplay,
  clearReaderDisplay,
  retrieveSetupIntent,
  collectSetupIntentPaymentMethod,
  cancelSetupIntent,
  confirmSetupIntent,
  processSetupIntent,
  processRefund,
  clearCachedCredentials,
  cancelCollectPaymentMethod,
  cancelCollectSetupIntent,
  cancelConfirmPaymentIntent,
  cancelProcessPaymentIntent,
  cancelConfirmSetupIntent,
  cancelProcessSetupIntent,
  cancelProcessRefund,
  setSimulatedCard,
  setSimulatedOfflineMode,
  setSimulatedCollectInputsResult,
  getOfflineStatus,
  getReaderSettings,
  setReaderSettings,
  collectInputs,
  cancelCollectInputs,
  collectData,
  cancelCollectData,
  print,
  cancelReaderReconnection,
  supportsReadersOfType,
  getPaymentStatus,
  getConnectionStatus,
  getConnectedReader,
  setTapToPayUxConfiguration,
  getNativeSdkVersion,
} from '../functions';
import { StripeTerminalContext } from '../components/StripeTerminalContext';
import { useListener } from './useListener';
import { NativeModules } from 'react-native';
//@ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type EventEmitter from 'react-native/Libraries/vendor/emitter/EventEmitter';
import { createInternalStripeError } from '../Errors/StripeErrorHelpers';
import { ErrorCode } from '../Errors/ErrorCodes';

// Event names come from the native module at runtime, so TypeScript cannot
// infer their values. Each is the event type `emitter` emits alongside the
// matching {@link UserCallbacks} callback.
const eventNames = NativeModules.StripeTerminalReactNative.getConstants();

/** Event type emitted when the SDK requests a new connection token. */
export const FETCH_TOKEN_PROVIDER: string = eventNames.FETCH_TOKEN_PROVIDER;
/** Event type for {@link UserCallbacks.onDidChangeConnectionStatus}. */
export const CHANGE_CONNECTION_STATUS: string =
  eventNames.CHANGE_CONNECTION_STATUS;
/** Event type for {@link UserCallbacks.onDidChangePaymentStatus}. */
export const CHANGE_PAYMENT_STATUS: string = eventNames.CHANGE_PAYMENT_STATUS;
/** Event type for {@link UserCallbacks.onFinishDiscoveringReaders}. */
export const FINISH_DISCOVERING_READERS: string =
  eventNames.FINISH_DISCOVERING_READERS;
/** Event type for {@link UserCallbacks.onDidFinishInstallingUpdate}. */
export const FINISH_INSTALLING_UPDATE: string =
  eventNames.FINISH_INSTALLING_UPDATE;
/** Event type for {@link UserCallbacks.onDidRequestReaderDisplayMessage}. */
export const REQUEST_READER_DISPLAY_MESSAGE: string =
  eventNames.REQUEST_READER_DISPLAY_MESSAGE;
/** Event type for {@link UserCallbacks.onDidRequestReaderInput}. */
export const REQUEST_READER_INPUT: string = eventNames.REQUEST_READER_INPUT;
/** Event type for {@link UserCallbacks.onDidReportAvailableUpdate}. */
export const REPORT_AVAILABLE_UPDATE: string =
  eventNames.REPORT_AVAILABLE_UPDATE;
/** Event type for {@link UserCallbacks.onDidUpdateRequirementsAvailable}. */
export const UPDATE_REQUIREMENTS_AVAILABLE: string =
  eventNames.UPDATE_REQUIREMENTS_AVAILABLE;
/** Event type for {@link UserCallbacks.onDidReportReaderSoftwareUpdateProgress}. */
export const REPORT_UPDATE_PROGRESS: string = eventNames.REPORT_UPDATE_PROGRESS;
/** Event type for {@link UserCallbacks.onDidStartInstallingUpdate}. */
export const START_INSTALLING_UPDATE: string =
  eventNames.START_INSTALLING_UPDATE;
/** Event type for {@link UserCallbacks.onUpdateDiscoveredReaders}. */
export const UPDATE_DISCOVERED_READERS: string =
  eventNames.UPDATE_DISCOVERED_READERS;
/** Event type for {@link UserCallbacks.onDidStartReaderReconnect}. */
export const START_READER_RECONNECT: string = eventNames.START_READER_RECONNECT;
/** Event type for {@link UserCallbacks.onDidSucceedReaderReconnect}. */
export const READER_RECONNECT_SUCCEED: string =
  eventNames.READER_RECONNECT_SUCCEED;
/** Event type for {@link UserCallbacks.onDidFailReaderReconnect}. */
export const READER_RECONNECT_FAIL: string = eventNames.READER_RECONNECT_FAIL;
/** Event type for {@link UserCallbacks.onDidChangeOfflineStatus}. */
export const CHANGE_OFFLINE_STATUS: string = eventNames.CHANGE_OFFLINE_STATUS;
/** Event type for {@link UserCallbacks.onDidForwardPaymentIntent}. */
export const FORWARD_PAYMENT_INTENT: string = eventNames.FORWARD_PAYMENT_INTENT;
/** Event type for {@link UserCallbacks.onDidForwardSetupIntent}. */
export const FORWARD_SETUP_INTENT: string = eventNames.FORWARD_SETUP_INTENT;
/** Event type for {@link UserCallbacks.onDidForwardingFailure}. */
export const REPORT_FORWARDING_ERROR: string =
  eventNames.REPORT_FORWARDING_ERROR;
/** Event type for {@link UserCallbacks.onDidDisconnect}. */
export const DISCONNECT: string = eventNames.DISCONNECT;
/** Event type for {@link UserCallbacks.onDidUpdateBatteryLevel}. */
export const UPDATE_BATTERY_LEVEL: string = eventNames.UPDATE_BATTERY_LEVEL;
/** Event type for {@link UserCallbacks.onDidReportLowBatteryWarning}. */
export const REPORT_LOW_BATTERY_WARNING: string =
  eventNames.REPORT_LOW_BATTERY_WARNING;
/** Event type for {@link UserCallbacks.onDidReportReaderEvent}. */
export const REPORT_READER_EVENT: string = eventNames.REPORT_READER_EVENT;
/**
 * Event type for {@link UserCallbacks.onDidAcceptTermsOfService}.
 * iOS only: Android does not report this event, so the value is `undefined` there.
 */
export const ACCEPT_TERMS_OF_SERVICE: string | undefined =
  eventNames.ACCEPT_TERMS_OF_SERVICE;

const NOT_INITIALIZED_ERROR_MESSAGE =
  'First initialize the Stripe Terminal SDK before performing any action';

/**
 *  useStripeTerminal hook Props
 */
export type Props = UserCallbacks;
/**
 * useStripeTerminal hook.
 * This hook gives you an acesss to all available SDK methods
 * as well as the state of the current connection
 *
 * @example
 * ```ts
 * const { discoverReaders } = useStripeTerminal({
 *   onUpdateDiscoveredReaders: (readers) => {
 *     setDisoveredReaders(readers)
 *   }
 *   onDidReportReaderSoftwareUpdateProgress: (progress) => {
 *     setCurrentProgress(progress)
 *   }
 * })
 * ```
 */
export function useStripeTerminal(props?: Props) {
  const {
    setLoading,
    isInitialized,
    getIsInitialized,
    initialize,
    setConnectedReader,
    setDiscoveredReaders,
    connectedReader,
    discoveredReaders,
    loading,
    emitter,
  } = useContext(StripeTerminalContext);

  const _isInitialized = useCallback(
    () => getIsInitialized(),
    [getIsInitialized]
  );

  const {
    onUpdateDiscoveredReaders,
    onFinishDiscoveringReaders,
    onDidFinishInstallingUpdate,
    onDidReportAvailableUpdate,
    onDidUpdateRequirementsAvailable,
    onDidReportReaderSoftwareUpdateProgress,
    onDidStartInstallingUpdate,
    onDidRequestReaderInput,
    onDidRequestReaderDisplayMessage,
    onDidChangePaymentStatus,
    onDidChangeConnectionStatus,
    onDidStartReaderReconnect,
    onDidSucceedReaderReconnect,
    onDidFailReaderReconnect,
    onDidChangeOfflineStatus,
    onDidForwardPaymentIntent,
    onDidForwardSetupIntent,
    onDidForwardingFailure,
    onDidDisconnect,
    onDidUpdateBatteryLevel,
    onDidReportLowBatteryWarning,
    onDidReportReaderEvent,
    onDidAcceptTermsOfService,
  } = props || {};

  const _discoverReaders = useCallback(
    async (params: DiscoverReadersParams) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);
      const response = await discoverReaders(params);
      setLoading(false);

      return response;
    },
    [_isInitialized, setLoading]
  );

  // TODO: check why NativeEventListeners are not registering properly if there is no below fix
  useListener(FETCH_TOKEN_PROVIDER, () => null);

  const didUpdateDiscoveredReaders = useCallback(
    ({ readers }: { readers: Reader.Type[] }) => {
      setDiscoveredReaders(readers);
      onUpdateDiscoveredReaders?.(readers);
    },
    [setDiscoveredReaders, onUpdateDiscoveredReaders]
  );

  const didFinishDiscoveringReaders = useCallback(
    ({ result }: EventResult<{ error?: StripeError }>) => {
      onFinishDiscoveringReaders?.(result.error);
    },
    [onFinishDiscoveringReaders]
  );

  const didReportAvailableUpdate = useCallback(
    ({ result }: EventResult<Reader.SoftwareUpdate>) => {
      onDidReportAvailableUpdate?.(result);
    },
    [onDidReportAvailableUpdate]
  );

  const didUpdateRequirementsAvailable = useCallback(
    ({ result }: EventResult<Reader.TapToPayUpdateRequirement[]>) => {
      onDidUpdateRequirementsAvailable?.(result);
    },
    [onDidUpdateRequirementsAvailable]
  );

  const didStartInstallingUpdate = useCallback(
    ({
      result,
      reader,
    }: {
      result: Reader.SoftwareUpdate;
      reader?: Reader.Type;
    }) => {
      onDidStartInstallingUpdate?.(result, reader);
    },
    [onDidStartInstallingUpdate]
  );

  const didReportReaderSoftwareUpdateProgress = useCallback(
    ({ result }: EventResult<{ progress: number }>) => {
      onDidReportReaderSoftwareUpdateProgress?.(result.progress);
    },
    [onDidReportReaderSoftwareUpdateProgress]
  );

  const didFinishInstallingUpdate = useCallback(
    ({
      result,
      error,
    }: {
      result?: Reader.SoftwareUpdate;
      error?: StripeError;
    }) => {
      onDidFinishInstallingUpdate?.(result, error);
    },
    [onDidFinishInstallingUpdate]
  );

  const didRequestReaderInput = useCallback(
    ({ result }: EventResult<Reader.InputOptions[]>) => {
      onDidRequestReaderInput?.(result);
    },
    [onDidRequestReaderInput]
  );

  const didRequestReaderDisplayMessage = useCallback(
    ({ result }: EventResult<Reader.DisplayMessage>) => {
      onDidRequestReaderDisplayMessage?.(result);
    },
    [onDidRequestReaderDisplayMessage]
  );

  const didChangePaymentStatus = useCallback(
    ({ result }: EventResult<PaymentStatus>) => {
      onDidChangePaymentStatus?.(result);
    },
    [onDidChangePaymentStatus]
  );

  const didChangeConnectionStatus = useCallback(
    ({ result }: EventResult<ConnectionStatus>) => {
      onDidChangeConnectionStatus?.(result);
    },
    [onDidChangeConnectionStatus]
  );

  const didStartReaderReconnect = useCallback(
    ({
      reader,
      reason,
    }: {
      reader: Reader.Type;
      reason: Reader.DisconnectReason;
    }) => {
      onDidStartReaderReconnect?.(reader, reason);
    },
    [onDidStartReaderReconnect]
  );

  const didSucceedReaderReconnect = useCallback(
    ({ reader }: { reader: Reader.Type }) => {
      onDidSucceedReaderReconnect?.(reader);
    },
    [onDidSucceedReaderReconnect]
  );

  const didFailReaderReconnect = useCallback(
    ({ reader }: { reader: Reader.Type }) => {
      onDidFailReaderReconnect?.(reader);
      setConnectedReader(null);
    },
    [onDidFailReaderReconnect, setConnectedReader]
  );

  const didChangeOfflineStatus = useCallback(
    ({ result }: { result: OfflineStatus }) => {
      if (!result.reader?.networkStatus) {
        result.reader = undefined;
      }
      onDidChangeOfflineStatus?.(result);
    },
    [onDidChangeOfflineStatus]
  );

  const didForwardPaymentIntent = useCallback(
    ({ result, error }: { result: PaymentIntent.Type; error?: StripeError }) => {
      onDidForwardPaymentIntent?.(result, error);
    },
    [onDidForwardPaymentIntent]
  );

  const didForwardSetupIntent = useCallback(
    ({ result, error }: { result: SetupIntent.Type; error?: StripeError }) => {
      onDidForwardSetupIntent?.(result, error);
    },
    [onDidForwardSetupIntent]
  );

  const didReportForwardingError = useCallback(
    ({ result }: { result: { error: StripeError } }) => {
      onDidForwardingFailure?.(result.error);
    },
    [onDidForwardingFailure]
  );

  const didDisconnect = useCallback(
    ({ reason }: { reason: Reader.DisconnectReason }) => {
      onDidDisconnect?.(reason);
      setConnectedReader(null);
      setDiscoveredReaders([]);
    },
    [onDidDisconnect, setConnectedReader, setDiscoveredReaders]
  );

  const didUpdateBatteryLevel = useCallback(
    ({ result }: { result: Reader.BatteryLevel }) => {
      onDidUpdateBatteryLevel?.(result);
    },
    [onDidUpdateBatteryLevel]
  );

  const didReportLowBatteryWarning = useCallback(() => {
    onDidReportLowBatteryWarning?.();
  }, [onDidReportLowBatteryWarning]);

  const didReportReaderEvent = useCallback(
    ({ result }: { result: ReaderEvent }) => {
      onDidReportReaderEvent?.(result);
    },
    [onDidReportReaderEvent]
  );

  const acceptTermsOfService = useCallback(() => {
    onDidAcceptTermsOfService?.();
  }, [onDidAcceptTermsOfService]);

  useListener(REPORT_AVAILABLE_UPDATE, didReportAvailableUpdate);
  useListener(UPDATE_REQUIREMENTS_AVAILABLE, didUpdateRequirementsAvailable);
  useListener(START_INSTALLING_UPDATE, didStartInstallingUpdate);
  useListener(REPORT_UPDATE_PROGRESS, didReportReaderSoftwareUpdateProgress);
  useListener(FINISH_INSTALLING_UPDATE, didFinishInstallingUpdate);

  useListener(UPDATE_DISCOVERED_READERS, didUpdateDiscoveredReaders);
  useListener(FINISH_DISCOVERING_READERS, didFinishDiscoveringReaders);

  useListener(REQUEST_READER_INPUT, didRequestReaderInput);
  useListener(REQUEST_READER_DISPLAY_MESSAGE, didRequestReaderDisplayMessage);
  useListener(CHANGE_PAYMENT_STATUS, didChangePaymentStatus);
  useListener(CHANGE_CONNECTION_STATUS, didChangeConnectionStatus);

  useListener(START_READER_RECONNECT, didStartReaderReconnect);
  useListener(READER_RECONNECT_SUCCEED, didSucceedReaderReconnect);
  useListener(READER_RECONNECT_FAIL, didFailReaderReconnect);

  useListener(CHANGE_OFFLINE_STATUS, didChangeOfflineStatus);
  useListener(FORWARD_PAYMENT_INTENT, didForwardPaymentIntent);
  useListener(FORWARD_SETUP_INTENT, didForwardSetupIntent);
  useListener(REPORT_FORWARDING_ERROR, didReportForwardingError);

  useListener(DISCONNECT, didDisconnect);

  useListener(UPDATE_BATTERY_LEVEL, didUpdateBatteryLevel);
  useListener(REPORT_LOW_BATTERY_WARNING, didReportLowBatteryWarning);
  useListener(REPORT_READER_EVENT, didReportReaderEvent);
  useListener(ACCEPT_TERMS_OF_SERVICE, acceptTermsOfService);

  const _initialize = useCallback(async () => {
    if (!initialize || typeof initialize !== 'function') {
      const errorMessage =
        'StripeTerminalProvider component is not found, has not been mounted properly or SDK has not been initialized properly';

      return {
        error: createInternalStripeError(
          {
            code: ErrorCode.UNEXPECTED_SDK_ERROR,
            message: errorMessage,
          },
          'rn'
        ).stripeError,
        reader: undefined,
      };
    }

    return await initialize();
  }, [initialize]);

  const _cancelDiscovering = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
    }
    setLoading(true);

    const response = await cancelDiscovering();

    setDiscoveredReaders([]);

    setLoading(false);

    return response;
  }, [setLoading, setDiscoveredReaders, _isInitialized]);

  const _connectReader = useCallback(
    async (params: ConnectReaderParams) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await connectReader(params);

      if (response.reader && !response.error) {
        setConnectedReader(response.reader);
      }
      setLoading(false);

      return response;
    },
    [setConnectedReader, setLoading, _isInitialized]
  );

  const _disconnectReader = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      return;
    }
    setLoading(true);

    const response = await disconnectReader();

    if (!response.error) {
      setConnectedReader(null);
      setDiscoveredReaders([]);
    }

    setLoading(false);

    return response;
  }, [setLoading, setConnectedReader, setDiscoveredReaders, _isInitialized]);

  const _rebootReader = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      return;
    }
    setLoading(true);

    const response = await rebootReader();

    setLoading(false);

    return response;
  }, [setLoading, _isInitialized]);

  const _createPaymentIntent = useCallback(
    async (params: CreatePaymentIntentParams) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await createPaymentIntent(params);

      setLoading(false);

      return response;
    },
    [setLoading, _isInitialized]
  );

  const _collectPaymentMethod = useCallback(
    async (params: CollectPaymentMethodParams) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await collectPaymentMethod(params);

      setLoading(false);

      return response;
    },
    [setLoading, _isInitialized]
  );

  const _retrievePaymentIntent = useCallback(
    async (clientSecret: string) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await retrievePaymentIntent(clientSecret);

      setLoading(false);

      return response;
    },
    [setLoading, _isInitialized]
  );

  const _getLocations = useCallback(
    async (params: GetLocationsParams) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await getLocations(params);

      setLoading(false);

      return response;
    },
    [setLoading, _isInitialized]
  );

  const _confirmPaymentIntent = useCallback(
    async (param: ConfirmPaymentMethodParams) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await confirmPaymentIntent(param);

      setLoading(false);

      return response;
    },
    [setLoading, _isInitialized]
  );

  const _processPaymentIntent = useCallback(
    async (param: ProcessPaymentIntentParams) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await processPaymentIntent(param);

      setLoading(false);

      return response;
    },
    [setLoading, _isInitialized]
  );

  const _createSetupIntent = useCallback(
    async (params: CreateSetupIntentParams) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await createSetupIntent(params);

      setLoading(false);

      return response;
    },
    [_isInitialized, setLoading]
  );

  const _cancelPaymentIntent = useCallback(
    async (params: CancelPaymentMethodParams) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await cancelPaymentIntent(params);

      setLoading(false);

      return response;
    },
    [setLoading, _isInitialized]
  );

  const _installAvailableUpdate = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
    }
    setLoading(true);

    const response = await installAvailableUpdate();

    setLoading(false);

    return response;
  }, [setLoading, _isInitialized]);

  const _cancelInstallingUpdate = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
    }
    setLoading(true);

    const response = await cancelInstallingUpdate();
    setLoading(false);

    return response;
  }, [setLoading, _isInitialized]);

  const _setReaderDisplay = useCallback(
    async (cart: Cart) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await setReaderDisplay(cart);
      setLoading(false);

      return response;
    },
    [setLoading, _isInitialized]
  );

  const _retrieveSetupIntent = useCallback(
    async (clientSecret: string) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await retrieveSetupIntent(clientSecret);

      setLoading(false);

      return response;
    },
    [setLoading, _isInitialized]
  );

  const _collectSetupIntentPaymentMethod = useCallback(
    async (params: CollectSetupIntentPaymentMethodParams) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await collectSetupIntentPaymentMethod(params);
      setLoading(false);

      return response;
    },
    [setLoading, _isInitialized]
  );

  const _clearReaderDisplay = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
    }
    setLoading(true);

    const response = await clearReaderDisplay();

    setLoading(false);

    return response;
  }, [setLoading, _isInitialized]);

  const _cancelSetupIntent = useCallback(
    async (params: CancelSetupIntentMethodParams) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await cancelSetupIntent(params);

      setLoading(false);

      return response;
    },
    [setLoading, _isInitialized]
  );

  const _confirmSetupIntent = useCallback(
    async (params: ConfirmSetupIntentMethodParams) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await confirmSetupIntent(params);

      setLoading(false);

      return response;
    },
    [setLoading, _isInitialized]
  );

  const _processSetupIntent = useCallback(
    async (params: ProcessSetupIntentParams) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await processSetupIntent(params);

      setLoading(false);

      return response;
    },
    [setLoading, _isInitialized]
  );

  const _setSimulatedCard = useCallback(
    async (cardNumber: string) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await setSimulatedCard(cardNumber);
      setLoading(false);

      return response;
    },
    [_isInitialized, setLoading]
  );

  const _setSimulatedOfflineMode = useCallback(
    async (simulatedOffline: boolean) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await setSimulatedOfflineMode(simulatedOffline);
      setLoading(false);

      return response;
    },
    [_isInitialized, setLoading]
  );

  const _setSimulatedCollectInputsResult = useCallback(
    async (simulatedCollectInputsBehavior: string) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await setSimulatedCollectInputsResult(
        simulatedCollectInputsBehavior
      );
      setLoading(false);

      return response;
    },
    [_isInitialized, setLoading]
  );

  const _processRefund = useCallback(
    async (params: RefundParams) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await processRefund(params);

      setLoading(false);

      return response;
    },
    [setLoading, _isInitialized]
  );

  const _clearCachedCredentials = useCallback(async () => {
    setLoading(true);

    const response = await clearCachedCredentials();

    setLoading(false);

    return response;
  }, [setLoading]);

  const _cancelCollectPaymentMethod = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
    }
    setLoading(true);

    const response = await cancelCollectPaymentMethod();

    setLoading(false);

    return response;
  }, [setLoading, _isInitialized]);

  const _cancelProcessRefund = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
    }
    setLoading(true);

    const response = await cancelProcessRefund();

    setLoading(false);

    return response;
  }, [_isInitialized, setLoading]);

  const _cancelCollectSetupIntent = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
    }
    setLoading(true);

    const response = await cancelCollectSetupIntent();

    setLoading(false);

    return response;
  }, [_isInitialized, setLoading]);

  const _cancelConfirmPaymentIntent = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
    }
    setLoading(true);

    const response = await cancelConfirmPaymentIntent();

    setLoading(false);

    return response;
  }, [_isInitialized, setLoading]);

  const _cancelProcessPaymentIntent = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
    }
    setLoading(true);

    const response = await cancelProcessPaymentIntent();

    setLoading(false);

    return response;
  }, [_isInitialized, setLoading]);

  const _cancelConfirmSetupIntent = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
    }
    setLoading(true);

    const response = await cancelConfirmSetupIntent();

    setLoading(false);

    return response;
  }, [_isInitialized, setLoading]);

  const _getOfflineStatus = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
    }
    const response = await getOfflineStatus();
    if (!response.reader?.networkStatus) {
      response.reader = undefined;
    }
    return response;
  }, [_isInitialized]);

  const _getPaymentStatus = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
    }
    const response = await getPaymentStatus();
    return response;
  }, [_isInitialized]);

  const _getConnectionStatus = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
    }
    const response = await getConnectionStatus();
    return response;
  }, [_isInitialized]);

  const _getConnectedReader = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
    }
    const response = await getConnectedReader();
    return response;
  }, [_isInitialized]);

  const _getReaderSettings = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
    }
    const response = await getReaderSettings();

    return response;
  }, [_isInitialized]);

  const _setReaderSettings = useCallback(
    async (params: Reader.ReaderSettingsParameters) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      const response = await setReaderSettings(params);

      return response;
    },
    [_isInitialized]
  );

  const _collectInputs = useCallback(
    async (params: ICollectInputsParameters) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await collectInputs(params);

      setLoading(false);

      return response;
    },
    [_isInitialized, setLoading]
  );

  const _cancelCollectInputs = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
    }
    setLoading(true);

    const response = await cancelCollectInputs();

    setLoading(false);

    return response;
  }, [_isInitialized, setLoading]);

  const _collectData = useCallback(
    async (params: CollectDataParams) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await collectData(params);

      setLoading(false);

      return response;
    },
    [_isInitialized, setLoading]
  );

  const _cancelCollectData = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
    }
    setLoading(true);

    const response = await cancelCollectData();

    setLoading(false);

    return response;
  }, [_isInitialized, setLoading]);

  const _print = useCallback(
    async (content: PrintContent) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await print(content);

      setLoading(false);

      return response;
    },
    [_isInitialized, setLoading]
  );

  const _cancelReaderReconnection = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
    }
    setLoading(true);

    const response = await cancelReaderReconnection();

    setLoading(false);

    return response;
  }, [_isInitialized, setLoading]);

  const _supportsReadersOfType = useCallback(
    async (params: Reader.ReaderSupportParams) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await supportsReadersOfType(params);

      setLoading(false);

      return response;
    },
    [_isInitialized, setLoading]
  );

  const _setTapToPayUxConfiguration = useCallback(
    async (params: TapToPayUxConfiguration) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await setTapToPayUxConfiguration(params);

      setLoading(false);

      return response;
    },
    [_isInitialized, setLoading]
  );

  const _easyConnect = useCallback(
    async (params: EasyConnectParams) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);
      const response = await easyConnect(params);

      if (response.reader) {
        setConnectedReader(response.reader);
      }

      setLoading(false);

      return response;
    },
    [_isInitialized, setLoading, setConnectedReader]
  );

  const _cancelEasyConnect = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
    }
    setLoading(true);

    const response = await cancelEasyConnect();

    setLoading(false);

    return response;
  }, [setLoading, _isInitialized]);

  const _getNativeSdkVersion = useCallback(async () => {
    return await getNativeSdkVersion();
  }, []);

  return {
    /** Initializes the SDK. Call once, before any other method, inside {@link StripeTerminalProvider}. */
    initialize: _initialize,
    /** Starts discovering readers with the given discovery method. Discovered readers are reported through {@link UserCallbacks.onUpdateDiscoveredReaders}. */
    discoverReaders: _discoverReaders,
    /** Cancels an in-progress {@link WithStripeTerminalProps.discoverReaders | discoverReaders} call. */
    cancelDiscovering: _cancelDiscovering,
    /** Discovers and connects to a reader in a single call. */
    easyConnect: _easyConnect,
    /** Cancels an in-progress {@link WithStripeTerminalProps.easyConnect | easyConnect} call. */
    cancelEasyConnect: _cancelEasyConnect,
    /** Connects to a reader returned by {@link WithStripeTerminalProps.discoverReaders | discoverReaders}. */
    connectReader: _connectReader,
    /** Disconnects from the connected reader. */
    disconnectReader: _disconnectReader,
    /** Reboots the connected reader. */
    rebootReader: _rebootReader,
    /** Creates a PaymentIntent. */
    createPaymentIntent: _createPaymentIntent,
    /** Collects a payment method for a PaymentIntent using the connected reader. */
    collectPaymentMethod: _collectPaymentMethod,
    /** Retrieves a PaymentIntent by its client secret. */
    retrievePaymentIntent: _retrievePaymentIntent,
    /** Lists the Locations belonging to the account. */
    getLocations: _getLocations,
    /** Confirms a PaymentIntent after {@link WithStripeTerminalProps.collectPaymentMethod | collectPaymentMethod} succeeds. */
    confirmPaymentIntent: _confirmPaymentIntent,
    /** Collects a payment method and confirms the PaymentIntent in a single call. */
    processPaymentIntent: _processPaymentIntent,
    /** Creates a SetupIntent. */
    createSetupIntent: _createSetupIntent,
    /** Cancels a PaymentIntent. */
    cancelPaymentIntent: _cancelPaymentIntent,
    /** Installs the software update reported by {@link UserCallbacks.onDidReportAvailableUpdate}. */
    installAvailableUpdate: _installAvailableUpdate,
    /** Cancels an in-progress reader software update. */
    cancelInstallingUpdate: _cancelInstallingUpdate,
    /** Displays a cart on the reader's screen. */
    setReaderDisplay: _setReaderDisplay,
    /** Clears the reader's screen. */
    clearReaderDisplay: _clearReaderDisplay,
    /** Retrieves a SetupIntent by its client secret. */
    retrieveSetupIntent: _retrieveSetupIntent,
    /** Collects a payment method for a SetupIntent using the connected reader. */
    collectSetupIntentPaymentMethod: _collectSetupIntentPaymentMethod,
    /** Cancels a SetupIntent. */
    cancelSetupIntent: _cancelSetupIntent,
    /** Confirms a SetupIntent after {@link WithStripeTerminalProps.collectSetupIntentPaymentMethod | collectSetupIntentPaymentMethod} succeeds. */
    confirmSetupIntent: _confirmSetupIntent,
    /** Collects a payment method and confirms the SetupIntent in a single call. */
    processSetupIntent: _processSetupIntent,
    /** Collects a payment method and refunds a charge or PaymentIntent. */
    processRefund: _processRefund,
    /** Clears the cached connection token and reader sessions, for example when switching accounts. */
    clearCachedCredentials: _clearCachedCredentials,
    /** Cancels an in-progress {@link WithStripeTerminalProps.collectPaymentMethod | collectPaymentMethod} call. */
    cancelCollectPaymentMethod: _cancelCollectPaymentMethod,
    /** Cancels an in-progress {@link WithStripeTerminalProps.collectSetupIntentPaymentMethod | collectSetupIntentPaymentMethod} call. */
    cancelCollectSetupIntent: _cancelCollectSetupIntent,
    /** Cancels an in-progress {@link WithStripeTerminalProps.confirmPaymentIntent | confirmPaymentIntent} call. */
    cancelConfirmPaymentIntent: _cancelConfirmPaymentIntent,
    /** Cancels an in-progress {@link WithStripeTerminalProps.processPaymentIntent | processPaymentIntent} call. */
    cancelProcessPaymentIntent: _cancelProcessPaymentIntent,
    /** Cancels an in-progress {@link WithStripeTerminalProps.confirmSetupIntent | confirmSetupIntent} call. */
    cancelConfirmSetupIntent: _cancelConfirmSetupIntent,
    /** Cancels an in-progress {@link WithStripeTerminalProps.processSetupIntent | processSetupIntent} call. */
    cancelProcessSetupIntent: cancelProcessSetupIntent,
    /** Cancels an in-progress {@link WithStripeTerminalProps.processRefund | processRefund} call. */
    cancelProcessRefund: _cancelProcessRefund,
    /** Sets the test card number a simulated reader presents. */
    setSimulatedCard: _setSimulatedCard,
    /** Simulates the device going offline or back online. */
    setSimulatedOfflineMode: _setSimulatedOfflineMode,
    /** Sets the result a simulated reader returns from {@link WithStripeTerminalProps.collectInputs | collectInputs}. */
    setSimulatedCollectInputsResult: _setSimulatedCollectInputsResult,
    /** Returns the offline status of the SDK and the connected reader. */
    getOfflineStatus: _getOfflineStatus,
    /** Returns the current payment status. */
    getPaymentStatus: _getPaymentStatus,
    /** Returns the current reader connection status. */
    getConnectionStatus: _getConnectionStatus,
    /** Returns the connected reader, if any. */
    getConnectedReader: _getConnectedReader,
    /** Returns the connected reader's settings. */
    getReaderSettings: _getReaderSettings,
    /** Updates the connected reader's settings. */
    setReaderSettings: _setReaderSettings,
    /** Displays forms on the reader and collects the customer's input. */
    collectInputs: _collectInputs,
    /** Cancels an in-progress {@link WithStripeTerminalProps.collectInputs | collectInputs} call. */
    cancelCollectInputs: _cancelCollectInputs,
    /** Collects non-payment data, such as a magstripe card, using the connected reader. */
    collectData: _collectData,
    /** Cancels an in-progress {@link WithStripeTerminalProps.collectData | collectData} call. */
    cancelCollectData: _cancelCollectData,
    /**
     * Prints the specified content to the connected reader's printer, if available.
     * @param content The content to print. Must be an image (JPEG/PNG) encoded as a base64 string or 'data:' URI scheme.
     */
    print: _print,
    /** Cancels an in-progress automatic reader reconnection. */
    cancelReaderReconnection: _cancelReaderReconnection,
    /** Checks whether the device supports readers of the given type and discovery method. */
    supportsReadersOfType: _supportsReadersOfType,
    /** Customizes the Tap to Pay screen. */
    setTapToPayUxConfiguration: _setTapToPayUxConfiguration,
    /** Returns the version of the native Stripe Terminal SDK. */
    getNativeSdkVersion: _getNativeSdkVersion,
    /** Event emitter for SDK events. Event types are exported as constants, such as {@link CHANGE_CONNECTION_STATUS}. */
    emitter: emitter,
    /** Readers found by the latest {@link WithStripeTerminalProps.discoverReaders | discoverReaders} call. */
    discoveredReaders,
    /** The connected reader, or `null` or `undefined` when no reader is connected. */
    connectedReader,
    /** Whether {@link WithStripeTerminalProps.initialize | initialize} has completed successfully. */
    isInitialized,
    /** Returns whether the SDK is initialized. Unlike {@link WithStripeTerminalProps.isInitialized | isInitialized}, reads the latest value outside the render cycle. */
    getIsInitialized,
    /** Whether an SDK call is in progress. */
    loading,
  };
}
