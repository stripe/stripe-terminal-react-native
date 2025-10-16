# Error Handling Utilities

This guide shows how to use the enhanced error handling utilities in the example app while maintaining backward compatibility with existing code.

## Getting started

The error handling utilities provide safer, more consistent error handling across the example app. You can adopt them gradually without breaking existing functionality.

## Key utilities

### Error display functions

```typescript
import { showErrorAlert, showErrorToast } from './src/util/errorHandling';

// Enhanced Alert with automatic error extraction
showErrorAlert(error, 'Connection failed');

// Simplified Toast with consistent configuration
showErrorToast(error);
```

### Error information extraction

```typescript
import { getErrorMessage, getErrorCode, extractErrorInfo } from './src/util/errorHandling';

// Safe error message extraction
const message = getErrorMessage(error, 'Unknown error');

// Safe error code extraction
const code = getErrorCode(error, 'UNKNOWN_ERROR');

// Complete error information for logging
const errorInfo = extractErrorInfo(error, 'Payment processing');
```

## Migration examples

### Alert error display

```typescript
// Before
Alert.alert('setReaderDisplay error', error.message);

// After
import { showErrorAlert } from './src/util/errorHandling';
showErrorAlert(error, 'setReaderDisplay error');
```

### Toast error display

```typescript
// Before
let toast = Toast.show(error?.message ? error.message : 'unknown error', {
  duration: Toast.durations.LONG,
  position: Toast.positions.BOTTOM,
  shadow: true,
  animation: true,
  hideOnPress: true,
  delay: 0,
});
setTimeout(() => Toast.hide(toast), 3000);

// After
import { showErrorToast } from './src/util/errorHandling';
showErrorToast(error);
```

### Error logging

```typescript
// Before
metadata: {
  errorCode: resp.error.code,
  errorMessage: resp.error.message,
}

// After
import { extractErrorInfo } from './src/util/errorHandling';
metadata: extractErrorInfo(resp.error, 'Setup Intent Creation');
```

## Benefits

- **Safer**: Handles undefined error properties automatically
- **Consistent**: Standardized error display across the app
- **Concise**: Reduces boilerplate code
- **Type-safe**: Full TypeScript support
- **Backward compatible**: Existing code continues to work

## Migration strategy

1. **Start with imports**: Add utility imports without changing existing logic
2. **Replace simple cases**: Begin with basic error message extraction
3. **Optimize complex logic**: Replace verbose Toast and Alert configurations
4. **Test thoroughly**: Ensure changes don't break existing functionality

## Additional utilities

The error handling module also provides:

- `checkIfObjectIsStripeError()`: Type-safe error checking
- `createStripeError()`: Create custom StripeError objects
- Legacy compatibility aliases for existing patterns

For complete API documentation, see the utility functions in `src/util/errorHandling.ts`.