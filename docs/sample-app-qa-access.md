## QA Example App Access

// TODO - find a better location for this Stripe-specifc section prior to launch

### Android

The Android example app is deployed to [Firebase App Distribution](https://firebase.google.com/docs/app-distribution) via a CI job that executes on successful merges to main.

A unique APK is generated for each supported region (EU and US). See the [App Distribution Console](https://console.firebase.google.com/project/internal-terminal/appdistribution/app/android:com.example.stripeterminalreactnative/releases) to view releases, enable build access for users, and generate invite links.

1. Visit the [App Distribution Console](https://console.firebase.google.com/project/internal-terminal/appdistribution/app/android:com.example.stripeterminalreactnative/releases) to view the internal release candidates.
2. Select an APK and add the email(s) of the testers that need access. This will generate email invite(s).
3. Have the tester(s) open the invite from their test device and follow the directions to download the APK.

### iOS

// TODO
