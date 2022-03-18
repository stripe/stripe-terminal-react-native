import React, { useEffect } from 'react';

import { StripeTerminalProvider } from 'stripe-terminal-react-native';
import App from './App';
import { API_URL } from './Config';

export default function Root() {
  const fetchTokenProvider = async () => {
    const response = await fetch(`${API_URL}/connection_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const { secret } = await response.json();
    return secret;
  };

  useEffect(() => {
    // test connection_token endpoint since native SDK's doesn't fetch it on init
    async function init() {
      try {
        await fetchTokenProvider();
      } catch (error) {
        console.error("Couldn't fetch connection token!");
      }
    }
    init();
  }, []);

  return (
    <StripeTerminalProvider
      logLevel="verbose"
      tokenProvider={fetchTokenProvider}
    >
      <App />
    </StripeTerminalProvider>
  );
}
