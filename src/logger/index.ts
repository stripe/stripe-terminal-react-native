import * as packageJson from '../../package.json';
import { stringifyRedacted } from '../utils/redact';
import type { LogLevel } from '../types';
import { InMemoryCollector } from './inMemoryCollector';
import {
  BatchUploader,
  ConsoleWriter,
  RealScheduler,
  RealUploader,
  realClock,
} from './batchUploader';

interface ObjectWithError {
  error: any;
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

  _collector: InMemoryCollector;
  _uploader: BatchUploader;

  static setLogLevel(level: LogLevel | undefined): void {
    Logger.logLevel = level;
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

      const action_id = `${Math.floor(Math.random() * 100000000)}`;

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
          request: stringifyRedacted({ args }),
          version_info: {
            client_type: 'RN_SDK',
            client_version: packageJson.version,
          },
          traces: [],
          additional_context: {
            action_id,
            session_id: '',
            serial_number: '',
          },
        },
      };

      const response = fn.apply(this, args);

      if (response instanceof Promise) {
        Logger.tracePromise(baseTraceObject, response);
        return response;
      }

      if (response?.error) {
        Logger.traceError(baseTraceObject, response);
        return response;
      }

      Logger.traceSuccess(
        baseTraceObject,
        stringifyRedacted(response)
      );
      return response;
    };
  }

  private static makeProxyEventFromTrace(trace: Trace): ProxyEvent {
    return {
      origin_role: 'pos-rn',
      origin_id: Logger.posId,
      event: {
        domain: 'Tracer',
        scope: 'e',
        event: trace?.trace?.method,
        result: trace?.trace?.exception ? 'ERROR' : 'OK',
      },
    };
  }

  private static tracePromise(
    baseTraceObject: Trace,
    response: Promise<any>
  ): void {
    const clonedTraceBase = { ...baseTraceObject };
    response
      .then((resp) => {
        if (resp?.error) {
          Logger.traceError(clonedTraceBase, resp);
          return;
        }

        const responseString = stringifyRedacted(resp);
        Logger.traceSuccess(clonedTraceBase, responseString);
      })
      .catch((e) => {
        Logger.traceException(clonedTraceBase, e);
      });
  }

  private static traceSuccess(baseTraceObject: Trace, response: string): void {
    const trace = {
      ...baseTraceObject,
      trace: {
        ...baseTraceObject.trace,
        response,
        total_time_ms: Date.now() - baseTraceObject.trace.start_time_ms,
      },
    };
    Logger.getInstance()._collector.pushTrace(trace);
    Logger.getInstance()._collector.pushProxyEvent(
      Logger.makeProxyEventFromTrace(trace)
    );
  }

  private static traceError(
    baseTraceObject: Trace,
    response: ObjectWithError
  ): void {
    const trace = {
      ...baseTraceObject,
      trace: {
        ...baseTraceObject.trace,
        exception: stringifyRedacted(response.error),
        response: stringifyRedacted(response),
        total_time_ms: Date.now() - baseTraceObject.trace.start_time_ms,
      },
    };
    Logger.getInstance()._collector.pushTrace(trace);
    Logger.getInstance()._collector.pushProxyEvent(
      Logger.makeProxyEventFromTrace(trace)
    );
  }

  private static traceException(
    baseTraceObject: Trace,
    exception: Error
  ): void {
    const trace = {
      ...baseTraceObject,
      trace: {
        ...baseTraceObject.trace,
        exception: exception.message,
        status_code: exception.cause,
        response: stringifyRedacted(exception),
        total_time_ms: Date.now() - baseTraceObject.trace.start_time_ms,
      },
    };
    Logger.getInstance()._collector.pushTrace(trace);
    Logger.getInstance()._collector.pushProxyEvent(
      Logger.makeProxyEventFromTrace(trace)
    );
  }
}
