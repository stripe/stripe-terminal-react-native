import { useEffect } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';

const eventEmitter = new NativeEventEmitter(
  NativeModules.StripeTerminalReactNative
);

export function useListener(name: string, callback: (...args: any[]) => any) {
  useEffect(() => {
    const listener = eventEmitter.addListener(name, callback);

    return () => {
      listener.remove();
    };
  }, [name, callback]);
}
