# Release & Support Lifecycle

## Current Public Preview Status

The Stripe Terminal React Native SDK is actively maintained and supports
production integrations today. We aim to release updates regularly to keep pace
with the Terminal iOS and Android SDKs and deliver the latest features,
reliability improvements, and fixes.

The SDK is currently in [public preview](https://docs.stripe.com/release-phases)
and released as beta versions, such as `0.0.1-beta.x`. During public preview,
Stripe supports the SDK, but users should expect to update regularly because
some breaking changes can occur as we keep pace with the underlying native SDKs.

We expect users to actively update to the latest beta version. Staying current
ensures your integration receives the latest fixes, improvements, and
compatibility updates from the Terminal iOS and Android SDKs.

## React Native Compatibility

The current SDK requires React Native 0.83 or newer and React 19.2 or newer.
Use the React, Babel, Metro, and native build-tool versions that correspond to
your application's React Native release.

| Dependency or tool | Minimum supported configuration | Current SDK development configuration | Planned policy |
| --- | --- | --- | --- |
| React Native | 0.83.0 | 0.85.x | Keep 0.83 as the floor until a future breaking change; move development to newer stable releases independently. |
| React | 19.2.0 | 19.2.3 | Follow the version required by the selected React Native release. |
| Babel | `@babel/core` `^7.25.2` and `@react-native/babel-preset` 0.83.x | `@babel/core` `^7.26.0` and `@react-native/babel-preset` 0.85.x | Follow the selected React Native release rather than setting an independent Babel floor. |
| Metro | `@react-native/metro-config` 0.83.x | `@react-native/metro-config` 0.85.x | Follow the selected React Native release. |
| TypeScript | `^5.8.3` | `^5.8.3` | Keep generated declarations compatible with supported React Native applications and upgrade after compatibility testing. |
| React Native Builder Bob | Not required by applications | 0.16.x | Upgrade as SDK build tooling; CI builds CommonJS, ES module, and TypeScript declaration outputs. |
| Android tooling | API 26; Gradle 9.0.0, Android Gradle Plugin 8.12.0, and Kotlin Gradle Plugin 2.2.0 for React Native 0.83 | SDK defaults: compile/target SDK 35, Gradle 9.0.0, Android Gradle Plugin 8.8.2, and Kotlin 2.3.21; the RN 0.85 dev app uses newer matching tooling | The minimum Kotlin compiler is 2.2.0; Terminal Android SDK 6.0 resolves Kotlin runtime libraries at 2.3.21. Follow each application's React Native toolchain while retaining API 26 as the SDK floor. |
| iOS tooling | iOS 16.0, Xcode 16.1, and CocoaPods 1.13 | Xcode 26.5 and CocoaPods 1.16.2 | Follow each application's React Native toolchain while retaining iOS 16.0 as the SDK floor. |

The React Native 0.83.0 minimum assumes an Xcode version compatible with that
release's bundled native dependencies. With Xcode 26.4 or newer, use React
Native 0.83.5 or newer; earlier 0.83 patch releases bundle an incompatible
version of `fmt`.

## Versioning

React Native SDK versions wrap specific versions of the Terminal iOS and Android
SDKs. The React Native SDK changelog identifies the native SDK versions included
in each release.

While the React Native SDK is in public preview, support and enforcement are
based on the underlying native SDK major versions included in each release. For
example, a React Native beta that includes Terminal iOS 5.x and Android 5.x
follows the [Terminal mobile SDK V5 lifecycle](https://docs.stripe.com/terminal/references/sdk-versioning).

## End-of-Life Enforcement

At the end of a native SDK major version's Deprecated phase, SDK versions that
include that native SDK major version will be blocked from connecting to
Terminal readers. Integrations using blocked SDK versions won't be able to
discover readers, connect to readers, or process payments.

You must upgrade to a React Native SDK version that includes supported native
SDK versions before the hard block date to avoid interruption to your payment
processing.

## Resources

- [Terminal SDK versioning and support policy](https://docs.stripe.com/terminal/references/sdk-versioning)
- [Migration guide](https://docs.stripe.com/terminal/references/sdk-migration-guide)
- [React Native SDK changelog](https://github.com/stripe/stripe-terminal-react-native/blob/main/CHANGELOG.md)

## Additional Notes

Tap to Pay functionality within Terminal may have additional constraints that
require upgrades to your SDK in advance of the timeline described in this
document. For more information, see the
[Tap to Pay security guidance](https://docs.stripe.com/terminal/references/ttpa-security-guidance).
