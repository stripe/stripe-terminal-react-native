import React, { useCallback, useEffect, useState, useContext } from 'react';
import { StyleSheet, ScrollView, Platform, TextInput } from 'react-native';

import { Picker } from '@react-native-picker/picker';

import { colors } from '../colors';
import List from '../components/List';
import ListItem from '../components/ListItem';
import { AppContext } from '../AppContext';
import { ClientApi } from '../api/client-api';
import type { IShortAccount } from '../types';
import { getStoredAccounts, setStoredAccounts } from '../util/merchantStorage';

export default function MerchantSelectScreen() {
  const { account, setAccount } = useContext(AppContext);
  const [accounts, setAccounts] = useState<Array<IShortAccount>>([]);
  const [isAddPending, setIsAddPending] = useState<boolean>(false);
  const [newMerchantKey, setNewMerchantKey] = useState<string>('');

  // on init load all stored accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const storedAccounts = await getStoredAccounts();
        setAccounts(storedAccounts);
      } catch (e) {
        console.log(e);
        // error reading value
      }
    };

    fetchAccounts();
  }, []);

  const onSelectMerchant = useCallback(
    async (secretKey: string) => {
      setAccount({ selectedAccountKey: secretKey });
    },
    [setAccount]
  );

  // write list of accounts to storage whenever it's changed
  useEffect(() => {
    setStoredAccounts(accounts);
  }, [accounts]);

  const onAddMerchant = useCallback(async () => {
    setIsAddPending(true);
    const addedAccount = await ClientApi.getAccount(newMerchantKey);

    if ('error' in addedAccount) {
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
    onSelectMerchant(newMerchantKey);
    setIsAddPending(false);
    setNewMerchantKey('');
  }, [newMerchantKey, onSelectMerchant]);

  return (
    <ScrollView
      testID="merchant-select-screen"
      contentContainerStyle={styles.container}
    >
      <List bolded={false} topSpacing={false} title="Add New Merchant">
        <TextInput
          style={styles.input}
          value={newMerchantKey}
          onChangeText={(value: string) => setNewMerchantKey(value)}
          placeholder="sk_test_xxx"
          editable={!isAddPending}
        />
        <ListItem
          color={colors.blue}
          title="Add Merchant"
          onPress={onAddMerchant}
          disabled={isAddPending}
        />
      </List>
      <List bolded={false} topSpacing={false} title="Select Merchant">
        <Picker
          selectedValue={account?.secretKey}
          style={styles.picker}
          itemStyle={styles.pickerItem}
          testID="update-plan-picker"
          onValueChange={onSelectMerchant}
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
