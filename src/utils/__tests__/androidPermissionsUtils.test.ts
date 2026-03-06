import { requestNeededAndroidPermissions } from '../androidPermissionsUtils';
import { PermissionsAndroid, Platform } from 'react-native';

PermissionsAndroid.request = jest.fn();

describe('androidPermissionsUtils.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('access is granted', async () => {
    (PermissionsAndroid.request as jest.Mock)
      .mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
    Object.defineProperty(Platform, 'OS', {
      value: 'android',
      writable: true,
    });
    Object.defineProperty(Platform, 'Version', {
      value: 31,
      writable: true,
    });
    await expect(requestNeededAndroidPermissions()).resolves.toEqual({
      error: null,
    });
  });

  it('access fine location is not granted', async () => {
    (PermissionsAndroid.request as jest.Mock)
      .mockImplementation((permission) => {
        if (permission === PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION) {
          return Promise.resolve(PermissionsAndroid.RESULTS.DENIED);
        }
        return Promise.resolve(PermissionsAndroid.RESULTS.GRANTED);
      })

    Object.defineProperty(Platform, 'OS', {
      value: 'android',
      writable: true,
    });
    Object.defineProperty(Platform, 'Version', {
      value: 31,
      writable: true,
    });

    await expect(requestNeededAndroidPermissions()).resolves.toEqual({
      error: {
        'android.permission.ACCESS_FINE_LOCATION': 'denied',
      },
    });
  });

  it('bluetooth connect is not granted', async () => {
    (PermissionsAndroid.request as jest.Mock)
      .mockImplementation((permission) => {

        if (permission === PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT) {
          return Promise.resolve(PermissionsAndroid.RESULTS.DENIED);
        }
        return Promise.resolve(PermissionsAndroid.RESULTS.GRANTED);
      })

    Object.defineProperty(Platform, 'OS', {
      value: 'android',
      writable: true,
    });
    Object.defineProperty(Platform, 'Version', {
      value: 31,
      writable: true,
    });

    await expect(requestNeededAndroidPermissions()).resolves.toEqual({
      error: {
        'android.permission.BLUETOOTH_CONNECT': 'denied',
      },
    });
  });

  it('bluetooth scan is not granted', async () => {

    (PermissionsAndroid.request as jest.Mock)
      .mockImplementation((permission) => {
        if (permission === PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN) {
          return Promise.resolve(PermissionsAndroid.RESULTS.DENIED);
        }
        return Promise.resolve(PermissionsAndroid.RESULTS.GRANTED);
      })
    Object.defineProperty(Platform, 'OS', {
      value: 'android',
      writable: true,
    });
    Object.defineProperty(Platform, 'Version', {
      value: 31,
      writable: true,
    });

    await expect(requestNeededAndroidPermissions()).resolves.toEqual({
      error: {
        'android.permission.BLUETOOTH_SCAN': 'denied',
      },
    });
  });

  it('grants permissions on android lower api level', async () => {

    (PermissionsAndroid.request as jest.Mock)
      .mockImplementation((permission) => {
        if (permission === PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION) {
          return Promise.resolve(PermissionsAndroid.RESULTS.GRANTED);
        }
        return Promise.resolve(PermissionsAndroid.RESULTS.DENIED);
      })
    Object.defineProperty(Platform, 'OS', {
      value: 'android',
      writable: true,
    });
    Object.defineProperty(Platform, 'Version', {
      value: 29,
      writable: true,
    });

    await expect(requestNeededAndroidPermissions()).resolves.toEqual({
      error: null,
    });
  });
});
