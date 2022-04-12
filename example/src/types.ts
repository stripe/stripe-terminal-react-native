import type { Stripe } from 'stripe';
import type { Api as IApi } from './api/api';

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
};

export type Api = IApi;
