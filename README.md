# Stripe Terminal React Native SDK (Public preview)

Stripe Terminal enables you to build your own in-person checkout to accept payments in the physical world. Built on Stripe's payments network, Terminal helps you unify your online and offline payment channels. With the Stripe Terminal React Native SDK, you can connect to pre-certified card readers from your React Native app and drive a customized in-store checkout flow.

- [Getting started](#getting-started)
- [Requirements](#requirements)
  - [JS](#js)
  - [Android](#android)
  - [iOS](#ios)
- [Try the example app](#try-the-example-app)
- [Installation](#installation)
- [Example code](#example-code)
  - [Initialization](#initialization)
  - [Hooks and events](#hooks-and-events)
- [Error Handling](#error-handling)
  - [StripeError](#stripeerror)
- [Additional docs](#additional-docs)
- [Contributing](#contributing)

## Getting started

Get started with our [📚 integration guides](https://stripe.com/docs/terminal/payments/setup-sdk?terminal-sdk-platform=react-native) and [example project](https://stripe.com/docs/terminal/example-applications?terminal-sdk-platform=react-native), or [📘 browse the SDK reference](https://stripe.dev/stripe-terminal-react-native).

Updating to a newer version of the SDK? See our [release notes](https://github.com/stripe/stripe-terminal-react-native/releases).

## Requirements

### JS

- The SDK uses TypeScript features available in Babel version `7.9.0` and above.
  Alternatively use the `plugin-transform-typescript` plugin in your project.

### Android

- Android API level 26 and above
  - Note that attempting to override minSdkVersion to decrease the minimum supported API level will not work due to internal runtime API level validation.
- compileSdkVersion = 35
- targetSdkVersion = 35

### iOS

- Compatible with apps targeting iOS 15.1 or above.

## Try the example app

The React Native SDK includes an open-source example app, which you can use to familiarize yourself with the SDK and reader before starting your own integration.

To build the example app from source, you'll need to:

1. Run `yarn bootstrap` from the root directory to build the SDK.
2. Navigate to our [example backend](https://github.com/stripe/example-terminal-backend) and click the button to deploy it on Heroku.
3. Navigate to the `example-app` folder and run `yarn install` to install all example app dependencies.
4. Copy `.env.example` to `.env`, and set the URL of the Heroku app you just deployed.
5. Run either `yarn ios` or `yarn android` depending on which platform you would like to build.

## Installation

```sh
yarn add @stripe/stripe-terminal-react-native
```

or

```sh
npm install @stripe/stripe-terminal-react-native
```

## Example code

### Initialization

To initialize Stripe Terminal SDK in your React Native app, use the `StripeTerminalProvider` component in the root component of your application.

First, create an endpoint on your backend server that creates a new connection token via the Stripe Terminal API.

Next, create a token provider that will fetch connection token from your server and provide it to StripeTerminalProvider as a parameter.
Stripe Terminal SDK will fetch it when it's needed.

```tsx
// Root.tsx
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
    initialize();
  }, [initialize]);

  return <View />;
}
```

### Hooks and events

Stripe Terminal SDK provides dedicated hook which exposes bunch of methods and props to be used within your App.
Additionally, you have access to the internal state of SDK that contains information about the current connection, discovered readers and loading state.

```tsx
// PaymentScreen.tsx

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

[Here](https://github.com/stripe/stripe-terminal-react-native/blob/281df38/src/hooks/useStripeTerminal.tsx#L85-L109) you can find the list of available events to be used within the event emitter.

Example:

```tsx
// PaymentScreen.tsx

import {
  withStripeTerminal,
  WithStripeTerminalProps,
  CHANGE_CONNECTION_STATUS,
  Reader,
} from '@stripe/stripe-terminal-react-native';

class PaymentScreen extends React.Component {
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
      simulated: true,
    });
  }
}

export default withStripeTerminal(PaymentScreen);
```

## Error Handling

The SDK provides comprehensive error handling through `StripeError` objects, giving you detailed information about failures and their context.

### StripeError

All SDK methods return errors as `StripeError` objects with a consistent structure across platforms.

#### Interface

```typescript
interface StripeError extends Error {
  name: 'StripeError';
  message: string;              // Human-readable error message
  code: ErrorCode;              // SDK error code (e.g., 'BLUETOOTH_ERROR')
  nativeErrorCode: string;      // Platform-specific error code
  
  /** Platform-specific metadata (flexible map structure) */
  metadata: Record<string, unknown>;
  
  /** Associated PaymentIntent (if applicable) */
  paymentIntent?: PaymentIntent.Type;
  
  /** Associated SetupIntent (if applicable) */
  setupIntent?: SetupIntent.Type;
  
  /** Associated Refund (if applicable, iOS only) */
  refund?: Refund.Props;
  
  /** API-level error information (unified across platforms) */
  apiError?: ApiErrorInformation;
  
  /** Underlying error information (unified structure) */
  underlyingError?: UnderlyingErrorInformation;
}
```

#### API Error Information

**`apiError`**: Structured Stripe API error details (when applicable):

```typescript
interface ApiErrorInformation {
  code: string;           // API error code (e.g., 'card_declined')
  message: string;        // API error message
  declineCode: string;    // Decline code (e.g., 'insufficient_funds')
  type?: string;          // Error type (e.g., 'card_error')
  charge?: string;        // Related charge ID
  docUrl?: string;        // Documentation URL
  param?: string;         // Parameter that caused the error
}
```

#### Underlying Error Information

**`underlyingError`**: Low-level error details from the platform SDK:

```typescript
interface UnderlyingErrorInformation {
  code: string;                       // Error code or exception class
  message: string;                    // Error message
  iosDomain?: string;                 // iOS: NSError domain
  iosLocalizedFailureReason?: string; // iOS: Localized failure reason
  iosLocalizedRecoverySuggestion?: string; // iOS: Recovery suggestion
}
```

#### Platform-Specific Metadata

The `metadata` field contains additional platform-specific debugging information.

On **iOS**, this may include fields like `deviceBannedUntilDate`, `prepareFailedReason`, `httpStatusCode`, `readerMessage`, `stripeAPIRequestId`, `stripeAPIFailureReason`, and `offlineDeclineReason`.

On **Android**, the `metadata` field is reserved for future platform-specific fields and is currently empty.

## Additional docs

- [Running e2e tests locally](https://github.com/stripe/stripe-terminal-react-native/blob/main/docs/e2e-tests.md)

## Contributing

See the [contributor guidelines](https://github.com/stripe/stripe-terminal-react-native/blob/main/CONTRIBUTING.md) to learn how to contribute to the repository.
