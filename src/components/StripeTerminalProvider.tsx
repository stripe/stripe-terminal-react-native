import React, { useCallback, useState, useMemo } from 'react';
import {
  Reader,
  LogLevel,
  CommonError,
  StripeError,
  EventResult,
  PaymentStatus,
} from '../types';
import { StripeTerminalContext } from './StripeTerminalContext';
import { initialize, setConnectionToken } from '../functions';
import { useListener } from '../hooks/useListener';
import { NativeModules } from 'react-native';
import EventEmitter from 'react-native/Libraries/vendor/emitter/EventEmitter';

const {
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
  START_READER_RECONNECT,
  READER_RECONNECT_SUCCEED,
  READER_RECONNECT_FAIL,
} = NativeModules.StripeTerminalReactNative.getConstants();

const emitter = new EventEmitter();

const TOKEN_PROVIDER_ERROR_MESSAGE =
  "Couldn't fetch connection token. Please check your tokenProvider method";

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
 *  StripeTerminalProvider Component
 *
 * @example
 * ```ts
 *  <StripeTerminalProvider tokenProvider={tokenProvider}>
 *    <App />
 *  </StripeTerminalProvider>
 * ```
 * @param __namedParameters Props
 * @returns JSX.Element
 * @category ReactComponents
 */
export function StripeTerminalProvider({
  children,
  tokenProvider,
  logLevel,
}: Props) {
  const [isInitialized, setIsInitialized] = useState(false);
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

  const didReportUnexpectedReaderDisconnect = useCallback(
    ({ error }: { error?: StripeError }) => {
      log('didReportUnexpectedReaderDisconnect', error);
      emitter?.emit(REPORT_UNEXPECTED_READER_DISCONNECT, error);
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
    ({ reader }: { reader: Reader.Type }) => {
      log('didStartReaderReconnect', reader);
      emitter?.emit(START_READER_RECONNECT, reader);
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

  useListener(START_READER_RECONNECT, didStartReaderReconnect);
  useListener(READER_RECONNECT_SUCCEED, didSucceedReaderReconnect);
  useListener(READER_RECONNECT_FAIL, didFailReaderReconnect);

  const tokenProviderHandler = async () => {
    try {
      const connectionToken = await tokenProvider();

      setConnectionToken(connectionToken);
    } catch (error) {
      setConnectionToken(undefined, TOKEN_PROVIDER_ERROR_MESSAGE);

      console.error(error);
      console.error(TOKEN_PROVIDER_ERROR_MESSAGE);
    }
  };

  useListener(FETCH_TOKEN_PROVIDER, tokenProviderHandler);

  const _initialize = useCallback(async () => {
    setLoading(true);

    // test tokenProvider method since native SDK's doesn't fetch it on init
    try {
      await tokenProvider();
    } catch (error) {
      console.error(TOKEN_PROVIDER_ERROR_MESSAGE);
      console.error(error);

      return {
        error: {
          code: CommonError.Failed,
          message: TOKEN_PROVIDER_ERROR_MESSAGE,
        },
      };
    }

    const response = await initialize({ logLevel });

    if (response.error) {
      log(response.error.code, response.error.message);
    } else if (response.reader) {
      log('Connected to the reader: ', response.reader);
      setConnectedReader(response.reader);
    }

    if (!response.error) {
      setIsInitialized(true);
    }

    setLoading(false);

    return response;
  }, [logLevel, tokenProvider, log]);

  const value = useMemo(
    () => ({
      loading,
      isInitialized,
      connectedReader,
      discoveredReaders,
      setIsInitialized,
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
      isInitialized,
      connectedReader,
      discoveredReaders,
      setIsInitialized,
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
