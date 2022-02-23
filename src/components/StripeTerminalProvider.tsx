import React, { useCallback, useState } from 'react';
import type { Reader, InitParams, LogLevel } from '../types';
import { StripeTerminalContext } from './StripeTerminalContext';
import { initialize, setConnectionToken } from '../functions';
import { useListener } from '../hooks/useListener';

const FETCH_TOKEN_PROVIDER_LISTENER_NAME = 'onFetchTokenProviderListener';

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

  const tokenProviderHandler = async () => {
    try {
      const connectionToken = await tokenProvider();

      setConnectionToken(connectionToken);
    } catch (error) {
      const errorMessage =
        "Couldn't fetch connection token. Please check your tokenProvider method";

      setConnectionToken(undefined, errorMessage);

      console.error(error);
      console.error(errorMessage);
    }
  };

  useListener(FETCH_TOKEN_PROVIDER_LISTENER_NAME, tokenProviderHandler);

  const _initialize = useCallback(
    async (params: InitParams) => {
      setLoading(true);

      const response = await initialize(params);

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
    },
    [setLoading, setConnectedReader, setIsInitialized, log]
  );

  return (
    <StripeTerminalContext.Provider
      value={{
        loading,
        isInitialized,
        connectedReader,
        discoveredReaders,
        setIsInitialized,
        setLoading: (value) => {
          setLoading(value);
        },
        setConnectedReader: (value) => {
          setConnectedReader(value);
        },
        setDiscoveredReaders: (values) => {
          setDiscoveredReaders(values);
        },
        log,
        initialize: _initialize,
      }}
    >
      {children}
    </StripeTerminalContext.Provider>
  );
}
