import type { Stripe } from 'stripe';
import type { Api as IApi } from './api/api';
import type {
  LocaleConfig,
  Location,
} from '@stripe/stripe-terminal-react-native';

export type IAccount = Stripe.Account & { secretKey: string };

export type IAppContext = {
  api: IApi;
  account: IAccount | null;
  setAccount: ({
    selectedAccountKey,
  }: {
    selectedAccountKey: string | null;
  }) => void;
  lastSuccessfulChargeId: string | null;
  setLastSuccessfulChargeId: (id: string) => void;
  lastSuccessfulPaymentIntentId: string | null;
  setLastSuccessfulPaymentIntentId: (id: string) => void;
  lastSuccessfulPaymentClientSecret: string | null;
  setLastSuccessfulPaymentClientSecret: (id: string) => void;
  lastSuccessfulAmount: string | null;
  setLastSuccessfulAmount: (amount: string) => void;
  autoReconnectOnUnexpectedDisconnect: boolean | false;
  setAutoReconnectOnUnexpectedDisconnect: (b: boolean) => void;
  cachedLocations: Array<Location>;
  setCachedLocations: (locations: Array<Location>) => void;
  refreshToken: boolean;
  setRefreshToken: (b: boolean) => void;
  isServerlessAoDTest: boolean;
  localeConfig: LocaleConfig;
  setLocaleConfig: (localeConfig: LocaleConfig) => void;
  onStripeTerminalInitialized: (success: boolean) => Promise<boolean>;
};

export type IShortAccount = {
  id?: string | null;
  name?: string | null;
  secretKey: string;
};

export type Api = IApi;
