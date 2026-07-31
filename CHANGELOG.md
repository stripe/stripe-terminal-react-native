# Stripe Terminal React Native SDK changelog

This document details changes made to the SDK by version.

## 0.0.1-beta.32

Includes iOS native SDK [5.6.0](https://github.com/stripe/stripe-terminal-ios/releases/tag/5.6.0) and [5.7.0](https://github.com/stripe/stripe-terminal-ios/releases/tag/5.7.0), and Android native SDK [5.6.0](https://github.com/stripe/stripe-terminal-android/blob/master/CHANGELOG.md#560---2026-06-08) and [5.7.0](https://github.com/stripe/stripe-terminal-android/blob/master/CHANGELOG.md#570---2026-07-13).

### New

- Added `localeConfig` initialization support to configure localization of API error messages. Pass `{ type: 'cardLanguagePreferenceIfAvailable' }` to localize messages to the cardholder's preferred language when available, falling back to the device locale, or `{ type: 'hardcoded', locale: '<locale>' }` to use a fixed locale. API errors now include `localizationResult` when the native Terminal SDK provides localized error details.
- **Preview:** Surcharging is now supported on Tap to Pay readers (Tap to Pay on iPhone and Tap to Pay on Android). To request access to this preview, please contact [Stripe Support](https://support.stripe.com/). (from native 5.7.0)

### Updates

- Added a release and support lifecycle policy for the React Native SDK.
- Android: `onDidUpdateBatteryLevel` now only fires when the battery level, status, or charging state changes from the last reported value. Previously it fired on every battery poll (~every 10 minutes) regardless of whether the value changed. (from native 5.6.0)
- Android (Tap to Pay): API error messages from Tap to Pay attestation now default to English (`en-US`) instead of the application locale. (from native 5.6.0)
- Android (Tap to Pay): Discovered Tap to Pay readers that are already registered to a location now include their `location`, so it can be passed directly to `connectReader` without a separate location lookup. (from native 5.7.0)

### Fixes

- Android (Expo): Fixed the `tapToPayCheck` Expo config plugin option injecting the `TapToPay.isInTapToPayProcess()` guard in the wrong position in `MainApplication.kt` when other plugins that modify `onCreate()` are listed after `@stripe/stripe-terminal-react-native` in `app.config.ts`. The guard is now re-positioned immediately after `super.onCreate()` regardless of plugin order, ensuring code added by other plugins is correctly skipped in the Tap to Pay subprocess.
- iOS: Fixed crash when reloading the app in development or when the React Native bridge is torn down while a reader is connected or discovering. Events from the Terminal SDK were being sent to an invalidated bridge, causing an `NSInternalInconsistencyException` (`RCTCallableJSModules is not set`).
- Android: Fixed race condition where canceling a cancelable operation, such as calling `cancelCollectPaymentMethod()` within milliseconds of `collectPaymentMethod()`, could cause the operation to never resolve, leaving callers hanging indefinitely. (from native 5.6.0)
- Android: Fixed race condition where calling `cancelPaymentIntent()` or `cancelSetupIntent()` while `collectPaymentMethod` was in-flight on an internet reader could cause an unexpected disconnect after a 45-second timeout. (from native 5.6.0)
- Android: `onDidForwardPaymentIntent` offline callback now receives the up-to-date intent returned by the Stripe API rather than the stale locally-stored snapshot. (from native 5.6.0)
- Android: When programmatically canceling a payment on a smart reader, the error message is now `"Transaction is cancelled by the user."` instead of `"Job was canceled"`. (from native 5.6.0)
- Android (Tap to Pay): Fixed an issue where the immersive mode system overlay could cause the Tap to Pay collection screen to prematurely close. Fixes [#1120](https://github.com/stripe/stripe-terminal-react-native/issues/1120). (from native 5.6.0)
- iOS: Fixed a crash caused by a race condition during internal logging operations. (from native 5.6.0)
- iOS: Fixed a race condition where reader state could be mutated after a disconnect, leaving the SDK permanently stuck in the Connected state. (from native 5.6.0)
- iOS: **Preview:** Fixed an issue where `surchargeDetails.amount` was not included in the amount charged, which also caused an incorrect `maximumAmount` calculation. (from native 5.6.0)
- iOS: Fixed a mobile reader disconnect caused by a critically low battery being reported with the wrong reason. `onDidDisconnect` now receives `criticallyLowBattery` instead of `disconnectRequested`. (from native 5.7.0)
- Android: Fixed `collectPaymentMethod` not populating `PaymentIntent.paymentMethod` for non-card payment methods (e.g. Affirm) when `updatePaymentIntent` is enabled. (from native 5.7.0)
- Android (Tap to Pay): Fixed an issue where a reader could fail to connect when Keystore certificates registered to the device had expired. (from native 5.7.0)
- Android (Tap to Pay): Fixed `generatedCard` not being populated on `CardPresentDetails` after processing a `PaymentIntent`. (from native 5.7.0)
- Android (Tap to Pay): Fixed a crash when initiating payment collection in portrait orientation while the app was running in landscape. (from native 5.7.0)
- Android (Tap to Pay): Fixed a build issue where Terminal resource names could collide with those of certain third-party libraries. (from native 5.7.0)

## 0.0.1-beta.31 - 2026-05-28

Includes iOS native SDK [5.2.0](https://github.com/stripe/stripe-terminal-ios/releases/tag/5.2.0), [5.3.0](https://github.com/stripe/stripe-terminal-ios/releases/tag/5.3.0), [5.4.0](https://github.com/stripe/stripe-terminal-ios/releases/tag/5.4.0), [5.5.0](https://github.com/stripe/stripe-terminal-ios/releases/tag/5.5.0) and Android native SDK [5.5.0](https://github.com/stripe/stripe-terminal-android/blob/master/CHANGELOG.md#550---2026-05-06), [5.5.1](https://github.com/stripe/stripe-terminal-android/blob/master/CHANGELOG.md#551---2026-05-22).

### New

- Preview: Reauthorizations - Added support to authorize a `PaymentIntent` again after its capture window has lapsed.
  - Added `requestReauthorization` to `PaymentMethodOptions` for requesting reauthorization support when creating card-present PaymentIntents.
  - Added `reauthorizationStatus` and `reauthorizeBefore` response fields to `CardPresentDetails`.
  - To request access to this feature, please contact [Stripe Support](https://support.stripe.com/).
- Preview: Multicapture - Added multicapture support. The `collectPaymentMethod` params now accept a `requestMulticapture` field (`'ifAvailable' | 'never'`), and `CardPresentDetails` now exposes a `multicaptureStatus` field (`'available' | 'unavailable' | 'unknown'`).
  - To request access to this feature, please contact [Stripe Support](https://support.stripe.com/).
- Preview: Terminal Donations - Added support to skip donations flow per transaction by adding a `skipDonation` parameter to `CollectPaymentMethodParams` and `ProcessPaymentIntentParams`.
  - To request access to this private preview, please contact [Stripe Support](https://support.stripe.com/).
- Added `appTransitionAnimation` optional parameter to `ConnectAppsOnDevicesParams` and `EasyConnectAppsOnDevicesParams` (Android only). Controls the activity transition animation played when the reader app foregrounds during an [Apps on Devices](https://docs.stripe.com/terminal/features/apps-on-devices/overview) payment flow.
  - Accepts `{ type: 'systemDefault' }` (default), `{ type: 'preset', preset: AppTransitionPreset.SlideFromBottom }`, or `{ type: 'custom', enterAnim: number, exitAnim: number }`.
- Added support for [simulating software update scenarios](https://docs.stripe.com/terminal/references/testing#simulated-reader-updates) on physical mobile readers in sandbox or test mode.
  - Added `TestReaderUpdate` type and `UpdateComponent` enum. Set `testReaderUpdate` on `ConnectBluetoothReaderParams`, `ConnectBluetoothProximityReaderParams`, `ConnectUsbReaderParams`, or `ConnectTapToPayParams` (iOS only for Tap to Pay).
  - Added `components` field to `Reader.SoftwareUpdate` to expose which update components (firmware, config, keys, incremental) are included in an update.
  - **Breaking:** Removed `simulateReaderUpdate` function and `SimulateUpdateType` type in favor of this new per-connection API.
- Added Klarna as a supported payment method. `PaymentMethodType.Klarna` is now available and `klarnaDetails` is exposed on payment method details.
- Added `PaymentMethodType` const object with named values (`CardPresent`, `InteracPresent`, etc.) for use with `paymentMethodTypes` fields. String literals continue to work for backwards compatibility.
- Added the `captureBefore` response field to `CardPresentDetails`, previously only available via the server-side API.
- Added `lastSetupError` field to `SetupIntent`, exposing the error from the last failed setup attempt.
- Added `setupError` field to `SetupAttempt`, exposing the error from the setup attempt (available via `SetupIntent.latestAttempt`).
- Added new fields to `ApiErrorInformation`: `requestLogUrl`, `adviceCode`, `networkAdviceCode`, `networkDeclineCode`, `paymentMethod`, and `paymentMethodType`.

### Updates

- Preview: Surcharging - Expanded surcharge support: `amountDetails.surcharge` now includes `status` (`'available' | 'unavailable'`) and `maximumAmount` fields in addition to `amount`.
  - To request access to this feature, please contact [Stripe Support](https://support.stripe.com/).
- Updated `TapZoneFront` and `TapZoneBehind` types to enforce that `xBias` and `yBias` must be provided together or omitted together.
- Made `PaymentMethodOptions.requestedPriority` optional so `captureMethod` can be set independently.
- iOS + Android: Offline mode now falls back faster when the device cannot reach Stripe, with optimized per-request timeouts replacing the previous 15-second wait. (from native 5.5.0)
- Android: The simulated Tap to Pay payment collection screen UI was updated to match the livemode UI and can now be customized with [`setTapToPayUxConfiguration`](https://docs.stripe.com/terminal/payments/setup-reader/tap-to-pay?terminal-sdk-platform=android#user-interface). Pressing the screen simulates a successful payment; long pressing simulates a failed payment collection.

### Fixes

- Fixed `confirmPaymentIntent`, `processPaymentIntent`, `confirmSetupIntent`, and `processSetupIntent` invalidating unrelated intents on success, which could cause subsequent calls like `cancelPaymentIntent` to fail.
- Fixed `confirmPaymentIntent`, `processPaymentIntent`, `confirmSetupIntent`, and `processSetupIntent` not returning updated intent state on failure, preventing retry flows from working correctly.
- Fixed `disconnectReader`, `rebootReader`, and `clearCachedCredentials` not fully resetting SDK state for setup intents.
- Android: Fixed `disconnectReader` and `rebootReader` discarding intent state before the operation completes, which could lose intents if the call failed.
- Fixed `interacPresent` being silently dropped from `paymentMethodTypes` on iOS and Android when passed as a camelCase string.
- iOS: Fixed race condition causing Tap to Pay reader reconnection failures when the app returns to the foreground. (from native 5.2.0)
- iOS: Fixed race condition crash when connecting to readers. (from native 5.3.0)
- iOS: Fixed crash caused by delegate callbacks and completion handlers being dispatched on background threads under Swift concurrency. (from native 5.4.0)
- iOS: Fixed race condition crash during Bluetooth mobile reader discovery. (from native 5.5.0)
- Improved internal SDK telemetry to prevent OOM crashes during extended offline operation. The in-memory trace and event queues are now each capped at ~2 MB independently, and uploads are bounded, serialized, and time-limited so traces accumulating during long network outages can't grow unbounded or block on stuck requests. Set `logLevel: 'verbose'` on `StripeTerminalProvider` to print log upload diagnostics on the console.

## 0.0.1-beta.30 - 2026-04-23

Includes Android native SDK [5.2.0](https://github.com/stripe/stripe-terminal-android/blob/master/CHANGELOG.md#520---2026-01-30), [5.3.0](https://github.com/stripe/stripe-terminal-android/blob/master/CHANGELOG.md#530---2026-03-03), [5.4.0](https://github.com/stripe/stripe-terminal-android/blob/master/CHANGELOG.md#540---2026-03-30), [5.4.1](https://github.com/stripe/stripe-terminal-android/blob/master/CHANGELOG.md#541---2026-04-13).

### Fixes

- Fixed an issue with memory allocation causing connections to Tap to Pay on Android readers to fail. (from native 5.4.1)
- Fixed an issue where Tap to Pay connections failed with a `TAP_TO_PAY_INSECURE_ENVIRONMENT` error on certain devices even when developer options were not enabled. (from native 5.4.1)
- Fixed an issue where calling `discoverReaders()` while a reader is already connected incorrectly resets the internal connection status, causing subsequent operations to fail with a "You did not provide an API key" error. (from native 5.3.0)
- Fixed Bluetooth/USB auto-reconnection for a mobile reader hanging indefinitely, requiring a restart. (from native 5.4.0)
- Fixed issue where tap zone would change size on tablets depending on portrait or landscape orientation. (from native 5.4.0)
- Fixed `SecurityException` when user taps and removes a card quickly. (from native 5.4.0)
- Fixed stale network connectivity state in offline mode caused by multiple failed health checks polluting the connection pool. (from native 5.2.0)
- Fixed names of internal layout files to prevent conflicts when using both Tap to Pay and the Stripe SDK. (from native 5.2.0)

## 0.0.1-beta.29 - 2026-03-06

Includes iOS native SDK [5.0.0](https://github.com/stripe/stripe-terminal-ios/releases/tag/5.0.0), [5.1.0](https://github.com/stripe/stripe-terminal-ios/releases/tag/5.1.0), [5.1.1](https://github.com/stripe/stripe-terminal-ios/releases/tag/5.1.1) and Android native SDK [5.0.0](https://github.com/stripe/stripe-terminal-android/blob/master/CHANGELOG.md#500---2025-11-03), [5.1.0](https://github.com/stripe/stripe-terminal-android/blob/master/CHANGELOG.md#510---2025-12-03), [5.1.1](https://github.com/stripe/stripe-terminal-android/blob/master/CHANGELOG.md#511---2025-12-16).

### New

- **Preview:** Added Discover card acceptance for Tap to Pay on Android (Public Preview).
- **Preview:** Added simulated reader support for Mail Order / Telephone Order (MOTO) transactions.
- **Preview:** Added QR-based payment support on mobile readers (Public Preview).
- Added `processPaymentIntent` and `processSetupIntent` methods that combine the collect and confirm steps into a single operation. The existing `collectPaymentMethod`/`confirmPaymentIntent` and `collectSetupIntentPaymentMethod`/`confirmSetupIntent` methods continue to work but the unified methods are recommended.
- Added `easyConnect` API that combines reader discovery and connection into a single method call for smart readers and Tap to Pay integrations. Added `DiscoveryFilter` type to filter internet reader discovery by reader ID or serial number.
- Added `AppsOnDevicesTokenProvider` for serverless Apps-on-Devices mode. "Handoff" has been renamed to "Apps on Devices" across all class names.
- Added `RECONNECTING` connection status value, emitted during auto-reconnect operations for mobile readers (Bluetooth/USB) and Tap to Pay readers, providing better observability into reconnection state.
- Added missing `requiredForOffline` and `lowBatterySucceedConnect` in `SimulateUpdateType`.

### Updates

- **Breaking:** Changed customer cancellation to be enabled by default on supported readers. The previous `enableCustomerCancellation` boolean has been replaced with a `customerCancellation` parameter accepting `ENABLE_IF_AVAILABLE` (default) or `DISABLE_IF_AVAILABLE`. If your integration previously relied on customer cancellation being off, you must explicitly set `DISABLE_IF_AVAILABLE`.
- **Breaking:** Redesigned error handling. The SDK now provides a structured `StripeError` interface with standardized error codes, rich metadata (including decline codes, payment intent state), and TypeScript type safety. The legacy `CommonError` enum (`Failed`, `Canceled`, `Unknown`) has been removed. See the Error Handling section in README.md for details.
- **Breaking:** Replaced `collectRefundPaymentMethod`, `cancelCollectRefundPaymentMethod`, `confirmRefund`, and `cancelConfirmRefund` with `processRefund` and `cancelProcessRefund`.
- **Breaking:** Changed Interac refunds using a PaymentIntent ID to require the PaymentIntent's `clientSecret` parameter. You can alternatively continue using the charge ID, which doesn't require `clientSecret`.
- **Breaking:** Removed Stripe Reader P400 support.
- **Breaking:** Android Tap to Pay: Production environments now fail reader discovery with `TAP_TO_PAY_INSECURE_ENVIRONMENT` if developer options, USB/Wi-Fi debugging, or other debug options are enabled on the device. This does not apply to simulated readers.
- **Breaking:** Simplified `connectReader` API: `discoveryMethod` has been moved from a separate second parameter into `ConnectReaderParams`, consolidating connection configuration into a single object.
- **Breaking:** Refactored `TapToPayUxConfiguration`. The `tapZoneIndicator` and `tapZonePosition` fields have been replaced by a single `TapZone` union type object. Each tap zone variant now carries its own position parameters directly.
- Updated React Native version to 0.82.
- Minimum iOS deployment target updated from iOS 14.0 to iOS 15.0. (from native 5.0.0)
- Android Tap to Pay now requires that your Android device's KeyStore supports hardware-backed key agreements (FEATURE_HARDWARE_KEYSTORE version 100+) and Android 13 (API 33) as a minimum OS version. (from native 5.0.0)

### Fixes

- iOS: Fixed a crash that could occur when calling disconnectReader with internet-connected readers (from native 5.1.1).
- Android: Updated TLS root certificates for Stripe domains (from native 5.1.1).
- Android: Fixed missing ProGuard configuration rules affecting Tap to Pay compilation (from native 5.1.0).
- Android: Fixed unexpected reader disconnects when cards cannot be properly read (from native 5.1.0).
- Android: Fixed issue preventing simulated Tap to Pay reader usage (from native 5.1.0).
- Android: Added missing processing status in PaymentIntent.
- iOS: Fixed magstripe data collection errors on smart readers (from native 5.0.0).
