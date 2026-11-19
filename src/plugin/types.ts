/**
 * Options for the SDK's Expo config plugin, set in the app config:
 *
 * @example
 * ```json
 * {
 *   "plugins": [
 *     [
 *       "@stripe/stripe-terminal-react-native",
 *       { "bluetoothBackgroundMode": true, "tapToPayCheck": true }
 *     ]
 *   ]
 * }
 * ```
 */
export type StripeTerminalPluginProps = {
  /** iOS: adds `bluetooth-central` to `UIBackgroundModes`. */
  bluetoothBackgroundMode?: boolean;
  /** iOS: `NSLocationWhenInUseUsageDescription`. Defaults to a generic message. */
  locationWhenInUsePermission?: string;
  /** iOS: `NSBluetoothPeripheralUsageDescription`. Defaults to a generic message. */
  bluetoothPeripheralPermission?: string;
  /** iOS: `NSBluetoothAlwaysUsageDescription`. Defaults to a generic message. */
  bluetoothAlwaysUsagePermission?: string;
  /** iOS: `NSLocalNetworkUsageDescription`. Defaults to a generic message. */
  localNetworkUsagePermission?: string;
  /**
   * Android: returns early from `MainApplication.onCreate` when the app is
   * started in the Tap to Pay process.
   */
  tapToPayCheck?: boolean;
  /** Android: calls `TerminalApplicationDelegate.onCreate` from `MainApplication`. */
  appDelegate?: boolean;
};
