# Connect to a reader

## Connect your application to a reader.

The Stripe Terminal SDK comes with a built-in simulated card reader, so you can develop and test your app without connecting to physical hardware. Whether your integration is complete or you’re just starting out, use the simulated reader to emulate all the Terminal flows in your app.

Note that the simulated reader does not provide a UI. After connecting to it in your app, you can see it working when calls to the Stripe SDK succeed.

To use the simulated reader, call `discoverReaders` to search for readers, with the `simulated` option set to `true`. When `onFinishDiscoveringReaders` callback is called without any errors, call `connectBluetoothReader` to connect to the simulated reader.

When connecting to a Bluetooth reader using `connectBluetoothReader`, your integration must provide the `locationId` parameter to the method, even for the simulated reader. Since the simulated reader can’t be associated with a real location, you may provide the simulated reader’s mock locationId instead.

```tsx
function DiscoverReadersScreen() {
  const { discoverReaders, connectBluetoothReader, discoveredReaders } =
    useStripeTerminal({
      onFinishDiscoveringReaders: (error) => {
        if (!error) {
          handleConnectBluetoothReader(discoveredReaders[0].id);
        }
      },
    });

  useEffect(() => {
    handleDiscoverReaders();
  }, []);

  const handleDiscoverReaders = async () => {
    // List of discovered readers will be available within useStripeTerminal hook
    const { error } = await discoverReaders({
      discoveryMethod: 'bluetoothScan',
      simulated: true,
    });

    if (error) {
      const { code, message } = error;
      Alert.alert('Discover readers error: ', `${code}, ${message}`);
    }
  };

  const handleConnectBluetoothReader = async (id: string) => {
    const { reader, error } = await connectBluetoothReader({
      readerId: discoveredReaders[0].id,
      // for simulated mode you can provide the simulated reader’s mock locationId
      locationId: discoveredReaders[0].locationId,
    });

    if (error) {
      console.log('connectBluetoothReader error', error);
    } else {
      console.log('Reader connected successfully', reader);
    }
  };

  return <View />;
}
```

## Next steps

Congratulations! You’ve connected your application to the reader. Next, collect your first Stripe Terminal payment.
