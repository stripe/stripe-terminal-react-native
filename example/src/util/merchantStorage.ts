import {
  STRIPE_PRIVATE_KEY,
  STRIPE_PRIVATE_CA_KEY,
  // @ts-ignore
} from '@env';

import type { Reader } from 'stripe-terminal-react-native';

import type { IShortAccount } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SELECTED_ACCOUNT_KEY = '@rn_selected_example_account';
const ACCOUNTS_KEY = '@rn_example_accounts';
const DISCOVERY_KEY = '@rn_example_discovery';

export const clearMerchantStorage = async () => AsyncStorage.clear();

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

type ISetDiscoveryParams = {
  method: Reader.DiscoveryMethod;
  isSimulated: boolean;
};

export const setDiscoveryMethod = async ({
  method,
  isSimulated,
}: ISetDiscoveryParams) => {
  await AsyncStorage.setItem(
    DISCOVERY_KEY,
    JSON.stringify({ method, isSimulated })
  );
};

export const getDiscoveryMethod =
  async (): Promise<ISetDiscoveryParams | null> => {
    const disc = await AsyncStorage.getItem(DISCOVERY_KEY);

    if (!disc) {
      return null;
    }

    return JSON.parse(disc);
  };

export const setStoredAccounts = async (accounts: Array<IShortAccount>) =>
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

export const getSelectedAccount = async (): Promise<string | null> =>
  (await AsyncStorage.getItem(SELECTED_ACCOUNT_KEY)) || STRIPE_PRIVATE_KEY;

export const setSelectedAccount = async (accountKey: string) =>
  await AsyncStorage.setItem(SELECTED_ACCOUNT_KEY, accountKey);
