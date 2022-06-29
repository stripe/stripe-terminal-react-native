import { requestNeededAndroidPermissions } from '../androidPermissionsUtils';

const permissionsConstantsMock = {
  PERMISSIONS: {
    ACCESS_FINE_LOCATION: 'ACCESS_FINE_LOCATION',
    BLUETOOTH_CONNECT: 'BLUETOOTH_CONNECT',
    BLUETOOTH_SCAN: 'BLUETOOTH_SCAN',
  },
  RESULTS: {
    GRANTED: 'granted',
  },
};

describe('androidPermissionsUtils.ts', () => {
  it('access is granted', async () => {
    const permissionsMock = {
      ACCESS_FINE_LOCATION: 'granted',
      BLUETOOTH_CONNECT: 'granted',
      BLUETOOTH_SCAN: 'granted',
    };
    jest.resetModules();

    jest.mock('react-native/Libraries/Utilities/Platform', () => ({
      OS: 'android',
      Version: 31,
    }));

    jest.doMock(
      'react-native/Libraries/PermissionsAndroid/PermissionsAndroid',
      () => ({
        request: (status: keyof typeof permissionsMock) => {
          return permissionsMock[status];
        },
        ...permissionsConstantsMock,
      })
    );

    await expect(requestNeededAndroidPermissions()).resolves.toEqual({
      error: null,
    });
  });

  it('access fine location is not granted', async () => {
    const permissionsMock = {
      ACCESS_FINE_LOCATION: 'denied',
      BLUETOOTH_CONNECT: 'granted',
      BLUETOOTH_SCAN: 'granted',
    };
    jest.resetModules();

    jest.mock('react-native/Libraries/Utilities/Platform', () => ({
      OS: 'android',
      Version: 31,
    }));

    jest.doMock(
      'react-native/Libraries/PermissionsAndroid/PermissionsAndroid',
      () => ({
        request: (permission: keyof typeof permissionsMock) => {
          return permissionsMock[permission];
        },
        ...permissionsConstantsMock,
      })
    );

    await expect(requestNeededAndroidPermissions()).resolves.toEqual({
      error: {
        ACCESS_FINE_LOCATION: 'denied',
      },
    });
  });

  it('bluetooth connect is not granted', async () => {
    const permissionsMock = {
      ACCESS_FINE_LOCATION: 'granted',
      BLUETOOTH_CONNECT: 'denied',
      BLUETOOTH_SCAN: 'granted',
    };
    jest.resetModules();

    jest.mock('react-native/Libraries/Utilities/Platform', () => ({
      OS: 'android',
      Version: 31,
    }));

    jest.doMock(
      'react-native/Libraries/PermissionsAndroid/PermissionsAndroid',
      () => ({
        request: (permission: keyof typeof permissionsMock) => {
          return permissionsMock[permission];
        },
        ...permissionsConstantsMock,
      })
    );

    await expect(requestNeededAndroidPermissions()).resolves.toEqual({
      error: {
        BLUETOOTH_CONNECT: 'denied',
      },
    });
  });

  it('bluetooth scan is not granted', async () => {
    const permissionsMock = {
      ACCESS_FINE_LOCATION: 'granted',
      BLUETOOTH_CONNECT: 'granted',
      BLUETOOTH_SCAN: 'denied',
    };
    jest.resetModules();

    jest.mock('react-native/Libraries/Utilities/Platform', () => ({
      OS: 'android',
      Version: 31,
    }));

    jest.doMock(
      'react-native/Libraries/PermissionsAndroid/PermissionsAndroid',
      () => ({
        request: (permission: keyof typeof permissionsMock) => {
          return permissionsMock[permission];
        },
        ...permissionsConstantsMock,
      })
    );

    await expect(requestNeededAndroidPermissions()).resolves.toEqual({
      error: {
        BLUETOOTH_SCAN: 'denied',
      },
    });
  });

  it('grants permissions on android lower api level', async () => {
    const permissionsMock = {
      ACCESS_FINE_LOCATION: 'granted',
      BLUETOOTH_CONNECT: 'denied',
      BLUETOOTH_SCAN: 'denied',
    };
    jest.resetModules();

    jest.mock('react-native/Libraries/Utilities/Platform', () => ({
      OS: 'android',
      Version: 29,
    }));

    jest.doMock(
      'react-native/Libraries/PermissionsAndroid/PermissionsAndroid',
      () => ({
        request: (permission: keyof typeof permissionsMock) => {
          return permissionsMock[permission];
        },
        ...permissionsConstantsMock,
      })
    );

    await expect(requestNeededAndroidPermissions()).resolves.toEqual({
      error: null,
    });
  });
});
