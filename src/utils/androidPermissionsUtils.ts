import { PermissionsAndroid, Platform } from 'react-native';

const defaultFineLocationParams = {
  title: 'Location Permission',
  message: 'Stripe Terminal needs access to your location',
  buttonPositive: 'Accept',
};

type PermissionsProps = {
  accessFineLocation?: {
    title: string;
    message: string;
    buttonPositive: string;
  };
};

type Error = { error: Record<string, string> | null };

const isAndroid12orHigher = () =>
  Platform.OS === 'android' && Platform.Version >= 31;

export async function requestNeededAndroidPermissions({
  accessFineLocation = defaultFineLocationParams,
}: PermissionsProps | undefined = {}): Promise<Error> {
  // Terminal native SDK 5.8.0 declares ACCESS_FINE_LOCATION with
  // maxSdkVersion="30" and BLUETOOTH_SCAN with neverForLocation, and treats
  // ACCESS_COARSE_LOCATION as sufficient for its location reporting. Request
  // COARSE on Android 12+ (FINE can no longer be granted there) and FINE on
  // Android 11 and earlier, where BLE scanning still requires it.
  const locationPermission = isAndroid12orHigher()
    ? PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
    : PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;

  const grantedLocation = await PermissionsAndroid.request(
    locationPermission,
    accessFineLocation || defaultFineLocationParams
  );

  if (!hasGrantedPermission(grantedLocation)) {
    return {
      error: {
        [locationPermission]: grantedLocation,
      },
    };
  }

  if (!isAndroid12orHigher()) {
    // we're done, we don't need to ask for BT perms
    return { error: null };
  }

  // otherwise within expo we have to make use of react-native-permissions
  const grantedBT = await PermissionsAndroid.request(
    // BLUETOOTH_CONNECT doesn't support customization
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
  );

  if (!hasGrantedPermission(grantedBT)) {
    return {
      error: {
        [PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT]: grantedBT,
      },
    };
  }

  const grantedBTScan = await PermissionsAndroid.request(
    // BLUETOOTH_SCAN doesn't support customization
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
  );

  if (!hasGrantedPermission(grantedBTScan)) {
    return {
      error: {
        [PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN]: grantedBTScan,
      },
    };
  }

  return { error: null };
}

const hasGrantedPermission = (status: string) => {
  return status === PermissionsAndroid.RESULTS.GRANTED;
};
