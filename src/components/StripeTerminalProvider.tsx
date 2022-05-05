import React, { useCallback, useState, useMemo } from 'react';
import { Reader, LogLevel, CommonError } from '../types';
import { StripeTerminalContext } from './StripeTerminalContext';
import { initialize, setConnectionToken } from '../functions';
import { useListener } from '../hooks/useListener';
import { NativeModules } from 'react-native';
// @ts-ignore
import EventEmitter from 'react-native/Libraries/vendor/emitter/EventEmitter';

const { FETCH_TOKEN_PROVIDER, LOG_INFO } =
  NativeModules.StripeTerminalReactNative.getConstants();

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

  useListener(
    LOG_INFO,
    ({ data, message }: { data?: Record<string, any>; message: string }) => {
      log(message, data);
    }
  );

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
