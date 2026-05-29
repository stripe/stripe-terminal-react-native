import type { Location, LocationStatus } from './';
import type { StripeError } from './StripeError';

export namespace Reader {
  export type DiscoveryMethod = IOS.DiscoveryMethod | Android.DiscoveryMethod;

  export type Type = IOS.Type &
    Android.Type & {
      id: string;
      label?: string;
      batteryLevel?: number;
      serialNumber: string;
      locationId?: string;
      deviceSoftwareVersion?: string;
      simulated?: boolean;
      availableUpdate?: SoftwareUpdate;
      ipAddress?: string;
      livemode?: boolean;
      locationStatus: LocationStatus;
      location?: Location;
      deviceType: DeviceType;
      status: NetworkStatus;
    };

  export namespace IOS {
    export type Type = {
      batteryStatus: BatteryStatus;
      isCharging?: number;
    };

    /**
     * Supported DiscoveryMethod for discovering devices.
     *
     * @remarks
     * USB is in private preview for iPads with M-series chips. Contact Stripe support to join the preview if interested.
     */
    export type DiscoveryMethod =
      | 'bluetoothProximity'
      | 'bluetoothScan'
      | 'internet'
      | 'tapToPay'
      | 'usb';
  }

  export namespace Android {
    export type Type = {
      baseUrl?: string;
      bootloaderVersion?: string;
      configVersion?: string;
      emvKeyProfileId?: string;
      firmwareVersion?: string;
      hardwareVersion?: string;
      macKeyProfileId?: string;
      pinKeyProfileId?: string;
      trackKeyProfileId?: string;
      settingsVersion?: string;
      pinKeysetId?: string;
    };

    export type DiscoveryMethod =
      | 'bluetoothScan'
      | 'internet'
      | 'tapToPay'
      | 'appsOnDevices'
      | 'usb';
  }

  export type BatteryStatus = 'critical' | 'low' | 'nominal' | 'unknown';

  export type BatteryLevel = {
    batteryLevel: number;
    batteryStatus: BatteryStatus;
    isCharging: boolean;
  };

  export type NetworkStatus = 'offline' | 'online';

  export type SoftwareUpdate = {
    deviceSoftwareVersion: string;
    estimatedUpdateTime: EstimatedUpdateTime;
    requiredAt?: string;
    /** The update components (firmware, config, keys, incremental) included in this update. */
    components?: UpdateComponent[];
  };

  export type EstimatedUpdateTime =
    | 'estimate1To2Minutes'
    | 'estimate2To5Minutes'
    | 'estimate5To15Minutes'
    | 'estimateLessThan1Minute';

  export type DeviceType =
    | 'chipper1X'
    | 'chipper2X'
    | 'cotsDevice'
    | 'etna'
    | 'stripeM2'
    | 'stripeS700'
    | 'stripeS700Devkit'
    | 'stripeS710'
    | 'stripeS710Devkit'
    | 'stripeT600'
    | 'stripeT600Devkit'
    | 'stripeT610'
    | 'stripeT610Devkit'
    | 'stripeU200'
    | 'tapToPay'
    | 'unknown'
    | 'verifoneM425'
    | 'verifoneM450'
    | 'verifoneP630'
    | 'verifoneUX700'
    | 'verifoneUX700Devkit'
    | 'verifoneV660p'
    | 'verifoneV660pA'
    | 'verifoneV660pDevkit'
    | 'verifoneVL110'
    | 'verifoneVM100'
    | 'verifoneVM110'
    | 'verifoneVP100'
    | 'verifoneVP110'
    | 'wiseCube'
    | 'wisePad3'
    | 'wisePad3s'
    | 'wisePosE'
    | 'wisePosEDevkit';

  export type InputOptions = 'insertCard' | 'swipeCard' | 'tapCard';

  export type DisplayMessage =
    | 'insertCard'
    | 'insertOrSwipeCard'
    | 'multipleContactlessCardsDetected'
    | 'removeCard'
    | 'retryCard'
    | 'swipeCard'
    | 'tryAnotherCard'
    | 'tryAnotherReadMethod'
    | 'checkMobileDevice'
    | 'cardRemovedTooEarly';

  export type ConnectionStatus =
    | 'connected'
    | 'connecting'
    | 'notConnected'
    | 'discovering'
    | 'reconnecting';

  export type DisconnectReason =
    | 'disconnectRequested'
    | 'rebootRequested'
    | 'securityReboot'
    | 'criticallyLowBattery'
    | 'poweredOff'
    | 'bluetoothDisabled'
    | 'bluetoothSignalLost'
    | 'usbDisconnected'
    | 'idlePowerDown'
    | 'unknown';

  export type ReaderSettings =
    | {
      accessibility?: Accessibility;
      error?: undefined;
    }
    | {
      accessibility?: undefined;
      error?: StripeError;
    };

  export type Accessibility = {
    textToSpeechStatus: ReaderTextToSpeechStatus;
    error?: StripeError;
  };

  export type ReaderTextToSpeechStatus = 'off' | 'headphones' | 'speakers';

  export type ReaderSettingsParameters = {
    textToSpeechViaSpeakers: boolean;
  };

  export type ReaderSupportParams = {
    deviceType: DeviceType;
    simulated?: boolean;
    discoveryMethod: Reader.DiscoveryMethod;
  };

  export type ReaderSupportResult = {
    error?: StripeError;
    readerSupportResult: boolean;
  };
}

/** The component types that can be included in a reader software update. */
export enum UpdateComponent {
  FIRMWARE = 'firmware',
  CONFIG = 'config',
  KEYS = 'keys',
  INCREMENTAL = 'incremental',
}

/**
 * Configures a simulated reader update for testing purposes. Pass as
 * `testReaderUpdate` on connection params to exercise update flows in
 * test mode on both simulated and physical readers.
 *
 * - `available` — An optional update is available and will be announced
 *   during connect.
 * - `required` — A required update will be performed during connect.
 * - `requiredOffline` — A required update exists. When connecting
 *   offline, connection will fail because the reader's version is not
 *   allowed. When connecting online, the reader will update and connect
 *   normally.
 * - `lowBattery` — A required update exists but the reader's battery is
 *   too low for the update to begin. The connection will fail.
 * - `lowBatterySucceedConnect` — A required update exists but the
 *   reader's battery is too low for the update to begin. The update will
 *   fail but connection succeeds because the reader is on a recent
 *   software version.
 * - `random` — Randomly selects a concrete update scenario to exercise
 *   various states, or no update being available.
 */
export type TestReaderUpdate =
  | { type: 'available'; components: UpdateComponent[] }
  | { type: 'required'; components: UpdateComponent[] }
  | { type: 'requiredOffline'; components: UpdateComponent[] }
  | { type: 'lowBattery' }
  | { type: 'lowBatterySucceedConnect' }
  | { type: 'random' };
