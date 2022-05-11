import React, { useCallback, useRef, useState, useMemo } from 'react';
import {
  Reader,
  LogLevel,
  StripeError,
  PaymentStatus,
  UserCallbacks,
  CommonError,
} from '../types';
import { StripeTerminalContext } from './StripeTerminalContext';
import { initialize, setConnectionToken } from '../functions';
import { useListener } from '../hooks/useListener';
import { NativeModules } from 'react-native';
// @ts-ignore
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
} = NativeModules.StripeTerminalReactNative.getConstants();

const emitter = new EventEmitter();

const TOKEN_PROVIDER_ERROR_MESSAGE =
  "Couldn't fetch connection token. Please check your tokenProvider method";

/**
 * @ignore
 */
type EventResult<T> = {
  result: T;
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
  const userCallbacks = useRef<UserCallbacks>();

  const log = useCallback(
    (code: string, message?: any) => {
      if (logLevel === 'verbose') {
        console.log(`[Stripe terminal]: ${code}`, message);
      }
    },
    [logLevel]
  );

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

  const didUpdateDiscoveredReaders = useCallback(
    ({ readers }: { readers: Reader.Type[] }) => {
      log('Discovered readers', readers);

      setDiscoveredReaders(readers);
      userCallbacks.current?.onUpdateDiscoveredReaders?.(readers);
      emitter.emit(UPDATE_DISCOVERED_READERS);
    },
    [setDiscoveredReaders, log]
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
      userCallbacks.current?.onFinishDiscoveringReaders?.(result.error);
      emitter.emit(FINISH_DISCOVERING_READERS);
    },
    [log]
  );

  const didReportUnexpectedReaderDisconnect = useCallback(
    ({ error }: { error?: StripeError }) => {
      if (error) {
        log(`code: ${error.code}, message: ${error.message}`);
      }
      setConnectedReader(null);
      setDiscoveredReaders([]);
      userCallbacks.current?.onDidReportUnexpectedReaderDisconnect?.(error);
      emitter.emit(REPORT_UNEXPECTED_READER_DISCONNECT);
    },
    [log, setConnectedReader, setDiscoveredReaders]
  );

  const didReportAvailableUpdate = useCallback(
    ({ result }: EventResult<Reader.SoftwareUpdate>) => {
      log('didReportAvailableUpdate', result);
      userCallbacks.current?.onDidReportAvailableUpdate?.(result);
      emitter.emit(REPORT_AVAILABLE_UPDATE);
    },
    [log]
  );

  const didStartInstallingUpdate = useCallback(
    ({ result }: EventResult<Reader.SoftwareUpdate>) => {
      log('didStartInstallingUpdate', result);
      userCallbacks.current?.onDidStartInstallingUpdate?.(result);
      emitter.emit(START_INSTALLING_UPDATE);
    },
    [log]
  );

  const didReportReaderSoftwareUpdateProgress = useCallback(
    ({ result }: EventResult<{ progress: string }>) => {
      log('didReportReaderSoftwareUpdateProgress', result);
      userCallbacks.current?.onDidReportReaderSoftwareUpdateProgress?.(
        result.progress
      );
      emitter.emit(REPORT_UPDATE_PROGRESS);
    },
    [log]
  );

  const didFinishInstallingUpdate = useCallback(
    ({
      result,
    }: EventResult<Reader.SoftwareUpdate | { error: StripeError }>) => {
      if ((result as { error: StripeError }).error) {
        const { error } = result as { error: StripeError };
        log(
          'Install update failed with the following error:',
          `code: ${error.code}, message: ${error.message}`
        );
        userCallbacks.current?.onDidFinishInstallingUpdate?.({
          update: undefined,
          error: error,
        });
      } else {
        log('didFinishInstallingUpdate', result);
        userCallbacks.current?.onDidFinishInstallingUpdate?.({
          update: result as Reader.SoftwareUpdate,
          error: undefined,
        });
      }
      emitter.emit(FINISH_INSTALLING_UPDATE);
    },
    [log]
  );

  const didRequestReaderInput = useCallback(
    ({ result }: EventResult<Reader.InputOptions[]>) => {
      log('didRequestReaderInput', result);
      userCallbacks.current?.onDidRequestReaderInput?.(result);
      emitter.emit(REQUEST_READER_INPUT);
    },
    [log]
  );

  const didRequestReaderDisplayMessage = useCallback(
    ({ result }: EventResult<Reader.DisplayMessage>) => {
      log('didRequestReaderDisplayMessage', result);
      userCallbacks.current?.onDidRequestReaderDisplayMessage?.(result);
      emitter.emit(REQUEST_READER_DISPLAY_MESSAGE);
    },
    [log]
  );

  const didChangePaymentStatus = useCallback(
    ({ result }: EventResult<PaymentStatus>) => {
      log('didChangePaymentStatus', result);
      userCallbacks.current?.onDidChangePaymentStatus?.(result);
      emitter.emit(CHANGE_PAYMENT_STATUS);
    },
    [log]
  );

  const didChangeConnectionStatus = useCallback(
    ({ result }: EventResult<Reader.ConnectionStatus>) => {
      log('didChangeConnectionStatus', result);
      userCallbacks.current?.onDidChangeConnectionStatus?.(result);
      emitter.emit(CHANGE_CONNECTION_STATUS);
    },
    [log]
  );

  useListener(FETCH_TOKEN_PROVIDER, tokenProviderHandler);
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

  const setUserCallbacks = useCallback((callbacks: UserCallbacks) => {
    userCallbacks.current = callbacks;
  }, []);

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
      setUserCallbacks,
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
      setUserCallbacks,
    ]
  );

  return (
    <StripeTerminalContext.Provider value={value}>
      {children}
    </StripeTerminalContext.Provider>
  );
}
