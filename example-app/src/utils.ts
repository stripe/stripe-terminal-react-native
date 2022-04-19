import { Platform } from 'react-native';

export const isAndroid12orHigher = () => {
  return Platform.OS === 'android' && Platform.Version >= 31;
};
