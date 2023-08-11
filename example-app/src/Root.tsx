import React, { useState, useCallback } from 'react';

import { StripeTerminalProvider } from '@stripe/stripe-terminal-react-native';
import App from './App';
import { AppContext, api } from './AppContext';

export default function Root() {
  const [lastSuccessfulChargeId, setLastSuccessfulChargeId] = useState<
    string | null
  >(null);

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

  return (
    <AppContext.Provider
      value={{
        api,
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
