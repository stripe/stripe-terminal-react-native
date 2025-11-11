import { Alert } from 'react-native';
import Toast from 'react-native-root-toast';
import { checkIfObjectIsStripeError } from '../../../src/Errors/StripeErrorHelpers';
import { ExampleAppError } from '../errors/ExampleAppError';

/**
 * Error handling utilities for example-app
 *
 * Provides consistent error handling across the application with support for:
 * - StripeError (from SDK)
 * - ExampleAppError (custom app errors)
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
  errorStep?: string;
  context?: string | Record<string, unknown>;
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
  } else if (error instanceof ExampleAppError) {
    return 'EXAMPLE_APP_ERROR';
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
      context: additionalContext,
    };
  } else if (error instanceof ExampleAppError) {
    let mergedContext: string | Record<string, unknown> | undefined;

    if (error.context && additionalContext) {
      if (
        typeof error.context === 'object' &&
        typeof additionalContext === 'object'
      ) {
        mergedContext = { ...error.context, ...additionalContext };
      } else if (typeof error.context === 'object') {
        mergedContext = { ...error.context, additionalContext };
      } else {
        mergedContext = { errorContext: error.context, additionalContext };
      }
    } else {
      mergedContext = error.context || additionalContext;
    }

    return {
      errorCode: 'EXAMPLE_APP_ERROR',
      errorMessage: error.message,
      errorStep: error.step,
      context: mergedContext,
    };
  } else if (error instanceof Error) {
    return {
      errorCode: error.name || 'Error',
      errorMessage: error.message,
      context: additionalContext,
    };
  } else {
    return {
      errorCode: 'UNKNOWN_ERROR',
      errorMessage: String(error),
      context: additionalContext,
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
