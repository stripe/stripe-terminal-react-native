import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';

import { Picker } from '@react-native-picker/picker';

import { colors } from '../colors';
import List from '../components/List';
import ListItem from '../components/ListItem';
import { AppContext } from '../AppContext';
import { Api } from '../api/api';
import type { IShortAccount } from '../types';
import {
  getStoredAccounts,
  getStoredConnectedAccountID,
  setStoredAccounts,
  setStoredConnectedAccountID,
} from '../util/merchantStorage';
import { showErrorAlert } from '../util/errorHandling';

export default function MerchantSelectScreen() {
  const { refreshToken, setRefreshToken } = useContext(AppContext);
  const { account, setAccount } = useContext(AppContext);
  const [accounts, setAccounts] = useState<Array<IShortAccount>>([]);
  const [isAddPending, setIsAddPending] = useState<boolean>(false);
  const [newAccountKey, setNewAccountKey] = useState<string>('');
  const [connectedStripeAccountID, setConnectedStripeAccountID] =
    useState<string>('');
  // on init load all stored accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const storedAccounts = await getStoredAccounts();
        setAccounts(storedAccounts);
      } catch (e) {
        // error reading value
        console.log(e);
      }
    };

    fetchAccounts();
  }, []);

  // write list of accounts to storage whenever it's changed
  useEffect(() => {
    setStoredAccounts(accounts);
  }, [accounts]);

  // fetch connected stripe account id from storage if there was ever a cache
  useEffect(() => {
    getStoredConnectedAccountID().then((value) => {
      if (value) {
        setConnectedStripeAccountID(value);
      }
    });
  }, []);

  // store connected stripe account id to storage
  const onConnectedAccountInputChange = (value: string) => {
    setConnectedStripeAccountID(value);
    setStoredConnectedAccountID(value);
  };

  // Set a flag to trigger the update token re-request when the connectedStripeAccount changes.
  const onEndInputTextContentChange = () => {
    setRefreshToken(!refreshToken);
  };

  const onSelectAccount = useCallback(
    async (secretKey: string | null) => {
      setAccount({ selectedAccountKey: secretKey });
    },
    [setAccount]
  );

  const onRemoveAllMerchants = useCallback(() => {
    setAccounts([]);
    onSelectAccount(null);
    setConnectedStripeAccountID('');
  }, [setAccounts, onSelectAccount, setConnectedStripeAccountID]);

  const onRemoveSelectedMerchant = useCallback(() => {
    setAccounts((prev) => {
      const idx = prev.findIndex((a) => a.secretKey === account?.secretKey);

      return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
    });
    onSelectAccount(null);
  }, [account?.secretKey, onSelectAccount]);

  const onAddAccount = useCallback(async () => {
    // check if already exists
    if (accounts.find((a) => a.secretKey === newAccountKey)) {
      Alert.alert('Merchant key already exists!');
      setNewAccountKey('');
      return;
    }
    setIsAddPending(true);
    const addedAccount = await Api.getAccount(newAccountKey);
    if ('error' in addedAccount) {
      showErrorAlert(addedAccount.error, 'Unable to add account');
      setIsAddPending(false);
      return;
    }
    // update state
    setAccounts((prev) =>
      prev.concat({
        id: addedAccount.id,
        secretKey: addedAccount.secretKey,
        name: addedAccount?.settings?.dashboard?.display_name,
      })
    );

    // set as current account
    onSelectAccount(newAccountKey);
    setIsAddPending(false);
    setNewAccountKey('');
  }, [accounts, newAccountKey, onSelectAccount]);

  return (
    <ScrollView
      testID="merchant-select-screen"
      contentContainerStyle={styles.container}
    >
      <List bolded={false} topSpacing={false} title="Add New Merchant">
        <TextInput
          style={styles.input}
          value={newAccountKey}
          onChangeText={(value: string) => setNewAccountKey(value)}
          placeholder="sk_test_xxx"
          editable={!isAddPending}
        />
      </List>
      <ListItem
        color={colors.blue}
        title="Add Merchant"
        onPress={onAddAccount}
        disabled={isAddPending}
      />
      <List bolded={false} topSpacing={false} title="DIRECT PAYMENT">
        <TextInput
          style={styles.input}
          value={connectedStripeAccountID}
          onChangeText={onConnectedAccountInputChange}
          placeholder="Connected Stripe Account ID"
          editable={!isAddPending}
          onEndEditing={onEndInputTextContentChange}
        />
      </List>
      <List bolded={false} topSpacing={false} title="Select Merchant">
        <Picker
          selectedValue={account?.secretKey}
          style={styles.picker}
          itemStyle={styles.pickerItem}
          testID="select-merchant-picker"
          onValueChange={onSelectAccount}
        >
          {accounts.map((a) => (
            <Picker.Item
              key={a.id}
              label={`${a.name} (${a.id})`}
              testID={a.id || 'no-id'}
              value={a.secretKey}
            />
          ))}
        </Picker>
      </List>
      <List bolded={false} topSpacing={false} title="Remove Merchant(s)">
        <ListItem
          color={colors.blue}
          title="Remove Selected Merchant"
          onPress={onRemoveSelectedMerchant}
        />
        <ListItem
          color={colors.blue}
          title="Remove All Merchants"
          onPress={onRemoveAllMerchants}
        />
      </List>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light_gray,
    height: '100%',
  },
  pickerContainer: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: colors.white,
    left: 0,
    width: '100%',
    ...Platform.select({
      ios: {
        height: 200,
      },
    }),
  },
  input: {
    height: 44,
    backgroundColor: colors.white,
    paddingLeft: 16,
    marginBottom: 12,
    borderBottomColor: colors.gray,
    color: colors.dark_gray,
    ...Platform.select({
      ios: {
        borderBottomWidth: StyleSheet.hairlineWidth,
      },
      android: {
        borderBottomWidth: 1,
        borderBottomColor: `${colors.gray}66`,
      },
    }),
  },
  picker: {
    width: '100%',
    ...Platform.select({
      android: {
        color: colors.slate,
        fontSize: 13,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 10,
        backgroundColor: colors.white,
      },
    }),
  },
  pickerItem: {
    fontSize: 16,
    color: colors.slate,
  },
  text: {
    paddingHorizontal: 12,
    color: colors.white,
  },
});
