import type { Location, LocationStatus } from './';

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

    export type DiscoveryMethod =
      | 'bluetoothProximity'
      | 'bluetoothScan'
      | 'internet'
      | 'localMobile';
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
      | 'localMobile'
      | 'handoff'
      | 'usb';
  }

  export type BatteryStatus = 'critical' | 'low' | 'nominal' | 'unknown';

  export type NetworkStatus = 'offline' | 'online';

  export type SoftwareUpdate = {
    deviceSoftwareVersion: string;
    estimatedUpdateTime: EstimatedUpdateTime;
    requiredAt?: string;
  };

  export type EstimatedUpdateTime =
    | 'estimate1To2Minutes'
    | 'estimate2To5Minutes'
    | 'estimate5To15Minutes'
    | 'estimateLessThan1Minute';

  export type SimulateUpdateType =
    | 'random'
    | 'available'
    | 'none'
    | 'required'
    | 'lowBattery';

  export type DeviceType =
    | 'chipper1X'
    | 'chipper2X'
    | 'stripeM2'
    | 'verifoneP400'
    | 'wiseCube'
    | 'wisePad3'
    | 'wisePosE'
    | 'wisePad3s'
    | 'wisePadEDevkit'
    | 'stripeS700Devkit'
    | 'cotsDevice';

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
    | 'checkMobileDevice';

  export type ConnectionStatus = 'connected' | 'connecting' | 'notConnected';
}
