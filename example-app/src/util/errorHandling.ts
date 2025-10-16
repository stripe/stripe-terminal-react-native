import { Alert } from 'react-native';
import Toast from 'react-native-root-toast';
import { checkIfObjectIsStripeError } from '@stripe/stripe-terminal-react-native';

/**
 * Enhanced error handling utilities for example-app
 * 
 * These utilities provide consistent error handling while maintaining
 * backward compatibility with existing code patterns.
 */

// Toast configuration constants
const DEFAULT_TOAST_CONFIG = {
  duration: Toast.durations.LONG,
  position: Toast.positions.BOTTOM,
  shadow: true,
  animation: true,
  hideOnPress: true,
  delay: 0,
};

/**
 * Shows an error Alert with proper title and message handling
 * 
 * Backward compatible with existing Alert.alert(error.code, error.message) patterns
 */
export function showErrorAlert(error: unknown, customTitle?: string): void {
  if (checkIfObjectIsStripeError(error)) {
    // Use error.code as title (existing pattern) unless custom title provided
    const title = customTitle || error.code;
    Alert.alert(title, error.message);
  } else if (error instanceof Error) {
    Alert.alert(customTitle || 'Error', error.message);
  } else {
    Alert.alert(customTitle || 'Error', String(error));
  }
}

/**
 * Shows an error Toast with consistent configuration
 * 
 * Backward compatible with existing Toast.show() patterns
 */
export function showErrorToast(
  error: unknown, 
  customConfig?: Partial<typeof DEFAULT_TOAST_CONFIG>
): number {
  let message: string;
  
  if (checkIfObjectIsStripeError(error)) {
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
  } else {
    message = error ? String(error) : 'Unknown error occurred';
  }
  
  const config = { ...DEFAULT_TOAST_CONFIG, ...customConfig };
  const toast = Toast.show(message, config);
  
  // Auto-hide after 3 seconds (existing pattern)
  setTimeout(() => {
    Toast.hide(toast);
  }, 3000);
  
  return toast;
}

/**
 * Extracts error information for logging
 * 
 * Returns a consistent object structure for logging purposes
 */
export function extractErrorInfo(error: unknown, context?: string): {
  errorCode: string;
  errorMessage: string;
  nativeErrorCode?: string;
  context?: string;
} {
  if (checkIfObjectIsStripeError(error)) {
    return {
      errorCode: error.code,
      errorMessage: error.message,
      nativeErrorCode: error.nativeErrorCode,
      context,
    };
  } else if (error instanceof Error) {
    return {
      errorCode: 'UNKNOWN_ERROR',
      errorMessage: error.message,
      context,
    };
  } else {
    return {
      errorCode: 'UNKNOWN_ERROR',
      errorMessage: String(error),
      context,
    };
  }
}

/**
 * Gets a safe error message string
 * 
 * Backward compatible with error?.message patterns
 */
export function getErrorMessage(error: unknown, fallback = 'Unknown error occurred'): string {
  if (checkIfObjectIsStripeError(error)) {
    return error.message;
  } else if (error instanceof Error) {
    return error.message;
  } else {
    return error ? String(error) : fallback;
  }
}

/**
 * Gets a safe error code string
 * 
 * Provides consistent error codes for all error types
 */
export function getErrorCode(error: unknown, fallback = 'UNKNOWN_ERROR'): string {
  if (checkIfObjectIsStripeError(error)) {
    return error.code;
  } else {
    return fallback;
  }
}

/**
 * Enhanced version of existing pattern: error?.message ? error.message : 'unknown error'
 * 
 * This function maintains the exact same behavior while adding type safety
 */
export function safeErrorMessage(error: unknown): string {
  return getErrorMessage(error, 'unknown error');
}

// Legacy compatibility aliases - these maintain existing API patterns
export const ErrorUtils = {
  showAlert: showErrorAlert,
  showToast: showErrorToast,
  getInfo: extractErrorInfo,
  getMessage: getErrorMessage,
  getCode: getErrorCode,
  safeMSG: safeErrorMessage,
};
