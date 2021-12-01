import { Platform } from 'react-native';
import ENV from 'react-native-config';

export const serverPort = '3002';

// Address to stripe server running on local machine
export const LOCAL_URL =
  Platform.OS === 'android' ? ENV.API_URL_ANDROID : ENV.API_URL_IOS;

export const API_URL = ENV.API_URL_CI || LOCAL_URL;
