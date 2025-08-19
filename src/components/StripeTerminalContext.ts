import { createContext } from 'react';
import type EventEmitter from 'react-native/Libraries/vendor/emitter/EventEmitter';
import type { Reader, InitializeResultType } from '../types';

type ContextType = {
  loading: boolean;
  isInitialized: boolean;
  getIsInitialized: () => boolean;
  connectedReader?: Reader.Type | null;
  discoveredReaders: Reader.Type[];
  emitter?: EventEmitter;
  setLoading(value: boolean): void;
  setConnectedReader(value: Reader.Type | null): void;
  setDiscoveredReaders(value: Reader.Type[]): void;
  initialize?(): Promise<InitializeResultType>;
  log(code: string, message?: any): void;
};

export const StripeTerminalContext = createContext<ContextType>({
  emitter: undefined,
  discoveredReaders: [],
  loading: false,
  isInitialized: false,
  getIsInitialized: () => false,
  log: () => {},
  setLoading: () => {},
  setConnectedReader: () => {},
  initialize: undefined,
  setDiscoveredReaders: () => {},
});
