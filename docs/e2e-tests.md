# Running e2e tests

End-to-end tests are driven by [Maestro](https://maestro.mobile.dev/) against the
dev app. The flows live in `maestro/app.yml` (and the `maestro/e2e/` sub-flows).

Install Maestro once:

```
curl -fsSL "https://get.maestro.mobile.dev" | bash
```

### Android

1. Start an Android emulator.
1. Build the dev app: `yarn e2e:build:android:release`
1. Install it: `adb install dev-app/android/app/build/outputs/apk/release/app-release.apk`
1. Run the tests: `yarn e2e:test:android:release`

### iOS

1. Boot an iOS simulator.
1. Build the dev app: `yarn e2e:build:ios:release`
1. Install it: `xcrun simctl install Booted dev-app/ios/build/Build/Products/Release-iphonesimulator/StripeTerminalReactNativeDevApp.app`
1. Run the tests: `yarn e2e:test:ios:release`
