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

**2c. Configure your app on iOS**

To prepare your app to work with the Stripe Terminal SDK on `iOS`, make a few changes to your Info.plist file in Xcode.

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

**2d. Fetch ConnectionToken**

Implement a token provider single function in your app that requests a connection token from your backend.

**2e. Verify permissions on Android**

Location access must be enabled in order to use the SDK. You’ll need to make sure that the `ACCESS_FINE_LOCATION` permission is enabled in your app. To do this, add the following check before you initialize the Terminal SDK:

**2f. Initialize the SDK**

To get started, add a `StripeTerminalProvider` on the root of your Application and provide your token provider as a prop.

## 3. Connect to the simulated reader

**3a. Discover readers**

The Stripe Terminal SDK comes with a built-in simulated card reader, so you can develop and test your app without connecting to physical hardware. To use the simulated reader, call `discoverReaders` to search for readers, with the simulated option set to true. You can discover intended readers more easily by [filtering by location](https://stripe.com/docs/terminal/fleet/locations#internet-reader-discovery).

**3b. Connect to the simulated reader**

When `onUpdateDiscoveredReaders` callback is called with an array of the readers as an argument, call `connectBluetoothReader` to connect to the simulated reader.

## 4. Collecting Payments

**4a. Create a PaymentIntent**

Add an endpoint on your server that creates a PaymentIntent. A PaymentIntent tracks the customer's payment lifecycle, keeping track of any failed payment attempts and ensuring they’re only charged once. Return the PaymentIntent's client secret in the response. If you’re using Stripe Connect, you can also specify [connected account information](https://stripe.com/docs/terminal/features/connect) based on your platform’s charge logic.

**4b. Fetch the PaymentIntent**

Make a request to your server for a PaymentIntent to initiate the payment process.

**4c. Collect payment method details**

Call `collectPaymentMethod` with retrieved PaymentIntent's ID to collect a payment method. When connected to the simulated reader calling this method immediately updates the PaymentIntent object with a [simulated test card](https://stripe.com/docs/terminal/references/testing#simulated-test-cards). When connected to a physical reader the connected reader waits for a card to be presented.

**4d. Process the payment**

After successfully collecting payment method data, call processPayment with the updated PaymentIntent to process the payment. A successful call results in a PaymentIntent with a status of `requires_capture`.

**4e. Create an endpoint to capture the PaymentIntent**

Create an endpoint on your backend that accepts a PaymentIntent ID and sends a request to the Stripe API to capture it.

**4f. Capture the PaymentIntent**

Notify your backend to capture the PaymentIntent. In your request send the PaymentIntent ID.

## 5. Test the integration

**5a. Run the application**

Run your Node server and go to `localhost:4242`.

```
npm start
```

**5b. Make a test paymentn**

Use [amounts](https://stripe.com/docs/terminal/references/testing#physical-test-card) ending in the following special values to test your integration.
**Payment succeeds**
**Payment is declined**

## Congratulations!

Your Terminal integration is now set up to collect in-person payments. Next, test your current integration with a physical reader or integrate Stripe Terminal with your connect platform.
