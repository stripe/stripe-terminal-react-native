import { useCallback, useContext } from 'react';
import type {
  DiscoverReadersParams,
  Reader,
  CreatePaymentIntentParams,
  GetLocationsParams,
  Cart,
  CreateSetupIntentParams,
  CollectSetupIntentPaymentMethodParams,
  RefundParams,
  CollectPaymentMethodParams,
  StripeError,
  PaymentStatus,
  UserCallbacks,
  EventResult,
  PaymentIntent,
  OfflineStatus,
  ICollectInputsParameters,
  ReaderEvent,
  ConfirmPaymentMethodParams,
  ConfirmSetupIntentMethodParams,
  CancelSetupIntentMethodParams,
  CancelPaymentMethodParams,
  CollectDataParams,
  TapToPayUxConfiguration,
  ConnectReaderParams,
} from '../types';
import {
  discoverReaders,
  cancelDiscovering,
  connectReader,
  disconnectReader,
  rebootReader,
  createPaymentIntent,
  collectPaymentMethod,
  retrievePaymentIntent,
  getLocations,
  confirmPaymentIntent,
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
  simulateReaderUpdate,
  collectRefundPaymentMethod,
  confirmRefund,
  clearCachedCredentials,
  cancelCollectPaymentMethod,
  cancelCollectSetupIntent,
  setSimulatedCard,
  cancelCollectRefundPaymentMethod,
  getOfflineStatus,
  getReaderSettings,
  setReaderSettings,
  collectInputs,
  cancelCollectInputs,
  collectData,
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

export const {
  FETCH_TOKEN_PROVIDER,
  CHANGE_CONNECTION_STATUS,
  CHANGE_PAYMENT_STATUS,
  FINISH_DISCOVERING_READERS,
  FINISH_INSTALLING_UPDATE,
  REQUEST_READER_DISPLAY_MESSAGE,
  REQUEST_READER_INPUT,
  REPORT_AVAILABLE_UPDATE,
  REPORT_UPDATE_PROGRESS,
  START_INSTALLING_UPDATE,
  UPDATE_DISCOVERED_READERS,
  START_READER_RECONNECT,
  READER_RECONNECT_SUCCEED,
  READER_RECONNECT_FAIL,
  CHANGE_OFFLINE_STATUS,
  FORWARD_PAYMENT_INTENT,
  REPORT_FORWARDING_ERROR,
  DISCONNECT,
  UPDATE_BATTERY_LEVEL,
  REPORT_LOW_BATTERY_WARNING,
  REPORT_READER_EVENT,
  ACCEPT_TERMS_OF_SERVICE,
} = NativeModules.StripeTerminalReactNative.getConstants();

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
    initialize,
    setConnectedReader,
    setDiscoveredReaders,
    connectedReader,
    discoveredReaders,
    loading,
    emitter,
    log,
  } = useContext(StripeTerminalContext);

  const _isInitialized = useCallback(() => isInitialized, [isInitialized]);

  const {
    onUpdateDiscoveredReaders,
    onFinishDiscoveringReaders,
    onDidFinishInstallingUpdate,
    onDidReportAvailableUpdate,
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

  const didStartInstallingUpdate = useCallback(
    ({ result }: EventResult<Reader.SoftwareUpdate>) => {
      onDidStartInstallingUpdate?.(result);
    },
    [onDidStartInstallingUpdate]
  );

  const didReportReaderSoftwareUpdateProgress = useCallback(
    ({ result }: EventResult<{ progress: string }>) => {
      onDidReportReaderSoftwareUpdateProgress?.(result.progress);
    },
    [onDidReportReaderSoftwareUpdateProgress]
  );

  const didFinishInstallingUpdate = useCallback(
    ({
      result,
    }: EventResult<Reader.SoftwareUpdate | { error: StripeError }>) => {
      if ((result as { error: StripeError }).error) {
        const { error } = result as { error: StripeError };

        onDidFinishInstallingUpdate?.({
          update: undefined,
          error: error,
        });
      } else {
        onDidFinishInstallingUpdate?.({
          update: result as Reader.SoftwareUpdate,
          error: undefined,
        });
      }
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
    ({ result }: EventResult<Reader.ConnectionStatus>) => {
      onDidChangeConnectionStatus?.(result);
    },
    [onDidChangeConnectionStatus]
  );

  const didStartReaderReconnect = useCallback(
    ({ reason }: { reason?: Reader.DisconnectReason }) => {
      onDidStartReaderReconnect?.(reason);
    },
    [onDidStartReaderReconnect]
  );

  const didSucceedReaderReconnect = useCallback(() => {
    onDidSucceedReaderReconnect?.();
  }, [onDidSucceedReaderReconnect]);

  const didFailReaderReconnect = useCallback(() => {
    onDidFailReaderReconnect?.();
    setConnectedReader(null);
  }, [onDidFailReaderReconnect, setConnectedReader]);

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
    ({ result, error }: { result: PaymentIntent.Type; error: StripeError }) => {
      onDidForwardPaymentIntent?.(result, error);
    },
    [onDidForwardPaymentIntent]
  );

  const didReportForwardingError = useCallback(
    ({ error }: { error?: StripeError }) => {
      onDidForwardingFailure?.(error);
    },
    [onDidForwardingFailure]
  );

  const didDisconnect = useCallback(
    ({ reason }: { reason?: Reader.DisconnectReason }) => {
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
      log('Failed', errorMessage);

      return {
        error: {
          code: 'Failed',
          message: errorMessage,
        },
        reader: undefined,
      };
    }

    return await initialize();
  }, [initialize, log]);

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
    async (
      params: ConnectReaderParams,
      discoveryMethod: Reader.DiscoveryMethod
    ) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await connectReader(params, discoveryMethod);

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

  const _simulateReaderUpdate = useCallback(
    async (update: Reader.SimulateUpdateType) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await simulateReaderUpdate(update);
      setLoading(false);

      return response;
    },
    [setLoading, _isInitialized]
  );

  const _collectRefundPaymentMethod = useCallback(
    async (params: RefundParams) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await collectRefundPaymentMethod(params);

      setLoading(false);

      return response;
    },
    [setLoading, _isInitialized]
  );

  const _confirmRefund = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
    }
    setLoading(true);

    const response = await confirmRefund();

    setLoading(false);

    return response;
  }, [setLoading, _isInitialized]);

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

  const _cancelCollectRefundPaymentMethod = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
    }
    setLoading(true);

    const response = await cancelCollectRefundPaymentMethod();

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

  const _getNativeSdkVersion = useCallback(async () => {
    return await getNativeSdkVersion();
  }, []);

  return {
    initialize: _initialize,
    discoverReaders: _discoverReaders,
    cancelDiscovering: _cancelDiscovering,
    connectReader: _connectReader,
    disconnectReader: _disconnectReader,
    rebootReader: _rebootReader,
    createPaymentIntent: _createPaymentIntent,
    collectPaymentMethod: _collectPaymentMethod,
    retrievePaymentIntent: _retrievePaymentIntent,
    getLocations: _getLocations,
    confirmPaymentIntent: _confirmPaymentIntent,
    createSetupIntent: _createSetupIntent,
    cancelPaymentIntent: _cancelPaymentIntent,
    installAvailableUpdate: _installAvailableUpdate,
    cancelInstallingUpdate: _cancelInstallingUpdate,
    setReaderDisplay: _setReaderDisplay,
    clearReaderDisplay: _clearReaderDisplay,
    retrieveSetupIntent: _retrieveSetupIntent,
    collectSetupIntentPaymentMethod: _collectSetupIntentPaymentMethod,
    cancelSetupIntent: _cancelSetupIntent,
    confirmSetupIntent: _confirmSetupIntent,
    simulateReaderUpdate: _simulateReaderUpdate,
    collectRefundPaymentMethod: _collectRefundPaymentMethod,
    confirmRefund: _confirmRefund,
    clearCachedCredentials: _clearCachedCredentials,
    cancelCollectPaymentMethod: _cancelCollectPaymentMethod,
    cancelCollectRefundPaymentMethod: _cancelCollectRefundPaymentMethod,
    cancelCollectSetupIntent: _cancelCollectSetupIntent,
    setSimulatedCard: _setSimulatedCard,
    getOfflineStatus: _getOfflineStatus,
    getPaymentStatus: _getPaymentStatus,
    getConnectionStatus: _getConnectionStatus,
    getConnectedReader: _getConnectedReader,
    getReaderSettings: _getReaderSettings,
    setReaderSettings: _setReaderSettings,
    collectInputs: _collectInputs,
    cancelCollectInputs: _cancelCollectInputs,
    collectData: _collectData,
    cancelReaderReconnection: _cancelReaderReconnection,
    supportsReadersOfType: _supportsReadersOfType,
    setTapToPayUxConfiguration: _setTapToPayUxConfiguration,
    getNativeSdkVersion: _getNativeSdkVersion,
    emitter: emitter,
    discoveredReaders,
    connectedReader,
    isInitialized,
    loading,
  };
}
