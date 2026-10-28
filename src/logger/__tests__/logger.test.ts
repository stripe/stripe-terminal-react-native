jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    Version: '17.0',
    constants: {},
    select: (options: { [key: string]: unknown }) =>
      options.ios ?? options.default,
  },
}));

import { Platform } from 'react-native';
import Logger from '..';
import * as packageJson from '../../../package.json';
import * as StripeErrorHelpers from '../../Errors/StripeErrorHelpers';
import { ErrorCode } from '../../Errors/ErrorCodes';
import { InternalStripeError } from '../../Errors/InternalStripeError';

const flushPromises = async (n = 5) => {
  for (let i = 0; i < n; i++) {
    await Promise.resolve();
  }
};

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
};

const resetSingleton = () => {
  Logger.instance = null;
  Logger.setLogLevel(undefined);
  Logger.endReaderSession();
};

describe.each(['ios', 'android'] as const)('Logger (%s)', (deviceType) => {
  beforeEach(() => {
    // Fake timers so the BatchUploader's constructor-scheduled flush
    // doesn't fire during the test (its real `fetch` would hit the
    // network).
    jest.useFakeTimers();
    jest.replaceProperty(Platform, 'OS', deviceType);
    resetSingleton();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
    resetSingleton();
  });

  describe('getInstance', () => {
    it('lazy-wires a collector and an uploader on first call', () => {
      const instance = Logger.getInstance();
      expect(instance._collector).toBeDefined();
      expect(instance._uploader).toBeDefined();
    });

    it('returns the same singleton across calls', () => {
      const a = Logger.getInstance();
      const b = Logger.getInstance();
      expect(a).toBe(b);
    });
  });

  describe('traceSdkMethod', () => {
    it.each(['success', 'error', 'throw', 'reject'] as const)(
      'includes the React Native version in %s traces without replacing the SDK version',
      async (outcome) => {
        jest.replaceProperty(Platform, 'constants', {
          reactNativeVersion: { major: 0, minor: 85, patch: 2, prerelease: null },
        } as typeof Platform.constants);
        const error = StripeErrorHelpers.rehydrateBridgeError({
          code: ErrorCode.READER_BUSY,
          message: 'Reader busy',
          error_source: 'native',
        });
        const traced = Logger.traceSdkMethod(() => {
          if (outcome === 'throw') throw error;
          if (outcome === 'reject') return Promise.reject(error);
          if (outcome === 'error') return Promise.resolve({ error });
          return Promise.resolve({ reader: {} });
        }, 'connectReader');
        const params = { discoveryMethod: 'internet' };

        if (outcome === 'throw') {
          await expect(async () => traced(params)).rejects.toBe(error);
        } else if (outcome === 'reject') {
          await expect(traced(params)).rejects.toBe(error.stripeError);
        } else {
          await traced(params);
        }
        await flushPromises();

        const traces = Logger.getInstance()._collector._traces;
        expect(traces).toHaveLength(1);
        expect(traces[0].trace.tags).toEqual({
          device_type: deviceType,
          discovery_method: 'internet',
          react_native_version: '0.85.2',
        });
        expect(traces[0].trace.version_info).toEqual({
          client_type: 'RN_SDK',
          client_version: packageJson.version,
        });
      }
    );

    it.each([
      ['rc.3', '0.85.2-rc.3'],
      ['nightly-20261001-abcdef', '0.85.2-nightly-20261001-abcdef'],
    ])(
      'preserves the React Native prerelease %s in traces',
      (prerelease, expected) => {
        jest.replaceProperty(Platform, 'constants', {
          reactNativeVersion: { major: 0, minor: 85, patch: 2, prerelease },
        } as typeof Platform.constants);

        Logger.traceSdkMethod(() => 'ready', 'getPaymentStatus')();

        expect(
          Logger.getInstance()._collector._traces[0].trace.tags.react_native_version
        ).toBe(expected);
      }
    );

    it.each([undefined, {}])(
      'records traces without a React Native version when constants are %p',
      (constants) => {
        jest.replaceProperty(
          Platform,
          'constants',
          constants as typeof Platform.constants
        );

        const result = Logger.traceSdkMethod(() => 'ready', 'getPaymentStatus')();

        expect(result).toBe('ready');
        expect(Logger.getInstance()._collector._traces[0].trace.tags).toEqual({
          device_type: deviceType,
        });
      }
    );

    it('continues the SDK operation when native constants lookup throws', () => {
      const originalConstants = Object.getOwnPropertyDescriptor(
        Platform,
        'constants'
      )!;
      Object.defineProperty(Platform, 'constants', {
        configurable: true,
        get() {
          throw new Error('Native constants unavailable');
        },
      });

      try {
        const operation = jest.fn(() => 'ready');
        const result = Logger.traceSdkMethod(operation, 'getPaymentStatus')();

        expect(result).toBe('ready');
        expect(operation).toHaveBeenCalledTimes(1);
        const traces = Logger.getInstance()._collector._traces;
        expect(traces).toHaveLength(1);
        expect(traces[0].trace.tags).toEqual({ device_type: deviceType });
      } finally {
        Object.defineProperty(Platform, 'constants', originalConstants);
      }
    });

    it.each([
      ['initialize', (reader: object) => ({ reader })],
      ['easyConnect', (reader: object) => ({ reader })],
    ])(
      'starts a reader session from a successful %s response',
      async (method, responseForReader) => {
        const reader = { serialNumber: 'WSC512345' };

        await Logger.traceSdkMethod(
          async () => responseForReader(reader),
          method
        )();
        Logger.traceSdkMethod(() => ({ ok: true }), 'getPaymentStatus')();

        const traces = Logger.getInstance()._collector._traces;
        expect(
          traces.map((trace) => [
            trace.trace.method,
            trace.trace.additional_context.serial_number,
          ])
        ).toEqual([
          [method, 'WSC512345'],
          ['getPaymentStatus', 'WSC512345'],
        ]);
      }
    );

    it('clears stale reader context when initialize succeeds without a reader', async () => {
      Logger.startReaderSession('STALE_READER');

      await Logger.traceSdkMethod(
        async () => ({ reader: undefined }),
        'initialize'
      )();
      Logger.traceSdkMethod(() => ({ ok: true }), 'getPaymentStatus')();

      expect(
        Logger.getInstance()._collector._traces.map((trace) => [
          trace.trace.method,
          trace.trace.additional_context.serial_number,
        ])
      ).toEqual([
        ['initialize', ''],
        ['getPaymentStatus', ''],
      ]);
    });

    it('records getConnectedReader without changing the reader session', async () => {
      const reader = { serialNumber: 'WSC512345' };

      await Logger.traceSdkMethod(
        async () => reader,
        'getConnectedReader'
      )();
      Logger.traceSdkMethod(() => ({ ok: true }), 'getPaymentStatus')();

      expect(
        Logger.getInstance()._collector._traces.map((trace) => [
          trace.trace.method,
          trace.trace.additional_context.serial_number,
        ])
      ).toEqual([
        ['getConnectedReader', 'WSC512345'],
        ['getPaymentStatus', ''],
      ]);
    });

    it('tracks the reader serial from connect through disconnect', async () => {
      const reader = { serialNumber: 'STR7112345' };

      await Logger.traceSdkMethod(
        async () => ({ reader }),
        'connectReader'
      )({ reader, discoveryMethod: 'internet' });
      Logger.traceSdkMethod(() => ({ ok: true }), 'getPaymentStatus')();
      await Logger.traceSdkMethod(async () => ({}), 'disconnectReader')();
      Logger.traceSdkMethod(() => ({ ok: true }), 'getPaymentStatus')();

      expect(
        Logger.getInstance()._collector._traces.map((trace) => [
          trace.trace.method,
          trace.trace.additional_context.serial_number,
        ])
      ).toEqual([
        ['connectReader', 'STR7112345'],
        ['getPaymentStatus', 'STR7112345'],
        ['disconnectReader', 'STR7112345'],
        ['getPaymentStatus', ''],
      ]);
    });

    it('does not replace or clear the session when connect or disconnect fails', async () => {
      Logger.startReaderSession('WSC519876');
      const error = StripeErrorHelpers.rehydrateBridgeError({
        code: ErrorCode.READER_BUSY,
        message: 'Reader operation failed',
        error_source: 'native',
      });

      await Logger.traceSdkMethod(
        async () => ({ error }),
        'connectReader'
      )({
        reader: { serialNumber: 'CHB212345' },
        discoveryMethod: 'bluetoothScan',
      });
      await Logger.traceSdkMethod(
        async () => ({ error }),
        'disconnectReader'
      )();
      Logger.traceSdkMethod(() => ({ ok: true }), 'getPaymentStatus')();

      const traces = Logger.getInstance()._collector._traces;
      expect(
        traces.map((trace) => trace.trace.additional_context.serial_number)
      ).toEqual(['CHB212345', 'WSC519876', 'WSC519876']);
    });

    it('does not let a stale disconnect completion clear a newer reader session', async () => {
      Logger.startReaderSession('OLDER_READER');
      const olderDisconnect = deferred<Record<string, never>>();
      const pendingDisconnect = Logger.traceSdkMethod(
        () => olderDisconnect.promise,
        'disconnectReader'
      )();

      Logger.endReaderSession();
      Logger.startReaderSession('NEWER_READER');
      olderDisconnect.resolve({});
      await pendingDisconnect;
      Logger.traceSdkMethod(() => ({ ok: true }), 'getPaymentStatus')();

      expect(
        Logger.getInstance()._collector._traces.map((trace) => [
          trace.trace.method,
          trace.trace.additional_context.serial_number,
        ])
      ).toEqual([
        ['disconnectReader', 'OLDER_READER'],
        ['getPaymentStatus', 'NEWER_READER'],
      ]);
    });

    it('lets a pending disconnect clear an unchanged reader query', async () => {
      const reader = { serialNumber: 'CURRENT_READER' };
      Logger.startReaderSession(reader.serialNumber);
      const pendingDisconnect = deferred<Record<string, never>>();
      const disconnectResult = Logger.traceSdkMethod(
        () => pendingDisconnect.promise,
        'disconnectReader'
      )();

      await Logger.traceSdkMethod(
        async () => reader,
        'getConnectedReader'
      )();
      pendingDisconnect.resolve({});
      await disconnectResult;
      Logger.traceSdkMethod(() => ({ ok: true }), 'getPaymentStatus')();

      expect(
        Logger.getInstance()._collector._traces.map((trace) => [
          trace.trace.method,
          trace.trace.additional_context.serial_number,
        ])
      ).toEqual([
        ['getConnectedReader', 'CURRENT_READER'],
        ['disconnectReader', 'CURRENT_READER'],
        ['getPaymentStatus', ''],
      ]);
    });

    it('falls back for an unregistered bridge code without changing the error', () => {
      jest.setSystemTime(1_000_000);
      const error = StripeErrorHelpers.rehydrateBridgeError({
        code: 'SOME_UNKNOWN_CODE',
        nativeErrorCode: '9999',
        message: 'An unregistered native error occurred',
        metadata: { detail: 'private' },
        error_source: 'native',
      });
      const originalError = error.stripeError;
      const originalDescriptors =
        Object.getOwnPropertyDescriptors(originalError);

      const traced = Logger.traceSdkMethod(() => {
        jest.setSystemTime(1_000_050);
        return { error };
      }, 'collectPaymentMethod');
      const result = traced();

      const { _collector } = Logger.getInstance();
      expect(_collector._traces).toHaveLength(1);
      const trace = _collector._traces[0].trace;
      expect(trace.total_time_ms).toBe(50);
      expect(trace.status_code).toBe('SOME_UNKNOWN_CODE');
      expect(_collector._proxyEvents).toStrictEqual([
        {
          origin_role: 'pos-rn',
          origin_id: Logger.posId,
          event: {
            domain: 'terminal_request',
            scope: 'terminal',
            event: 'collectPaymentMethod',
            result: 'ERROR',
            duration: trace.total_time_ms,
            outcome: ErrorCode.UNEXPECTED_SDK_ERROR,
            tags: { error_source: 'native' },
          },
        },
      ]);
      expect(result.error).toBe(originalError);
      expect(error.stripeError).toBe(originalError);
      expect(error.stripeError.code).toBe('SOME_UNKNOWN_CODE');
      expect(Object.getOwnPropertyDescriptors(error.stripeError)).toEqual(
        originalDescriptors
      );
    });

    it('serializes requests with the method-specific full-path allowlist', () => {
      const traced = Logger.traceSdkMethod(
        () => ({ futureResponseField: 'unchanged' }),
        'createPaymentIntent'
      );
      traced({
        amount: 1000,
        currency: 'usd',
        metadata: { orderId: 'private' },
      });

      const request = JSON.parse(
        Logger.getInstance()._collector._traces[0].trace.request
      );
      expect(request).toEqual({
        'rn-args': [
          {
            amount: 1000,
            currency: 'usd',
            metadata: '<REDACTED>',
          },
        ],
      });
      expect(
        JSON.parse(Logger.getInstance()._collector._traces[0].trace.response!)
      ).toEqual({});
    });

    it('pushes a trace and terminal_request metric for a sync return', () => {
      const response = { ok: true };
      const traced = Logger.traceSdkMethod(() => response, 'doThing');
      expect(traced()).toBe(response);

      const { _collector } = Logger.getInstance();
      expect(_collector._traces).toHaveLength(1);
      expect(_collector._proxyEvents).toHaveLength(1);

      const trace = _collector._traces[0];
      expect(trace.origin_id).toBe(Logger.posId);
      expect(trace.trace.method).toBe('doThing');
      expect(trace.trace.tags).toEqual({ device_type: deviceType });
      expect(JSON.parse(trace.trace.response!)).toBe('<REDACTED>');
      expect(trace.trace.status_code).toBeUndefined();
      expect(JSON.parse(JSON.stringify(trace.trace))).not.toHaveProperty(
        'status_code'
      );

      const event = _collector._proxyEvents[0];
      expect(event).toStrictEqual({
        origin_role: 'pos-rn',
        origin_id: Logger.posId,
        event: {
          domain: 'terminal_request',
          scope: 'terminal',
          event: 'doThing',
          result: 'OK',
          duration: trace.trace.total_time_ms,
        },
      });
    });

    it.each([false, true])(
      'logs the internal error and returns the public error (async: %s)',
      async (asynchronous) => {
        jest.setSystemTime(1_000_000);
        const paymentIntent = {
          id: 'pi_123',
          clientSecret: 'pi_123_secret_private',
        };
        const internalError = StripeErrorHelpers.rehydrateBridgeError({
          code: 'CANCELED',
          message: 'The operation was canceled.',
          metadata: { orderId: 'private' },
          error_source: 'native',
          paymentIntent,
        });
        const response = { error: internalError, paymentIntent: undefined };
        const normalizeError = jest.spyOn(StripeErrorHelpers, 'normalizeError');
        const traceError = jest.spyOn(Logger as any, 'traceError');
        const traced = Logger.traceSdkMethod(
          () => {
            jest.setSystemTime(1_000_125);
            return asynchronous ? Promise.resolve(response) : response;
          },
          'collectPaymentMethod'
        );

        const returned = traced();
        expect(returned instanceof Promise).toBe(asynchronous);
        const result = await returned;

        expect(internalError).toBeInstanceOf(InternalStripeError);
        expect(normalizeError).toHaveBeenCalledTimes(1);
        expect(normalizeError).toHaveBeenCalledWith(internalError);
        expect(normalizeError.mock.results[0].value).toBe(internalError);
        expect(traceError).toHaveBeenCalledTimes(1);
        expect(traceError).toHaveBeenCalledWith(
          expect.anything(),
          response,
          undefined
        );
        const tracedResponse = traceError.mock.calls[0][1] as {
          error: InternalStripeError;
        };
        expect(tracedResponse.error).toBe(internalError);
        expect(response.error).toBe(internalError);
        expect(result.error).toBe(internalError.stripeError);
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.paymentIntent).toBe(paymentIntent);
        expect(Object.keys(result)).toEqual(['error', 'paymentIntent']);
        expect(result.paymentIntent).toBeUndefined();
        expect(
          Object.getOwnPropertyDescriptor(result.error, 'message')?.enumerable
        ).toBe(false);
        expect(result.error.metadata).toEqual({ orderId: 'private' });
        expect(paymentIntent.clientSecret).toBe('pi_123_secret_private');

        const { _collector } = Logger.getInstance();
        expect(_collector._traces).toHaveLength(1);
        expect(_collector._proxyEvents).toHaveLength(1);
        const trace = _collector._traces[0].trace;
        expect(trace.total_time_ms).toBe(125);
        expect(trace.method).toBe('collectPaymentMethod');
        expect(trace.tags).toEqual({ device_type: deviceType });
        expect(_collector._proxyEvents[0].event).toStrictEqual({
          domain: 'terminal_request',
          scope: 'terminal',
          event: 'collectPaymentMethod',
          result: 'ERROR',
          duration: trace.total_time_ms,
          outcome: ErrorCode.CANCELED,
          tags: { error_source: 'native' },
        });
        expect(trace.status_code).toBe('CANCELED');
        const loggedError = JSON.parse(trace.exception!);
        expect(Object.keys(loggedError).sort()).toEqual(
          Object.keys(internalError).sort()
        );
        expect(loggedError.errorSource).toBe('native');
        expect(loggedError.stripeError.name).toBe('StripeError');
        expect(loggedError.stripeError.message).toBe(
          'The operation was canceled.'
        );
        expect(loggedError.stripeError.metadata).toBe('<REDACTED>');
        expect(loggedError.stripeError.paymentIntent).toEqual({
          id: 'pi_123',
          clientSecret: '<REDACTED>',
        });
        expect(JSON.parse(trace.response!).error).toEqual(loggedError);
        for (const field of ['stripeError', 'errorSource', 'error_source']) {
          expect(result.error).not.toHaveProperty(field);
        }
      }
    );

    it.each([false, true])(
      'preserves the async success result (error key present: %s)',
      async (hasErrorKey) => {
        jest.setSystemTime(1_000_000);
        const reader = { id: 'tmr_123' };
        const response = hasErrorKey
          ? { reader, error: undefined }
          : { reader };
        const normalizeError = jest.spyOn(StripeErrorHelpers, 'normalizeError');
        const traced = Logger.traceSdkMethod(
          async () => {
            await Promise.resolve();
            jest.setSystemTime(1_000_250);
            return response;
          },
          'connectReader'
        );

        const pending = traced({ reader, discoveryMethod: 'internet' });
        expect(Logger.getInstance()._collector._proxyEvents).toHaveLength(0);
        const result = await pending;

        expect(result).toBe(response);
        expect(result.reader).toBe(reader);
        expect(Object.keys(result)).toEqual(
          hasErrorKey ? ['reader', 'error'] : ['reader']
        );
        expect(normalizeError).not.toHaveBeenCalled();
        const { _collector } = Logger.getInstance();
        expect(_collector._traces).toHaveLength(1);
        expect(_collector._proxyEvents).toHaveLength(1);
        const trace = _collector._traces[0].trace;
        expect(trace.total_time_ms).toBe(250);
        expect(trace.method).toBe('connectReader');
        expect(trace.tags).toStrictEqual({
          device_type: deviceType,
          discovery_method: 'internet',
        });
        expect(_collector._proxyEvents[0].event).toStrictEqual({
          domain: 'terminal_request',
          scope: 'terminal',
          event: 'connectReader',
          result: 'OK',
          duration: trace.total_time_ms,
          tags: { discovery_method: 'internet' },
        });
        expect(trace.status_code).toBeUndefined();
        expect(JSON.parse(JSON.stringify(trace))).not.toHaveProperty(
          'status_code'
        );
      }
    );

    describe('connectReader discovery method tags', () => {
      it('does not interrupt an SDK operation when metric tag extraction fails', async () => {
        const response = { reader: { id: 'tmr_123' } };
        const operation = jest.fn().mockResolvedValue(response);
        const traced = Logger.traceSdkMethod(operation, 'connectReader');

        await expect(traced()).resolves.toBe(response);

        expect(operation).toHaveBeenCalledTimes(1);
        const { _collector } = Logger.getInstance();
        expect(_collector._traces).toHaveLength(1);
        expect(_collector._traces[0].trace.tags).toStrictEqual({
          device_type: deviceType,
        });
        expect(_collector._proxyEvents).toHaveLength(1);
        expect(_collector._proxyEvents[0].event).toStrictEqual({
          domain: 'terminal_request',
          scope: 'terminal',
          event: 'connectReader',
          result: 'OK',
          duration: expect.any(Number),
        });
      });

      it.each([
        'bluetoothScan',
        'bluetoothProximity',
        'usb',
        'internet',
        'tapToPay',
        'appsOnDevices',
      ] as const)(
        'records %s for an async success without changing the response',
        async (discoveryMethod) => {
          jest.setSystemTime(1_000_000);
          const reader = { id: 'tmr_123' };
          const response = { reader };
          const traced = Logger.traceSdkMethod(async () => {
            await Promise.resolve();
            jest.setSystemTime(1_000_125);
            return response;
          }, 'connectReader');

          const pending = traced({ reader, discoveryMethod });
          expect(Logger.getInstance()._collector._proxyEvents).toHaveLength(0);
          const result = await pending;

          expect(result).toBe(response);
          expect(result.reader).toBe(reader);
          const { _collector } = Logger.getInstance();
          expect(_collector._traces).toHaveLength(1);
          expect(_collector._proxyEvents).toHaveLength(1);
          const trace = _collector._traces[0].trace;
          expect(trace.total_time_ms).toBe(125);
          expect(trace.method).toBe('connectReader');
          expect(trace.tags).toStrictEqual({
            device_type: deviceType,
            discovery_method: discoveryMethod,
          });
          expect(_collector._proxyEvents[0].event).toStrictEqual({
            domain: 'terminal_request',
            scope: 'terminal',
            event: 'connectReader',
            result: 'OK',
            duration: trace.total_time_ms,
            tags: { discovery_method: discoveryMethod },
          });
        }
      );

      it('records the discovery method for a sync success', () => {
        jest.setSystemTime(1_000_000);
        const reader = { id: 'tmr_123' };
        const response = { reader };
        const traced = Logger.traceSdkMethod(() => {
          jest.setSystemTime(1_000_075);
          return response;
        }, 'connectReader');

        const result = traced({ reader, discoveryMethod: 'usb' });

        expect(result).toBe(response);
        expect(result.reader).toBe(reader);
        const { _collector } = Logger.getInstance();
        expect(_collector._traces).toHaveLength(1);
        expect(_collector._proxyEvents).toHaveLength(1);
        const trace = _collector._traces[0].trace;
        expect(trace.total_time_ms).toBe(75);
        expect(trace.tags).toStrictEqual({
          device_type: deviceType,
          discovery_method: 'usb',
        });
        expect(_collector._proxyEvents[0].event).toStrictEqual({
          domain: 'terminal_request',
          scope: 'terminal',
          event: 'connectReader',
          result: 'OK',
          duration: trace.total_time_ms,
          tags: { discovery_method: 'usb' },
        });
      });

      it.each([false, true])(
        'merges the discovery method with a returned native error (async: %s)',
        async (asynchronous) => {
          jest.setSystemTime(1_000_000);
          const error = StripeErrorHelpers.rehydrateBridgeError({
            code: ErrorCode.READER_BUSY,
            message: 'Reader operation failed',
            error_source: 'native',
          });
          const response = { error, reader: undefined };
          const traced = Logger.traceSdkMethod(() => {
            jest.setSystemTime(1_000_125);
            return asynchronous ? Promise.resolve(response) : response;
          }, 'connectReader');

          const returned = traced({
            reader: { id: 'tmr_123' },
            discoveryMethod: 'bluetoothScan',
          });
          expect(returned instanceof Promise).toBe(asynchronous);
          const result = await returned;

          expect(result.error).toBe(error.stripeError);
          expect(result.reader).toBeUndefined();
          expect(Object.keys(result)).toEqual(Object.keys(response));
          expect(response.error).toBe(error);
          const { _collector } = Logger.getInstance();
          expect(_collector._traces).toHaveLength(1);
          expect(_collector._proxyEvents).toHaveLength(1);
          const trace = _collector._traces[0].trace;
          expect(trace.total_time_ms).toBe(125);
          expect(trace.tags).toStrictEqual({
            device_type: deviceType,
            discovery_method: 'bluetoothScan',
          });
          expect(_collector._proxyEvents[0].event).toStrictEqual({
            domain: 'terminal_request',
            scope: 'terminal',
            event: 'connectReader',
            result: 'ERROR',
            duration: trace.total_time_ms,
            outcome: ErrorCode.READER_BUSY,
            tags: {
              discovery_method: 'bluetoothScan',
              error_source: 'native',
            },
          });
        }
      );

      it('merges the discovery method with a rejected common Error and preserves its identity', async () => {
        jest.setSystemTime(1_000_000);
        const error = new TypeError('Network request failed');
        const traced = Logger.traceSdkMethod(() => {
          jest.setSystemTime(1_000_125);
          return Promise.reject(error);
        }, 'connectReader');

        const result = traced({
          reader: { id: 'tmr_123' },
          discoveryMethod: 'internet',
        });
        expect(result).toBeInstanceOf(Promise);
        await expect(result).rejects.toBe(error);
        await flushPromises();

        const { _collector } = Logger.getInstance();
        expect(_collector._traces).toHaveLength(1);
        expect(_collector._proxyEvents).toHaveLength(1);
        const trace = _collector._traces[0].trace;
        expect(trace.total_time_ms).toBe(125);
        expect(trace.tags).toStrictEqual({
          device_type: deviceType,
          discovery_method: 'internet',
        });
        expect(_collector._proxyEvents[0].event).toStrictEqual({
          domain: 'terminal_request',
          scope: 'terminal',
          event: 'connectReader',
          result: 'ERROR',
          duration: trace.total_time_ms,
          outcome: ErrorCode.UNEXPECTED_SDK_ERROR,
          tags: { discovery_method: 'internet', error_source: 'rn' },
        });
      });

      it('merges the discovery method with a sync throw and preserves the internal error identity', () => {
        jest.setSystemTime(1_000_000);
        const error = StripeErrorHelpers.createInternalStripeError(
          { code: ErrorCode.READER_BUSY, message: 'Reader operation failed' },
          'native'
        );
        const traced = Logger.traceSdkMethod(() => {
          jest.setSystemTime(1_000_125);
          throw error;
        }, 'connectReader');

        let thrown: unknown;
        try {
          traced({ reader: { id: 'tmr_123' }, discoveryMethod: 'tapToPay' });
        } catch (exception) {
          thrown = exception;
        }

        expect(thrown).toBe(error);
        const { _collector } = Logger.getInstance();
        expect(_collector._traces).toHaveLength(1);
        expect(_collector._proxyEvents).toHaveLength(1);
        const trace = _collector._traces[0].trace;
        expect(trace.total_time_ms).toBe(125);
        expect(trace.tags).toStrictEqual({
          device_type: deviceType,
          discovery_method: 'tapToPay',
        });
        expect(_collector._proxyEvents[0].event).toStrictEqual({
          domain: 'terminal_request',
          scope: 'terminal',
          event: 'connectReader',
          result: 'ERROR',
          duration: trace.total_time_ms,
          outcome: ErrorCode.READER_BUSY,
          tags: { discovery_method: 'tapToPay', error_source: 'native' },
        });
      });

      it('captures the discovery method at call start and isolates overlapping calls', async () => {
        jest.setSystemTime(1_000_000);
        const firstResponse = { reader: { id: 'tmr_first' } };
        const secondResponse = { reader: { id: 'tmr_second' } };
        const first = deferred<typeof firstResponse>();
        const second = deferred<typeof secondResponse>();
        const operation = jest
          .fn()
          .mockImplementationOnce(() => first.promise)
          .mockImplementationOnce(() => second.promise);
        const traced = Logger.traceSdkMethod(operation, 'connectReader');
        const firstParams = {
          reader: firstResponse.reader,
          discoveryMethod: 'bluetoothScan',
        };

        const firstCall = traced(firstParams);
        firstParams.discoveryMethod = 'tapToPay';
        jest.setSystemTime(1_000_050);
        const secondCall = traced({
          reader: secondResponse.reader,
          discoveryMethod: 'internet',
        });
        expect(Logger.getInstance()._collector._proxyEvents).toHaveLength(0);

        jest.setSystemTime(1_000_125);
        second.resolve(secondResponse);
        expect(await secondCall).toBe(secondResponse);
        jest.setSystemTime(1_000_250);
        first.resolve(firstResponse);
        expect(await firstCall).toBe(firstResponse);

        expect(operation).toHaveBeenCalledTimes(2);
        const { _collector } = Logger.getInstance();
        expect(_collector._traces).toHaveLength(2);
        expect(_collector._proxyEvents).toHaveLength(2);
        expect(
          _collector._traces.map(({ trace }) => trace.total_time_ms)
        ).toEqual([75, 250]);
        expect(_collector._traces.map(({ trace }) => trace.tags)).toStrictEqual(
          [
            { device_type: deviceType, discovery_method: 'internet' },
            { device_type: deviceType, discovery_method: 'bluetoothScan' },
          ]
        );
        expect(_collector._proxyEvents.map(({ event }) => event)).toStrictEqual(
          [
            {
              domain: 'terminal_request',
              scope: 'terminal',
              event: 'connectReader',
              result: 'OK',
              duration: _collector._traces[0].trace.total_time_ms,
              tags: { discovery_method: 'internet' },
            },
            {
              domain: 'terminal_request',
              scope: 'terminal',
              event: 'connectReader',
              result: 'OK',
              duration: _collector._traces[1].trace.total_time_ms,
              tags: { discovery_method: 'bluetoothScan' },
            },
          ]
        );
      });

      it('omits the discovery method for discovery and payment calls after connecting', async () => {
        jest.setSystemTime(1_000_000);
        const reader = { serialNumber: 'STR7112345' };
        const connectResponse = { reader };
        const connect = Logger.traceSdkMethod(async () => {
          jest.setSystemTime(1_000_100);
          return connectResponse;
        }, 'connectReader');
        expect(
          await connect({ reader, discoveryMethod: 'bluetoothScan' })
        ).toBe(connectResponse);

        const discoveryResponse = {};
        const discover = Logger.traceSdkMethod(async () => {
          jest.setSystemTime(1_000_150);
          return discoveryResponse;
        }, 'discoverReaders');
        expect(await discover({ discoveryMethod: 'bluetoothScan' })).toBe(
          discoveryResponse
        );

        const paymentIntent = { id: 'pi_123' };
        const paymentResponse = { paymentIntent };
        const process = Logger.traceSdkMethod(async () => {
          jest.setSystemTime(1_000_175);
          return paymentResponse;
        }, 'processPaymentIntent');
        expect(await process({ paymentIntent })).toBe(paymentResponse);

        const { _collector } = Logger.getInstance();
        expect(_collector._traces).toHaveLength(3);
        expect(_collector._proxyEvents).toHaveLength(3);
        expect(
          _collector._traces.map(({ trace }) => trace.total_time_ms)
        ).toEqual([100, 50, 25]);
        expect(_collector._traces.map(({ trace }) => trace.tags)).toStrictEqual(
          [
            { device_type: deviceType, discovery_method: 'bluetoothScan' },
            { device_type: deviceType },
            { device_type: deviceType },
          ]
        );
        expect(_collector._proxyEvents.map(({ event }) => event)).toStrictEqual(
          [
            {
              domain: 'terminal_request',
              scope: 'terminal',
              event: 'connectReader',
              result: 'OK',
              duration: _collector._traces[0].trace.total_time_ms,
              tags: { discovery_method: 'bluetoothScan' },
            },
            {
              domain: 'terminal_request',
              scope: 'terminal',
              event: 'discoverReaders',
              result: 'OK',
              duration: _collector._traces[1].trace.total_time_ms,
            },
            {
              domain: 'terminal_request',
              scope: 'terminal',
              event: 'processPaymentIntent',
              result: 'OK',
              duration: _collector._traces[2].trace.total_time_ms,
            },
          ]
        );
      });
    });

    it('keeps a resolved error response fulfilled while redacting its companion model', async () => {
      const setupIntent = {
        id: 'seti_123',
        status: 'requires_payment_method',
        clientSecret: 'seti_123_secret_private',
        metadata: { orderId: 'private' },
      };
      const internalError = StripeErrorHelpers.rehydrateBridgeError({
        code: 'DECLINED_BY_STRIPE_API',
        message: 'Setup failed',
        metadata: { reason: 'private' },
        error_source: 'native',
      });
      const response = { error: internalError, setupIntent };
      const traced = Logger.traceSdkMethod(
        () => Promise.resolve(response),
        'processSetupIntent'
      );

      const pending = traced();
      expect(pending).toBeInstanceOf(Promise);
      const result = await pending;

      expect(result.error).toBe(internalError.stripeError);
      expect(result.setupIntent).toBe(setupIntent);
      expect(response.error).toBe(internalError);
      expect(setupIntent.clientSecret).toBe('seti_123_secret_private');

      const { _collector } = Logger.getInstance();
      expect(_collector._traces).toHaveLength(1);
      expect(_collector._proxyEvents).toHaveLength(1);
      expect(_collector._proxyEvents[0].event.result).toBe('ERROR');
      expect(JSON.parse(_collector._traces[0].trace.response!)).toEqual({
        setupIntent: {
          id: 'seti_123',
          status: 'requires_payment_method',
          clientSecret: '<REDACTED>',
          metadata: '<REDACTED>',
        },
        error: {
          errorSource: 'native',
          stripeError: {
            name: 'StripeError',
            code: 'DECLINED_BY_STRIPE_API',
            nativeErrorCode: 'DECLINED_BY_STRIPE_API',
            message: 'Setup failed',
            metadata: '<REDACTED>',
          },
        },
      });
    });

    it('normalizes a sync common Error response once before tracing and returning it', () => {
      const error = new TypeError('Network request failed');
      const reader = { id: 'tmr_123' };
      const response = { error, reader, futureResponseField: undefined };
      const normalizeError = jest.spyOn(StripeErrorHelpers, 'normalizeError');
      const traceError = jest.spyOn(Logger as any, 'traceError');
      const traced = Logger.traceSdkMethod(() => response, 'doSyncError');

      const result = traced();

      expect(result).not.toBeInstanceOf(Promise);
      expect(normalizeError).toHaveBeenCalledTimes(1);
      expect(normalizeError).toHaveBeenCalledWith(error);
      const normalized = normalizeError.mock.results[0].value;
      expect(traceError).toHaveBeenCalledTimes(1);
      const tracedResponse = traceError.mock.calls[0][1] as {
        error: InternalStripeError;
      };
      expect(tracedResponse.error).toBe(normalized);
      expect(result.error).toBe(normalized.stripeError);
      expect(result.error).not.toBe(error);
      expect(result.error.cause).toBe(error);
      expect(result.reader).toBe(reader);
      expect(Object.keys(result)).toEqual(Object.keys(response));
      expect(result.futureResponseField).toBeUndefined();
      expect(response.error).toBe(error);

      const { _collector } = Logger.getInstance();
      expect(_collector._traces).toHaveLength(1);
      expect(_collector._proxyEvents).toHaveLength(1);
      expect(_collector._proxyEvents[0].event.result).toBe('ERROR');
      const trace = _collector._traces[0].trace;
      expect(trace.status_code).toBe(ErrorCode.UNEXPECTED_SDK_ERROR);
      expect(JSON.parse(trace.exception!)).toMatchObject({
        errorSource: 'rn',
        stripeError: {
          code: ErrorCode.UNEXPECTED_SDK_ERROR,
          cause: '<REDACTED>',
        },
      });
      expect(JSON.parse(trace.response!)).toEqual({
        error: JSON.parse(trace.exception!),
      });
    });

    it.each([0, 750])(
      'uses the same elapsed time for the trace and metric (%i ms)',
      (durationMs) => {
        jest.setSystemTime(1_000_000);
        const traced = Logger.traceSdkMethod(() => {
          jest.setSystemTime(1_000_000 + durationMs);
          return { ok: true };
        }, 'timed');
        traced();

        const { _collector } = Logger.getInstance();
        expect(_collector._traces).toHaveLength(1);
        expect(_collector._traces[0].trace.total_time_ms).toBe(durationMs);
        expect(_collector._traces[0].trace.start_time_ms).toBe(1_000_000);
        expect(_collector._proxyEvents).toHaveLength(1);
        expect(_collector._proxyEvents[0].event).toMatchObject({
          domain: 'terminal_request',
          event: 'timed',
          duration: _collector._traces[0].trace.total_time_ms,
        });
      }
    );

    it.each([
      { name: 'no cause', cause: undefined },
      {
        name: 'a string cause',
        cause: 'Connection interrupted',
      },
      {
        name: 'an Error cause',
        cause: Object.assign(new Error('Connection interrupted'), {
          metadata: { orderId: 'cause-private' },
        }),
      },
    ])(
      'normalizes a common Error with $name once per resolved or rejected operation',
      async ({ cause }) => {
        const error = Object.assign(
          new TypeError(
            'Network request failed',
            cause === undefined ? undefined : { cause }
          ),
          { metadata: { orderId: 'private' } }
        );
        if (cause !== undefined) {
          expect(
            Object.getOwnPropertyDescriptor(error, 'cause')?.enumerable
          ).toBe(false);
        }
        const originalDescriptors = Object.getOwnPropertyDescriptors(error);
        const context = { attempt: 1 };
        const response = { error, context, optional: undefined };
        const normalizeError = jest.spyOn(StripeErrorHelpers, 'normalizeError');
        const traceError = jest.spyOn(Logger as any, 'traceError');
        const traceException = jest.spyOn(Logger as any, 'traceException');
        const resolved = Logger.traceSdkMethod(
          () => Promise.resolve(response),
          'doResolvedError'
        );
        const rejected = Logger.traceSdkMethod(
          () => Promise.reject(error),
          'doRejecting'
        );

        const result = await resolved();
        expect(normalizeError).toHaveBeenCalledTimes(1);
        expect(normalizeError).toHaveBeenLastCalledWith(error);
        const normalizedResolved = normalizeError.mock.results[0].value;
        expect(result).not.toBe(response);
        expect(result.error).toBe(normalizedResolved.stripeError);
        expect(result.error).not.toBe(error);
        expect(result.error.cause).toBe(error);
        expect(result.context).toBe(context);
        expect(Object.keys(result)).toEqual(Object.keys(response));
        expect(result.optional).toBeUndefined();
        expect(response.error).toBe(error);

        const rejectedPromise = rejected();
        await expect(rejectedPromise).rejects.toBeInstanceOf(Error);
        await flushPromises();

        expect(normalizeError).toHaveBeenCalledTimes(2);
        expect(normalizeError).toHaveBeenLastCalledWith(error);
        const normalizedRejected = normalizeError.mock.results[1].value;
        await expect(rejectedPromise).rejects.toBe(error);
        expect(normalizedRejected.stripeError).not.toBe(error);
        expect(normalizedRejected.stripeError.cause).toBe(error);
        expect(traceError).toHaveBeenCalledTimes(1);
        const tracedResponse = traceError.mock.calls[0][1] as {
          error: InternalStripeError;
        };
        expect(tracedResponse.error).toBe(normalizedResolved);
        expect(traceException).toHaveBeenCalledTimes(1);
        expect(traceException.mock.calls[0][1]).toBe(normalizedRejected);
        const { _collector } = Logger.getInstance();
        expect(_collector._traces).toHaveLength(2);
        expect(_collector._proxyEvents.map((event) => event.event)).toStrictEqual(
          ['doResolvedError', 'doRejecting'].map((method, index) => ({
            domain: 'terminal_request',
            scope: 'terminal',
            event: method,
            result: 'ERROR',
            duration: _collector._traces[index].trace.total_time_ms,
            outcome: ErrorCode.UNEXPECTED_SDK_ERROR,
            tags: { error_source: 'rn' },
          }))
        );
        const resolvedTrace = _collector._traces[0].trace;
        const rejectedTrace = _collector._traces[1].trace;
        expect(resolvedTrace.method).toBe('doResolvedError');
        expect(rejectedTrace.method).toBe('doRejecting');
        for (const trace of [resolvedTrace, rejectedTrace]) {
          expect(trace.tags).toEqual({ device_type: deviceType });
          expect(trace.status_code).toBe(ErrorCode.UNEXPECTED_SDK_ERROR);
        }
        const loggedError = JSON.parse(resolvedTrace.exception!);
        expect(loggedError).toEqual({
          errorSource: 'rn',
          stripeError: {
            name: 'StripeError',
            code: ErrorCode.UNEXPECTED_SDK_ERROR,
            nativeErrorCode: ErrorCode.UNEXPECTED_SDK_ERROR,
            message: 'Network request failed',
            metadata: '<REDACTED>',
            cause: '<REDACTED>',
          },
        });
        expect(rejectedTrace.exception).toBe(resolvedTrace.exception);
        expect(JSON.parse(resolvedTrace.response!)).toEqual({
          error: loggedError,
        });
        expect(JSON.parse(rejectedTrace.response!)).toEqual(loggedError);
        expect(Object.getOwnPropertyDescriptors(error)).toEqual(
          originalDescriptors
        );
        expect(error.metadata).toEqual({ orderId: 'private' });
        expect(error.cause).toBe(cause);
        if (cause instanceof Error) {
          expect(cause).toMatchObject({
            metadata: { orderId: 'cause-private' },
          });
        }
      }
    );

    it('unwraps resolved internal errors and preserves rejections while tracing', async () => {
      jest.setSystemTime(1_000_000);
      const internalError = StripeErrorHelpers.rehydrateBridgeError({
        code: 'CANCELED',
        message: 'The operation was canceled.',
        error_source: 'native',
      });
      const normalizeError = jest.spyOn(StripeErrorHelpers, 'normalizeError');
      const traceError = jest.spyOn(Logger as any, 'traceError');
      const traceException = jest.spyOn(Logger as any, 'traceException');
      const resolved = Logger.traceSdkMethod(
        () => Promise.resolve({ error: internalError }),
        'doResolvedError'
      );
      const rejected = Logger.traceSdkMethod(
        () => {
          jest.setSystemTime(1_000_125);
          return Promise.reject(internalError);
        },
        'doRejecting'
      );

      const result = await resolved();
      expect(result.error).toBe(internalError.stripeError);
      const { _collector } = Logger.getInstance();
      expect(_collector._traces).toHaveLength(1);
      expect(_collector._proxyEvents).toHaveLength(1);
      await expect(rejected()).rejects.toBe(internalError.stripeError);
      await flushPromises();

      expect(normalizeError).toHaveBeenCalledTimes(2);
      expect(normalizeError).toHaveBeenNthCalledWith(1, internalError);
      expect(normalizeError).toHaveBeenNthCalledWith(2, internalError);
      expect(normalizeError.mock.results[0].value).toBe(internalError);
      expect(normalizeError.mock.results[1].value).toBe(internalError);
      expect(traceError).toHaveBeenCalledTimes(1);
      const tracedResponse = traceError.mock.calls[0][1] as {
        error: InternalStripeError;
      };
      expect(tracedResponse.error).toBe(internalError);
      expect(traceException).toHaveBeenCalledTimes(1);
      expect(traceException.mock.calls[0][1]).toBe(internalError);
      expect(_collector._traces).toHaveLength(2);
      expect(_collector._proxyEvents.map((event) => event.event)).toStrictEqual(
        ['doResolvedError', 'doRejecting'].map((method, index) => ({
          domain: 'terminal_request',
          scope: 'terminal',
          event: method,
          result: 'ERROR',
          duration: _collector._traces[index].trace.total_time_ms,
          outcome: ErrorCode.CANCELED,
          tags: { error_source: 'native' },
        }))
      );
      const resolvedTrace = _collector._traces[0].trace;
      const rejectedTrace = _collector._traces[1].trace;
      expect(resolvedTrace.method).toBe('doResolvedError');
      expect(rejectedTrace.method).toBe('doRejecting');
      expect(resolvedTrace.tags).toEqual({ device_type: deviceType });
      expect(rejectedTrace.tags).toEqual({ device_type: deviceType });
      expect(rejectedTrace.total_time_ms).toBe(125);
      expect(resolvedTrace.status_code).toBe('CANCELED');
      expect(rejectedTrace.status_code).toBe('CANCELED');
      const loggedError = JSON.parse(resolvedTrace.exception!);
      expect(loggedError.errorSource).toBe('native');
      expect(loggedError.stripeError.name).toBe('StripeError');
      expect(loggedError.stripeError.message).toBe(
        'The operation was canceled.'
      );
      expect(rejectedTrace.exception).toBe(resolvedTrace.exception);
      expect(JSON.parse(resolvedTrace.response!)).toEqual({ error: loggedError });
      expect(JSON.parse(rejectedTrace.response!)).toEqual(loggedError);
    });

    it.each([false, true])(
      'preserves an async callback throw and normalizes it once for tracing (after await: %s)',
      async (afterAwait) => {
        const error = new TypeError('Network request failed');
        const normalizeError = jest.spyOn(StripeErrorHelpers, 'normalizeError');
        const traceException = jest.spyOn(Logger as any, 'traceException');
        const traced = Logger.traceSdkMethod(async () => {
          if (afterAwait) await Promise.resolve();
          throw error;
        }, 'doAsyncThrowing');

        const result = traced();

        expect(result).toBeInstanceOf(Promise);
        await expect(result).rejects.toBeInstanceOf(Error);
        await flushPromises();
        expect(normalizeError).toHaveBeenCalledTimes(1);
        expect(normalizeError).toHaveBeenCalledWith(error);
        const normalized = normalizeError.mock.results[0].value;
        await expect(result).rejects.toBe(error);
        expect(normalized.stripeError.cause).toBe(error);
        expect(traceException).toHaveBeenCalledTimes(1);
        expect(traceException.mock.calls[0][1]).toBe(normalized);

        const { _collector } = Logger.getInstance();
        expect(_collector._traces).toHaveLength(1);
        expect(_collector._proxyEvents).toHaveLength(1);
        expect(_collector._proxyEvents[0].event.result).toBe('ERROR');
        const trace = _collector._traces[0].trace;
        expect(trace.status_code).toBe(ErrorCode.UNEXPECTED_SDK_ERROR);
        expect(trace.response).toBe(trace.exception);
      }
    );

    it('preserves response-processing failures while normalizing them for tracing', async () => {
      const error = new Error('Response normalization failed');
      jest
        .spyOn(Logger as any, 'normalizeResponseError')
        .mockImplementationOnce(() => {
          throw error;
        });
      const normalizeError = jest.spyOn(StripeErrorHelpers, 'normalizeError');
      const traceException = jest.spyOn(Logger as any, 'traceException');
      const traced = Logger.traceSdkMethod(
        () => Promise.resolve({ ok: true }),
        'doNormalizing'
      );

      const result = traced();
      await expect(result).rejects.toBeInstanceOf(Error);
      await flushPromises();

      expect(normalizeError).toHaveBeenCalledTimes(1);
      expect(normalizeError).toHaveBeenCalledWith(error);
      const normalized = normalizeError.mock.results[0].value;
      await expect(result).rejects.toBe(error);
      expect(normalized.stripeError.cause).toBe(error);
      expect(traceException).toHaveBeenCalledTimes(1);
      expect(traceException.mock.calls[0][1]).toBe(normalized);
      const { _collector } = Logger.getInstance();
      expect(_collector._traces).toHaveLength(1);
      expect(_collector._proxyEvents).toHaveLength(1);
      expect(_collector._proxyEvents[0].event.result).toBe('ERROR');
      const trace = _collector._traces[0].trace;
      expect(trace.status_code).toBe(ErrorCode.UNEXPECTED_SDK_ERROR);
      expect(trace.response).toBe(trace.exception);
    });

    it.each(['common Error', 'rn', 'native'] as const)(
      'preserves a synchronous throw and normalizes it only for tracing (%s)',
      (source) => {
        jest.setSystemTime(1_000_000);
        const message = 'Operation failed';
        const error =
          source === 'common Error'
            ? new TypeError(message)
            : StripeErrorHelpers.createInternalStripeError(
                { code: ErrorCode.READER_BUSY, message },
                source
              );
        const normalizeError = jest.spyOn(StripeErrorHelpers, 'normalizeError');
        const traceException = jest.spyOn(Logger as any, 'traceException');
        const operation = jest.fn(() => {
          jest.setSystemTime(1_000_375);
          throw error;
        });
        const traced = Logger.traceSdkMethod(operation, 'doThrowing');

        let thrown: unknown;
        try {
          traced();
        } catch (exception) {
          thrown = exception;
        }

        expect(thrown).toBe(error);
        expect(operation).toHaveBeenCalledTimes(1);
        expect(normalizeError).toHaveBeenCalledTimes(1);
        expect(normalizeError).toHaveBeenCalledWith(error);
        const normalized = normalizeError.mock.results[0].value;
        if (error instanceof InternalStripeError) {
          expect(normalized).toBe(error);
        } else {
          expect(thrown).toBeInstanceOf(TypeError);
          expect(normalized.stripeError.cause).toBe(error);
        }
        expect(traceException).toHaveBeenCalledTimes(1);
        expect(traceException.mock.calls[0][1]).toBe(normalized);

        const { _collector } = Logger.getInstance();
        expect(_collector._traces).toHaveLength(1);
        expect(_collector._proxyEvents).toHaveLength(1);
        const trace = _collector._traces[0].trace;
        const code =
          source === 'common Error'
            ? ErrorCode.UNEXPECTED_SDK_ERROR
            : ErrorCode.READER_BUSY;
        expect(trace.total_time_ms).toBe(375);
        expect(_collector._proxyEvents[0].event).toStrictEqual({
          domain: 'terminal_request',
          scope: 'terminal',
          event: 'doThrowing',
          result: 'ERROR',
          duration: trace.total_time_ms,
          outcome: code,
          tags: { error_source: source === 'common Error' ? 'rn' : source },
        });
        expect(trace.method).toBe('doThrowing');
        expect(trace.tags).toEqual({ device_type: deviceType });
        expect(trace.status_code).toBe(code);
        expect(trace.response).toBe(trace.exception);
        expect(JSON.parse(trace.exception!)).toMatchObject({
          errorSource: source === 'common Error' ? 'rn' : source,
          stripeError: {
            name: 'StripeError',
            code,
            nativeErrorCode: code,
            message,
            metadata: '<REDACTED>',
          },
        });
      }
    );

    // The next three guard against a TypeError thrown by the `'error'
    // in response` / `'error' in resp` checks when the wrapped function
    // returns a non-object value.

    it('does not throw and records OK when a sync method returns null', () => {
      const traced = Logger.traceSdkMethod(() => null, 'doNull');
      expect(() => traced()).not.toThrow();

      const { _collector } = Logger.getInstance();
      expect(_collector._traces).toHaveLength(1);
      expect(_collector._proxyEvents).toHaveLength(1);
      expect(_collector._proxyEvents[0].event.result).toBe('OK');
    });

    it('does not throw and records OK when a sync method returns a primitive', () => {
      const traced = Logger.traceSdkMethod(() => 42, 'doPrimitive');
      expect(() => traced()).not.toThrow();

      const { _collector } = Logger.getInstance();
      expect(_collector._traces).toHaveLength(1);
      expect(_collector._proxyEvents).toHaveLength(1);
      expect(_collector._proxyEvents[0].event.result).toBe('OK');
    });

    it('records OK (not a TypeError exception) when a promise resolves to null', async () => {
      const traced = Logger.traceSdkMethod(
        () => Promise.resolve(null),
        'doNullPromise'
      );
      traced();
      await flushPromises();

      const { _collector } = Logger.getInstance();
      expect(_collector._traces).toHaveLength(1);
      expect(_collector._proxyEvents).toHaveLength(1);
      expect(_collector._traces[0].trace.exception).toBeUndefined();
      expect(_collector._proxyEvents[0].event.result).toBe('OK');
    });
  });

  describe('setLogLevel', () => {
    let consoleLog: jest.SpyInstance;

    beforeEach(() => {
      consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLog.mockRestore();
    });

    const stubFetch = (): typeof global.fetch => {
      const original = global.fetch;
      const fakeFetch = jest
        .fn<Promise<Response>, [unknown]>()
        .mockResolvedValue({ ok: true, status: 200 } as Response);
      global.fetch = fakeFetch as unknown as typeof global.fetch;
      return original;
    };

    const seedTrace = () => {
      Logger.traceSdkMethod(() => ({ ok: true }), 'noop')();
    };

    it('routes the ConsoleWriter to console.log when verbose', async () => {
      Logger.setLogLevel('verbose');
      seedTrace();
      const original = stubFetch();
      try {
        await Logger.getInstance()._uploader.flush();
      } finally {
        global.fetch = original;
      }

      const traceStartCall = consoleLog.mock.calls.find((c) =>
        String(c[1]).startsWith('reportTrace start')
      );
      expect(traceStartCall?.[0]).toBe('[StripeTerminal:Logger]');
    });

    it('keeps the ConsoleWriter silent when the level is undefined', async () => {
      Logger.setLogLevel(undefined);
      seedTrace();
      const original = stubFetch();
      try {
        await Logger.getInstance()._uploader.flush();
      } finally {
        global.fetch = original;
      }

      expect(consoleLog).not.toHaveBeenCalled();
    });
  });
});
