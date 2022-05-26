import type { Reader } from '@stripe/stripe-terminal-react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

const DISCOVERY_KEY = '@rn_example_discovery';

export const clearMerchantStorage = async () => AsyncStorage.clear();

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
