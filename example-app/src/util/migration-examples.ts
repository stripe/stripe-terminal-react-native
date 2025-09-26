/**
 * Example-App Error Handling Migration Examples
 *
 * This file demonstrates actual migration cases that can be directly copied to corresponding files
 */

// 🆕 Unified import - only need to add this one line to any file requiring error handling
import { showErrorAlert, getErrorMessage, getErrorCode, extractErrorInfo } from './errorHandling';

// ================================================================================
// 📝 Case 1: DiscoverReadersScreen.tsx - Line 169
// ================================================================================

// ❌ Original code:
// Alert.alert(error.code, error.message);

// ✅ Option A - Minimal change, identical behavior:
// showErrorAlert(error);

// ✅ Option B - Explicit control, safer:
// Alert.alert(getErrorCode(error), getErrorMessage(error));

// ================================================================================
// 📝 Case 2: ReaderDisplayScreen.tsx - Line 44 & 57
// ================================================================================

// ❌ Original code:
// Alert.alert('setReaderDisplay error', error.message);

// ✅ Enhanced version:
// showErrorAlert(error, 'setReaderDisplay error');

// ================================================================================
// 📝 Case 3: HomeScreen.tsx - Toast handling
// ================================================================================

// ❌ Original code (10+ lines):
/*
console.log('onDidForwardingFailure ' + error?.message);
let toast = Toast.show(error?.message ? error.message : 'unknown error', {
  duration: Toast.durations.LONG,
  position: Toast.positions.BOTTOM,
  shadow: true,
  animation: true,
  hideOnPress: true,
  delay: 0,
});
setTimeout(function () {
  Toast.hide(toast);
}, 3000);
*/

// ✅ Enhanced version (2 lines):
/*
import { getErrorMessage, showErrorToast } from '../util/errorHandling';

console.log('onDidForwardingFailure ' + getErrorMessage(error));
showErrorToast(error);
*/

// ================================================================================
// 📝 Case 4: SetupIntentScreen.tsx - Logging
// ================================================================================

// ❌ Original code:
/*
metadata: {
  errorCode: resp.error.code,
  errorMessage: resp.error.message,
}
*/

// ✅ Enhanced version:
/*
metadata: extractErrorInfo(resp.error, 'Setup Intent Creation')
// Returns: { errorCode, errorMessage, nativeErrorCode?, context }
*/

// ================================================================================
// 📝 Case 5: App.tsx - Initialization error
// ================================================================================

// ❌ Original code:
// Alert.alert('StripeTerminal init failed', error.message);

// ✅ Enhanced version:
// showErrorAlert(error, 'StripeTerminal init failed');

// ================================================================================
// 🚀 Migration Strategy Examples
// ================================================================================

/**
 * Phase 1: Only add imports, test utility functions
 */
function phase1Example() {
  // Keep existing code unchanged, only test new functions
  const error = new Error('test');
  console.log('Safe message:', getErrorMessage(error));
  console.log('Safe code:', getErrorCode(error));
}

/**
 * Phase 2: Replace simple cases
 */
function phase2Example(error: unknown) {
  // Start with simple Alert cases
  // Alert.alert(error.code, error.message); // Old
  showErrorAlert(error); // New
}

/**
 * Phase 3: Handle complex logic
 */
function phase3Example(error: unknown) {
  // Replace complex error handling
  const errorInfo = extractErrorInfo(error, 'User Action');
  console.log('Detailed error info:', errorInfo);
  showErrorAlert(error);
}

/**
 * Complete error handling function example
 */
export function handleOperationError(
  error: unknown,
  operation: string,
  showUI = true
): void {
  const errorInfo = extractErrorInfo(error, operation);

  // Log detailed error information
  console.error(`${operation} failed:`, errorInfo);

  // Show user-friendly error
  if (showUI) {
    showErrorAlert(error, `${operation} Error`);
  }
}

// Usage examples:
// handleOperationError(error, 'Payment Collection');
// handleOperationError(error, 'Reader Connection', false); // Don't show UI

export default {
  phase1Example,
  phase2Example,
  phase3Example,
  handleOperationError,
};
