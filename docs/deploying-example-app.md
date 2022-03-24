## Deploying Example App

// TODO - find a better location for this Stripe-specifc section prior to launch

### Android

The Android example app is deployed to [Firebase App Distribution](https://firebase.google.com/docs/app-distribution) via a CI job that executes after a successful merge to main:

https://github.com/stripe/stripe-terminal-react-native/blob/e285cc9710cada5bc99434cb0d157354efbd621d/.circleci/config.yml#L265

A unique APK is generated for each supported region (EU and US). See the [App Distribution Console](https://console.firebase.google.com/project/internal-terminal/appdistribution/app/android:com.example.stripeterminalreactnative/releases) to view releases, enable build access for users, and generate invite links.

### iOS

// TODO

### Backend

The Example backend is deployed to Heroku via a CI job that executes after a successful merge to main:

https://github.com/stripe/stripe-terminal-react-native/blob/e285cc9710cada5bc99434cb0d157354efbd621d/.circleci/config.yml#L296

A separate backend instance is generated for each supported region (EU and US):

- https://stripe-terminal-rn-example-eu.herokuapp.com/
- https://stripe-terminal-rn-example-us.herokuapp.com/
