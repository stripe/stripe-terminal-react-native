# Stripe Terminal React Native SDK

Stripe Terminal enables you to build your own in-person checkout to accept payments in the physical world. Built on Stripe's payments network, Terminal helps you unify your online and offline payment channels. With the Stripe Terminal React Native SDK, you can connect to pre-certified card readers from your React Native app and drive a customized in-store checkout flow.

## Getting started

Get started with our [📚 integration guides](https://stripe.com/docs/terminal/payments/setup-sdk?terminal-sdk-platform=react-native) and [example project](#run-the-example-app), or [📘 browse the SDK reference](https://stripe.dev/stripe-terminal-react-native).

> Updating to a newer version of the SDK? See our [changelog](https://github.com/stripe/stripe-terminal-react-native/blob/master/CHANGELOG.md).

## Installation

```sh
yarn add @stripe/stripe-terminal-react-native
or
npm install @stripe/stripe-terminal-react-native
```

### iOS

You'll need to run `pod install` in your `ios` directory to install the native dependencies.

### Requirements

The SDK uses TypeScript features available in Babel version `7.9.0` and above.
Alternatively use the `plugin-transform-typescript` plugin in your project.

#### Android

- Android 5.0 (API level 21) and above

#### iOS

Compatible with apps targeting iOS 10 or above.

## Stripe Terminal SDK initialization

To initialize Stripe Terminal SDK in your React Native app, use the `StripeTerminalProvider` component in the root component of your application.

First, create an endpoint on your backend server that creates a new connection token via the Stripe Terminal API.
Next, create a token provider that will fetch connection token from your server and provide it to StripeTerminalProvider as a parameter.
Stripe Terminal SDK will fetch it when it's needed.

```tsx
// App.ts
import { StripeTerminalProvider } from '@stripe/stripe-terminal-react-native';

function App() {
  const fechTokenProvider = async () => {
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
      tokenProvider={fechTokenProvider}
    >
      <Screen />
    </StripeTerminalProvider>
  );
}
```

## Usage example

Stripe Terminal SDK provides dedicated hook which exposes bunch of methods and props to be used within your App.
Moreover, you have an access to the internal state of SDK that contain information about the current connection, discovered readers and loading state.
Alternatively, you can import all of the functions directly from the module but keep in mind that you will loose an access to the SDK state.

```tsx
// Screen.ts

import { useStripeTerminal } from '@stripe/stripe-terminal-react-native';

// Alternatively you can import the methods directly.
import {
  useStripeTerminal,
  discoverReaders,
} from '@stripe/stripe-terminal-react-native';

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
  }, []);

  return <View />;
}
```

In case your app uses `React Class Components` you can use dedicated `withStripeTerminal` Higher-Order-Component.
Please note that comparing to the hooks approach, you need to use event emitter to listen on specific events that comes from SDK.

[Here](https://github.com/stripe/stripe-terminal-react-native/blob/main/src/hooks/useStripeTerminal.tsx#L51), you can find the list of available events to be used within event emitter.

Example:

```tsx
import {
  withStripeTerminal,
  WithStripeTerminalProps,
  CHANGE_CONNECTION_STATUS_LISTENER_NAME,
  Reader,
} from '@stripe/stripe-terminal-react-native';

class Screen extends React.Component {
  componentDidMount() {
    this.discoverReaders();

    const eventSubscription = props.emitter.addListener(
      CHANGE_CONNECTION_STATUS_LISTENER_NAME, // didChangeConnectionStatus
      (status: Reader.ConnectionStatus) => {
        // access to the current connection status
      }
    );
  }

  async discoverReaders() {
    thisp.props.discoverReaders({
      discoveryMethod: 'bluetoothScan',
      simulated,
    });
  }
}

export default withStripeTerminal(PaymentScreen);
```

## Run the example app

- Install the dependencies
  - `yarn bootstrap`
- Set up env vars
  - `cp example/.env.example example/.env` and set the variable values in your newly created `.env` file.
- Start the example
  - Terminal 1: `yarn example start:server`
  - Terminal 2: `yarn example start`
  - Terminal 3: depending on what platform you want to build for run either
    - `yarn example ios`
    - or
    - `yarn example android`

## Configure your app

### Android

Location access must be enabled in order to use the SDK. You’ll need to make sure that the `ACCESS_COARSE_LOCATION` permission is enabled in your app. To do this, add the following check before you initialize the Terminal SDK:

```tsx
useEffect(() => {
  async function init() {
    try {
      const granted = await PermissionsAndroid.request(
        'android.permission.ACCESS_COARSE_LOCATION',
        {
          title: 'Location Permission Permission',
          message: 'App needs access to your Location ',
          buttonPositive: 'Accept',
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can use the Location');
      } else {
        console.error(
          'Location services are required in order to connect to a reader.'
        );
      }
    } catch {}
  }
  init();
}, []);
```

### iOS

Location services must be enabled in order to use the SDK on iOS. Add the following key-value pair to your app's `Info.plist` file:

- Privacy - Location When In Use Usage Description
  - Key: `NSLocationWhenInUseUsageDescription`
  - Value: "Location access is required in order to accept payments."

> Note: Stripe needs to know where payments occur to reduce risks associated with those charges and to minimize disputes. If the SDK can’t determine the iOS device’s location, payments are disabled until location access is restored.

For your app to run in the background and remain connected to the reader, add this key-value pair to your `Info.plist` file:

- Required background modes
  - Key: `UIBackgroundModes`
  - Value: `bluetooth-central` (Uses Bluetooth LE accessories)
  - Note the value is actually an array that you will need to add `bluetooth-central` to.

For your app to pass validation when submitting to the App Store, add the following key-value pairs as well:

- Privacy - Bluetooth Peripheral Usage Description
  - Key: `NSBluetoothPeripheralUsageDescription`
  - Value: “Bluetooth access is required in order to connect to supported bluetooth card readers.”
- Privacy - Bluetooth Always Usage Description
  - Key: `NSBluetoothAlwaysUsageDescription`
  - Value: "This app uses Bluetooth to connect to supported card readers."

## Contributing

See the [contributor guidelines](CONTRIBUTING.md) to learn how to contribute to the repository.
