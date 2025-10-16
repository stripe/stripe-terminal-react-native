# Example-App Error Handling Utility Guide

This guide demonstrates how to use the new error handling utilities while minimizing changes to existing code.

## 🎯 Design Principles

1. **Backward Compatible** - New utilities won't break existing code
2. **Progressive Migration** - Gradually replace existing error handling
3. **Preserve Existing Patterns** - Maintain current Alert and Toast usage habits

## 📝 Usage Examples

### 1️⃣ Existing Patterns → Enhanced Versions

#### **Alert Error Display**

```typescript
// Existing code (ReaderDisplayScreen.tsx:44)
Alert.alert('setReaderDisplay error', error.message);

// Enhanced version - safer error handling
import { showErrorAlert } from './src/util/errorHandling';
showErrorAlert(error, 'setReaderDisplay error');

// Or maintain exact same behavior
import { getErrorMessage } from './src/util/errorHandling';
Alert.alert('setReaderDisplay error', getErrorMessage(error));
```

#### **Toast Error Display**

```typescript
// Existing code (HomeScreen.tsx:40)
let toast = Toast.show(error?.message ? error.message : 'unknown error', {
  duration: Toast.durations.LONG,
  // ... config
});
setTimeout(() => Toast.hide(toast), 3000);

// Enhanced version - one line completes all logic
import { showErrorToast } from './src/util/errorHandling';
showErrorToast(error);

// Or replace only the error message part
import { safeErrorMessage } from '../util/errorHandling';
let toast = Toast.show(safeErrorMessage(error), { /* existing config */ });
```

#### **Error Code Handling**

```typescript
// Existing code (DiscoverReadersScreen.tsx:169)
Alert.alert(error.code, error.message);

// Enhanced version - safer
import { showErrorAlert } from './src/util/errorHandling';
showErrorAlert(error); // Automatically uses error.code as title

// Or more precise control
import { getErrorCode, getErrorMessage } from './src/util/errorHandling';
Alert.alert(getErrorCode(error), getErrorMessage(error));
```

#### **Logging**

```typescript
// Existing code (SetupIntentScreen.tsx:207-208)
metadata: {
  errorCode: resp.error.code,
  errorMessage: resp.error.message,
}

// Enhanced version - unified error info extraction
import { extractErrorInfo } from './src/util/errorHandling';
metadata: extractErrorInfo(resp.error, 'Setup Intent Creation')
// Returns: { errorCode, errorMessage, nativeErrorCode?, context }
```

### 2️⃣ Progressive Migration Strategy

#### **Phase 1: Add imports, keep existing logic**
```typescript
// Only import needed functions, existing code unchanged
import { getErrorMessage } from './src/util/errorHandling';

// Existing code remains unchanged, just safer
const message = getErrorMessage(error, 'fallback message');
```

#### **Phase 2: Gradually replace complex logic**
```typescript
// Replace complex Toast handling
import { showErrorToast } from './src/util/errorHandling';

// From this:
let toast = Toast.show(error?.message ? error.message : 'unknown error', {
  duration: Toast.durations.LONG,
  position: Toast.positions.BOTTOM,
  // ... 10 lines of config
});
setTimeout(() => Toast.hide(toast), 3000);

// To this:
showErrorToast(error);
```

#### **Phase 3: Unify error handling patterns**
```typescript
// Final goal: consistent error handling
import { showErrorAlert, extractErrorInfo } from '../util/errorHandling';

const handleError = (error: unknown, context: string) => {
  showErrorAlert(error);
  console.log('Error details:', extractErrorInfo(error, context));
};
```

## 🔧 Practical Application Examples

### ReaderDisplayScreen.tsx - Minimal Changes

```typescript
// Original code
if (error) {
  console.log('error', error);
  Alert.alert('setReaderDisplay error', error.message);
  return;
}

// Enhanced version - only modify one line
import { showErrorAlert } from './src/util/errorHandling';

if (error) {
  console.log('error', error);
  showErrorAlert(error, 'setReaderDisplay error'); // Safer
  return;
}
```

### HomeScreen.tsx - Toast Improvements

```typescript
// Original code
onDidForwardingFailure(error) {
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
}

// Enhanced version - simplified and safer
import { getErrorMessage, showErrorToast } from '../util/errorHandling';

onDidForwardingFailure(error) {
  console.log('onDidForwardingFailure ' + getErrorMessage(error));
  showErrorToast(error);
}
```

## ✅ Benefits

1. **Safer** - Automatically handles cases where `error.message` might be undefined
2. **More Consistent** - All error displays use the same format and configuration
3. **More Concise** - Reduces duplicate Toast configuration code
4. **Better Types** - TypeScript support reduces runtime errors
5. **Backward Compatible** - Existing code continues to work
6. **Easy Migration** - Provides staged migration strategy

## 🚀 Migration Recommendations

1. **Start by importing utilities** - Don't modify existing logic
2. **Replace simple cases** - Begin with the simplest error handling
3. **Gradually optimize** - Replace complex error handling logic when time permits
4. **Keep testing** - Ensure changes don't break existing functionality