import { useCallback, useContext } from 'react';
import type {
  DiscoverReadersParams,
  StripeError,
  Reader,
  ConnectInternetReaderParams,
  CreatePaymentIntentParams,
  ConnectBluetoothReaderParams,
  GetLocationsParams,
  Cart,
  CreateSetupIntentParams,
  CollectSetupIntentPaymentMethodParams,
  RefundParams,
  ReadReusableCardParamsType,
  PaymentStatus,
  InitParams,
} from '../types';
import {
  discoverReaders,
  cancelDiscovering,
  connectBluetoothReader,
  disconnectReader,
  connectInternetReader,
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
} from '../functions';
import { StripeTerminalContext } from '../components/StripeTerminalContext';
import { useListener } from './useListener';
import EventEmitter from 'react-native/Libraries/vendor/emitter/EventEmitter';
import { NativeModules } from 'react-native';

export const {
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

/**
 *  useStripeTerminal hook Props
 */
export type Props = {
  onUpdateDiscoveredReaders?(readers: Reader.Type[]): void;
  onFinishDiscoveringReaders?(error?: StripeError): void;
  onDidReportUnexpectedReaderDisconnect?(error?: StripeError): void;
  onDidReportAvailableUpdate?(update: Reader.SoftwareUpdate): void;
  onDidStartInstallingUpdate?(update: Reader.SoftwareUpdate): void;
  onDidReportReaderSoftwareUpdateProgress?(progress: string): void;
  onDidFinishInstallingUpdate?(update: Reader.SoftwareUpdate): void;

  onDidRequestReaderInput?(input: Reader.InputOptions[]): void;
  onDidRequestReaderDisplayMessage?(message: Reader.DisplayMessage): void;

  onDidChangeConnectionStatus?(status: Reader.ConnectionStatus): void;
  onDidChangePaymentStatus?(status: PaymentStatus): void;
};

/**
 * @ignore
 */
type EventResult<T> = {
  result: T;
};

const emitter = new EventEmitter();

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
    log,
  } = useContext(StripeTerminalContext);

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

  const didUpdateDiscoveredReaders = useCallback(
    ({ readers }: { readers: Reader.Type[] }) => {
      log('Discovered readers', readers);

      setDiscoveredReaders(readers);
      onUpdateDiscoveredReaders?.(readers);
      emitter.emit(UPDATE_DISCOVERED_READERS);
    },
    [onUpdateDiscoveredReaders, setDiscoveredReaders, log]
  );

  const didFinishDiscoveringReaders = useCallback(
    ({ result }: EventResult<{ error?: StripeError }>) => {
      if (result.error) {
        const { error } = result;
        log(
          'Discovering readers has been finished with the following error:',
          `code: ${error.code}, message: ${error.message}`
        );
      }
      onFinishDiscoveringReaders?.(result.error);
      emitter.emit(FINISH_DISCOVERING_READERS);
    },
    [onFinishDiscoveringReaders, log]
  );

  const didReportUnexpectedReaderDisconnect = useCallback(
    ({ error }: { error?: StripeError }) => {
      if (error) {
        log(`code: ${error.code}, message: ${error.message}`);
      }
      setConnectedReader(null);
      setDiscoveredReaders([]);
      onDidReportUnexpectedReaderDisconnect?.(error);
      emitter.emit(REPORT_UNEXPECTED_READER_DISCONNECT);
    },
    [
      onDidReportUnexpectedReaderDisconnect,
      log,
      setConnectedReader,
      setDiscoveredReaders,
    ]
  );

  const didReportAvailableUpdate = useCallback(
    ({ result }: EventResult<Reader.SoftwareUpdate>) => {
      log('didReportAvailableUpdate', result);
      onDidReportAvailableUpdate?.(result);
      emitter.emit(REPORT_AVAILABLE_UPDATE);
    },
    [onDidReportAvailableUpdate, log]
  );

  const didStartInstallingUpdate = useCallback(
    ({ result }: EventResult<Reader.SoftwareUpdate>) => {
      log('didStartInstallingUpdate', result);
      onDidStartInstallingUpdate?.(result);
      emitter.emit(START_INSTALLING_UPDATE);
    },
    [onDidStartInstallingUpdate, log]
  );

  const didReportReaderSoftwareUpdateProgress = useCallback(
    ({ result }: EventResult<{ progress: string }>) => {
      log('didReportReaderSoftwareUpdateProgress', result);
      onDidReportReaderSoftwareUpdateProgress?.(result.progress);
      emitter.emit(REPORT_UPDATE_PROGRESS);
    },
    [onDidReportReaderSoftwareUpdateProgress, log]
  );

  const didFinishInstallingUpdate = useCallback(
    ({ result }: EventResult<Reader.SoftwareUpdate>) => {
      log('didFinishInstallingUpdate', result);
      onDidFinishInstallingUpdate?.(result);
      emitter.emit(FINISH_INSTALLING_UPDATE);
    },
    [onDidFinishInstallingUpdate, log]
  );

  const didRequestReaderInput = useCallback(
    ({ result }: EventResult<Reader.InputOptions[]>) => {
      log('didRequestReaderInput', result);
      onDidRequestReaderInput?.(result);
      emitter.emit(REQUEST_READER_INPUT);
    },
    [onDidRequestReaderInput, log]
  );

  const didRequestReaderDisplayMessage = useCallback(
    ({ result }: EventResult<Reader.DisplayMessage>) => {
      log('didRequestReaderDisplayMessage', result);
      onDidRequestReaderDisplayMessage?.(result);
      emitter.emit(REQUEST_READER_DISPLAY_MESSAGE);
    },
    [onDidRequestReaderDisplayMessage, log]
  );

  const didChangePaymentStatus = useCallback(
    ({ result }: EventResult<PaymentStatus>) => {
      log('didChangePaymentStatus', result);
      onDidChangePaymentStatus?.(result);
      emitter.emit(CHANGE_PAYMENT_STATUS);
    },
    [onDidChangePaymentStatus, log]
  );

  const didChangeConnectionStatus = useCallback(
    ({ result }: EventResult<Reader.ConnectionStatus>) => {
      log('didChangeConnectionStatus', result);
      onDidChangeConnectionStatus?.(result);
      emitter.emit(CHANGE_CONNECTION_STATUS);
    },
    [onDidChangeConnectionStatus, log]
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

  const _discoverReaders = useCallback(
    async (params: DiscoverReadersParams) => {
      setLoading(true);
      const response = await discoverReaders(params);
      setLoading(false);

      return response;
    },
    [setLoading]
  );

  const _initialize = useCallback(
    async (params: InitParams) => {
      if (!initialize || typeof initialize !== 'function') {
        const errorMessage =
          'StripeTerminalProvider component is not found or has not been mounted properly';
        log('Failed', errorMessage);
        return {
          error: {
            code: 'Failed',
            message: errorMessage,
          },
        };
      }

      const res = initialize(params);
      return res;
    },
    [initialize, log]
  );

  const _cancelDiscovering = useCallback(async () => {
    setLoading(true);

    const response = await cancelDiscovering();

    setDiscoveredReaders([]);

    setLoading(false);

    return response;
  }, [setLoading, setDiscoveredReaders]);

  const _connectBluetoothReader = useCallback(
    async (params: ConnectBluetoothReaderParams) => {
      setLoading(true);

      const response = await connectBluetoothReader(params);

      if (response.reader && !response.error) {
        setConnectedReader(response.reader);
      }
      setLoading(false);

      return response;
    },
    [setConnectedReader, setLoading]
  );

  const _connectInternetReader = useCallback(
    async (params: ConnectInternetReaderParams) => {
      setLoading(true);

      const response = await connectInternetReader(params);

      if (response.reader) {
        setConnectedReader(response.reader);
      }
      setLoading(false);

      return response;
    },
    [setConnectedReader, setLoading]
  );

  const _disconnectReader = useCallback(async () => {
    setLoading(true);

    const response = await disconnectReader();

    if (!response.error) {
      setConnectedReader(null);
      setDiscoveredReaders([]);
    }

    setLoading(false);

    return response;
  }, [setLoading, setConnectedReader, setDiscoveredReaders]);

  const _createPaymentIntent = useCallback(
    async (params: CreatePaymentIntentParams) => {
      setLoading(true);

      const response = await createPaymentIntent(params);

      setLoading(false);

      return response;
    },
    [setLoading]
  );

  const _collectPaymentMethod = useCallback(
    async (paymentIntentId: string) => {
      setLoading(true);

      const response = await collectPaymentMethod(paymentIntentId);

      setLoading(false);

      return response;
    },
    [setLoading]
  );

  const _retrievePaymentIntent = useCallback(
    async (clientSecret: string) => {
      setLoading(true);

      const response = await retrievePaymentIntent(clientSecret);

      setLoading(false);

      return response;
    },
    [setLoading]
  );

  const _getLocations = useCallback(
    async (params: GetLocationsParams) => {
      setLoading(true);

      const response = await getLocations(params);

      setLoading(false);

      return response;
    },
    [setLoading]
  );

  const _processPayment = useCallback(
    async (paymentIntentId: string) => {
      setLoading(true);

      const response = await processPayment(paymentIntentId);

      setLoading(false);

      return response;
    },
    [setLoading]
  );

  const _createSetupIntent = useCallback(
    async (params: CreateSetupIntentParams) => {
      setLoading(true);

      const response = await createSetupIntent(params);

      setLoading(false);

      return response;
    },
    [setLoading]
  );

  const _cancelPaymentIntent = useCallback(
    async (paymentIntentId: string) => {
      setLoading(true);

      const response = await cancelPaymentIntent(paymentIntentId);

      setLoading(false);

      return response;
    },
    [setLoading]
  );

  const _installAvailableUpdate = useCallback(async () => {
    setLoading(true);

    const response = await installAvailableUpdate();

    setLoading(false);

    return response;
  }, [setLoading]);

  const _cancelInstallingUpdate = useCallback(async () => {
    setLoading(true);

    const response = await cancelInstallingUpdate();
    setLoading(false);

    return response;
  }, [setLoading]);

  const _setReaderDisplay = useCallback(
    async (cart: Cart) => {
      setLoading(true);

      const response = await setReaderDisplay(cart);
      setLoading(false);

      return response;
    },
    [setLoading]
  );

  const _retrieveSetupIntent = useCallback(
    async (clientSecret: string) => {
      setLoading(true);

      const response = await retrieveSetupIntent(clientSecret);

      setLoading(false);

      return response;
    },
    [setLoading]
  );

  const _collectSetupIntentPaymentMethod = useCallback(
    async (params: CollectSetupIntentPaymentMethodParams) => {
      setLoading(true);

      const response = await collectSetupIntentPaymentMethod(params);
      setLoading(false);

      return response;
    },
    [setLoading]
  );

  const _clearReaderDisplay = useCallback(async () => {
    setLoading(true);

    const response = await clearReaderDisplay();

    setLoading(false);

    return response;
  }, [setLoading]);

  const _cancelSetupIntent = useCallback(
    async (setupIntentId: string) => {
      setLoading(true);

      const response = await cancelSetupIntent(setupIntentId);

      setLoading(false);

      return response;
    },
    [setLoading]
  );

  const _confirmSetupIntent = useCallback(
    async (setupIntentId: string) => {
      setLoading(true);

      const response = await confirmSetupIntent(setupIntentId);

      setLoading(false);

      return response;
    },
    [setLoading]
  );

  const _simulateReaderUpdate = useCallback(
    async (update: Reader.SimulateUpdateType) => {
      setLoading(true);

      const response = await simulateReaderUpdate(update);
      setLoading(false);

      return response;
    },
    [setLoading]
  );

  const _collectRefundPaymentMethod = useCallback(
    async (params: RefundParams) => {
      setLoading(true);

      const response = await collectRefundPaymentMethod(params);

      setLoading(false);

      return response;
    },
    [setLoading]
  );

  const _processRefund = useCallback(async () => {
    setLoading(true);

    const response = await processRefund();

    setLoading(false);

    return response;
  }, [setLoading]);

  const _clearCachedCredentials = useCallback(async () => {
    setLoading(true);

    const response = await clearCachedCredentials();

    setLoading(false);

    return response;
  }, [setLoading]);

  const _readReusableCard = useCallback(
    async (params: ReadReusableCardParamsType) => {
      setLoading(true);

      const response = await readReusableCard(params);

      setLoading(false);

      return response;
    },
    [setLoading]
  );

  const _cancelCollectPaymentMethod = useCallback(async () => {
    setLoading(true);

    const response = await cancelCollectPaymentMethod();

    setLoading(false);

    return response;
  }, [setLoading]);

  const _cancelCollectSetupIntent = useCallback(async () => {
    setLoading(true);

    const response = await cancelCollectSetupIntent();

    setLoading(false);

    return response;
  }, [setLoading]);

  const _cancelReadReusableCard = useCallback(async () => {
    setLoading(true);

    const response = await cancelReadReusableCard();

    setLoading(false);

    return response;
  }, [setLoading]);

  return {
    initialize: _initialize,
    discoverReaders: _discoverReaders,
    cancelDiscovering: _cancelDiscovering,
    connectBluetoothReader: _connectBluetoothReader,
    disconnectReader: _disconnectReader,
    connectInternetReader: _connectInternetReader,
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
    cancelCollectSetupIntent: _cancelCollectSetupIntent,
    cancelReadReusableCard: _cancelReadReusableCard,
    emitter: emitter,
    discoveredReaders,
    connectedReader,
    isInitialized,
    loading,
  };
}
