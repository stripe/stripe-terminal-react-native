import {
  API_URL as defaultURL,
  API_URL_ANDROID as androidURL,
  API_CA_URL as defaultCaURL,
  API_CA_URL_ANDROID as androidCaURL,
  // @ts-ignore
} from '@env';
import { Platform } from 'react-native';
import { LaunchArguments } from 'react-native-launch-arguments';

interface DetoxLaunchArguments {
  canada?: boolean;
}

const args = LaunchArguments.value<DetoxLaunchArguments>();

const API_CA_URL = Platform.OS === 'android' ? androidCaURL : defaultCaURL;

export const API_URL: string = args.canada
  ? API_CA_URL
  : Platform.OS === 'android' && androidURL
  ? androidURL
  : defaultURL;
