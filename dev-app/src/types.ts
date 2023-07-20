import type { Stripe } from 'stripe';
import type { Api as IApi } from './api/api';
import type { ChargeType } from '@stripe/stripe-terminal-react-native';

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
};

export type IShortAccount = {
  id?: string | null;
  name?: string | null;
  secretKey: string;
  stripeAccountID: string;
  connectedAccountType: ChargeType;
};

export type Api = IApi;
