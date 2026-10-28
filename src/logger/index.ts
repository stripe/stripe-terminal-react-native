import * as packageJson from '../../package.json';
import { Platform } from 'react-native';
import {
  stringifyRedactedInternalError,
  stringifyRedactedRequest,
  stringifyRedactedResponse,
} from '../utils/redactionPolicies';
import type { LogLevel } from '../types';
import { InternalStripeError } from '../Errors/InternalStripeError';
import { ErrorCode } from '../Errors/ErrorCodes';
import { isValidErrorCode, normalizeError } from '../Errors/StripeErrorHelpers';
import { MetricTag, TimerMetric } from './Metric';
import type { MetricFields } from './Metric';
import { InMemoryCollector } from './inMemoryCollector';
import {
  BatchUploader,
  ConsoleWriter,
  RealScheduler,
  RealUploader,
  realClock,
} from './batchUploader';

interface ObjectWithError {
  error: InternalStripeError;
}

export interface Trace {
  origin_role: string;
  origin_id: string;
  trace: {
    action_id: string;
    request_info: {
      user_agent: string;
    };
    start_time_ms: number;
    total_time_ms: number;
    service: string;
    method: string;
    request: string;
    response?: string;
    exception?: string;
    status_code?: string;
    tags: {
      device_type: string;
      discovery_method?: string;
      react_native_version?: string;
    };
    version_info: {
      client_type: string;
      client_version: string;
    };
    traces: string[];
    additional_context: {
      action_id: string;
      session_id: string;
      serial_number: string;
    };
  };
}

export interface ProxyEvent {
  origin_role: string;
  origin_id: string;
  event: {
    domain: string;
    scope: string;
    event: string;
    result: 'OK' | 'ERROR';
  };
}

/**
 * A singleton class whose instance exists for the lifetime of the RN SDK.
 * This class batches traces and sends them to Client-Logger, a Stripe-internal
 * analytics service.
 */
export default class Logger {
  static instance: Logger | null = null;
  static posId: string = `pos-${Math.random().toString(36).substring(2)}`;
  static logLevel: LogLevel | undefined = undefined;
  private static readerSerialNumber: string = '';

  _collector: InMemoryCollector;
  _uploader: BatchUploader;

  static setLogLevel(level: LogLevel | undefined): void {
    Logger.logLevel = level;
  }

  /** Starts trace context for operations performed during a reader session. */
  static startReaderSession(serialNumber?: string): void {
    Logger.readerSerialNumber = serialNumber ?? '';
  }

  /** Ends trace context for the current reader session. */
  static endReaderSession(): void {
    Logger.startReaderSession();
  }

  private static serialNumberFromReader(reader: unknown): string | undefined {
    try {
      const serialNumber = (reader as { serialNumber?: unknown } | null)
        ?.serialNumber;
      return typeof serialNumber === 'string' && serialNumber.length > 0
        ? serialNumber
        : undefined;
    } catch {
      // Trace context must never interrupt an SDK operation.
      return undefined;
    }
  }

  private static serialNumberFromConnectArgs(
    args: readonly unknown[]
  ): string | undefined {
    try {
      return Logger.serialNumberFromReader(
        (args[0] as { reader?: unknown } | null)?.reader
      );
    } catch {
      return undefined;
    }
  }

  private static updateReaderSessionFromResponse(
    trace: Trace,
    response: unknown,
    attemptedReaderSerialNumber?: string
  ): void {
    try {
      if (
        response === null ||
        typeof response !== 'object' ||
        (response as { error?: unknown }).error
      ) {
        return;
      }

      const reader =
        trace.trace.method === 'getConnectedReader'
          ? response
          : (response as { reader?: unknown }).reader;
      const serialNumber =
        Logger.serialNumberFromReader(reader) ?? attemptedReaderSerialNumber;
      if (serialNumber) {
        trace.trace.additional_context.serial_number = serialNumber;
      }

      // A reader query describes its own trace, but does not establish a new
      // lifecycle session. Connect and disconnect own that state.
      if (trace.trace.method === 'getConnectedReader') {
        return;
      }

      if (serialNumber) {
        Logger.startReaderSession(serialNumber);
      } else if (trace.trace.method === 'initialize') {
        trace.trace.additional_context.serial_number = '';
        Logger.endReaderSession();
      } else if (
        trace.trace.method === 'disconnectReader' &&
        Logger.readerSerialNumber ===
          trace.trace.additional_context.serial_number
      ) {
        Logger.endReaderSession();
      }
    } catch {
      // Trace context must never interrupt an SDK operation.
    }
  }

  static getInstance() {
    if (Logger.instance === null) {
      Logger.instance = new Logger();
    }

    return Logger.instance;
  }

  constructor() {
    this._collector = new InMemoryCollector();
    this._uploader = new BatchUploader({
      collector: this._collector,
      uploader: new RealUploader(),
      clock: realClock,
      scheduler: new RealScheduler(),
      writer: new ConsoleWriter(() => Logger.logLevel === 'verbose'),
      deviceUuid: Logger.posId,
    });
  }

  private static metricTagsFromArgs(
    methodName: string,
    args: readonly unknown[]
  ): Record<string, string> | undefined {
    try {
      return methodName === 'connectReader'
        ? {
            [MetricTag.DISCOVERY_METHOD]: (
              args[0] as { discoveryMethod: string }
            ).discoveryMethod,
          }
        : undefined;
    } catch {
      // Metric tags must never interrupt an SDK operation.
      return undefined;
    }
  }

  /** Records a terminal_request timer without creating a trace. */
  private static recordTerminalRequest(
    methodName: string,
    durationMs: number,
    error?: InternalStripeError,
    metricTags?: Record<string, string>
  ): void {
    const fields: MetricFields = {
      domain: 'terminal_request',
      scope: 'terminal',
      event: methodName,
      result: error ? 'ERROR' : 'OK',
    };
    if (metricTags) {
      fields.tags = metricTags;
    }
    if (error) {
      fields.outcome = isValidErrorCode(error.stripeError.code)
        ? error.stripeError.code
        : ErrorCode.UNEXPECTED_SDK_ERROR;
      fields.tags = {
        ...metricTags,
        [MetricTag.ERROR_SOURCE]: error.errorSource,
      };
    }

    const metric = new TimerMetric(fields, durationMs);
    Logger.getInstance()._collector.pushProxyEvent({
      origin_role: 'pos-rn',
      origin_id: Logger.posId,
      event: metric.toPayload(),
    });
  }

  /**
   * A method that traces that an inner function (`fn`) was called. This should
   * wrap the entire method body of a public facing Terminal SDK method.
   * This method logs the function parameters with which the function was called,
   * and the response that gets sent back to the user.
   *
   * @param fn The inner function that should be called and traced.
   * @param methodName The name of the SDK method that's getting traced.
   * @returns A function that should be called with `fn`'s args.
   */
  static traceSdkMethod(
    fn: (...args: any[]) => any | Promise<any>,
    methodName: string
  ) {
    return function constructTrace(this: any, ...args: any[]) {
      const method = methodName || fn.name;
      const metricTags = Logger.metricTagsFromArgs(method, args);

      const action_id = `${Math.floor(Math.random() * 100000000)}`;
      const attemptedReaderSerialNumber =
        method === 'connectReader'
          ? Logger.serialNumberFromConnectArgs(args)
          : undefined;
      const serialNumber =
        attemptedReaderSerialNumber ?? Logger.readerSerialNumber;

      const baseTraceObject: Trace = {
        origin_role: 'pos-rn',
        origin_id: Logger.posId,
        trace: {
          action_id,
          request_info: {
            user_agent: '',
          },
          start_time_ms: Date.now(),
          total_time_ms: 0,
          service: 'StripeTerminalReactNative',
          method,
          request: stringifyRedactedRequest(method, args),
          tags: { device_type: Platform.OS },
          version_info: {
            client_type: 'RN_SDK',
            client_version: packageJson.version,
          },
          traces: [],
          additional_context: {
            action_id,
            session_id: '',
            serial_number: serialNumber,
          },
        },
      };

      try {
        const reactNativeVersion = Platform.constants?.reactNativeVersion;
        if (reactNativeVersion) {
          const { major, minor, patch, prerelease } = reactNativeVersion;
          baseTraceObject.trace.tags.react_native_version = `${major}.${minor}.${patch}${
            prerelease ? `-${prerelease}` : ''
          }`;
        }
      } catch {
        // Optional diagnostic metadata must not interrupt SDK operations.
      }

      const discoveryMethod = metricTags?.[MetricTag.DISCOVERY_METHOD];
      if (discoveryMethod !== undefined) {
        baseTraceObject.trace.tags.discovery_method = discoveryMethod;
      }

      let response;
      try {
        response = fn.apply(this, args);
      } catch (error) {
        const internalError = normalizeError(error);
        Logger.traceException(baseTraceObject, internalError, metricTags);
        throw error;
      }

      if (response instanceof Promise) {
        const normalizedResponse = response.then(Logger.normalizeResponseError);
        Logger.tracePromise(
          baseTraceObject,
          normalizedResponse,
          attemptedReaderSerialNumber,
          metricTags
        );
        return normalizedResponse.then(
          Logger.unwrapInternalError,
          Logger.unwrapInternalRejection
        );
      }

      if (response?.error) {
        const normalizedResponse = Logger.normalizeResponseError(response);
        Logger.traceError(baseTraceObject, normalizedResponse, metricTags);
        return Logger.unwrapInternalError(normalizedResponse);
      }

      Logger.updateReaderSessionFromResponse(
        baseTraceObject,
        response,
        attemptedReaderSerialNumber
      );
      Logger.traceSuccess(
        baseTraceObject,
        stringifyRedactedResponse(method, response),
        metricTags
      );
      return response;
    };
  }

  private static normalizeResponseError(response: any): any {
    const error = response?.error;
    if (!error) {
      return response;
    }
    const internalError = normalizeError(error);
    return internalError === error
      ? response
      : { ...response, error: internalError };
  }

  private static unwrapInternalError(response: any): any {
    if (response?.error) {
      return { ...response, error: response.error.stripeError };
    }
    return response;
  }

  private static unwrapInternalRejection(error: unknown): never {
    if (error instanceof InternalStripeError) {
      throw error.stripeError;
    }
    throw error;
  }

  private static toLoggableInternalError(error: InternalStripeError): object {
    const stripeError = error.stripeError;
    const commonError = stripeError.cause;

    return {
      ...error,
      stripeError: {
        ...stripeError,
        name: stripeError.name,
        message: stripeError.message,
        cause:
          commonError instanceof Error
            ? Logger.toLoggableCommonError(commonError)
            : undefined,
      },
    };
  }

  private static toLoggableCommonError(topError: Error): object {
    const cause = topError.cause;

    return {
      ...topError,
      name: topError.name,
      message: topError.message,
      cause:
        cause instanceof Error
          ? {
              ...cause,
              name: cause.name,
              message: cause.message,
            }
          : undefined,
    };
  }

  /** Expects normalized error results; normalizes rejections only for tracing. */
  private static tracePromise(
    baseTraceObject: Trace,
    response: Promise<any>,
    attemptedReaderSerialNumber?: string,
    metricTags?: Record<string, string>
  ): void {
    const clonedTraceBase = { ...baseTraceObject };
    response
      .then((resp) => {
        Logger.updateReaderSessionFromResponse(
          clonedTraceBase,
          resp,
          attemptedReaderSerialNumber
        );
        if (resp?.error) {
          Logger.traceError(clonedTraceBase, resp, metricTags);
          return;
        }

        const responseString = stringifyRedactedResponse(
          clonedTraceBase.trace.method,
          resp
        );
        Logger.traceSuccess(clonedTraceBase, responseString, metricTags);
      })
      .catch((e) => {
        Logger.traceException(clonedTraceBase, normalizeError(e), metricTags);
      });
  }

  private static traceSuccess(
    baseTraceObject: Trace,
    response: string,
    metricTags?: Record<string, string>
  ): void {
    const trace = {
      ...baseTraceObject,
      trace: {
        ...baseTraceObject.trace,
        response,
        total_time_ms: Date.now() - baseTraceObject.trace.start_time_ms,
      },
    };
    Logger.getInstance()._collector.pushTrace(trace);
    Logger.recordTerminalRequest(
      trace.trace.method,
      trace.trace.total_time_ms,
      undefined,
      metricTags
    );
  }

  private static traceError(
    baseTraceObject: Trace,
    response: ObjectWithError,
    metricTags?: Record<string, string>
  ): void {
    const loggedError = Logger.toLoggableInternalError(response.error);
    const trace = {
      ...baseTraceObject,
      trace: {
        ...baseTraceObject.trace,
        exception: stringifyRedactedInternalError(loggedError),
        status_code: response.error.stripeError.code,
        response: stringifyRedactedResponse(baseTraceObject.trace.method, {
          ...response,
          error: loggedError,
        }),
        total_time_ms: Date.now() - baseTraceObject.trace.start_time_ms,
      },
    };
    Logger.getInstance()._collector.pushTrace(trace);
    Logger.recordTerminalRequest(
      trace.trace.method,
      trace.trace.total_time_ms,
      response.error,
      metricTags
    );
  }

  private static traceException(
    baseTraceObject: Trace,
    exception: InternalStripeError,
    metricTags?: Record<string, string>
  ): void {
    const loggedError = stringifyRedactedInternalError(
      Logger.toLoggableInternalError(exception)
    );
    const trace = {
      ...baseTraceObject,
      trace: {
        ...baseTraceObject.trace,
        exception: loggedError,
        status_code: exception.stripeError.code,
        response: loggedError,
        total_time_ms: Date.now() - baseTraceObject.trace.start_time_ms,
      },
    };
    Logger.getInstance()._collector.pushTrace(trace);
    Logger.recordTerminalRequest(
      trace.trace.method,
      trace.trace.total_time_ms,
      exception,
      metricTags
    );
  }
}
