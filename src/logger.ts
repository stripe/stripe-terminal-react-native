import * as packageJson from '../package.json';
import { Platform } from 'react-native';
import { b64EncodeUnicode } from './utils/b64EncodeDecode';

interface ObjectWithError {
  error: any;
}

interface Trace {
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

const getDeviceInfo = () => {
  return {
    device_class: 'POS',
    // device_uuid: '',
    host_os_version: Platform.Version.toString(),
    // host_hw_version: '', // ex: 'iPad4,1' or 'SM-N960U'
    hardware_model: {
      pos_info: {
        description: Platform.select({ ios: 'iOS', android: 'Android' }),
      },
    },
    // app_model: {
    //   app_id: '',
    //   app_version: '',
    // },
  };
};

const buildGatorRequest = (
  method: string,
  requestPayload: object,
  sessionToken: string | null
) => {
  return {
    id: Date.now(),
    service: 'GatorService',
    method,
    content: b64EncodeUnicode(JSON.stringify(requestPayload)),
    session_token: sessionToken || '',
    version_info: {
      client_type: 'RN_SDK',
      client_version: packageJson.version,
    },

    parent_trace_id: '',
    device_info: getDeviceInfo(),
  };
};

const sendGatorRequest = async (request: object) => {
  const url = 'https://gator.stripe.com:443/protojsonservice/GatorService';

  return fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
};

/**
 * A singleton class whose instance exists for the lifetime of the RN SDK.
 * This class batches traces and sends them to Client-Logger, a Stripe-internal
 * analytics service.
 *
 * The instance holds onto traces, and holds a timer that flushes the collected
 * traces (currently every 10 seconds).
 */
export default class Logger {
  static instance: Logger | null = null;
  _traces: object[] = [];

  static getInstance() {
    if (Logger.instance === null) {
      Logger.instance = new Logger();
    }

    return Logger.instance;
  }

  constructor() {
    setInterval(Logger.flushTraces, 10 * 1000);
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
        origin_role: 'pos-js',
        origin_id: 'pos-b0u0t9vbvob',
        trace: {
          action_id,
          request_info: {
            user_agent: '',
          },
          start_time_ms: Date.now(),
          total_time_ms: 0,
          service: 'StripeTerminalReactNative',
          method,
          request: JSON.stringify({ args }),
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

      if ('error' in response) {
        Logger.traceError(baseTraceObject, response);
      } else {
        Logger.traceSuccess(baseTraceObject, response);
      }

      return response;
    };
  }

  private static flushTraces() {
    if (Logger.getInstance()._traces.length === 0) {
      return;
    }

    const req = buildGatorRequest(
      'reportTrace',
      { proxy_traces: [...Logger.getInstance()._traces] },
      '' // TODO: Fetch the logging token from the native module
    );
    sendGatorRequest(req).then((_resp) => {
      Logger.getInstance()._traces = [];
    });
  }

  private static tracePromise(
    baseTraceObject: Trace,
    response: Promise<any>
  ): void {
    const clonedTraceBase = { ...baseTraceObject };
    response
      .then((resp) => {
        const responseString = JSON.stringify(resp);
        Logger.traceSuccess(clonedTraceBase, responseString);
      })
      .catch((e) => {
        Logger.traceException(clonedTraceBase, e);
      });
  }

  private static traceSuccess(baseTraceObject: Trace, response: any): void {
    if (response instanceof Promise) {
      Logger.tracePromise(baseTraceObject, response);
      return;
    }

    const trace = {
      type: 'success',
      response: JSON.stringify(response),
      ...baseTraceObject,
    };
    Logger.getInstance()._traces.push(trace);
  }

  private static traceError(
    baseTraceObject: Trace,
    response: ObjectWithError
  ): void {
    const trace = {
      type: 'exception',
      exception: response.error,
      errorCode: 'error',
      ...baseTraceObject,
    };
    Logger.getInstance()._traces.push(trace);
  }

  private static traceException(
    baseTraceObject: Trace,
    exception: Error
  ): void {
    const trace = {
      type: 'exception',
      exception: exception.message,
      errorCode: exception.cause,
      ...baseTraceObject,
    };
    Logger.getInstance()._traces.push(trace);
  }
}
