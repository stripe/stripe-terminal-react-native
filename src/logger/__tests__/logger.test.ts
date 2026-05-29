jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    Version: '17.0',
    select: (options: { [key: string]: unknown }) =>
      options.ios ?? options.default,
  },
}));

import Logger from '..';

const flushPromises = async (n = 5) => {
  for (let i = 0; i < n; i++) {
    await Promise.resolve();
  }
};

const resetSingleton = () => {
  Logger.instance = null;
  Logger.setLogLevel(undefined);
};

describe('Logger (facade)', () => {
  beforeEach(() => {
    // Fake timers so the BatchUploader's constructor-scheduled flush
    // doesn't fire during the test (its real `fetch` would hit the
    // network).
    jest.useFakeTimers();
    resetSingleton();
  });

  afterEach(() => {
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
    it('pushes a trace + derived event into the collector for a sync return', () => {
      const traced = Logger.traceSdkMethod(() => ({ ok: true }), 'doThing');
      traced();

      const { _collector } = Logger.getInstance();
      expect(_collector._traces).toHaveLength(1);
      expect(_collector._proxyEvents).toHaveLength(1);

      const trace = _collector._traces[0];
      expect(trace.origin_id).toBe(Logger.posId);
      expect(trace.trace.method).toBe('doThing');
      expect(trace.trace.response).toContain('ok');

      const event = _collector._proxyEvents[0];
      expect(event.origin_id).toBe(Logger.posId);
      expect(event.event.event).toBe('doThing');
      expect(event.event.result).toBe('OK');
    });

    it('stamps total_time_ms on the trace based on elapsed wall time', () => {
      jest.setSystemTime(1_000_000);
      const traced = Logger.traceSdkMethod(() => {
        jest.setSystemTime(1_000_750);
        return { ok: true };
      }, 'timed');
      traced();

      const { _collector } = Logger.getInstance();
      expect(_collector._traces[0].trace.total_time_ms).toBe(750);
      expect(_collector._traces[0].trace.start_time_ms).toBe(1_000_000);
    });

    it('marks the event ERROR and records the exception when a promise rejects', async () => {
      const traced = Logger.traceSdkMethod(
        () => Promise.reject(new Error('boom')),
        'doRejecting'
      );

      const promise = traced();
      // Swallow the rejection so the test runner doesn't surface it as
      // an unhandled error.
      promise.catch(() => {});
      await flushPromises();

      const { _collector } = Logger.getInstance();
      expect(_collector._traces).toHaveLength(1);
      expect(_collector._proxyEvents).toHaveLength(1);
      expect(_collector._traces[0].trace.exception).toBe('boom');
      expect(_collector._proxyEvents[0].event.result).toBe('ERROR');
    });

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
