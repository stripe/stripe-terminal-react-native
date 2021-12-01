export * from './types';
export * from './functions';

console.disableYellowBox = true;

// hooks
export {
  useStripeTerminal,
  Props as UseStripeTerminalProps,
  CHANGE_CONNECTION_STATUS_LISTENER_NAME,
  CHANGE_PAYMENT_STATUS_LISTENER_NAME,
  FINISH_DISCOVERING_READERS_LISTENER_NAME,
  FINISH_INSTALLING_UPDATE_LISTENER_NAME,
  REPORT_AVAILABLE_UPDATE_LISTENER_NAME,
  REPORT_UNEXPECTED_READER_DISCONNECT,
  REPORT_UPDATE_PROGRESS_LISTENER_NAME,
  REQUEST_READER_DISPLAY_MESSAGE,
  REQUEST_READER_INPUT_LISTENER_NAME,
  START_INSTALLING_UPDATE_LISTENER_NAME,
  UPDATE_DISCOVERED_READERS_LISTENER_NAME,
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
