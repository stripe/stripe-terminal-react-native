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
  setSimulatedCard,
  getSdkInfo,
} from '../functions';
import { StripeTerminalContext } from '../components/StripeTerminalContext';
import { useListener } from './useListener';
import { NativeModules } from 'react-native';

const { FETCH_TOKEN_PROVIDER } =
  NativeModules.StripeTerminalReactNative.getConstants();

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
    setUserCallbacks,
  } = useContext(StripeTerminalContext);

  const _isInitialized = useCallback(() => isInitialized, [isInitialized]);

  const _validateInit = useCallback(async () => {
    if (!_isInitialized()) {
      console.error(NOT_INITIALIZED_ERROR_MESSAGE);
      throw Error(NOT_INITIALIZED_ERROR_MESSAGE);
    }
  }, [_isInitialized]);

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
      _validateInit();
      setLoading(true);
      const response = await discoverReaders(params);
      setLoading(false);

      return response;
    },
    [_validateInit, setLoading]
  );

  // TODO: check why NativeEventListeners are not registering properly if there is no below fix
  useListener(FETCH_TOKEN_PROVIDER, () => null);

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

    const res = await initialize();
    return res;
  }, [initialize, log]);

  const _cancelDiscovering = useCallback(async () => {
    _validateInit();
    setLoading(true);

    const response = await cancelDiscovering();

    setDiscoveredReaders([]);

    setLoading(false);

    return response;
  }, [setLoading, setDiscoveredReaders, _validateInit]);

  const _connectBluetoothReader = useCallback(
    async (params: ConnectBluetoothReaderParams) => {
      _validateInit();
      setLoading(true);

      const response = await connectBluetoothReader(params);

      if (response.reader && !response.error) {
        setConnectedReader(response.reader);
      }
      setLoading(false);

      return response;
    },
    [setConnectedReader, setLoading, _validateInit]
  );

  const _connectInternetReader = useCallback(
    async (params: ConnectInternetReaderParams) => {
      _validateInit();
      setLoading(true);

      const response = await connectInternetReader(params);

      if (response.reader) {
        setConnectedReader(response.reader);
      }
      setLoading(false);

      return response;
    },
    [setConnectedReader, setLoading, _validateInit]
  );

  const _connectUsbReader = useCallback(
    async (params: ConnectUsbReaderParams) => {
      _validateInit();
      setLoading(true);

      const response = await connectUsbReader(params);

      if (response.reader && !response.error) {
        setConnectedReader(response.reader);
      }
      setLoading(false);

      return response;
    },
    [_validateInit, setConnectedReader, setLoading]
  );

  const _connectEmbeddedReader = useCallback(
    async (params: ConnectEmbeddedParams) => {
      _validateInit();
      setLoading(true);

      const response = await connectEmbeddedReader(params);

      if (response.reader) {
        setConnectedReader(response.reader);
      }
      setLoading(false);

      return response;
    },
    [setConnectedReader, setLoading, _validateInit]
  );

  const _connectLocalMobileReader = useCallback(
    async (params: ConnectLocalMobileParams) => {
      _validateInit();
      setLoading(true);

      const response = await connectLocalMobileReader(params);

      if (response.reader) {
        setConnectedReader(response.reader);
      }
      setLoading(false);

      return response;
    },
    [setConnectedReader, setLoading, _validateInit]
  );

  const _connectHandoffReader = useCallback(
    async (params: ConnectEmbeddedParams) => {
      _validateInit();
      setLoading(true);

      const response = await connectHandoffReader(params);

      if (response.reader) {
        setConnectedReader(response.reader);
      }
      setLoading(false);

      return response;
    },
    [setConnectedReader, setLoading, _validateInit]
  );

  const _disconnectReader = useCallback(async () => {
    _validateInit();
    setLoading(true);

    const response = await disconnectReader();

    if (!response.error) {
      setConnectedReader(null);
      setDiscoveredReaders([]);
    }

    setLoading(false);

    return response;
  }, [setLoading, setConnectedReader, setDiscoveredReaders, _validateInit]);

  const _createPaymentIntent = useCallback(
    async (params: CreatePaymentIntentParams) => {
      _validateInit();
      setLoading(true);

      const response = await createPaymentIntent(params);

      setLoading(false);

      return response;
    },
    [setLoading, _validateInit]
  );

  const _collectPaymentMethod = useCallback(
    async (paymentIntentId: string) => {
      _validateInit();
      setLoading(true);

      const response = await collectPaymentMethod(paymentIntentId);

      setLoading(false);

      return response;
    },
    [setLoading, _validateInit]
  );

  const _retrievePaymentIntent = useCallback(
    async (clientSecret: string) => {
      _validateInit();
      setLoading(true);

      const response = await retrievePaymentIntent(clientSecret);

      setLoading(false);

      return response;
    },
    [setLoading, _validateInit]
  );

  const _getLocations = useCallback(
    async (params: GetLocationsParams) => {
      _validateInit();
      setLoading(true);

      const response = await getLocations(params);

      setLoading(false);

      return response;
    },
    [setLoading, _validateInit]
  );

  const _getSdkInfo = useCallback(async () => {
    _validateInit();
    setLoading(true);

    const response = await getSdkInfo();

    setLoading(false);

    return response;
  }, [setLoading, _validateInit]);

  const _processPayment = useCallback(
    async (paymentIntentId: string) => {
      _validateInit();
      setLoading(true);

      const response = await processPayment(paymentIntentId);

      setLoading(false);

      return response;
    },
    [setLoading, _validateInit]
  );

  const _createSetupIntent = useCallback(
    async (params: CreateSetupIntentParams) => {
      _validateInit();
      setLoading(true);

      const response = await createSetupIntent(params);

      setLoading(false);

      return response;
    },
    [_validateInit, setLoading]
  );

  const _cancelPaymentIntent = useCallback(
    async (paymentIntentId: string) => {
      _validateInit();
      setLoading(true);

      const response = await cancelPaymentIntent(paymentIntentId);

      setLoading(false);

      return response;
    },
    [setLoading, _validateInit]
  );

  const _installAvailableUpdate = useCallback(async () => {
    _validateInit();
    setLoading(true);

    const response = await installAvailableUpdate();

    setLoading(false);

    return response;
  }, [setLoading, _validateInit]);

  const _cancelInstallingUpdate = useCallback(async () => {
    _validateInit();
    setLoading(true);

    const response = await cancelInstallingUpdate();
    setLoading(false);

    return response;
  }, [setLoading, _validateInit]);

  const _setReaderDisplay = useCallback(
    async (cart: Cart) => {
      _validateInit();
      setLoading(true);

      const response = await setReaderDisplay(cart);
      setLoading(false);

      return response;
    },
    [setLoading, _validateInit]
  );

  const _retrieveSetupIntent = useCallback(
    async (clientSecret: string) => {
      _validateInit();
      setLoading(true);

      const response = await retrieveSetupIntent(clientSecret);

      setLoading(false);

      return response;
    },
    [setLoading, _validateInit]
  );

  const _collectSetupIntentPaymentMethod = useCallback(
    async (params: CollectSetupIntentPaymentMethodParams) => {
      _validateInit();
      setLoading(true);

      const response = await collectSetupIntentPaymentMethod(params);
      setLoading(false);

      return response;
    },
    [setLoading, _validateInit]
  );

  const _clearReaderDisplay = useCallback(async () => {
    _validateInit();
    setLoading(true);

    const response = await clearReaderDisplay();

    setLoading(false);

    return response;
  }, [setLoading, _validateInit]);

  const _cancelSetupIntent = useCallback(
    async (setupIntentId: string) => {
      _validateInit();
      setLoading(true);

      const response = await cancelSetupIntent(setupIntentId);

      setLoading(false);

      return response;
    },
    [setLoading, _validateInit]
  );

  const _confirmSetupIntent = useCallback(
    async (setupIntentId: string) => {
      _validateInit();
      setLoading(true);

      const response = await confirmSetupIntent(setupIntentId);

      setLoading(false);

      return response;
    },
    [setLoading, _validateInit]
  );

  const _setSimulatedCard = useCallback(
    async (cardNumber: string) => {
      _validateInit();
      setLoading(true);

      const response = await setSimulatedCard(cardNumber);
      setLoading(false);

      return response;
    },
    [setLoading, _validateInit]
  );

  const _simulateReaderUpdate = useCallback(
    async (update: Reader.SimulateUpdateType) => {
      _validateInit();
      setLoading(true);

      const response = await simulateReaderUpdate(update);
      setLoading(false);

      return response;
    },
    [setLoading, _validateInit]
  );

  const _collectRefundPaymentMethod = useCallback(
    async (params: RefundParams) => {
      _validateInit();
      setLoading(true);

      const response = await collectRefundPaymentMethod(params);

      setLoading(false);

      return response;
    },
    [setLoading, _validateInit]
  );

  const _processRefund = useCallback(async () => {
    _validateInit();
    setLoading(true);

    const response = await processRefund();

    setLoading(false);

    return response;
  }, [setLoading, _validateInit]);

  const _clearCachedCredentials = useCallback(async () => {
    _validateInit();
    setLoading(true);

    const response = await clearCachedCredentials();

    setLoading(false);

    return response;
  }, [setLoading, _validateInit]);

  const _readReusableCard = useCallback(
    async (params: ReadReusableCardParamsType) => {
      _validateInit();
      setLoading(true);

      const response = await readReusableCard(params);

      setLoading(false);

      return response;
    },
    [setLoading, _validateInit]
  );

  const _cancelCollectPaymentMethod = useCallback(async () => {
    _validateInit();
    setLoading(true);

    const response = await cancelCollectPaymentMethod();

    setLoading(false);

    return response;
  }, [setLoading, _validateInit]);

  const _cancelCollectSetupIntent = useCallback(async () => {
    _validateInit();
    setLoading(true);

    const response = await cancelCollectSetupIntent();

    setLoading(false);

    return response;
  }, [_validateInit, setLoading]);

  const _cancelReadReusableCard = useCallback(async () => {
    _validateInit();
    setLoading(true);

    const response = await cancelReadReusableCard();

    setLoading(false);

    return response;
  }, [_validateInit, setLoading]);

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
    getSdkInfo: _getSdkInfo,
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
    setSimulatedCard: _setSimulatedCard,
    emitter: emitter,
    discoveredReaders,
    connectedReader,
    isInitialized,
    loading,
  };
}
