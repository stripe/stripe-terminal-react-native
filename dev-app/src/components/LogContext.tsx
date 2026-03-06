import { createContext, type SetStateAction } from 'react';

export type Event = {
  name: string;
  description: string;
  metadata?: Record<string, string | null | undefined>;
  onBack?(): void;
};

export type Log = {
  name: string;
  events: Array<Event>;
};

export type CancelType = {
  label: string;
  isDisabled: boolean;
  action: () => void;
};

type ContextType = {
  logs: Array<Log>;
  addLogs: (newLog: Log) => void;
  clearLogs: () => void;
  cancel: CancelType | null;
  setCancel: (c: SetStateAction<CancelType | null>) => void;
};

export const LogContext = createContext<ContextType>({
  logs: [],
  addLogs: () => {},
  clearLogs: () => {},
  cancel: null,
  setCancel: () => {},
});
