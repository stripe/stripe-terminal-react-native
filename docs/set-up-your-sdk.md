# Set up your SDK

## Set up the Stripe Terminal SDK so you can begin accepting in-person payments.

Getting started with the Android SDK requires four steps:

- [Install the SDK](#install-the-sdk) in your app
- [Configure your app](#configure-your-app)
- [Set up the connection token endpoint](#set-up-the-connection-token-endpoint) in your app and backend
- [Initialize the SDK in your app](#initialize-the-sdk)

## Install the SDK

The [React Native SDK](https://github.com/stripe/stripe-terminal-react-native) is open source and fully documented. Internally, it makes use of native iOS and Android SDKs. Install the SDK by running:

```sh
yarn add @stripe/stripe-terminal-react-native
or
npm install @stripe/stripe-terminal-react-native
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
          title: 'Location Permission',
          message: 'Stripe Terminal needs access to your location',
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

For convenience, Stripe Terminal SDK also provides an util that handles all needed Android permissions.
In order to use it follow below instrustions:

```tsx
import { requestNeededAndroidPermissions } from 'stripe-terminal-react-native';

try {
  const granted = await requestNeededAndroidPermissions({
    accessFineLocation: {
      title: 'Location Permission',
      message: 'Stripe Terminal needs access to your location',
      buttonPositive: 'Accept',
    },
  });
  if (granted) {
    // init SDK
  } else {
    console.error(
      'Location and BT services are required in order to connect to a reader.'
    );
  }
} catch (e) {
  console.error(e);
}
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

> Note: This package cannot be used in the "Expo Go" app because [it requires custom native code](https://docs.expo.io/workflow/customizing/).

### Android

For android you'll need to massage your build files in order to properly compile. First in `android/build.gradle` by updating both `compileSdkVersion` and `targetSdkVersion` to at least `31`:

```
buildscript {
    ext {
        buildToolsVersion = "29.0.3"
        minSdkVersion = 21
        compileSdkVersion = 31
        targetSdkVersion = 31
    }
```

Next ensure that jetifier is ignoring the `moshi` lib by adding the following to `android/gradle.properties`:

```
android.jetifier.ignorelist=moshi-1.13.0.jar
```

or

```
android.jetifier.blacklist=moshi-1.13.0.jar
```

Depending on the version of jetifier in use.

### Configuring the SDK

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

### Build

Next, rebuild your app as described in the ['Adding custom native code'](https://docs.expo.io/workflow/customizing/) guide with:

```
expo run:ios
or
expo run:android
```

## Set up the connection token endpoint

### Server-side

```ts
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = require('stripe')('sk_test_7mJuPfZsBzc3JkrANrFrcDqC');

// In a new endpoint on your server, create a ConnectionToken and return the
// `secret` to your app. The SDK needs the `secret` to connect to a reader.
let connectionToken = stripe.terminal.connectionTokens.create();
```

Obtain the secret from the ConnectionToken on your server and pass it to the client side.

```ts
const express = require('express');
const app = express();

app.post('/connection_token', async (req, res) => {
  const token = res.json({ secret: token.secret }); // ... Fetch or create the ConnectionToken
});

app.listen(3000, () => {
  console.log('Running on port 3000');
});
```

> The ConnectionToken’s secret lets you connect to any Stripe Terminal reader and take payments with your Stripe account. Be sure to authenticate the endpoint for creating connection tokens.

## Client-side

To give the SDK access to this endpoint, create a token provider single function that requests a ConnectionToken from your backend.

```tsx
// App.ts
import { StripeTerminalProvider } from '@stripe/stripe-terminal-react-native';

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
```

This function is called whenever the SDK needs to authenticate with Stripe or the Reader. It’s also called when a new connection token is needed to connect to a reader (for example, when your app disconnects from a reader). If the SDK is unable to retrieve a new connection token from your backend, connecting to a reader fails with the error from your server.

> Do not cache or hardcode the connection token. The SDK manages the connection token’s lifecycle.

## Initialize the SDK

To get started, provide your token provider implemented in [Step 3](#set-up-the-connection-token-endpoint) to `StripeTerminalProvider` as a prop.

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
