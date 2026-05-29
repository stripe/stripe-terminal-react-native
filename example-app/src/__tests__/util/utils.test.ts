import { Platform } from 'react-native';
import { isAndroid12orHigher } from '../../utils';

describe('isAndroid12orHigher', () => {
  const setPlatform = (os: string, version: number) => {
    Object.defineProperty(Platform, 'OS', {
      get: () => os,
      configurable: true,
    });
    Object.defineProperty(Platform, 'Version', {
      get: () => version,
      configurable: true,
    });
  };

  it('returns false on iOS', () => {
    setPlatform('ios', 16);
    expect(isAndroid12orHigher()).toBe(false);
  });

  it('returns false on Android below API 31', () => {
    setPlatform('android', 30);
    expect(isAndroid12orHigher()).toBe(false);
  });

  it('returns true on Android API 31', () => {
    setPlatform('android', 31);
    expect(isAndroid12orHigher()).toBe(true);
  });

  it('returns true on Android API 34', () => {
    setPlatform('android', 34);
    expect(isAndroid12orHigher()).toBe(true);
  });
});
