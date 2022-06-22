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

const getDeviceInfo = () => {
  return {
    device_class: 'POS',
    // device_uuid: '',
    host_os_version: Platform.Version.toString(),
    // host_hw_version: '', // ex: 'iPad4,1' or 'SM-N960U'
    hardware_model: {
      pos_info: {
        description: Platform.select({
          ios: 'iOS',
          android: 'Android',
        })?.toString(),
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
  static posId: string = `pos-${Math.random().toString(36).substring(2)}`;
  _traces: Array<Trace> = [];

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

      if (response instanceof Promise) {
        Logger.tracePromise(baseTraceObject, response);
        return response;
      }

      if ('error' in response) {
        Logger.traceError(baseTraceObject, response);
        return response;
      }

      Logger.traceSuccess(baseTraceObject, JSON.stringify(response));
      return response;
    };
  }

  private static flushTraces() {
    if (Logger.getInstance()._traces.length === 0) {
      return;
    }

    // reportTrace
    const req = buildGatorRequest(
      'reportTrace',
      { proxy_traces: [...Logger.getInstance()._traces] },
      ''
    );
    sendGatorRequest(req).then((_resp) => {
      Logger.getInstance()._traces = [];
    });

    // reportEvent
    const eventRequest = buildGatorRequest(
      'reportEvent',
      {
        proxy_events: Logger.getEventPayload(),
      },
      ''
    );
    sendGatorRequest(eventRequest).then((_resp) => {
      Logger.getInstance()._traces = [];
    });
  }

  private static getEventPayload() {
    return Logger.getInstance()._traces.map((trace) => ({
      origin_role: 'pos-rn',
      origin_id: Logger.posId,
      event: {
        domain: 'Tracer',
        scope: 'e',
        event: trace?.trace?.method,
        result: trace?.trace?.exception ? 'ERROR' : 'OK',
      },
    }));
  }

  private static tracePromise(
    baseTraceObject: Trace,
    response: Promise<any>
  ): void {
    const clonedTraceBase = { ...baseTraceObject };
    response
      .then((resp) => {
        if ('error' in resp && resp.error) {
          Logger.traceError(clonedTraceBase, resp);
          return;
        }

        const responseString = JSON.stringify(resp);
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
      },
    };

    Logger.getInstance()._traces.push(trace);
  }

  private static traceError(
    baseTraceObject: Trace,
    response: ObjectWithError
  ): void {
    const trace = {
      ...baseTraceObject,
      trace: {
        ...baseTraceObject.trace,
        exception: JSON.stringify(response.error),
        response: JSON.stringify(response),
      },
    };
    Logger.getInstance()._traces.push(trace);
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
        response: JSON.stringify(exception),
      },
    };
    Logger.getInstance()._traces.push(trace);
  }
}
