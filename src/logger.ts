import { b64EncodeUnicode } from './utils/b64EncodeDecode';

const getDeviceInfo = () => {
  return {
    device_class: 'POS',
    device_uuid: '8779b5ea-c25d-11ec-9d64-0242ac120002', // https://www.npmjs.com/package/react-native-device-info
    host_os_version: 'jil-test-host-os',
    host_hw_version: 'my-computer',
    hardware_model: {
      pos_info: {
        description: 'jil-test',
      },
    },
    app_model: {
      app_id: 'com.stripe.jil.is.testing.gator',
      app_version: '42.4.2',
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

  static reportEvent(event: object) {
    const req = buildGatorRequest(
      'reportEvent',
      event,
      Logger.getInstance()._sessionToken
    );
    sendGatorRequest(req);
  }

  static reportTrace(trace: object) {
    const req = buildGatorRequest(
      'reportTrace',
      trace,
      Logger.getInstance()._sessionToken
    );
    sendGatorRequest(req);
  }
}

/**
 * When initializing:
 *
 * ```
 * Logger.acquireSessionToken(tokenProvider);
 * ```
 *
 * When connecting:
 *
 * ```
 * if(Logger.sessionToken !== null) {
 *    Logger.acquireSessionToken()
 * }
 * ```
 *
 * When disconnecting:
 *
 * ```
 * Logger.forgetSessionToken()
 * ```
 *
 * When logging:
 *
 * ```
 * Logger.reportEvent(...)
 * ```
 *
 */
