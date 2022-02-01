// @ts-ignore
import { API_URL as defaultURL, API_URL_ANDROID as androidURL } from '@env';
import { Platform } from 'react-native';

export const API_URL: string =
  Platform.OS === 'android' && androidURL ? androidURL : defaultURL;
