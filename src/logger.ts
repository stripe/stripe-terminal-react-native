import {
  getBundleId,
  getBuildNumber,
  getSystemVersion,
  getSystemName,
  getUniqueId,
  getDeviceId,
} from 'react-native-device-info';
import * as packageJson from '../package.json';
import { b64EncodeUnicode } from './utils/b64EncodeDecode';

const getDeviceInfo = () => {
  return {
    device_class: 'POS',
    device_uuid: getUniqueId(),
    host_os_version: getSystemName(),
    host_hw_version: getSystemVersion(),
    hardware_model: {
      pos_info: {
        description: getDeviceId(),
      },
    },
    app_model: {
      app_id: getBundleId(),
      app_version: getBuildNumber(),
    },
  };
};

type DeviceInfo = object;

const buildUrlSearchParams = (obj: DeviceInfo) => {
  const getKeyValues = (source: DeviceInfo, keys: any[]) =>
    Object.entries(source).reduce((acc: any[], [key, value]) => {
      if (typeof value === 'object') {
        acc.push(...getKeyValues(value, [...keys, key]));
      } else {
        acc.push([[...keys, key], value]);
      }

      return acc;
    }, []);

  let keys: string[] = [];

  return getKeyValues(obj, keys)
    .map(([[key0, ...keysRest], value]) => {
      const keysRestInBrackets = keysRest
        .map((a: string) => `[${a}]`.replace('[', '%5B').replace(']', '%5D'))
        .join('');

      return `${key0}${keysRestInBrackets}=${value}`;
    })
    .join('&');
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
      client_version: '',
    },

    parent_trace_id: '',
    device_info: getDeviceInfo(),
  };
};

const sendGatorRequest = (request: object) => {
  const url = 'https://gator.stripe.com:443/protojsonservice/GatorService';

  console.log(`!!! SENDING GATOR REQUEST !!! ${JSON.stringify(request)}`);

  fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
};

const generatePosRpcSession = (connection_token: string) => {
  const url =
    'https://api.stripe.com/v1/terminal/connection_tokens/generate_pos_rpc_session';

  const body = buildUrlSearchParams({ pos_device_info: getDeviceInfo() });

  console.log(85, body);

  return fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${b64EncodeUnicode(connection_token)}`,
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      'stripe-version': '2019-02-19',
    },
    body,
  })
    .then((response) => response.json())
    .then((json) => {
      if (json.sdk_rpc_session_token) {
        return json.sdk_rpc_session_token;
      } else {
        console.error(json);
      }
    })
    .catch((_error) => {
      // swallow error
      return null;
    });
};

export default class Logger {
  static instance: Logger | null = null;
  _sessionToken: string | null = null;

  static getInstance() {
    if (Logger.instance === null) {
      Logger.instance = new Logger();
    }

    return Logger.instance;
  }

  static async acquireSessionToken(tokenProvider: () => Promise<string>) {
    console.log(tokenProvider);
    // Call the user's token provider method to get a connection token
    const connectionToken = await tokenProvider();
    // Exchange that connection token for a RPC session token
    const sessionToken = await generatePosRpcSession(connectionToken);
    // Set _sessionToken to that
    Logger.getInstance()._sessionToken = sessionToken;
  }

  static forgetSessionToken() {
    Logger.getInstance()._sessionToken = null;
  }

  // private static reportEvent(event: object) {
  //   const req = buildGatorRequest(
  //     'reportEvent',
  //     event,
  //     Logger.getInstance()._sessionToken
  //   );
  //   sendGatorRequest(req);
  // }

  private static reportTrace(trace: object) {
    const req = buildGatorRequest(
      'reportTrace',
      { proxy_traces: [trace] },
      Logger.getInstance()._sessionToken
    );
    sendGatorRequest(req);
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

      const baseTraceObject = {
        origin_role: 'pos-js',
        origin_id: 'pos-b0u0t9vbvob',
        trace: {
          action_id: '',
          request_info: {
            user_agent: '',
          },
          start_time_ms: Date.now(),
          total_time_ms: 0,
          service: 'asdf',
          method,
          request: JSON.stringify({ args }),
          version_info: {
            client_type: 'RN_SDK',
            client_version: packageJson.version,
          },
          traces: [],
          additional_context: {
            action_id: '78793673',
            session_id: '59501352',
            serial_number: 'WSC513101000010',
          },
        },
      };

      const response = fn.apply(this, args);

      if (response instanceof Promise) {
        Logger.tracePromise(baseTraceObject, response);
      }

      // Is there a case where we have an error that isn't thrown on a promise?

      Logger.traceSuccess(baseTraceObject, response);

      return response;
    };
  }

  private static tracePromise(
    baseTraceObject: object,
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

  private static traceSuccess(baseTraceObject: object, response: any): void {
    const trace = {
      type: 'success',
      response: JSON.stringify(response),
      ...baseTraceObject,
    };
    Logger.reportTrace(trace);
  }

  private static traceException(
    baseTraceObject: object,
    exception: Error
  ): void {
    const trace = {
      type: 'exception',
      exception: exception.message,
      errorCode: exception.cause,
      ...baseTraceObject,
    };
    Logger.reportTrace(trace);
  }
}
