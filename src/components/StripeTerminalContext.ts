import { createContext } from 'react';
import type { Reader, InitParams, InitializeResultType } from '../types';

type ContextType = {
  loading: boolean;
  isInitialized: boolean;
  connectedReader?: Reader.Type | null;
  discoveredReaders: Reader.Type[];
  setLoading(value: boolean): void;
  setIsInitialized(value: boolean): void;
  setConnectedReader(value: Reader.Type | null): void;
  setDiscoveredReaders(value: Reader.Type[]): void;
  initialize?(params: InitParams): Promise<InitializeResultType>;
  log(code: string, message?: any): void;
};

export const StripeTerminalContext = createContext<ContextType>({
  discoveredReaders: [],
  loading: false,
  isInitialized: false,
  log: () => {},
  setLoading: () => {},
  setIsInitialized: () => {},
  setConnectedReader: () => {},
  initialize: undefined,
  setDiscoveredReaders: () => {},
});
