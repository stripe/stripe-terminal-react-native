import {
  STRIPE_PRIVATE_KEY,
  STRIPE_PRIVATE_CA_KEY,
  // @ts-ignore
} from '@env';

import type { IShortAccount } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SELECTED_ACCOUNT_KEY = '@rn_selected_example_account';
const ACCOUNTS_KEY = '@rn_example_accounts';

export const getStoredAccounts = async (): Promise<Array<IShortAccount>> => {
  const jsonValue = await AsyncStorage.getItem(ACCOUNTS_KEY);
  const accts = jsonValue ? JSON.parse(jsonValue) : [];

  if (
    STRIPE_PRIVATE_KEY &&
    !accts.find((a: IShortAccount) => a.secretKey === STRIPE_PRIVATE_KEY)
  ) {
    accts.push({
      id: 'acct_1234',
      name: 'CI US TEST ACCT',
      secretKey: STRIPE_PRIVATE_KEY,
    });
  }

  if (
    STRIPE_PRIVATE_CA_KEY &&
    !accts.find((a: IShortAccount) => a.secretKey === STRIPE_PRIVATE_CA_KEY)
  ) {
    accts.push({
      id: 'acct_5555',
      name: 'CI CA TEST ACCT',
      secretKey: STRIPE_PRIVATE_CA_KEY,
    });
  }

  return accts;
};

export const setStoredAccounts = async (accounts: Array<IShortAccount>) =>
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

export const getSelectedAccount = async (): Promise<string | null> =>
  (await AsyncStorage.getItem(SELECTED_ACCOUNT_KEY)) || STRIPE_PRIVATE_KEY;

export const setSelectedAccount = async (accountKey: string) =>
  await AsyncStorage.setItem(SELECTED_ACCOUNT_KEY, accountKey);
