## Runing e2e tests

### Android

1. Create an Android emulator with a name that matches the name found in `.detoxrc.json`
1. Run `yarn detox build --configuration android`
1. Run `yarn e2e:test:android`

### iOS

prereqs: Ensure AppleSimulatorUtils are installed

```
brew tap wix/brew
brew install applesimutils
```

1. Create an iOS simulator with a name that matches the name found in `.detoxrc.json`
1. Run `yarn detox build --configuration ios`
1. launch the simulator
1. Run `yarn e2e:test:ios`
