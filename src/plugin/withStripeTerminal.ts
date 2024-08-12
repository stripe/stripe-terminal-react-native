import {
  ConfigPlugin,
  createRunOncePlugin,
  IOSConfig,
  withInfoPlist,
  withAndroidManifest,
  withGradleProperties,
  AndroidConfig,
} from '@expo/config-plugins';

type InnerManifest = AndroidConfig.Manifest.AndroidManifest['manifest'];

type ManifestPermission = InnerManifest['permission'];

type AndroidManifest = {
  manifest: InnerManifest & {
    'permission'?: ManifestPermission;
    'uses-permission'?: InnerManifest['uses-permission'];
    'uses-feature'?: InnerManifest['uses-feature'];
  };
};

const pkg = require('@stripe/stripe-terminal-react-native/package.json');

type StripeTerminalPluginProps = {
  bluetoothBackgroundMode?: boolean;
  locationWhenInUsePermission?: string;
  bluetoothPeripheralPermission?: string;
  bluetoothAlwaysUsagePermission?: string;
  localNetworkUsagePermission?: string;
};

const withStripeTerminal: ConfigPlugin<StripeTerminalPluginProps> = (
  config,
  props
) => {
  config = withStripeTerminalIos(config, props);
  config = withNoopSwiftFile(config);
  config = withStripeTerminalAndroid(config);
  config = withJetifierIgnoringJackson(config);

  return config;
};

const withStripeTerminalAndroid: ConfigPlugin = (expoConfig) => {
  return withAndroidManifest(expoConfig, (config) => {
    config.modResults = addBTPermissionToManifest(config.modResults);
    config.modResults = addLocationPermissionToManifest(config.modResults);

    return config;
  });
};

const withJetifierIgnoringJackson: ConfigPlugin = (expoConfig) => {
  return withGradleProperties(expoConfig, (config) => {
    config.modResults.push({
      key: 'android.jetifier.ignorelist',
      value: 'jackson-core',
      type: 'property',
    });

    return config;
  });
};

export function addLocationPermissionToManifest(
  androidManifest: AndroidManifest
) {
  if (!Array.isArray(androidManifest.manifest['uses-permission'])) {
    androidManifest.manifest['uses-permission'] = [];
  }

  if (
    !androidManifest.manifest['uses-permission'].find(
      (item) =>
        item.$['android:name'] === 'android.permission.ACCESS_FINE_LOCATION'
    )
  ) {
    androidManifest.manifest['uses-permission']?.push({
      $: {
        'android:name': 'android.permission.ACCESS_FINE_LOCATION',
      },
    });
  }

  if (
    !androidManifest.manifest['uses-permission'].find(
      (item) =>
        item.$['android:name'] === 'android.permission.ACCESS_COARSE_LOCATION'
    )
  ) {
    androidManifest.manifest['uses-permission']?.push({
      $: {
        'android:name': 'android.permission.ACCESS_COARSE_LOCATION',
      },
    });
  }
  return androidManifest;
}

export function addBTPermissionToManifest(androidManifest: AndroidManifest) {
  // Add `<uses-permission android:name="android.permission.BLUETOOTH_CONNECT/SCAN"/>` to the AndroidManifest.xml
  if (!Array.isArray(androidManifest.manifest['uses-permission'])) {
    androidManifest.manifest['uses-permission'] = [];
  }

  if (
    !androidManifest.manifest['uses-permission'].find(
      (item) =>
        item.$['android:name'] === 'android.permission.BLUETOOTH_CONNECT'
    )
  ) {
    androidManifest.manifest['uses-permission']?.push({
      $: {
        'android:name': 'android.permission.BLUETOOTH_CONNECT',
      },
    });
  }

  if (
    !androidManifest.manifest['uses-permission'].find(
      (item) => item.$['android:name'] === 'android.permission.BLUETOOTH_SCAN'
    )
  ) {
    androidManifest.manifest['uses-permission']?.push({
      $: {
        'android:name': 'android.permission.BLUETOOTH_SCAN',
      },
    });
  }
  return androidManifest;
}

/**
 * Grant bluetooth and location permissions.
 */
const withStripeTerminalIos: ConfigPlugin<StripeTerminalPluginProps> = (
  expoConfig,
  props
) => {
  return withInfoPlist(expoConfig, (config) => {
    if (props.bluetoothBackgroundMode) {
      config.modResults.UIBackgroundModes = [
        ...(config.modResults.UIBackgroundModes ?? []),
        'bluetooth-central',
      ];
    }

    config.modResults.NSLocationWhenInUseUsageDescription =
      props.locationWhenInUsePermission ||
      'Location access is required in order to accept payments.';

    config.modResults.NSBluetoothPeripheralUsageDescription =
      props.bluetoothPeripheralPermission ||
      'Bluetooth access is required in order to connect to supported bluetooth card readers.';

    config.modResults.NSBluetoothAlwaysUsageDescription =
      props.bluetoothAlwaysUsagePermission ||
      'This app uses Bluetooth to connect to supported card readers.';

    config.modResults.NSLocalNetworkUsageDescription =
      props.localNetworkUsagePermission ||
      'This app uses the local WiFi network to connect to supported card readers.';
    return config;
  });
};

/**
 * Add a blank Swift file to the Xcode project for Swift compatibility.
 */
export const withNoopSwiftFile: ConfigPlugin = (config) => {
  return IOSConfig.XcodeProjectFile.withBuildSourceFile(config, {
    filePath: 'noop-file.swift',
    contents: [
      '//',
      '// @generated',
      '// A blank Swift file must be created for native modules with Swift files to work correctly.',
      '//',
      '',
    ].join('\n'),
  });
};

export default createRunOncePlugin(withStripeTerminal, pkg.name, pkg.version);
