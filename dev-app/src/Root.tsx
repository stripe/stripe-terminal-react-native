import React, { useState, useCallback, useEffect } from 'react';

import {
  StripeTerminalProvider,
  AppsOnDevicesConnectionTokenProvider,
  type LocaleConfig,
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
  getLocaleConfig,
  setLocaleConfig as setStoredLocaleConfig,
  getPendingLocaleConfig,
  setPendingLocaleConfig,
  clearPendingLocaleConfig,
} from './util/merchantStorage';
import { FALLBACK_HARDCODED_LOCALE } from './util/localeConfig';

const DEFAULT_LOCALE_CONFIG: LocaleConfig = {
  type: 'cardLanguagePreferenceIfAvailable',
};

export default function Root() {
  const [account, setAccount] = useState<IAccount | null>(null);
  const [accountLoaded, setAccountLoaded] = useState<boolean>(false);
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
  const [activeLocaleConfig, setActiveLocaleConfigState] =
    useState<LocaleConfig | null>(null);
  const [localeConfig, setLocaleConfigState] = useState<LocaleConfig | null>(
    null
  );
  const [pendingLocaleConfig, setPendingLocaleConfigState] =
    useState<LocaleConfig | null>(null);

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

  useEffect(() => {
    const loadLocaleConfig = async () => {
      const storedLocaleConfig = await getLocaleConfig();
      const storedPendingLocaleConfig = await getPendingLocaleConfig();
      const loadedLocaleConfig = storedLocaleConfig ?? DEFAULT_LOCALE_CONFIG;

      setActiveLocaleConfigState(storedPendingLocaleConfig ?? loadedLocaleConfig);
      setLocaleConfigState(loadedLocaleConfig);
      setPendingLocaleConfigState(storedPendingLocaleConfig);
    };
    loadLocaleConfig();
  }, []);

  const setLocaleConfig = useCallback(async (nextLocaleConfig: LocaleConfig) => {
    setPendingLocaleConfigState(nextLocaleConfig);
    await setPendingLocaleConfig(nextLocaleConfig);
  }, []);

  const onStripeTerminalInitialized = useCallback(
    async (success: boolean) => {
      if (pendingLocaleConfig == null) {
        return false;
      }

      await clearPendingLocaleConfig();

      if (success) {
        setLocaleConfigState(pendingLocaleConfig);
        setActiveLocaleConfigState(pendingLocaleConfig);
        await setStoredLocaleConfig(pendingLocaleConfig);
        setPendingLocaleConfigState(null);
        return false;
      }

      const fallbackConfig: LocaleConfig = {
        type: 'hardcoded',
        locale: FALLBACK_HARDCODED_LOCALE,
      };

      setLocaleConfigState(fallbackConfig);
      setActiveLocaleConfigState(fallbackConfig);
      await setStoredLocaleConfig(fallbackConfig);
      setPendingLocaleConfigState(null);
      return true;
    },
    [pendingLocaleConfig]
  );

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
      try {
        const acct = await getSelectedAccount();
        await onSelectAccount({ selectedAccountKey: acct });
      } finally {
        setAccountLoaded(true);
      }
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
  if (
    serverlessAoDTestState === 'loading' ||
    activeLocaleConfig == null ||
    localeConfig == null ||
    !accountLoaded
  ) {
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
        localeConfig,
        setLocaleConfig,
        onStripeTerminalInitialized,
      }}
    >
      <StripeTerminalProvider
        logLevel="verbose"
        localeConfig={activeLocaleConfig}
        tokenProvider={serverlessAoDTestState === 'enabled' ? AppsOnDevicesConnectionTokenProvider : fetchTokenProvider}
      >
        <App />
      </StripeTerminalProvider>
    </AppContext.Provider>
  );
}
