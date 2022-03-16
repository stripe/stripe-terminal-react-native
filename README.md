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

- The SDK uses TypeScript features available in Babel version `7.9.0` and above.
  Alternatively use the `plugin-transform-typescript` plugin in your project.

#### Android

- Android 5.0 (API level 21) and above
- compileSdkVersion = 31
- targetSdkVersion = 31

**Android 12 (API Level >= 31)**

To enable compatibility the library with the latest Android 12 please make sure that you meet following requirements:

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

#### iOS

- Compatible with apps targeting iOS 10 or above.

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

## Configure your app

### Android

Location access must be enabled in order to use the SDK. You’ll need to make sure that the `ACCESS_FINE_LOCATION` permission is enabled in your app.

---

**IMPORTANT**
In case of supportig **Android 12** you need also to ask the user for additional permissions:

`PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT` and `PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN`

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

### iOS

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

## Usage example

Stripe Terminal SDK provides dedicated hook which exposes bunch of methods and props to be used within your App.
Additionally, you have access to the internal state of SDK that contains information about the current connection, discovered readers and loading state.

Alternatively, you can import all of the functions directly from the module but keep in mind that you will loose the access to the SDK state.

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
Please note that comparing to the hooks approach, you need to use event emitter to listen on specific events that comes from SDK.

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

## Run the example app

- Install the dependencies
  - `yarn bootstrap`
- Set your api key in your environment
  - `cp example/.env.example example/.env`
  - edit `.env`

To start and monitor each process:

- Start the backend
  - `yarn example start:server`
- Start the example
  - Terminal 1: `yarn example start`
  - Terminal 2: depending on what platform you want to build for run either
    - `yarn example ios`
    - or
    - `yarn example android`

To launch the watcher, server, and perform an initial build you can run:

- `yarn example ios:all`
  or
- `yarn example android:all`

## Runing e2e tests

### Android

1. Create an Android emulator with a name that matches the name found in `.detoxrc.json`
1. Run `yarn detox build --configuration android`
1. Run `yarn e2e:test:android`

### iOS

prereqs: Ensure AppleSimulatorUtils are installed

```
brew tap wix/brew
brew install applesimutils
```

1. Create an iOS simulator with a name that matches the name found in `.detoxrc.json`
1. Run `yarn detox build --configuration ios`
1. launch the simulator
1. Run `yarn e2e:test:ios`

## Deploying Example App

// TODO - find a better location for this Stripe-specifc section prior to launch

### Android

The Android example app is deployed to [Firebase App Distribution](https://firebase.google.com/docs/app-distribution) via a CI job that executes after a successful merge to main:

https://github.com/stripe/stripe-terminal-react-native/blob/e285cc9710cada5bc99434cb0d157354efbd621d/.circleci/config.yml#L265

A unique APK is generated for each supported region (EU and US). See the [App Distribution Console](https://console.firebase.google.com/project/internal-terminal/appdistribution/app/android:com.example.stripeterminalreactnative/releases) to view releases, enable build access for users, and generate invite links.

### iOS

// TODO

### Backend

The Example backend is deployed to Heroku via a CI job that executes after a successful merge to main:

https://github.com/stripe/stripe-terminal-react-native/blob/e285cc9710cada5bc99434cb0d157354efbd621d/.circleci/config.yml#L296

A separate backend instance is generated for each supported region (EU and US):

- https://stripe-terminal-rn-example-eu.herokuapp.com/
- https://stripe-terminal-rn-example-us.herokuapp.com/

## Contributing

See the [contributor guidelines](CONTRIBUTING.md) to learn how to contribute to the repository.
See the [contributor guidelines](CONTRIBUTING.md) to learn how to contribute to the repository.
