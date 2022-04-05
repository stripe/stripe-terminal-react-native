import React, { useState } from 'react';
import { ScrollView, Platform, StyleSheet, TextInput } from 'react-native';
import List from '../components/List';
import ListItem from '../components/ListItem';
import { useStripeTerminal } from 'stripe-terminal-react-native';
import { colors } from '../colors';

export default function ReaderDisplayScreen() {
  const { setReaderDisplay, clearReaderDisplay } = useStripeTerminal();
  const [cart, setCart] = useState<{
    currency?: string;
    tax?: string;
    amount?: string;
    itemDescription: string;
  }>({
    currency: 'usd',
    tax: '200',
    amount: '5000',
    itemDescription: 'Red t-shirt',
  });

  const _setCartDisplay = async () => {
    const { error } = await setReaderDisplay({
      currency: cart.currency!,
      tax: Number(cart.tax),
      total: Number(cart.amount) + Number(cart.tax),
      lineItems: [
        {
          displayName: cart.itemDescription,
          quantity: 1,
          amount: Number(cart.amount),
        },
      ],
    });

    if (error) {
      console.log('error', error);
      return;
    }

    console.log('setReaderDisplay success');
  };

  const _clearReaderDisplay = async () => {
    const { error } = await clearReaderDisplay();

    if (error) {
      console.log('error', error);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="always"
    >
      <List bolded={false} topSpacing={false} title="Item Description">
        <TextInput
          autoCapitalize="none"
          placeholder="Item Descritption"
          onChangeText={(value) =>
            setCart((c) => ({ ...c, itemDescription: value }))
          }
          value={cart.itemDescription}
          style={styles.input}
        />
      </List>
      <List bolded={false} topSpacing={false} title="Currency">
        <TextInput
          autoCapitalize="none"
          placeholder="Currency"
          onChangeText={(value) => setCart((c) => ({ ...c, currency: value }))}
          value={cart.currency}
          style={styles.input}
        />
      </List>
      <List bolded={false} topSpacing={false} title="Tax Amount">
        <TextInput
          autoCapitalize="none"
          placeholder="Tax"
          keyboardType="number-pad"
          onChangeText={(value) => setCart((c) => ({ ...c, tax: value }))}
          value={String(cart.tax)}
          style={styles.input}
        />
      </List>
      <List bolded={false} topSpacing={false} title="Charge Amount">
        <TextInput
          autoCapitalize="none"
          placeholder="Total"
          onChangeText={(value) => setCart((c) => ({ ...c, amount: value }))}
          value={String(cart.amount)}
          style={styles.input}
        />
      </List>
      <List bolded={false} topSpacing={false} title="Display Actions">
        <ListItem
          title="Set reader display"
          disabled={!cart.currency || !cart.tax || !cart.amount}
          onPress={_setCartDisplay}
        />
        <ListItem title="Clear reader display" onPress={_clearReaderDisplay} />
      </List>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light_gray,
    flex: 1,
    paddingVertical: 22,
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
    backgroundColor: colors.white,
    color: colors.dark_gray,
    paddingLeft: 16,
    marginBottom: 12,
    borderBottomColor: colors.gray,
    ...Platform.select({
      ios: {
        borderBottomWidth: StyleSheet.hairlineWidth,
      },
      android: {
        borderBottomWidth: 1,
        borderBottomColor: `${colors.gray}66`,
        color: colors.dark_gray,
      },
    }),
  },
});
