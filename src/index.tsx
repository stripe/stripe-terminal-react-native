export * from './types';
export * from './functions';

// hooks
export {
  useStripeTerminal,
  Props as UseStripeTerminalProps,
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

// utils
export { requestNeededAndroidPermissions } from './utils/androidPermissionsUtils';
export { requestNeededExpoAndroidPermissions } from './utils/androidExpoPermissionsUtils';
