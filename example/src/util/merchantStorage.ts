import type { IShortAccount } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SELECTED_ACCOUNT_KEY = '@rn_selected_example_account';
const ACCOUNTS_KEY = '@rn_example_accounts';

export const getStoredAccounts = async (): Promise<Array<IShortAccount>> => {
  const jsonValue = await AsyncStorage.getItem(ACCOUNTS_KEY);
  const parsedValue = jsonValue ? JSON.parse(jsonValue) : [];
  return parsedValue;
};

export const setStoredAccounts = async (accounts: Array<IShortAccount>) => {
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

export const getSelectedAccount = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(SELECTED_ACCOUNT_KEY);
};

export const setSelectedAccount = async (accountKey: string) => {
  await AsyncStorage.setItem(SELECTED_ACCOUNT_KEY, accountKey);
};
