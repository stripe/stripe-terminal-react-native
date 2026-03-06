import React, { useState, useCallback, useEffect } from 'react';

import {
  StripeTerminalProvider,
  AppsOnDevicesConnectionTokenProvider,
  type Location,
} from '@stripe/stripe-terminal-react-native';
import App from './App';
import { AppContext, api } from './AppContext';
import type { IAccount } from './types';
import { Api } from './api/api';
import {
  setSelectedAccount,
  getSelectedAccount,
  clearMerchantStorage,
  getServerlessAoDTestPending,
} from './util/merchantStorage';

export default function Root() {
  const [account, setAccount] = useState<IAccount | null>(null);
  const [lastSuccessfulChargeId, setLastSuccessfulChargeId] = useState<
    string | null
  >(null);
  const [lastSuccessfulPaymentIntentId, setLastSuccessfulPaymentIntentId] =
    useState<string | null>(null);
  const [lastSuccessfulPaymentClientSecret, setLastSuccessfulPaymentClientSecret] =
    useState<string | null>(null);
  const [lastSuccessfulAmount, setLastSuccessfulAmount] = useState<
    string | null
  >(null);
  const [
    autoReconnectOnUnexpectedDisconnect,
    setAutoReconnectOnUnexpectedDisconnect,
  ] = useState<boolean | false>(false);
  const [refreshToken, setRefreshToken] = useState<boolean | false>(false);

  const [cachedLocations, setCachedLocations] = useState<Location[]>([]);

  type ServerlessAoDTestState = 'loading' | 'enabled' | 'disabled';
  const [serverlessAoDTestState, setServerlessAoDTestState] = useState<ServerlessAoDTestState>('loading');

  useEffect(() => {
    // var is a string in CI
    if (process.env.IS_CI === 'true') {
      clearMerchantStorage();
    }
  }, []);

  useEffect(() => {
    const loadServerlessAoDTestPending = async () => {
      const pending = await getServerlessAoDTestPending();
      setServerlessAoDTestState(pending ? 'enabled' : 'disabled');
    };
    loadServerlessAoDTestPending();
  }, []);

  const onSelectAccount = useCallback(
    async ({ selectedAccountKey }: { selectedAccountKey: string | null }) => {
      if (!selectedAccountKey) {
        setAccount(null);
        setSelectedAccount('');
        api.setSecretKey('');
        return;
      }

      const selectedAccount = await Api.getAccount(selectedAccountKey);

      if ('error' in selectedAccount) {
        console.log(selectedAccount.error);
        return;
      }

      // update account state in context
      setAccount(selectedAccount);

      // init api
      api.setSecretKey(selectedAccountKey);

      // persist to storage
      setSelectedAccount(selectedAccount.secretKey);
    },
    []
  );

  useEffect(() => {
    const initAccount = async () => {
      const acct = await getSelectedAccount();
      onSelectAccount({ selectedAccountKey: acct });
    };

    initAccount();
  }, [onSelectAccount]);

  const fetchTokenProvider = useCallback(async (): Promise<string> => {
    if (!api) {
      return '';
    }
    const resp = await api.createConnectionToken();
    if ('error' in resp) {
      console.log('could not fetch connection token');
      return '';
    }

    return resp?.secret || '';
  }, []);

  // Wait for serverless AoD test setting to load before rendering StripeTerminalProvider
  if (serverlessAoDTestState === 'loading') {
    return null;
  }

  return (
    <AppContext.Provider
      value={{
        api,
        account,
        setAccount: onSelectAccount,
        setLastSuccessfulChargeId: (id) => setLastSuccessfulChargeId(id),
        lastSuccessfulChargeId,
        setLastSuccessfulPaymentIntentId: (id) =>
          setLastSuccessfulPaymentIntentId(id),
        lastSuccessfulPaymentIntentId,
        setLastSuccessfulAmount: (a) => setLastSuccessfulAmount(a),
        lastSuccessfulPaymentClientSecret,
        setLastSuccessfulPaymentClientSecret: (a) => setLastSuccessfulPaymentClientSecret(a),
        lastSuccessfulAmount,
        autoReconnectOnUnexpectedDisconnect,
        setAutoReconnectOnUnexpectedDisconnect: (b) =>
          setAutoReconnectOnUnexpectedDisconnect(b),
        cachedLocations,
        setCachedLocations: (locations) => setCachedLocations(locations),
        refreshToken,
        setRefreshToken: (b) => setRefreshToken(b),
        isServerlessAoDTest: serverlessAoDTestState === 'enabled',
      }}
    >
      <StripeTerminalProvider
        logLevel="verbose"
        tokenProvider={serverlessAoDTestState === 'enabled' ? AppsOnDevicesConnectionTokenProvider : fetchTokenProvider}
      >
        <App />
      </StripeTerminalProvider>
    </AppContext.Provider>
  );
}
