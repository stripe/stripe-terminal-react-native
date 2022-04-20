import type { Api as IApi } from './api/api';

export type IAppContext = {
  api: IApi;
  lastSuccessfulChargeId: string | null;
  setLastSuccessfulChargeId: (id: string) => void;
};

export type IShortAccount = {
  id?: string | null;
  name?: string | null;
  secretKey: string;
};

export type Api = IApi;
