import React, { useCallback, useState, useMemo, useRef } from 'react';
import {
  type Reader,
  type LogLevel,
  type InitParams,
  type LocaleConfig,
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
import { createInternalStripeError } from '../Errors/StripeErrorHelpers';
import { ErrorCode } from '../Errors/ErrorCodes';
import Logger from '../logger';

const {
  FETCH_TOKEN_PROVIDER,
  CHANGE_CONNECTION_STATUS,
  CHANGE_PAYMENT_STATUS,
  FINISH_DISCOVERING_READERS,
  FINISH_INSTALLING_UPDATE,
  REQUEST_READER_DISPLAY_MESSAGE,
  REQUEST_READER_INPUT,
  REPORT_AVAILABLE_UPDATE,
  UPDATE_REQUIREMENTS_AVAILABLE,
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
 * This feature is currently in development and is not yet available for use. To express interest
 * in the private preview, contact your Stripe account team.
 *
 * @example
 * ```ts
 * import { AppsOnDevicesConnectionTokenProvider } from '@stripe/stripe-terminal-react-native';
 * <StripeTerminalProvider
 *   tokenProvider={AppsOnDevicesConnectionTokenProvider}
 *   localeConfig={{ type: 'cardLanguagePreferenceIfAvailable' }}
 * >
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
  } catch {
    console.error(TOKEN_PROVIDER_ERROR_MESSAGE);
    return {
      error: createInternalStripeError(
        {
          code: ErrorCode.CONNECTION_TOKEN_PROVIDER_ERROR,
          message: TOKEN_PROVIDER_ERROR_MESSAGE,
        },
        'rn'
      ),
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
  localeConfig: LocaleConfig;
}

/**
 * StripeTerminalProvider Component
 *
 * @example
 * ```ts
 * // Using a custom token provider (standard setup)
 * <StripeTerminalProvider
 *   tokenProvider={fetchTokenProvider}
 *   localeConfig={{ type: 'cardLanguagePreferenceIfAvailable' }}
 * >
 *   <App />
 * </StripeTerminalProvider>
 *
 * // Using Apps-on-Devices serverless mode (Android only, on Stripe smart readers)
 * import { AppsOnDevicesConnectionTokenProvider } from '@stripe/stripe-terminal-react-native';
 * <StripeTerminalProvider
 *   tokenProvider={AppsOnDevicesConnectionTokenProvider}
 *   localeConfig={{ type: 'cardLanguagePreferenceIfAvailable' }}
 * >
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
  localeConfig,
}: Props) {
  // Detect if using Apps-on-Devices mode by checking if the sentinel function was passed
  const isAppsOnDevicesMode = tokenProvider === AppsOnDevicesConnectionTokenProvider;
  const isInitializedRef = useRef(false);
  const getIsInitialized = useCallback(() => isInitializedRef.current, []);
  const [loading, setLoading] = useState(true);
  const [connectedReader, setConnectedReader] = useState<Reader.Type | null>();
  const [discoveredReaders, setDiscoveredReaders] = useState<Reader.Type[]>([]);

  const log = useCallback(
    (code: string) => {
      if (logLevel === 'verbose') {
        console.log(`[Stripe terminal] ${code}`);
      }
    },
    [logLevel]
  );

  const didUpdateDiscoveredReaders = useCallback(
    ({ readers }: { readers: Reader.Type[] }) => {
      log('didUpdateDiscoveredReaders');
      emitter?.emit(UPDATE_DISCOVERED_READERS, readers);
    },
    [log]
  );

  const didFinishDiscoveringReaders = useCallback(
    ({ result }: EventResult<{ error?: StripeError }>) => {
      log('didFinishDiscoveringReaders');
      // result.error is already rehydrated by useListener when present
      emitter?.emit(FINISH_DISCOVERING_READERS, result.error);
    },
    [log]
  );

  const didReportAvailableUpdate = useCallback(
    ({ result }: EventResult<Reader.SoftwareUpdate>) => {
      log('didReportAvailableUpdate');
      emitter?.emit(REPORT_AVAILABLE_UPDATE, result);
    },
    [log]
  );

  const didUpdateRequirementsAvailable = useCallback(
    ({ result }: EventResult<Reader.TapToPayUpdateRequirement[]>) => {
      log('didUpdateRequirementsAvailable');
      emitter?.emit(UPDATE_REQUIREMENTS_AVAILABLE, result);
    },
    [log]
  );

  const didStartInstallingUpdate = useCallback(
    ({
      result,
      reader,
    }: {
      result: Reader.SoftwareUpdate;
      reader?: Reader.Type;
    }) => {
      log('didStartInstallingUpdate');
      emitter?.emit(START_INSTALLING_UPDATE, result, reader);
    },
    [log]
  );

  const didReportReaderSoftwareUpdateProgress = useCallback(
    ({ result }: EventResult<{ progress: number }>) => {
      log('didReportReaderSoftwareUpdateProgress');
      emitter?.emit(REPORT_UPDATE_PROGRESS, result.progress);
    },
    [log]
  );

  const didFinishInstallingUpdate = useCallback(
    ({
      result,
      error,
    }: {
      result?: Reader.SoftwareUpdate;
      error?: StripeError;
    }) => {
      log('didFinishInstallingUpdate');
      emitter?.emit(FINISH_INSTALLING_UPDATE, result, error);
    },
    [log]
  );

  const didRequestReaderInput = useCallback(
    ({ result }: EventResult<Reader.InputOptions[]>) => {
      log('didRequestReaderInput');
      emitter?.emit(REQUEST_READER_INPUT, result);
    },
    [log]
  );

  const didRequestReaderDisplayMessage = useCallback(
    ({ result }: EventResult<Reader.DisplayMessage>) => {
      log('didRequestReaderDisplayMessage');
      emitter?.emit(REQUEST_READER_DISPLAY_MESSAGE, result);
    },
    [log]
  );

  const didChangePaymentStatus = useCallback(
    ({ result }: EventResult<PaymentStatus>) => {
      log('didChangePaymentStatus');
      emitter?.emit(CHANGE_PAYMENT_STATUS, result);
    },
    [log]
  );

  const didChangeConnectionStatus = useCallback(
    ({ result }: EventResult<Reader.ConnectionStatus>) => {
      log('didChangeConnectionStatus');
      emitter?.emit(CHANGE_CONNECTION_STATUS, result);
    },
    [log]
  );

  const didStartReaderReconnect = useCallback(
    ({
      reader,
      reason,
    }: {
      reader: Reader.Type;
      reason: Reader.DisconnectReason;
    }) => {
      log('didStartReaderReconnect');
      emitter?.emit(START_READER_RECONNECT, reader, reason);
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
    ({ reader }: { reader: Reader.Type }) => {
      log('didFailReaderReconnect');
      emitter?.emit(READER_RECONNECT_FAIL, reader);
    },
    [log]
  );

  const didChangeOfflineStatus = useCallback(
    ({ result }: { result?: OfflineStatus }) => {
      log('didChangeOfflineStatus');
      emitter?.emit(CHANGE_OFFLINE_STATUS, result);
    },
    [log]
  );

  const didForwardPaymentIntent = useCallback(
    ({ result, error }: { result: PaymentIntent.Type; error?: StripeError }) => {
      log('didForwardPaymentIntent');
      emitter?.emit(FORWARD_PAYMENT_INTENT, result, error);
    },
    [log]
  );

  const didReportForwardingError = useCallback(
    ({ result }: { result: { error: StripeError } }) => {
      const error = result.error;
      log('didReportForwardingError');
      emitter?.emit(REPORT_FORWARDING_ERROR, error);
    },
    [log]
  );

  const didDisconnect = useCallback(
    ({ reason }: { reason: Reader.DisconnectReason }) => {
      log('didDisconnect');
      emitter?.emit(DISCONNECT, reason);
    },
    [log]
  );

  const didUpdateBatteryLevel = useCallback(
    ({ result }: { result?: Reader.BatteryLevel }) => {
      log('didUpdateBatteryLevel');
      emitter?.emit(UPDATE_BATTERY_LEVEL, result);
    },
    [log]
  );

  const didReportLowBatteryWarning = useCallback(
    ({ result }: { result?: string }) => {
      log('didReportLowBatteryWarning');
      emitter?.emit(REPORT_LOW_BATTERY_WARNING, result);
    },
    [log]
  );

  const didReportReaderEvent = useCallback(
    ({ result }: EventResult<ReaderEvent>) => {
      log('didReportReaderEvent');
      emitter?.emit(REPORT_READER_EVENT, result);
    },
    [log]
  );

  const didAcceptTermsOfService = useCallback(() => {
    log('didAcceptTermsOfService');
    emitter?.emit(ACCEPT_TERMS_OF_SERVICE);
  }, [log]);

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
  useListener(REPORT_FORWARDING_ERROR, didReportForwardingError);

  useListener(DISCONNECT, didDisconnect);

  useListener(UPDATE_BATTERY_LEVEL, didUpdateBatteryLevel);
  useListener(REPORT_LOW_BATTERY_WARNING, didReportLowBatteryWarning);
  useListener(REPORT_READER_EVENT, didReportReaderEvent);
  useListener(ACCEPT_TERMS_OF_SERVICE, didAcceptTermsOfService);

  const tokenProviderHandler = useCallback(async () => {
    try {
      const connectionToken = await tokenProvider();

      setConnectionToken(connectionToken, undefined);
    } catch {
      setConnectionToken(undefined, TOKEN_PROVIDER_ERROR_MESSAGE);

      console.error(TOKEN_PROVIDER_ERROR_MESSAGE);
    }
  }, [tokenProvider]);

  useListener(FETCH_TOKEN_PROVIDER, tokenProviderHandler);

  const _initialize = useCallback(async () => {
    const initParams: InitParams = { logLevel, localeConfig };

    setLoading(true);
    log('initialize');

    const response = await Logger.traceSdkMethod(async () => {
      return isAppsOnDevicesMode
        ? initializeWithServerlessAppsOnDevices(initParams)
        : initializeWithTokenProvider(initParams, tokenProvider);
    }, 'initialize')();

    if (response.error) {
      log(response.error.code);
    } else {
      if (response.reader) {
        log('Connected to the reader');
        setConnectedReader(response.reader);
      }
      isInitializedRef.current = true;
    }

    setLoading(false);

    return response;
  }, [logLevel, localeConfig, isAppsOnDevicesMode, tokenProvider, log]);

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
