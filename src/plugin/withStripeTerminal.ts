import {
  ConfigPlugin,
  createRunOncePlugin,
  IOSConfig,
  withInfoPlist,
} from '@expo/config-plugins';

const pkg = require('stripe-terminal-react-native/package.json');

type StripeTerminalPluginProps = {
  bluetoothBackgroundMode?: boolean;
  locationWhenInUsePermission?: string;
  bluetoothPeripheralPermission?: string;
  bluetoothAlwaysUsagePermission?: string;
};

const withStripeTerminal: ConfigPlugin<StripeTerminalPluginProps> = (
  config,
  props
) => {
  config = withStripeTerminalIos(config, props);
  config = withNoopSwiftFile(config);

  return config;
};

/**
 * Grant bluetooth and location permissions.
 */
const withStripeTerminalIos: ConfigPlugin<StripeTerminalPluginProps> = (
  expoConfig,
  props
) => {
  return withInfoPlist(expoConfig, (config) => {
    if (props.bluetoothBackgroundMode) {
      config.modResults.UIBackgroundModes = ['bluetooth-central'];
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
