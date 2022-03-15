export * from './types';
export * from './functions';

// hooks
export {
  useStripeTerminal,
  Props as UseStripeTerminalProps,
  CHANGE_CONNECTION_STATUS,
  CHANGE_PAYMENT_STATUS,
  FINISH_DISCOVERING_READERS,
  FINISH_INSTALLING_UPDATE,
  REPORT_AVAILABLE_UPDATE,
  REPORT_UNEXPECTED_READER_DISCONNECT,
  REPORT_UPDATE_PROGRESS,
  REQUEST_READER_DISPLAY_MESSAGE,
  REQUEST_READER_INPUT,
  START_INSTALLING_UPDATE,
  UPDATE_DISCOVERED_READERS,
} from './hooks/useStripeTerminal';

// components
export {
  StripeTerminalProvider,
  Props as StripeTerminalProviderProps,
} from './components/StripeTerminalProvider';

export {
  withStripeTerminal,
  WithStripeTerminalProps,
} from './components/withStripeTerminal';
