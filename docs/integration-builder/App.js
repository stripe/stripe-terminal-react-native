import React, { useEffect, useState } from 'react';
import {
  TouchableOpacity,
  Text,
  PermissionsAndroid,
  Platform,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  StripeTerminalProvider,
  useStripeTerminal,
} from 'stripe-terminal-react-native';
import {
  fetchConnectionToken,
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
    onUpdateDiscoveredReaders: async (readers) => {
      const selectedReader = readers[0];
      // {{ INTEGRATION-BUILDER START: #3b }}
      const { reader, error } = await connectBluetoothReader({
        readerId: selectedReader.id,
        // for simulated mode you can provide the simulated reader’s mock locationId
        locationId: selectedReader.locationId,
      });
      // {{ INTEGRATION-BUILDER END: #3b }}

      if (error) {
        console.log('connectBluetoothReader error', error);
      } else {
        console.log('Reader connected successfully', reader);
      }
    },
  });
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  // {{ INTEGRATION-BUILDER START: #2e }}
  useEffect(() => {
    async function init() {
      try {
        const granted = await PermissionsAndroid.request(
          'android.permission.ACCESS_FINE_LOCATION',
          {
            title: 'Location Permission',
            message: 'Stripe Terminal needs access to your location',
            buttonPositive: 'Accept',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('You can use the Location');
          setPermissionsGranted(true);
        } else {
          Alert.alert(
            'Location services are required in order to connect to a reader.'
          );
        }
      } catch {
        Alert.alert(
          'Location services are required in order to connect to a reader.'
        );
      }
    }

    if (Platform.OS === 'android') {
      init();
    }
  }, []);
  // {{ INTEGRATION-BUILDER END: #2e }}

  const handleDiscoverReaders = async () => {
    // List of discovered readers will be available within useStripeTerminal hook
    // {{ INTEGRATION-BUILDER START: #3a }}
    const { error } = await discoverReaders({
      discoveryMethod: 'bluetoothScan',
      simulated: true,
    });
    // {{ INTEGRATION-BUILDER END: #3a }}

    if (error) {
      console.log(
        'Discover readers error: ',
        `${error.code}, ${error.message}`
      );
    } else {
      console.log('discoverReaders succeeded');
    }
  };

  const collectPayment = async () => {
    const clientSecret = await fetchPaymentIntent();

    if (!clientSecret) {
      console.log('createPaymentIntent failed');
      return;
    }
    // {{ INTEGRATION-BUILDER START: #4c }}
    const { paymentIntent, error } = await retrievePaymentIntent(clientSecret);

    if (error) {
      console.log(`Couldn't retrieve payment intent: ${error.message}`);
    } else if (paymentIntent) {
      const { paymentIntent: collectedPaymentIntent, error: collectError } =
        await collectPaymentMethod(paymentIntent.id);
      // {{ INTEGRATION-BUILDER END: #4c }}

      if (collectError) {
        console.log(`collectPaymentMethod failed: ${collectError.message}`);
      } else if (collectedPaymentIntent) {
        console.log('collectPaymentMethod succeeded');

        processPayment(collectedPaymentIntent);
      }
    }
  };

  const processPayment = async (paymentIntent) => {
    // {{ INTEGRATION-BUILDER START: #4d }}
    const { paymentIntent: processPaymentPaymentIntent, error } =
      await processPayment(paymentIntent.id);
    // {{ INTEGRATION-BUILDER END: #4d }}

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
    <>
      {permissionsGranted ? (
        // {{ INTEGRATION-BUILDER START: #2f }}
        <StripeTerminalProvider
          logLevel="verbose"
          tokenProvider={fetchConnectionToken}
          // {{ INTEGRATION-BUILDER START: #2f }}
        >
          <TouchableOpacity
            disabled={!permissionsGranted}
            onPress={handleDiscoverReaders}
          >
            <Text>Discover Readers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!permissionsGranted}
            onPress={collectPayment}
          >
            <Text>Collect payment</Text>
          </TouchableOpacity>
        </StripeTerminalProvider>
      ) : (
        <ActivityIndicator style={StyleSheet.absoluteFillObject} />
      )}
    </>
  );
}
