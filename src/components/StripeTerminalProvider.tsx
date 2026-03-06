import React, { useCallback, useState, useMemo, useRef } from 'react';
import {
  type Reader,
  type LogLevel,
  type InitParams,
  type EventResult,
  type PaymentStatus,
  type OfflineStatus,
  type PaymentIntent,
  type ReaderEvent,
} from '../types';
import type { StripeError } from '../types/StripeError';
import { StripeTerminalContext } from './StripeTerminalContext';
import { initialize, setConnectionToken } from '../functions';
import { useListener } from '../hooks/useListener';
import { NativeModules } from 'react-native';
import EventEmitter from 'react-native/Libraries/vendor/emitter/EventEmitter';
import { createStripeError } from '../Errors/StripeErrorHelpers';
import { ErrorCode } from '../Errors/ErrorCodes';

const {
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

const emitter = new EventEmitter();

const TOKEN_PROVIDER_ERROR_MESSAGE =
  "Couldn't fetch connection token. Please check your tokenProvider method";

/**
 * When using the Stripe Terminal SDK to build Apps on Devices that run on Stripe readers,
 * the AppsOnDevicesConnectionTokenProvider can be used to obtain connection tokens without
 * contacting your backend server.
 *
 * This feature is in private preview and only available on Android.
 * Contact Stripe support to enable this feature on your account.
 *
 * @example
 * ```ts
 * import { AppsOnDevicesConnectionTokenProvider } from '@stripe/stripe-terminal-react-native';
 * <StripeTerminalProvider tokenProvider={AppsOnDevicesConnectionTokenProvider}>
 *   <App />
 * </StripeTerminalProvider>
 * ```
 */
export const AppsOnDevicesConnectionTokenProvider = async (): Promise<string> => {
  throw new Error(
    'Potential misconfiguration detected. Please check your integration.'
  );
};

// Helper: Initialize for serverless Apps-on-Devices mode
const initializeWithServerlessAppsOnDevices = async (initParams: InitParams) => {
  return initialize({ initParams, useAppsOnDevicesConnectionTokenProvider: true });
};

// Helper: Initialize with standard token provider
const initializeWithTokenProvider = async (
  initParams: InitParams,
  tokenProvider: () => Promise<string>
) => {
  try {
    await tokenProvider();
  } catch (error) {
    console.error(TOKEN_PROVIDER_ERROR_MESSAGE);
    console.error(error);
    return {
      error: createStripeError({
        code: ErrorCode.CONNECTION_TOKEN_PROVIDER_ERROR,
        message: TOKEN_PROVIDER_ERROR_MESSAGE,
      }),
    };
  }

  const result = await initialize({
    initParams,
    useAppsOnDevicesConnectionTokenProvider: false,
  });
  return result;
};

/**
 *  StripeTerminalProvider Component Props
 */
export interface Props {
  children: React.ReactElement | React.ReactElement[];
  /*
   You must set a token provider before calling any Stripe terminal method.
   This should fetch a connection token from your server and return it as a string.
    * @example
    * ```ts
    * const fetchTokenProvider = async () => {
    *   const response = await fetch('http://api_url/connection_token');
    *   const { secret } = await response.json();
    *   return secret;
    * };
    * ```
   */
  tokenProvider: () => Promise<string>;
  logLevel?: LogLevel;
}

/**
 * StripeTerminalProvider Component
 *
 * @example
 * ```ts
 * // Using a custom token provider (standard setup)
 * <StripeTerminalProvider tokenProvider={fetchTokenProvider}>
 *   <App />
 * </StripeTerminalProvider>
 *
 * // Using Apps-on-Devices serverless mode (Android only, on Stripe smart readers)
 * import { AppsOnDevicesConnectionTokenProvider } from '@stripe/stripe-terminal-react-native';
 * <StripeTerminalProvider tokenProvider={AppsOnDevicesConnectionTokenProvider}>
 *   <App />
 * </StripeTerminalProvider>
 * ```
 * @param __namedParameters Props
 * @returns React.JSX.Element
 * @category ReactComponents
 */
export function StripeTerminalProvider({
  children,
  tokenProvider,
  logLevel,
}: Props) {
  // Detect if using Apps-on-Devices mode by checking if the sentinel function was passed
  const isAppsOnDevicesMode = tokenProvider === AppsOnDevicesConnectionTokenProvider;
  const isInitializedRef = useRef(false);
  const getIsInitialized = useCallback(() => isInitializedRef.current, []);
  const [loading, setLoading] = useState(true);
  const [connectedReader, setConnectedReader] = useState<Reader.Type | null>();
  const [discoveredReaders, setDiscoveredReaders] = useState<Reader.Type[]>([]);

  const log = useCallback(
    (code: string, message?: any) => {
      if (logLevel === 'verbose') {
        console.log(`[Stripe terminal]: ${code}`, message);
      }
    },
    [logLevel]
  );

  const didUpdateDiscoveredReaders = useCallback(
    ({ readers }: { readers: Reader.Type[] }) => {
      log('didUpdateDiscoveredReaders', readers);
      emitter?.emit(UPDATE_DISCOVERED_READERS, readers);
    },
    [log]
  );

  const didFinishDiscoveringReaders = useCallback(
    ({ result }: EventResult<{ error?: StripeError }>) => {
      log('didFinishDiscoveringReaders', result);
      emitter?.emit(FINISH_DISCOVERING_READERS, result.error);
    },
    [log]
  );

  const didReportAvailableUpdate = useCallback(
    ({ result }: EventResult<Reader.SoftwareUpdate>) => {
      log('didReportAvailableUpdate', result);
      emitter?.emit(REPORT_AVAILABLE_UPDATE, result);
    },
    [log]
  );

  const didStartInstallingUpdate = useCallback(
    ({ result }: EventResult<Reader.SoftwareUpdate>) => {
      log('didStartInstallingUpdate', result);
      emitter?.emit(START_INSTALLING_UPDATE, result);
    },
    [log]
  );

  const didReportReaderSoftwareUpdateProgress = useCallback(
    ({ result }: EventResult<{ progress: string }>) => {
      log('didReportReaderSoftwareUpdateProgress', result);
      emitter?.emit(REPORT_UPDATE_PROGRESS, result.progress);
    },
    [log]
  );

  const didFinishInstallingUpdate = useCallback(
    ({
      result,
    }: EventResult<Reader.SoftwareUpdate | { error: StripeError }>) => {
      log('didFinishInstallingUpdate', result);
      emitter?.emit(FINISH_INSTALLING_UPDATE, result);
    },
    [log]
  );

  const didRequestReaderInput = useCallback(
    ({ result }: EventResult<Reader.InputOptions[]>) => {
      log('didRequestReaderInput', result);
      emitter?.emit(REQUEST_READER_INPUT, result);
    },
    [log]
  );

  const didRequestReaderDisplayMessage = useCallback(
    ({ result }: EventResult<Reader.DisplayMessage>) => {
      log('didRequestReaderDisplayMessage', result);
      emitter?.emit(REQUEST_READER_DISPLAY_MESSAGE, result);
    },
    [log]
  );

  const didChangePaymentStatus = useCallback(
    ({ result }: EventResult<PaymentStatus>) => {
      log('didChangePaymentStatus', result);
      emitter?.emit(CHANGE_PAYMENT_STATUS, result);
    },
    [log]
  );

  const didChangeConnectionStatus = useCallback(
    ({ result }: EventResult<Reader.ConnectionStatus>) => {
      log('didChangeConnectionStatus', result);
      emitter?.emit(CHANGE_CONNECTION_STATUS, result);
    },
    [log]
  );

  const didStartReaderReconnect = useCallback(
    ({ reason }: { reason: Reader.DisconnectReason }) => {
      log('didStartReaderReconnect', reason);
      emitter?.emit(START_READER_RECONNECT, reason);
    },
    [log]
  );

  const didSucceedReaderReconnect = useCallback(
    ({ reader }: { reader: Reader.Type }) => {
      log('didSucceedReaderReconnect');
      emitter?.emit(READER_RECONNECT_SUCCEED, reader);
    },
    [log]
  );

  const didFailReaderReconnect = useCallback(
    ({ error }: { error?: StripeError }) => {
      log('didFailReaderReconnect');
      emitter?.emit(READER_RECONNECT_FAIL, error);
    },
    [log]
  );

  const didChangeOfflineStatus = useCallback(
    ({ result }: { result?: OfflineStatus }) => {
      log('didChangeOfflineStatus', result);
      emitter?.emit(CHANGE_OFFLINE_STATUS, result);
    },
    [log]
  );

  const didForwardPaymentIntent = useCallback(
    ({ result, error }: { result: PaymentIntent.Type; error: StripeError }) => {
      log('didForwardPaymentIntent', { ...result, ...error });
      emitter?.emit(FORWARD_PAYMENT_INTENT, result, error);
    },
    [log]
  );

  const didReportForwardingError = useCallback(
    ({ error }: { error?: StripeError }) => {
      log('didReportForwardingError', error);
      emitter?.emit(REPORT_FORWARDING_ERROR, error);
    },
    [log]
  );

  const didDisconnect = useCallback(
    ({ reason }: { reason?: Reader.DisconnectReason }) => {
      log('didDisconnect', reason);
      emitter?.emit(DISCONNECT, reason);
    },
    [log]
  );

  const didUpdateBatteryLevel = useCallback(
    ({ result }: { result?: Reader.BatteryLevel }) => {
      log('didUpdateBatteryLevel', result);
      emitter?.emit(UPDATE_BATTERY_LEVEL, result);
    },
    [log]
  );

  const didReportLowBatteryWarning = useCallback(
    ({ result }: { result?: string }) => {
      log('didReportLowBatteryWarning', result);
      emitter?.emit(REPORT_LOW_BATTERY_WARNING, result);
    },
    [log]
  );

  const didReportReaderEvent = useCallback(
    ({ result }: EventResult<ReaderEvent>) => {
      log('didReportReaderEvent', result);
      emitter?.emit(REPORT_READER_EVENT, result);
    },
    [log]
  );

  const didAcceptTermsOfService = useCallback(() => {
    log('didAcceptTermsOfService');
    emitter?.emit(ACCEPT_TERMS_OF_SERVICE);
  }, [log]);

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
  useListener(ACCEPT_TERMS_OF_SERVICE, didAcceptTermsOfService);

  const tokenProviderHandler = async () => {
    try {
      const connectionToken = await tokenProvider();

      setConnectionToken(connectionToken, undefined);
    } catch (error) {
      setConnectionToken(undefined, TOKEN_PROVIDER_ERROR_MESSAGE);

      console.error(error);
      console.error(TOKEN_PROVIDER_ERROR_MESSAGE);
    }
  };

  useListener(FETCH_TOKEN_PROVIDER, tokenProviderHandler);

  const _initialize = useCallback(async () => {
    const initParams: InitParams = { logLevel };

    setLoading(true);
    log('initialize', `tokenProvider mode: ${isAppsOnDevicesMode ? 'AppsOnDevicesConnectionTokenProvider' : 'StandardConnectionTokenProvider'}`);

    const response = isAppsOnDevicesMode
      ? await initializeWithServerlessAppsOnDevices(initParams)
      : await initializeWithTokenProvider(initParams, tokenProvider);

    if (response.error) {
      log(response.error.code, response.error.message);
    } else {
      if (response.reader) {
        log('Connected to the reader: ', response.reader);
        setConnectedReader(response.reader);
      }
      isInitializedRef.current = true;
    }

    setLoading(false);

    return response;
  }, [logLevel, isAppsOnDevicesMode, tokenProvider, log]);

  const value = useMemo(
    () => ({
      loading,
      isInitialized: isInitializedRef.current,
      getIsInitialized,
      connectedReader,
      discoveredReaders,
      setLoading,
      setConnectedReader,
      setDiscoveredReaders,
      log,
      initialize: _initialize,
      emitter,
    }),
    [
      _initialize,
      loading,
      getIsInitialized,
      connectedReader,
      discoveredReaders,
      setLoading,
      setConnectedReader,
      setDiscoveredReaders,
      log,
    ]
  );

  return (
    <StripeTerminalContext.Provider value={value}>
      {children}
    </StripeTerminalContext.Provider>
  );
}
