import React, { useState, useCallback, useEffect } from 'react';

import { StripeTerminalProvider } from '@stripe/stripe-terminal-react-native';
import App from './App';
import { AppContext, api } from './AppContext';
import type { IAccount } from './types';
import { Api } from './api/api';
import {
  setSelectedAccount,
  getSelectedAccount,
  clearMerchantStorage,
} from './util/merchantStorage';

export default function Root() {
  const [account, setAccount] = useState<IAccount | null>(null);
  const [lastSuccessfulChargeId, setLastSuccessfulChargeId] = useState<
    string | null
  >(null);

  useEffect(() => {
    // var is a string in CircleCI
    if (process.env.IS_CI === 'true') {
      clearMerchantStorage();
    }
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

  const fetchTokenProvider = async (): Promise<string> => {
    if (!api) {
      return '';
    }
    const resp = await api.createConnectionToken();

    if ('error' in resp) {
      console.log('could not fetch connection token');
      return '';
    }

    return resp?.secret || '';
  };

  return (
    <AppContext.Provider
      value={{
        api,
        account,
        setAccount: onSelectAccount,
        setLastSuccessfulChargeId: (id) => setLastSuccessfulChargeId(id),
        lastSuccessfulChargeId,
      }}
    >
      <StripeTerminalProvider
        logLevel="verbose"
        tokenProvider={fetchTokenProvider}
      >
        <App />
      </StripeTerminalProvider>
    </AppContext.Provider>
  );
}
