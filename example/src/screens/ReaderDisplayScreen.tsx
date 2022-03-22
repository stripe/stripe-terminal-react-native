import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useStripeTerminal } from 'stripe-terminal-react-native';
import { colors } from '../colors';
import Button from '../components/Button';

export default function ReaderDisplayScreen() {
  const { setReaderDisplay, clearReaderDisplay } = useStripeTerminal();
  const [cart, setCart] = useState<{
    currency?: string;
    tax?: string;
    total?: string;
  }>({ currency: 'usd', tax: '200', total: '5000' });

  const _setCartDisplay = async () => {
    const { error } = await setReaderDisplay({
      currency: cart.currency!,
      tax: Number(cart.tax),
      total: Number(cart.total),
      lineItems: [
        {
          displayName: 'item 1',
          quantity: 5,
          amount: 500,
        },
        {
          displayName: 'item 2',
          quantity: 12,
          amount: 1200,
        },
      ],
    });
    if (error) {
      console.log('error', error);
    } else {
      console.log('setReaderDisplay success');
    }
  };

  const _clearReaderDisplay = async () => {
    const { error } = await clearReaderDisplay();

    if (error) {
      console.log('error', error);
    }
  };

  return (
    <View style={styles.container}>
      <View>
        <TextInput
          autoCapitalize="none"
          placeholder="Currency"
          onChangeText={(value) => setCart((c) => ({ ...c, currency: value }))}
          value={cart.currency}
          style={styles.input}
        />
        <TextInput
          autoCapitalize="none"
          placeholder="Tax"
          keyboardType="number-pad"
          onChangeText={(value) => setCart((c) => ({ ...c, tax: value }))}
          value={String(cart.tax)}
          style={styles.input}
        />
        <TextInput
          autoCapitalize="none"
          placeholder="Total"
          onChangeText={(value) => setCart((c) => ({ ...c, total: value }))}
          value={String(cart.total)}
          style={styles.input}
        />
        <View style={styles.buttonWrapper}>
          <Button
            variant="primary"
            title="Set reader display"
            disabled={!cart.currency || !cart.tax || !cart.total}
            onPress={_setCartDisplay}
          />
        </View>
        <View style={styles.buttonWrapper}>
          <Button
            variant="primary"
            title="Clear reader display"
            onPress={_clearReaderDisplay}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    flex: 1,
    padding: 22,
  },
  discoveredWrapper: {
    height: 50,
  },
  buttonWrapper: {
    marginBottom: 20,
    marginTop: 50,
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  input: {
    height: 44,
    borderBottomColor: colors.slate,
    borderBottomWidth: 1.5,
    color: colors.dark_gray,
    marginBottom: 12,
  },
});
