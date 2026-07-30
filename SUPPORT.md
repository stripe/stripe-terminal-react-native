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
