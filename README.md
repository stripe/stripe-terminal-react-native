- [Stripe Terminal React Native SDK](#stripe-terminal-react-native-sdk)
  - [Getting started](#getting-started)
  - [Requirements](#requirements)
    - [JS](#js)
    - [Android](#android)
    - [iOS](#ios)
  - [Installation](#installation)
  - [Usage With React Native CLI](#usage-with-react-native-cli)
    - [iOS](#ios-1)
      - [Permissions](#permissions)
    - [Android](#android-1)
      - [Permissions](#permissions-1)
      - [Manifest](#manifest)
  - [Usage With Expo](#usage-with-expo)
  - [Stripe Terminal SDK initialization](#stripe-terminal-sdk-initialization)
  - [Basic Usage Example](#basic-usage-example)
  - [Further Usage Examples](#further-usage-examples)
  - [Additional Docs](#additional-docs)
  - [Internal Docs](#internal-docs)
  - [Contributing](#contributing)

# Stripe Terminal React Native SDK

Stripe Terminal enables you to build your own in-person checkout to accept payments in the physical world. Built on Stripe's payments network, Terminal helps you unify your online and offline payment channels. With the Stripe Terminal React Native SDK, you can connect to pre-certified card readers from your React Native app and drive a customized in-store checkout flow.

## Getting started

Get started with our [📚 integration guides](https://stripe.com/docs/terminal/payments/setup-sdk?terminal-sdk-platform=react-native) and [example project](#run-the-example-app), or [📘 browse the SDK reference](https://stripe.dev/stripe-terminal-react-native).

> Updating to a newer version of the SDK? See our [changelog](https://github.com/stripe/stripe-terminal-react-native/blob/master/CHANGELOG.md).

## Requirements

### JS

- The SDK uses TypeScript features available in Babel version `7.9.0` and above.
  Alternatively use the `plugin-transform-typescript` plugin in your project.

### Android

- Android 5.0 (API level 21) and above
- compileSdkVersion = 31
- targetSdkVersion = 31

### iOS

- Compatible with apps targeting iOS 10 or above.

## Installation

```sh
yarn add @stripe/stripe-terminal-react-native
or
npm install @stripe/stripe-terminal-react-native
```

_note: early access beta users will need to install from git with_

```
yarn add https://github.com/stripe/stripe-terminal-react-native
or
npm install https://github.com/stripe/stripe-terminal-react-native
```

## Usage With React Native CLI

### iOS

You'll need to run `pod install` in your `ios` directory to install the native dependencies.

#### Permissions

Location services must be enabled in order to use the SDK on iOS. Add the following key-value pair to your app's `Info.plist` file:

- Privacy - Location When In Use Usage Description

Update:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string></string>
```

to

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Location access is required in order to accept payments.</string>
```

> Note: Stripe needs to know where payments occur to reduce risks associated with those charges and to minimize disputes. If the SDK can’t determine the iOS device’s location, payments are disabled until location access is restored.

For your app to run in the background and remain connected to the reader, add this key-value pair to your `Info.plist` file:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>bluetooth-central</string>
</array>
```

For your app to pass validation when submitting to the App Store, add the following key-value pairs as well:

```xml
<key>NSBluetoothPeripheralUsageDescription</key>
<string>Bluetooth access is required in order to connect to supported bluetooth card readers.</string>
<key>NSBluetoothAlwaysUsageDescription</key>
<string>This app uses Bluetooth to connect to supported card readers.</string>
```

### Android

#### Permissions

In order for the Stripe Terminal SDK to function properly we'll need to enable the following permissions:

- `PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT`
- `PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN`
- `PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION`

To do this, add the following check before you initialize the Terminal SDK:

```tsx
useEffect(() => {
  async function init() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
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

#### Manifest

To enable compatibility the library with the latest Android 12 please make sure that you ad following requirements:

Add `android:exported="true"` to the `AndroidManifest.xml`:

```xml
<manifest ...>
    <application android:name=".MainApplication">
      <activity
        android:name=".MainActivity"
        android:exported="true">
          <!-- content -->
      </activity>
    </application>
</manifest>
```

Please read the [Android documentation](https://developer.android.com/about/versions/12/behavior-changes-12#exported) to establish the exact value that you need to set.

## Usage With Expo

_Note: Currently Expo is only supported for usage with iOS, we will resume support for android when expo update its `compileSdkVersion` to 31_

_Note: This package cannot be used in the "Expo Go" app because [it requires custom native code](https://docs.expo.io/workflow/customizing/)._

After [installing](#installation) the SDK, add the [config plugin](https://docs.expo.io/guides/config-plugins/) to the [`plugins`](https://docs.expo.io/versions/latest/config/app/#plugins) array of your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      [
        "stripe-terminal-react-native",
        {
          "bluetoothBackgroundMode": true,
          "locationWhenInUsePermission": "Location access is required in order to accept payments.",
          "bluetoothPeripheralPermission": "Bluetooth access is required in order to connect to supported bluetooth card readers.",
          "bluetoothAlwaysUsagePermission": "This app uses Bluetooth to connect to supported card readers."
        }
      ]
    ]
  }
}
```

That's it, that will take care of all android and iOS permissioning required for the SDK to function!

Next, rebuild your app as described in the ['Adding custom native code'](https://docs.expo.io/workflow/customizing/) guide with:

```
expo run:ios
or
expo run:android
```

## Stripe Terminal SDK initialization

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
Please note that `initialize` method must be called from the nested component of `StripeTerminalProvider`.

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

## Basic Usage Example

Stripe Terminal SDK provides dedicated hook which exposes bunch of methods and props to be used within your App.
Additionally, you have access to the internal state of SDK that contains information about the current connection, discovered readers and loading state.

Alternatively, you can import all of the functions directly from the module but keep in mind that you will lose the access to SDK state.

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

## Further Usage Examples

You can find further examples of common SDK actions here:

- [Collect a Payment](/docs/collect-payments.md)
- [Connect to a Reader](/docs/connect-to-a-reader.md)
- [Set the Reader Display](/docs/display.md)
- [Incremental Authorization](/docs/incremental-authorizations.md)
- [Refunds](/docs/refund-transactions.md)
- [Saving Cards](/docs/saving-cards.md)

## Additional Docs

- [Setting up the SDK](/docs/set-up-your-sdk.md)
- [Running the Example Application](/docs/example-applications.md)
- [Running e2e tests locally](/docs/e2e-tests.md)

## Internal Docs

- [Deploying the example apps](/docs/deploying-example-app.md)

## Contributing

See the [contributor guidelines](CONTRIBUTING.md) to learn how to contribute to the repository.
See the [contributor guidelines](CONTRIBUTING.md) to learn how to contribute to the repository.
