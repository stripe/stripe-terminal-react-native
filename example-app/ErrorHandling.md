# Error Handling Utilities

The example app includes enhanced error handling utilities that provide safer, more consistent error handling across the application while maintaining backward compatibility with existing code.

## Key utilities

The error handling utilities provide automatic error extraction, type safety, and consistent error display patterns.

```typescript
import { 
  showErrorAlert, 
  showErrorToast, 
  getErrorMessage, 
  getErrorCode 
} from './src/util/errorHandling';

// Enhanced Alert with automatic error extraction
showErrorAlert(error, 'Connection failed');

// Simplified Toast with consistent configuration
showErrorToast(error);

// Safe error message/code extraction
const message = getErrorMessage(error, 'Unknown error');
const code = getErrorCode(error, 'UNKNOWN_ERROR');
```

## Usage examples

### Alert error display

```typescript
// Before
Alert.alert('Error', error.message);

// After
showErrorAlert(error, 'Error');
```

### Toast error display

```typescript
// Before
Toast.show(error?.message || 'unknown error', { 
  duration: Toast.durations.LONG,
  position: Toast.positions.BOTTOM,
  // ... additional configuration
});

// After
showErrorToast(error);
```

## Key benefits

The error handling utilities provide several advantages:

- **Type Safety**: Full TypeScript support prevents runtime errors
- **Automatic Error Handling**: Safely handles undefined error properties
- **Consistent Display**: Standardized error presentation across the app
- **Reduced Boilerplate**: Eliminates repetitive error handling code
- **Backward Compatibility**: Existing code continues to work without changes

## Additional utilities

The error handling module also provides:

- `extractErrorInfo()`: Complete error information extraction for logging
- `checkIfObjectIsStripeError()`: Type-safe error validation
- Legacy compatibility functions for existing patterns

For complete API documentation, see the utility functions in `src/util/errorHandling.ts`.
