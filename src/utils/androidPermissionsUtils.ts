import { PermissionsAndroid, Platform } from 'react-native';
import { PERMISSIONS, RESULTS, request } from 'react-native-permissions';

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

const isAndroid12orHigher = () =>
  Platform.OS === 'android' && Platform.Version >= 31;

export async function requestNeededAndroidPermissions({
  accessFineLocation = defaultFineLocationParams,
}: PermissionsProps | undefined = {}): Promise<boolean> {
  let hasGrantedLocationPermissions = false;
  let hasGrantedBluetoothPermissions = false;

  const grantedFineLocation = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    accessFineLocation || defaultFineLocationParams
  );

  if (hasGrantedPermission(grantedFineLocation)) {
    hasGrantedLocationPermissions = true;

    if (isAndroid12orHigher()) {
      const grantedBT = await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
      const grantedBTScan = await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);

      if (
        hasGrantedPermission(grantedBT) &&
        hasGrantedPermission(grantedBTScan)
      ) {
        hasGrantedBluetoothPermissions = true;
      }
    } else {
      hasGrantedBluetoothPermissions = true;
    }
  }
  return hasGrantedBluetoothPermissions && hasGrantedLocationPermissions;
}

const hasGrantedPermission = (status: string) => {
  return status === RESULTS.GRANTED;
};
