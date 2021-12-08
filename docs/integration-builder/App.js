import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import {
  StripeTerminalProvider,
  useStripeTerminal,
} from 'stripe-terminal-react-native';
import {
  fechTokenProvider,
  fetchPaymentIntent,
  capturePaymentIntent,
} from './apiClient';

export default function App() {
  const {
    discoverReaders,
    retrievePaymentIntent,
    connectBluetoothReader,
    collectPaymentMethod,
  } = useStripeTerminal({
    onUpdateDiscoveredReaders: (readers) => {
      // once you get the list of available readers you can make a connection.
      handleConnectBluetoothReader(readers[0]);
    },
  });

  const handleDiscoverReaders = async () => {
    // List of discovered readers will be available within useStripeTerminal hook
    const { error } = await discoverReaders({
      discoveryMethod: 'bluetoothScan',
      simulated: true,
    });

    if (error) {
      console.log(
        'Discover readers error: ',
        `${error.code}, ${error.message}`
      );
    } else {
      console.log('discoverReaders succeeded');
    }
  };

  const handleConnectBluetoothReader = async (selectedReader) => {
    const { reader, error } = await connectBluetoothReader({
      readerId: selectedReader.id,
      // for simulated mode you can provide the simulated reader’s mock locationId
      locationId: selectedReader.locationId,
    });

    if (error) {
      console.log('connectBluetoothReader error', error);
    } else {
      console.log('Reader connected successfully', reader);
    }
  };

  const collectPayment = async () => {
    const clientSecret = await fetchPaymentIntent();

    if (!clientSecret) {
      console.log('createPaymentIntent failed');
      return;
    }
    const { paymentIntent, error } = await retrievePaymentIntent(clientSecret);

    if (error) {
      console.log(`Couldn't retrieve payment intent: ${error.message}`);
    } else if (paymentIntent) {
      const { paymentIntent: collectedPaymentIntent, error: collectError } =
        await collectPaymentMethod(paymentIntent.id);

      if (error) {
        console.log(`collectPaymentMethod failed: ${collectError.message}`);
      } else if (collectedPaymentIntent) {
        console.log('collectPaymentMethod succeeded');

        processPayment(collectedPaymentIntent);
      }
    }
  };

  const processPayment = async (paymentIntent) => {
    const { paymentIntent: processPaymentPaymentIntent, error } =
      await processPayment(paymentIntent.id);

    if (error) {
      console.log(`processPayment failed: ${error.message}`);
    } else if (processPaymentPaymentIntent) {
      console.log('processPayment succeeded');

      const result = await capturePaymentIntent();
      if (!result) {
        console.log('capture failed');
      } else {
        console.log('capture succeeded');
      }
    }
  };

  return (
    <StripeTerminalProvider
      logLevel="verbose"
      tokenProvider={fechTokenProvider}
    >
      <TouchableOpacity onPress={handleDiscoverReaders}>
        <Text>Discover Readers</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={collectPayment}>
        <Text>Collect payment</Text>
      </TouchableOpacity>
    </StripeTerminalProvider>
  );
}
