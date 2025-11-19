import { Alert } from 'react-native';
import Toast from 'react-native-root-toast';
import { checkIfObjectIsStripeError } from '../../../src/Errors/StripeErrorHelpers';
import { DevAppError } from '../errors/DevAppError';

/**
 * Error handling utilities for dev-app
 *
 * Provides consistent error handling across the application with support for:
 * - StripeError (from SDK)
 * - DevAppError (custom app errors)
 * - Standard JavaScript Error
 * - Unknown error values
 */

// Toast configuration
const DEFAULT_TOAST_CONFIG = {
  duration: Toast.durations.LONG,
  position: Toast.positions.BOTTOM,
  shadow: true,
  animation: true,
  hideOnPress: true,
  delay: 0,
};

const DEFAULT_TOAST_AUTO_HIDE_DELAY = 3000;

/**
 * Error information structure for logging and debugging
 */
export interface ErrorInfo {
  errorCode: string;
  errorMessage: string;
  nativeErrorCode?: string;
  paymentIntent?: string;
  setupIntent?: string;
  refund?: string;
  context?: string;
}

/**
 * Gets a safe error message string
 */
export function getErrorMessage(
  error: unknown,
  fallback = 'Unknown error occurred'
): string {
  if (checkIfObjectIsStripeError(error)) {
    return error.message;
  } else if (error instanceof Error) {
    return error.message;
  } else if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  } else {
    return error ? String(error) : fallback;
  }
}

/**
 * Gets a safe error code string
 */
export function getErrorCode(
  error: unknown,
  fallback = 'UNKNOWN_ERROR'
): string {
  if (checkIfObjectIsStripeError(error)) {
    return error.code;
  } else if (error instanceof DevAppError) {
    return error.code;
  } else if (error instanceof Error) {
    return error.name || 'Error';
  } else {
    return fallback;
  }
}

/**
 * Shows an error Alert with proper title and message handling
 */
export function showErrorAlert(error: unknown, customTitle?: string): void {
  const title = customTitle || getErrorCode(error, 'Error');
  const message = getErrorMessage(error);
  Alert.alert(title, message);
}

/**
 * Shows an error Toast with consistent configuration
 * @returns Object with toastId and optional cleanup function
 */
export function showErrorToast(
  error: unknown,
  customConfig?: Partial<typeof DEFAULT_TOAST_CONFIG>,
  autoHideDelay: number = DEFAULT_TOAST_AUTO_HIDE_DELAY
): { toastId: number; cleanup: () => void } {
  const message = getErrorMessage(error);
  const config = { ...DEFAULT_TOAST_CONFIG, ...customConfig };
  const toastId = Toast.show(message, config);

  let timerId: ReturnType<typeof setTimeout> | undefined;
  if (autoHideDelay > 0) {
    timerId = setTimeout(() => {
      Toast.hide(toastId);
    }, autoHideDelay);
  }

  return {
    toastId,
    cleanup: () => {
      if (timerId) {
        clearTimeout(timerId);
      }
      Toast.hide(toastId);
    },
  };
}

/**
 * Extracts comprehensive error information for logging and debugging
 */
export function extractErrorInfo(
  error: unknown,
  additionalContext?: string | Record<string, unknown>
): ErrorInfo {
  if (checkIfObjectIsStripeError(error)) {
    return {
      errorCode: error.code,
      errorMessage: error.message,
      nativeErrorCode: error.nativeErrorCode,
      paymentIntent: error.paymentIntent
        ? JSON.stringify(error.paymentIntent, undefined, 2)
        : undefined,
      setupIntent: error.setupIntent
        ? JSON.stringify(error.setupIntent, undefined, 2)
        : undefined,
      refund: error.refund
        ? JSON.stringify(error.refund, undefined, 2)
        : undefined,
      context: additionalContext
        ? typeof additionalContext === 'string'
          ? additionalContext
          : JSON.stringify(additionalContext)
        : undefined,
    };
  } else if (error instanceof DevAppError) {
    let mergedContext: string | undefined;

    if (error.context && additionalContext) {
      if (typeof additionalContext === 'string') {
        mergedContext = JSON.stringify({
          errorContext: error.context,
          additionalContext,
        });
      } else {
        mergedContext = JSON.stringify({
          errorContext: error.context,
          ...additionalContext,
        });
      }
    } else if (error.context) {
      mergedContext = error.context;
    } else if (additionalContext) {
      mergedContext =
        typeof additionalContext === 'string'
          ? additionalContext
          : JSON.stringify(additionalContext);
    }

    return {
      errorCode: error.code,
      errorMessage: error.message,
      nativeErrorCode: error.nativeErrorCode,
      paymentIntent: error.paymentIntent,
      setupIntent: error.setupIntent,
      refund: error.refund,
      context: mergedContext,
    };
  } else if (error instanceof Error) {
    return {
      errorCode: error.name || 'Error',
      errorMessage: error.message,
      context: additionalContext
        ? typeof additionalContext === 'string'
          ? additionalContext
          : JSON.stringify(additionalContext)
        : undefined,
    };
  } else {
    return {
      errorCode: 'UNKNOWN_ERROR',
      errorMessage: String(error),
      context: additionalContext
        ? typeof additionalContext === 'string'
          ? additionalContext
          : JSON.stringify(additionalContext)
        : undefined,
    };
  }
}

/**
 * Backward compatibility wrapper
 */
export function safeErrorMessage(error: unknown): string {
  return getErrorMessage(error, 'unknown error');
}

export const ErrorUtils = {
  showAlert: showErrorAlert,
  showToast: showErrorToast,
  getInfo: extractErrorInfo,
  getMessage: getErrorMessage,
  getCode: getErrorCode,
  getSafeMessage: safeErrorMessage,
};

