import React, { useCallback, useEffect, useState, useContext } from 'react';
import {
  Alert,
  StyleSheet,
  ScrollView,
  Platform,
  TextInput,
} from 'react-native';

import { Picker } from '@react-native-picker/picker';

import { colors } from '../colors';
import List from '../components/List';
import ListItem from '../components/ListItem';
import { AppContext } from '../AppContext';
import { Api } from '../api/api';
import type { IShortAccount } from '../types';
import { getStoredAccounts, setStoredAccounts } from '../util/merchantStorage';

export default function MerchantSelectScreen() {
  const { account, setAccount } = useContext(AppContext);
  const [accounts, setAccounts] = useState<Array<IShortAccount>>([]);
  const [isAddPending, setIsAddPending] = useState<boolean>(false);
  const [newAccountKey, setNewAccountKey] = useState<string>('');

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

  const onSelectAccount = useCallback(
    async (secretKey: string | null) => {
      setAccount({ selectedAccountKey: secretKey });
    },
    [setAccount]
  );

  const onRemoveAllMerchants = useCallback(() => {
    setAccounts([]);
    onSelectAccount(null);
  }, [setAccounts, onSelectAccount]);

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
      Alert.alert('Unable to add account', addedAccount.error.message);
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
  }, [newAccountKey, onSelectAccount, accounts]);

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
        <ListItem
          color={colors.blue}
          title="Add Merchant"
          onPress={onAddAccount}
          disabled={isAddPending}
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
        backgroundColor: colors.white,
      },
    }),
  },
  pickerItem: {
    fontSize: 16,
  },
  text: {
    paddingHorizontal: 12,
    color: colors.white,
  },
});
