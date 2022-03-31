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
  InitParams,
  ConnectEmbeddedParams,
  ConnectLocalMobileParams,
  UserCallbacks,
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
} from '../functions';
import { StripeTerminalContext } from '../components/StripeTerminalContext';
import { useListener } from './useListener';
import { NativeModules } from 'react-native';

const { FETCH_TOKEN_PROVIDER } =
  NativeModules.StripeTerminalReactNative.getConstants();

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
    setUserCallbacks,
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

  setUserCallbacks({
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
  });

  const _discoverReaders = useCallback(
    async (params: DiscoverReadersParams) => {
      setLoading(true);
      const response = await discoverReaders(params);
      setLoading(false);

      return response;
    },
    [setLoading]
  );

  // TODO: check why NativeEventListeners are not registering properly if there is no below fix
  useListener(FETCH_TOKEN_PROVIDER, () => null);

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

  const _connectUsbReader = useCallback(
    async (params: ConnectUsbReaderParams) => {
      setLoading(true);

      const response = await connectUsbReader(params);

      if (response.reader && !response.error) {
        setConnectedReader(response.reader);
      }
      setLoading(false);

      return response;
    },
    [setConnectedReader, setLoading]
  );

  const _connectEmbeddedReader = useCallback(
    async (params: ConnectEmbeddedParams) => {
      setLoading(true);

      const response = await connectEmbeddedReader(params);

      if (response.reader) {
        setConnectedReader(response.reader);
      }
      setLoading(false);

      return response;
    },
    [setConnectedReader, setLoading]
  );

  const _connectLocalMobileReader = useCallback(
    async (params: ConnectLocalMobileParams) => {
      setLoading(true);

      const response = await connectLocalMobileReader(params);

      if (response.reader) {
        setConnectedReader(response.reader);
      }
      setLoading(false);

      return response;
    },
    [setConnectedReader, setLoading]
  );

  const _connectHandoffReader = useCallback(
    async (params: ConnectEmbeddedParams) => {
      setLoading(true);

      const response = await connectHandoffReader(params);

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
    cancelCollectSetupIntent: _cancelCollectSetupIntent,
    cancelReadReusableCard: _cancelReadReusableCard,
    connectEmbeddedReader: _connectEmbeddedReader,
    connectHandoffReader: _connectHandoffReader,
    connectLocalMobileReader: _connectLocalMobileReader,
    emitter: emitter,
    discoveredReaders,
    connectedReader,
    isInitialized,
    loading,
  };
}
