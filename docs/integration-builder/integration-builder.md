# Accept in-person payments

Set up Stripe Terminal and use the simulated reader to emulate accepting in-person payments.

## 1. Set up the server

**1a. Install the Stripe Node library**

Install the package and import it in your code. Alternatively,
if you’re starting from scratch and need a `package.json` file,
download the project files using the link in the code editor.

Install the library:

```
npm install --save stripe
```

**1b. Create a ConnectionToken endpoint**

To connect to a reader, your backend needs to give the SDK permission to use the reader with your Stripe account by providing it with the secret from a [ConnectionToken](https://stripe.com/docs/api/terminal/connection_tokens). Your backend should only create connection tokens for clients that it trusts. You can [pass a location ID](https://stripe.com/docs/terminal/fleet/locations#direct-connection-tokens) when creating the connection token to control access to readers. If you’re using Stripe Connect, you should also [scope the connection token](https://stripe.com/docs/terminal/features/connect) to the relevant connected accounts.

## 2. Set up the SDK

**2a. Organize your readers**

[Create locations](https://stripe.com/docs/terminal/fleet/locations) to organize your readers. Locations group readers and allows them to automatically download the reader configuration needed for their region of use.

**2b. Install the SDK**

The [React Native SDK](https://github.com/stripe/stripe-terminal-react-native) is open source and fully documented. Internally, it makes use of native iOS and Android SDKs. Install the SDK by running:

```sh
yarn add @stripe/stripe-terminal-react-native
or
npm install @stripe/stripe-terminal-react-native
```

**2b. Configure your app**

To prepare your app to work with the Stripe Terminal SDK, make a few changes to your Info.plist file in Xcode.

[location]
Enable location services with the following key-value pair.

```
<key>NSLocationWhenInUseUsageDescription</key>
<string>Location access is required in order to accept payments.</string>
```

[Background-Modes]
Ensure that your app runs in the background and remains connected to the reader.

```
<key>UIBackgroundModes</key>
<array>
<string>bluetooth-central</string>
</array>
```

[Bluetooth-Peripheral]
Pass app validation checks when submitting to the App Store.

```
<key>NSBluetoothPeripheralUsageDescription</key>
<string>Bluetooth access is required in order to connect to supported bluetooth card readers.</string>
```

[Bluetooth-Always]
Allow your app to display a Bluetooth permission dialog.

```
<key>NSBluetoothAlwaysUsageDescription</key>
<string>This app uses Bluetooth to connect to supported card readers.</string>
```

[location-Android]

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

**2c. Fetch ConnectionToken**

Implement a token provider single function in your app that requests a connection token from your backend.

**2c. Initialize the SDK**

To get started, provide your token provider to `StripeTerminalProvider` as a prop.

```tsx
import { StripeTerminalProvider } from '@stripe/stripe-terminal-react-native';

function App() {
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
