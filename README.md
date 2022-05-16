# Stripe Terminal React Native SDK (Beta)

Stripe Terminal enables you to build your own in-person checkout to accept payments in the physical world. Built on Stripe's payments network, Terminal helps you unify your online and offline payment channels. With the Stripe Terminal React Native SDK, you can connect to pre-certified card readers from your React Native app and drive a customized in-store checkout flow.

- [Getting started](#getting-started)
- [Requirements](#requirements)
  - [JS](#js)
  - [Android](#android)
  - [iOS](#ios)
- [Installation](#installation)
- [Setup](#setup)
  - [React Native CLI](#react-native-cli)
    - [iOS](#ios-1)
      - [Permissions](#permissions)
    - [Android](#android-1)
      - [Permissions](#permissions-1)
      - [Manifest](#manifest)
  - [Usage With Expo](#usage-with-expo)
    - [Android](#android-2)
      - [build.gradle](#buildgradle)
      - [Permissions](#permissions-2)
    - [iOS](#ios-2)
    - [Configuring the SDK](#configuring-the-sdk)
    - [Build](#build)
- [Example Code](#example-code)
  - [Initialization](#initialization)
  - [Hooks and Events](#hooks-and-events)
  - [Common Operations](#common-operations)
- [Additional Docs](#additional-docs)
  - [Internal Docs](#internal-docs)
- [Contributing](#contributing)

# Getting started

> Note: The below docs are not yet available and will be released as we near open beta

Get started with our [📚 integration guides](https://stripe.com/docs/terminal/payments/setup-sdk?terminal-sdk-platform=react-native) and [example project](#run-the-example-app), or [📘 browse the SDK reference](https://stripe.dev/stripe-terminal-react-native).

Updating to a newer version of the SDK? See our [changelog](https://github.com/stripe/stripe-terminal-react-native/blob/master/CHANGELOG.md).

# Requirements

## JS

- The SDK uses TypeScript features available in Babel version `7.9.0` and above.
  Alternatively use the `plugin-transform-typescript` plugin in your project.

## Android

- Android 5.0 (API level 21) and above
- compileSdkVersion = 31
- targetSdkVersion = 31

## iOS

- Compatible with apps targeting iOS 10 or above.

# Installation

```sh
yarn add @stripe/stripe-terminal-react-native
or
npm install @stripe/stripe-terminal-react-native
```
# Example Code

## Initialization

To initialize Stripe Terminal SDK in your React Native app, use the `StripeTerminalProvider` component in the root component of your application.

First, create an endpoint on your backend server that creates a new connection token via the Stripe Terminal API.

Next, create a token provider that will fetch connection token from your server and provide it to StripeTerminalProvider as a parameter.
Stripe Terminal SDK will fetch it when it's needed.

```tsx
// Root.ts
import { StripeTerminalProvider } from '@stripe/stripe-terminal-react-native';

function Root() {
  const fetchTokenProvider = async () => {
    const response = await fetch(`${API_URL}/connection_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const { secret } = await response.json();
    return secret;
  };

  return (
    <StripeTerminalProvider
      logLevel="verbose"
      tokenProvider={fetchTokenProvider}
    >
      <App />
    </StripeTerminalProvider>
  );
}
```

As a last step, simply call `initialize` method from `useStripeTerminal` hook.
Please note that `initialize` method must be called from a nested component of `StripeTerminalProvider`.

```tsx
// App.tsx
function App() {
  const { initialize } = useStripeTerminal();

  useEffect(() => {
    initialize({
      logLevel: 'verbose',
    });
  }, [initialize]);

  return <View />;
}
```

## Hooks and Events

Stripe Terminal SDK provides dedicated hook which exposes bunch of methods and props to be used within your App.
Additionally, you have access to the internal state of SDK that contains information about the current connection, discovered readers and loading state.

```tsx
// Screen.ts

import { useStripeTerminal } from '@stripe/stripe-terminal-react-native';

export default function PaymentScreen() {
  const { discoverReaders, connectedReader, discoveredReaders } =
    useStripeTerminal({
      onUpdateDiscoveredReaders: (readers) => {
        // access to discovered readers
      },
      onDidChangeConnectionStatus: (status) => {
        // access to the current connection status
      },
    });

  useEffect(() => {
    const { error } = await discoverReaders({
      discoveryMethod: 'bluetoothScan',
      simulated: true,
    });
  }, [discoverReaders]);

  return <View />;
}
```

In case your app uses `React Class Components` you can use dedicated `withStripeTerminal` Higher-Order-Component.
Please note that unlike the hooks approach, you need to use event emitter to listen on specific events that comes from SDK.

[Here](https://github.com/stripe/stripe-terminal-react-native/blob/main/src/hooks/useStripeTerminal.tsx#L51) you can find the list of available events to be used within the event emitter.

Example:

```tsx
import {
  withStripeTerminal,
  WithStripeTerminalProps,
  CHANGE_CONNECTION_STATUS,
  Reader,
  componentDidMount() {
    this.discoverReaders();

    const eventSubscription = props.emitter.addListener(
      CHANGE_CONNECTION_STATUS, // didChangeConnectionStatus
      (status: Reader.ConnectionStatus) => {
        // access to the current connection status
      }
    );
  }

  async discoverReaders() {
    this.props.discoverReaders({
      discoveryMethod: 'bluetoothScan',
      simulated,
    });
  }
}

export default withStripeTerminal(PaymentScreen);
```
# Additional Docs

- [Running the Example Application](/docs/example-applications.md)
- [Running e2e tests locally](/docs/e2e-tests.md)

# Contributing

See the [contributor guidelines](CONTRIBUTING.md) to learn how to contribute to the repository.
