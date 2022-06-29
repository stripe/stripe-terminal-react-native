import { useCallback, useContext } from 'react';
import type {
  DiscoverReadersParams,
  Reader,
  ConnectInternetReaderParams,
  CreatePaymentIntentParams,
  ConnectBluetoothReaderParams,
  ConnectUsbReaderParams,
  GetLocationsParams,
  Cart,
  CreateSetupIntentParams,
  CollectSetupIntentPaymentMethodParams,
  RefundParams,
  ReadReusableCardParamsType,
  ConnectEmbeddedParams,
  ConnectLocalMobileParams,
  CollectPaymentMethodParams,
  StripeError,
  PaymentStatus,
  UserCallbacks,
  EventResult,
} from '../types';
import {
  discoverReaders,
  cancelDiscovering,
  connectBluetoothReader,
  disconnectReader,
  connectInternetReader,
  connectUsbReader,
  createPaymentIntent,
  collectPaymentMethod,
  retrievePaymentIntent,
  getLocations,
  processPayment,
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
  processRefund,
  clearCachedCredentials,
  readReusableCard,
  cancelCollectPaymentMethod,
  cancelCollectSetupIntent,
  cancelReadReusableCard,
  connectEmbeddedReader,
  connectHandoffReader,
  connectLocalMobileReader,
  setSimulatedCard,
  cancelCollectRefundPaymentMethod,
} from '../functions';
import { StripeTerminalContext } from '../components/StripeTerminalContext';
import { useListener } from './useListener';
import { NativeModules } from 'react-native';

export const {
  FETCH_TOKEN_PROVIDER,
  CHANGE_CONNECTION_STATUS,
  CHANGE_PAYMENT_STATUS,
  FINISH_DISCOVERING_READERS,
  FINISH_INSTALLING_UPDATE,
  REQUEST_READER_DISPLAY_MESSAGE,
  REQUEST_READER_INPUT,
  REPORT_AVAILABLE_UPDATE,
  REPORT_UNEXPECTED_READER_DISCONNECT,
  REPORT_UPDATE_PROGRESS,
  START_INSTALLING_UPDATE,
  UPDATE_DISCOVERED_READERS,
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
    onDidReportUnexpectedReaderDisconnect,
    onDidStartInstallingUpdate,
    onDidRequestReaderInput,
    onDidRequestReaderDisplayMessage,
    onDidChangePaymentStatus,
    onDidChangeConnectionStatus,
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

  const didReportUnexpectedReaderDisconnect = useCallback(
    ({ error }: { error?: StripeError }) => {
      setConnectedReader(null);
      setDiscoveredReaders([]);
      onDidReportUnexpectedReaderDisconnect?.(error);
    },
    [
      onDidReportUnexpectedReaderDisconnect,
      setConnectedReader,
      setDiscoveredReaders,
    ]
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

  useListener(REPORT_AVAILABLE_UPDATE, didReportAvailableUpdate);
  useListener(START_INSTALLING_UPDATE, didStartInstallingUpdate);
  useListener(REPORT_UPDATE_PROGRESS, didReportReaderSoftwareUpdateProgress);
  useListener(FINISH_INSTALLING_UPDATE, didFinishInstallingUpdate);

  useListener(UPDATE_DISCOVERED_READERS, didUpdateDiscoveredReaders);
  useListener(FINISH_DISCOVERING_READERS, didFinishDiscoveringReaders);
  useListener(
    REPORT_UNEXPECTED_READER_DISCONNECT,
    didReportUnexpectedReaderDisconnect
  );
  useListener(REQUEST_READER_INPUT, didRequestReaderInput);
  useListener(REQUEST_READER_DISPLAY_MESSAGE, didRequestReaderDisplayMessage);
  useListener(CHANGE_PAYMENT_STATUS, didChangePaymentStatus);
  useListener(CHANGE_CONNECTION_STATUS, didChangeConnectionStatus);

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

  const _connectBluetoothReader = useCallback(
    async (params: ConnectBluetoothReaderParams) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await connectBluetoothReader(params);

      if (response.reader && !response.error) {
        setConnectedReader(response.reader);
      }
      setLoading(false);

      return response;
    },
    [setConnectedReader, setLoading, _isInitialized]
  );

  const _connectInternetReader = useCallback(
    async (params: ConnectInternetReaderParams) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await connectInternetReader(params);

      if (response.reader) {
        setConnectedReader(response.reader);
      }
      setLoading(false);

      return response;
    },
    [setConnectedReader, setLoading, _isInitialized]
  );

  const _connectUsbReader = useCallback(
    async (params: ConnectUsbReaderParams) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await connectUsbReader(params);

      if (response.reader && !response.error) {
        setConnectedReader(response.reader);
      }
      setLoading(false);

      return response;
    },
    [_isInitialized, setConnectedReader, setLoading]
  );

  const _connectEmbeddedReader = useCallback(
    async (params: ConnectEmbeddedParams) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await connectEmbeddedReader(params);

      if (response.reader) {
        setConnectedReader(response.reader);
      }
      setLoading(false);

      return response;
    },
    [_isInitialized, setConnectedReader, setLoading]
  );

  const _connectLocalMobileReader = useCallback(
    async (params: ConnectLocalMobileParams) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await connectLocalMobileReader(params);

      if (response.reader) {
        setConnectedReader(response.reader);
      }
      setLoading(false);

      return response;
    },
    [_isInitialized, setConnectedReader, setLoading]
  );

  const _connectHandoffReader = useCallback(
    async (params: ConnectEmbeddedParams) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await connectHandoffReader(params);

      if (response.reader) {
        setConnectedReader(response.reader);
      }
      setLoading(false);

      return response;
    },
    [_isInitialized, setConnectedReader, setLoading]
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

  const _processPayment = useCallback(
    async (paymentIntentId: string) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await processPayment(paymentIntentId);

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
    async (paymentIntentId: string) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await cancelPaymentIntent(paymentIntentId);

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
    async (setupIntentId: string) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await cancelSetupIntent(setupIntentId);

      setLoading(false);

      return response;
    },
    [setLoading, _isInitialized]
  );

  const _confirmSetupIntent = useCallback(
    async (setupIntentId: string) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await confirmSetupIntent(setupIntentId);

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

  const _processRefund = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
    }
    setLoading(true);

    const response = await processRefund();

    setLoading(false);

    return response;
  }, [setLoading, _isInitialized]);

  const _clearCachedCredentials = useCallback(async () => {
    setLoading(true);

    const response = await clearCachedCredentials();

    setLoading(false);

    return response;
  }, [setLoading]);

  const _readReusableCard = useCallback(
    async (params: ReadReusableCardParamsType) => {
      if (!_isInitialized()) {
        console.error(NOT_INITIALIZED_ERROR_MESSAGE);
        throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
      }
      setLoading(true);

      const response = await readReusableCard(params);

      setLoading(false);

      return response;
    },
    [setLoading, _isInitialized]
  );

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

  const _cancelReadReusableCard = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
    }
    setLoading(true);

    const response = await cancelReadReusableCard();

    setLoading(false);

    return response;
  }, [_isInitialized, setLoading]);

  return {
    initialize: _initialize,
    discoverReaders: _discoverReaders,
    cancelDiscovering: _cancelDiscovering,
    connectBluetoothReader: _connectBluetoothReader,
    disconnectReader: _disconnectReader,
    connectInternetReader: _connectInternetReader,
    connectUsbReader: _connectUsbReader,
    createPaymentIntent: _createPaymentIntent,
    collectPaymentMethod: _collectPaymentMethod,
    retrievePaymentIntent: _retrievePaymentIntent,
    getLocations: _getLocations,
    processPayment: _processPayment,
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
    processRefund: _processRefund,
    clearCachedCredentials: _clearCachedCredentials,
    readReusableCard: _readReusableCard,
    cancelCollectPaymentMethod: _cancelCollectPaymentMethod,
    cancelCollectRefundPaymentMethod: _cancelCollectRefundPaymentMethod,
    cancelCollectSetupIntent: _cancelCollectSetupIntent,
    cancelReadReusableCard: _cancelReadReusableCard,
    connectEmbeddedReader: _connectEmbeddedReader,
    connectHandoffReader: _connectHandoffReader,
    connectLocalMobileReader: _connectLocalMobileReader,
    setSimulatedCard: _setSimulatedCard,
    emitter: emitter,
    discoveredReaders,
    connectedReader,
    isInitialized,
    loading,
  };
}
