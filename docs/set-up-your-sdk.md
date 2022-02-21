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

For iOS, run `pod install` in the `ios` directory to ensure that you also install the required native dependencies. Android doesn’t require any additional steps.

## Configure your app

### Android

Location access must be enabled in order to use the SDK. You’ll need to make sure that the `ACCESS_FINE_LOCATION` permission is enabled in your app. 

---
**IMPORTANT**
In case of supportig **Android 12** you need also to ask the user for additional permissions:

`PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT` and `PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN`
---

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
          buttonPositive: 'Agree',
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can use the Location');
      } else {
        throw Error(
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
  const { initialize } = useStripeTerminal()

  useEffect(() => {
    initialize({
      logLevel: 'verbose',
    });
  }, [])

  return (
    <View />
  );
}
```
