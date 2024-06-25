import React from 'react';

import type { IAppContext } from './types';
import { Api } from './api/api';

export const api = new Api();

export const AppContext = React.createContext<IAppContext>({
  api,
  account: null,
  setAccount: (_k) => null,
  lastSuccessfulChargeId: null,
  setLastSuccessfulChargeId: (_id) => null,
  lastSuccessfulPaymentIntentId: null,
  setLastSuccessfulPaymentIntentId: (_id) => null,
  lastSuccessfulAmount: null,
  setLastSuccessfulAmount: (_a) => null,
  autoReconnectOnUnexpectedDisconnect: false,
  setAutoReconnectOnUnexpectedDisconnect: (_b) => null,
  cachedLocations: [],
  setCachedLocations: (_locations) => null,
  refreshToken: false,
  setRefreshToken: (_b) => null,
});
