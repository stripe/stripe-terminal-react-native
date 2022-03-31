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

type Error = { error: Record<string, string> | null };

export async function requestNeededExpoAndroidPermissions({
  accessFineLocation = defaultFineLocationParams,
}: PermissionsProps | undefined = {}): Promise<Error> {
  const grantedFineLocation = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    accessFineLocation || defaultFineLocationParams
  );

  if (!hasGrantedPermission(grantedFineLocation)) {
    return {
      error: {
        [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION]:
          grantedFineLocation,
      },
    };
  }

  if (!isAndroid12orHigher()) {
    // we're done, we don't need to ask for BT perms
    return { error: null };
  }

  // otherwise within expo we have to make use of react-native-permissions
  const grantedBT = await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);

  if (!hasGrantedPermission(grantedBT)) {
    return {
      error: {
        [PERMISSIONS.ANDROID.BLUETOOTH_CONNECT]: grantedBT,
      },
    };
  }

  const grantedBTScan = await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);

  if (!hasGrantedPermission(grantedBTScan)) {
    return {
      error: {
        [PERMISSIONS.ANDROID.BLUETOOTH_SCAN]: grantedBTScan,
      },
    };
  }

  return { error: null };
}

const hasGrantedPermission = (status: string) => {
  return status === RESULTS.GRANTED;
};
