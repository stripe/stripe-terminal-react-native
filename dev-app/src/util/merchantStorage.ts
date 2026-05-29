import type { Reader } from '@stripe/stripe-terminal-react-native';

import type { IShortAccount } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SELECTED_ACCOUNT_KEY = '@rn_selected_example_account';
const ACCOUNTS_KEY = '@rn_example_accounts';
const DISCOVERY_KEY = '@rn_example_discovery';
const CONNECTED_ACCOUNT_ID_KEY = '@rn_example_connected_account_key';
const SERVERLESS_AOD_TEST_PENDING_KEY = '@rn_example_serverless_aod_test_pending';

export const clearMerchantStorage = async () => AsyncStorage.clear();

export const getStoredAccounts = async (): Promise<Array<IShortAccount>> => {
  const jsonValue = await AsyncStorage.getItem(ACCOUNTS_KEY);
  return jsonValue ? JSON.parse(jsonValue) : [];
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
  (await AsyncStorage.getItem(SELECTED_ACCOUNT_KEY)) ||
  getPreloadedSecretKeys()[0] ||
  null;

export const setSelectedAccount = async (accountKey: string) =>
  await AsyncStorage.setItem(SELECTED_ACCOUNT_KEY, accountKey);

export const setStoredConnectedAccountID = async (
  storedConnectedAccountID: string
) =>
  await AsyncStorage.setItem(
    CONNECTED_ACCOUNT_ID_KEY,
    storedConnectedAccountID
  );

export const getStoredConnectedAccountID = async (): Promise<string | null> =>
  await AsyncStorage.getItem(CONNECTED_ACCOUNT_ID_KEY);

export const setServerlessAoDTestPending = (pending: boolean) =>
  AsyncStorage.setItem(SERVERLESS_AOD_TEST_PENDING_KEY, pending ? 'true' : 'false');

export const getServerlessAoDTestPending = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem(SERVERLESS_AOD_TEST_PENDING_KEY);
  return value === 'true';
};

export const clearServerlessAoDTestPending = () =>
  AsyncStorage.removeItem(SERVERLESS_AOD_TEST_PENDING_KEY);

export const getPreloadedSecretKeys = (): string[] =>
  (process.env.PRELOADED_SECRET_KEYS || '').split(',').filter(Boolean);
