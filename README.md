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
  - [Platform error conversion](#platform-error-conversion)
  - [Error handling utilities](#error-handling-utilities)
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

The SDK provides error handling through `StripeError` objects and utility functions to help you build robust payment applications.

### StripeError

All SDK methods return errors as `StripeError` objects, which provide information about what went wrong and context for debugging.

#### Interface

```typescript
interface StripeError extends Error {
  name: 'StripeError';
  message: string; // Human-readable error message
  code: ErrorCode; // SDK error code (e.g., 'BLUETOOTH_ERROR')
  nativeErrorCode: string; // Platform-specific error code
  metadata: Record<string, unknown>; // Additional error context
  paymentIntent?: PaymentIntent.Type; // Related PaymentIntent (if applicable)
  setupIntent?: SetupIntent.Type; // Related SetupIntent (if applicable)
}
```

#### Key Benefits

#### Structured Error Information

- All errors follow the same structure across platforms
- Multiple error codes and metadata provide debugging information
- Full TypeScript support prevents runtime errors

#### Cross-Platform Consistency

- Same error structure on iOS and Android
- `nativeErrorCode` provides platform-specific details when needed
- Native platform errors are automatically converted to `StripeError`
- Handles different native error structures transparently

#### Enhanced Debugging

- Over 60 specific error codes organized by category (Network, Reader, Payment, etc.)
- Additional context like decline codes, API error details, and debugging information
- Automatic inclusion of related PaymentIntent or SetupIntent when relevant

#### Error Categories

The SDK provides error codes organized by category:

```typescript
// Network errors
'STRIPE_API_CONNECTION_ERROR';
'REQUEST_TIMED_OUT';
'SESSION_EXPIRED';

// Reader/Hardware errors
'BLUETOOTH_ERROR';
'READER_BUSY';
'CARD_READ_TIMED_OUT';

// Payment errors
'DECLINED_BY_STRIPE_API';
'DECLINED_BY_READER';

// Integration errors
'NOT_CONNECTED_TO_READER';
'INVALID_CLIENT_SECRET';
// ... and 60+ additional specific codes
```

#### Usage Examples

#### Basic Error Handling

```typescript
const { connectReader } = useStripeTerminal();

try {
  const { error } = await connectReader(reader, 'bluetoothScan');
  if (error) {
    console.log('Connection failed:', error.code);
    console.log('Message:', error.message);
    console.log('Native code:', error.nativeErrorCode);

    // Handle specific error types
    switch (error.code) {
      case 'BLUETOOTH_ERROR':
        // Guide user to enable Bluetooth
        break;
      case 'READER_BUSY':
        // Retry after delay
        break;
      default:
        // Handle other error cases
        break;
    }
  }
} catch (error) {
  // Handle unexpected errors
}
```

#### Payment Error Handling with Context

```typescript
const { confirmPaymentIntent } = useStripeTerminal();

const { error, paymentIntent } = await confirmPaymentIntent('pi_...');
if (error) {
  console.log('Payment failed:', error.code);

  // Access decline details from metadata
  if (error.code === 'DECLINED_BY_STRIPE_API') {
    const declineCode = error.metadata?.decline_code;
    const networkStatus = error.metadata?.network_status;
    console.log('Decline reason:', declineCode);
  }

  // Access related PaymentIntent for recovery
  if (error.paymentIntent) {
    console.log('PaymentIntent status:', error.paymentIntent.status);
    // Implement recovery logic based on status
  }
}
```

### Platform Error Conversion

The React Native SDK acts as a bridge between the native Android and iOS Terminal SDKs and your React Native application. When the underlying native Terminal SDKs throw exceptions or errors, the React Native SDK automatically catches and converts them into standardized `StripeError` objects.

#### Architecture Overview

```text
┌─────────────────────┐    ┌─────────────────────┐
│   Android Terminal  │    │    iOS Terminal     │
│        SDK          │    │        SDK          │
└──────────┬──────────┘    └──────────┬──────────┘
           │                          │
           │ Platform-specific        │ Platform-specific
           │     Errors               │     Errors
           │                          │
           ▼                          ▼
┌──────────────────────────────────────────────────┐
│           React Native SDK Bridge                │
│        (Automatic Error Conversion)              │
└──────────────────┬───────────────────────────────┘
                   │
                   │ Standardized StripeError
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│          Your React Native App                   │
└──────────────────────────────────────────────────┘
```

The SDK automatically handles different native error structures between Android and iOS, converting them to `StripeError` format:

#### What You Receive as a Developer

Regardless of the underlying platform, your React Native code always receives the same `StripeError` structure:

```typescript
// Consistent StripeError format across all platforms
{
  name: "StripeError",
  code: "BLUETOOTH_ERROR",           // Standardized error code
  message: "Bluetooth connection failed",
  nativeErrorCode: "1001",          // Platform-specific code for debugging
  metadata: {                       // Rich debugging context - see platform differences below
    // Platform-specific debugging information
    // Different fields available on Android vs iOS
  },
  paymentIntent?: { /* Related PaymentIntent */ },
  setupIntent?: { /* Related SetupIntent */ }
}
```

#### Platform-Specific Metadata Differences

While the main `StripeError` structure is consistent, the `metadata` field contains platform-specific debugging information:

**Android Metadata Structure**:

```typescript
metadata: {
  // Android-specific fields
  apiError?: {
    // Stripe API error details when applicable
    code: string,
    message: string,
    declineCode?: string
  },
  underlyingError?: {
    // Java/Kotlin exception information
    code: string,        // Exception class name
    message: string
  },
  exceptionClass: string  // TerminalException class name
}
```

**iOS Metadata Structure**:

```typescript
metadata: {
  // iOS-specific fields
  domain: string,                        // NSError domain
  isStripeError: boolean,
  localizedFailureReason?: string,       // iOS localized failure reason
  localizedRecoverySuggestion?: string,  // iOS recovery suggestion
  underlyingError?: {
    // NSError chain information
    domain: string,
    code: number,
    message: string
  },
  userInfo?: {
    // Additional NSError userInfo dictionary
    [key: string]: any
  }
}
```

#### Using Platform-Specific Metadata

You can access platform-specific debugging information while maintaining cross-platform compatibility:

```typescript
const { error } = await connectReader(reader, 'bluetoothScan');
if (error) {
  console.log('Error code:', error.code);
  console.log('Native code:', error.nativeErrorCode);

  // Access platform-specific debugging information
  if (error.metadata.apiError) {
    // Android-specific: Stripe API error details
    console.log('API Error:', error.metadata.apiError);
  }

  if (error.metadata.userInfo) {
    // iOS-specific: Additional NSError userInfo
    console.log('iOS UserInfo:', error.metadata.userInfo);
  }

  if (error.metadata.localizedFailureReason) {
    // iOS-specific: Localized failure reason
    console.log('iOS Failure Reason:', error.metadata.localizedFailureReason);
  }

  if (error.metadata.underlyingError) {
    // Platform-specific: Underlying error details
    console.log('Underlying Error:', error.metadata.underlyingError);
  }

  if (error.metadata.exceptionClass) {
    // Android-specific: Exception class information
    console.log('Android Exception Class:', error.metadata.exceptionClass);
  }
}
```

#### Automatic Conversion Process

The conversion from native errors to `StripeError` objects happens automatically at the bridge layer:

- **Android**: `TerminalException` objects are converted to standardized `StripeError` format
- **iOS**: `NSError` objects are converted to standardized `StripeError` format
- **Cross-platform**: Error codes are mapped to consistent values across platforms

#### Platform Conversion Benefits

- Detects platform-specific error structures automatically
- Handles missing or malformed error data safely
- Retains all relevant debugging information from both platforms
- Always produces `StripeError` objects regardless of platform

This means you can write your error handling code once and it works the same way on both Android and iOS. The conversion happens automatically behind the scenes, so you always work with standardized error objects.

### Error Handling Utilities

The SDK includes utility functions for error handling:

```typescript
import {
  checkIfObjectIsStripeError,
  createStripeError,
} from '@stripe/stripe-terminal-react-native';

// Type-safe error checking
if (checkIfObjectIsStripeError(error)) {
  // TypeScript now knows this is a StripeError
  console.log(error.code, error.nativeErrorCode);
}

// Create custom StripeError objects for testing or custom error scenarios
const customError = createStripeError({
  code: 'UNEXPECTED_SDK_ERROR',
  message: 'Custom error message',
  metadata: { context: 'custom operation' },
});
```

**Why use StripeError?**

✅ **Consistent**: Same error format across all platforms and SDK methods  
✅ **Informative**: Rich context with multiple error codes and metadata  
✅ **Type-Safe**: Full TypeScript support with intelligent autocomplete  
✅ **Debuggable**: Detailed information for troubleshooting production issues  
✅ **User-Friendly**: Human-readable messages suitable for user display  
✅ **Recoverable**: Context and related objects enable sophisticated error recovery

## Additional docs

- [Running e2e tests locally](https://github.com/stripe/stripe-terminal-react-native/blob/main/docs/e2e-tests.md)

## Contributing

See the [contributor guidelines](https://github.com/stripe/stripe-terminal-react-native/blob/main/CONTRIBUTING.md) to learn how to contribute to the repository.
