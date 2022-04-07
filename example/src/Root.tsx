import React, { useState, useCallback } from 'react';

import { StripeTerminalProvider } from 'stripe-terminal-react-native';
import App from './App';
// import { API_URL } from './Config';
import { AppContext } from './AppContext';
import type { IAccount } from './types';
import { ClientApi } from './api/client-api';
import { setSelectedAccount } from './util/merchantStorage';

const api = new ClientApi();

export default function Root() {
  const [account, setAccount] = useState<IAccount | null>(null);

  const onSelectAccount = useCallback(
    async ({ selectedAccountKey }: { selectedAccountKey: string | null }) => {
      if (!selectedAccountKey) {
        setAccount(null);
        setSelectedAccount('');
        return;
      }

      const selectedAccount = await ClientApi.getAccount(selectedAccountKey);

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

  const fetchTokenProvider = async (): Promise<string> => {
    if (!api) {
      return '';
    }
    const resp = await api.createConnectionToken();

    if ('error' in resp) {
      console.log('could not fetch connection token');
      return '';
    }

    console.log(resp);

    return resp?.secret || '';
  };

  return (
    <AppContext.Provider
      value={{
        api,
        account,
        setAccount: onSelectAccount,
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
