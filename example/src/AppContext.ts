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
});
