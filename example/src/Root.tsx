import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet } from 'react-native';

import { StripeTerminalProvider } from 'stripe-terminal-react-native';
import App from './App';
import { API_URL } from './Config';

export default function Root() {
  const [initialized, setInitialized] = useState(false);

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
        setInitialized(true);
      } catch (error) {
        console.error(error);
        Alert.alert("Couldn't fetch connection token!");
      }
    }
    init();
  }, []);

  return (
    <StripeTerminalProvider
      logLevel="verbose"
      tokenProvider={fetchTokenProvider}
    >
      {initialized ? (
        <App />
      ) : (
        <ActivityIndicator style={StyleSheet.absoluteFillObject} />
      )}
    </StripeTerminalProvider>
  );
}
