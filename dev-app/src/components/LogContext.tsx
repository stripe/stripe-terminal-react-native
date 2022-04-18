import { createContext } from 'react';

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

type ContextType = {
  logs: Array<Log>;
  addLogs: (newLog: Log) => void;
  clearLogs: () => void;
};

export const LogContext = createContext<ContextType>({
  logs: [],
  addLogs: () => {},
  clearLogs: () => {},
});
