import { useEffect } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';
import { rehydrateBridgeError } from '../Errors/StripeErrorHelpers';
import Logger from '../logger';

const eventEmitter = new NativeEventEmitter(
  NativeModules.StripeTerminalReactNative
);
const { READER_RECONNECT_SUCCEED, READER_RECONNECT_FAIL, DISCONNECT } =
  NativeModules.StripeTerminalReactNative.getConstants();

function updateReaderSession(name: string, event: unknown): void {
  if (name === READER_RECONNECT_SUCCEED) {
    const serialNumber = (
      event as { reader?: { serialNumber?: unknown } } | null
    )?.reader?.serialNumber;
    Logger.startReaderSession(
      typeof serialNumber === 'string' ? serialNumber : undefined
    );
  } else if (name === READER_RECONNECT_FAIL || name === DISCONNECT) {
    Logger.endReaderSession();
  }
}

/**
 * Some native events wrap payloads as `{ result: { ... } }` and put the bridge
 * error object on `result.error` instead of a top-level `event.error` (e.g.
 * `FINISH_DISCOVERING_READERS` and `REPORT_FORWARDING_ERROR`). Those need the
 * same `rehydrateBridgeError` path as top-level errors so callbacks receive real
 * `StripeError` instances.
 *
 * We only treat plain objects as `result` — never arrays — because other
 * events use `result` as a non-object value (e.g. arrays for reader input).
 */
function hasNestedResultError(
  event: Record<string, unknown>
): event is { result: Record<string, unknown> & { error: unknown } } {
  const { result } = event;
  return (
    result != null &&
    typeof result === 'object' &&
    !Array.isArray(result) &&
    !!(result as { error?: unknown }).error
  );
}

export function useListener(name: string, callback: (...args: any[]) => any) {
  useEffect(() => {
    const listener = eventEmitter.addListener(name, (event) => {
      updateReaderSession(name, event);
      if (!event || typeof event !== 'object') {
        callback(event);
        return;
      }
      const e = event as Record<string, unknown>;
      if (e.error) {
        callback({ ...e, error: rehydrateBridgeError(e.error).stripeError });
        return;
      }
      if (hasNestedResultError(e)) {
        callback({
          ...e,
          result: {
            ...e.result,
            error: rehydrateBridgeError(e.result.error).stripeError,
          },
        });
        return;
      }
      callback(event);
    });

    return () => {
      listener.remove();
    };
  }, [name, callback]);
}
