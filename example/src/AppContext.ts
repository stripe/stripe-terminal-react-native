import React from 'react';

import type { IAppContext } from './types';

export const AppContext = React.createContext<IAppContext>({
  api: null,
  account: null,
  setAccount: (_k) => null,
});
