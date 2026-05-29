jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    Version: '17.0',
    select: (options: { [key: string]: unknown }) =>
      options.ios ?? options.default,
  },
}));

import { BatchUploader, ConsoleWriter } from '../batchUploader';
import type { Clock, Scheduler, Uploader } from '../batchUploader';
import { InMemoryCollector } from '../inMemoryCollector';
import type { ProxyEvent, Trace } from '../';

interface PendingSend {
  request: object;
  resolve: (response: Response) => void;
  reject: (err: unknown) => void;
}

class FakeUploader implements Uploader {
  sends: PendingSend[] = [];
  send(request: object): Promise<Response> {
    return new Promise<Response>((resolve, reject) => {
      this.sends.push({ request, resolve, reject });
    });
  }
  resolveLast(status: number = 200): void {
    const last = this.sends[this.sends.length - 1];
    last.resolve({ ok: status >= 200 && status < 300, status } as Response);
  }
  rejectLast(err: unknown = new Error('network')): void {
    const last = this.sends[this.sends.length - 1];
    last.reject(err);
  }
}

class FakeClock implements Clock {
  current: number = 0;
  now(): number {
    return this.current;
  }
}

interface ScheduledTask {
  fn: () => void;
}

class FakeScheduler implements Scheduler {
  queue: ScheduledTask[] = [];
  schedule(fn: () => void): unknown {
    const task: ScheduledTask = { fn };
    this.queue.push(task);
    return task;
  }
  cancel(handle: unknown): void {
    this.queue = this.queue.filter((t) => t !== handle);
  }
  runNext(): void {
    const task = this.queue.shift();
    if (task) task.fn();
  }
}

const flushPromises = async (n = 10) => {
  for (let i = 0; i < n; i++) await Promise.resolve();
};

const pushPair = (
  c: InMemoryCollector,
  trace: Trace,
  event: ProxyEvent
): void => {
  c.pushTrace(trace);
  c.pushProxyEvent(event);
};

const makeTrace = (method: string = 'doThing'): Trace => ({
  origin_role: 'pos-rn',
  origin_id: 'pos-test',
  trace: {
    action_id: '1',
    request_info: { user_agent: '' },
    start_time_ms: 0,
    total_time_ms: 0,
    service: 'StripeTerminalReactNative',
    method,
    request: '{}',
    version_info: { client_type: 'RN_SDK', client_version: '0.0.0-test' },
    traces: [],
    additional_context: {
      action_id: '1',
      session_id: '',
      serial_number: '',
    },
  },
});

const makeEvent = (
  method: string = 'doThing',
  result: 'OK' | 'ERROR' = 'OK'
): ProxyEvent => ({
  origin_role: 'pos-rn',
  origin_id: 'pos-test',
  event: { domain: 'd', scope: 's', event: method, result },
});

interface TestRig {
  collector: InMemoryCollector;
  uploader: FakeUploader;
  clock: FakeClock;
  scheduler: FakeScheduler;
  writer: ConsoleWriter;
  batch: BatchUploader;
}

const buildRig = (opts?: { verbose?: boolean }): TestRig => {
  const collector = new InMemoryCollector();
  const uploader = new FakeUploader();
  const clock = new FakeClock();
  const scheduler = new FakeScheduler();
  const writer = new ConsoleWriter(() => opts?.verbose === true);
  const batch = new BatchUploader({
    collector,
    uploader,
    clock,
    scheduler,
    writer,
    deviceUuid: 'pos-test',
  });
  return { collector, uploader, clock, scheduler, writer, batch };
};

describe('BatchUploader', () => {
  describe('constructor', () => {
    it('schedules its first flush onto the injected scheduler', () => {
      const rig = buildRig();
      expect(rig.scheduler.queue).toHaveLength(1);
    });
  });

  describe('flush — success paths', () => {
    it('drains both queues when both upload batches return 2xx', async () => {
      const rig = buildRig();
      pushPair(rig.collector, makeTrace('a'), makeEvent('a'));
      pushPair(rig.collector, makeTrace('b'), makeEvent('b'));

      const flushed = rig.batch.flush();
      // Trace batch goes first.
      await flushPromises();
      expect(rig.uploader.sends).toHaveLength(1);
      rig.uploader.resolveLast(200);
      await flushPromises();
      // Then event batch.
      expect(rig.uploader.sends).toHaveLength(2);
      rig.uploader.resolveLast(200);
      await flushed;

      expect(rig.collector._traces).toHaveLength(0);
      expect(rig.collector._proxyEvents).toHaveLength(0);
      expect(rig.collector._traceBufferedBytes).toBe(0);
      expect(rig.collector._proxyEventBufferedBytes).toBe(0);
    });

    it('skips the HTTP call entirely on an empty trace batch (event-only)', async () => {
      const rig = buildRig();
      rig.collector.pushProxyEvent(makeEvent('a'));

      const flushed = rig.batch.flush();
      await flushPromises();
      expect(rig.uploader.sends).toHaveLength(1);
      rig.uploader.resolveLast(200);
      await flushed;

      expect(rig.collector._proxyEvents).toHaveLength(0);
    });
  });

  describe('flush — failure paths', () => {
    it('preserves both queues when both batches reject', async () => {
      const rig = buildRig();
      pushPair(rig.collector, makeTrace(), makeEvent());
      const traceBefore = rig.collector._traceBufferedBytes;
      const eventBefore = rig.collector._proxyEventBufferedBytes;

      const flushed = rig.batch.flush();
      await flushPromises();
      rig.uploader.rejectLast(new Error('trace-net'));
      await flushPromises();
      rig.uploader.rejectLast(new Error('event-net'));
      await flushed;

      expect(rig.collector._traces).toHaveLength(1);
      expect(rig.collector._proxyEvents).toHaveLength(1);
      expect(rig.collector._traceBufferedBytes).toBe(traceBefore);
      expect(rig.collector._proxyEventBufferedBytes).toBe(eventBefore);
    });

    it('drains only the trace queue when the event batch fails', async () => {
      const rig = buildRig();
      pushPair(rig.collector, makeTrace(), makeEvent());

      const flushed = rig.batch.flush();
      await flushPromises();
      rig.uploader.resolveLast(200);
      await flushPromises();
      rig.uploader.rejectLast(new Error('event-failed'));
      await flushed;

      expect(rig.collector._traces).toHaveLength(0);
      expect(rig.collector._proxyEvents).toHaveLength(1);
    });

    it('drains only the trace queue when the event batch returns 5xx', async () => {
      const rig = buildRig();
      pushPair(rig.collector, makeTrace(), makeEvent());

      const flushed = rig.batch.flush();
      await flushPromises();
      rig.uploader.resolveLast(200);
      await flushPromises();
      rig.uploader.resolveLast(500);
      await flushed;

      expect(rig.collector._traces).toHaveLength(0);
      expect(rig.collector._proxyEvents).toHaveLength(1);
    });
  });

  describe('flush — concurrency', () => {
    it('processes the two batches serially (event awaits trace)', async () => {
      const rig = buildRig();
      pushPair(rig.collector, makeTrace(), makeEvent());

      const flushed = rig.batch.flush();
      await flushPromises();
      // Only the trace request has been issued — event waits.
      expect(rig.uploader.sends).toHaveLength(1);
      const traceReq = rig.uploader.sends[0].request as any;
      expect(traceReq.method).toBe('reportTrace');
      expect(traceReq.device_info.device_uuid).toBe('pos-test');

      rig.uploader.resolveLast(200);
      await flushPromises();
      expect(rig.uploader.sends).toHaveLength(2);
      const eventReq = rig.uploader.sends[1].request as any;
      expect(eventReq.method).toBe('reportEvent');
      expect(eventReq.device_info.device_uuid).toBe('pos-test');

      rig.uploader.resolveLast(200);
      await flushed;
    });

    it('respects the per-upload byte budget, leaving overflow for the next flush', async () => {
      const rig = buildRig();
      const big = (method: string) => {
        const t = makeTrace(method);
        t.trace.response = 'x'.repeat(200_000);
        return t;
      };
      pushPair(rig.collector, big('a'), makeEvent('a'));
      pushPair(rig.collector, big('b'), makeEvent('b'));
      pushPair(rig.collector, big('c'), makeEvent('c'));

      const flushed = rig.batch.flush();
      await flushPromises();
      rig.uploader.resolveLast(200);
      await flushPromises();
      rig.uploader.resolveLast(200);
      await flushed;

      expect(rig.collector._traces).toHaveLength(1);
      expect(rig.collector._traces[0].trace.method).toBe('c');
    });

    it('locks in the trace prefix at flush start but drains events pushed during the trace upload', async () => {
      const rig = buildRig();
      pushPair(rig.collector, makeTrace('a'), makeEvent('a'));
      pushPair(rig.collector, makeTrace('b'), makeEvent('b'));

      const flushed = rig.batch.flush();
      await flushPromises();
      // Push arrives while the trace upload is in flight — trace 'c'
      // is past the peeked prefix, but event 'c' will be picked up by
      // the deferred event peek.
      pushPair(rig.collector, makeTrace('c'), makeEvent('c'));

      rig.uploader.resolveLast(200);
      await flushPromises();
      rig.uploader.resolveLast(200);
      await flushed;

      expect(rig.collector._traces).toHaveLength(1);
      expect(rig.collector._traces[0].trace.method).toBe('c');
      expect(rig.collector._proxyEvents).toHaveLength(0);
    });

    it('no-ops a re-entrant flush call while one is in flight', async () => {
      const rig = buildRig();
      pushPair(rig.collector, makeTrace(), makeEvent());

      const first = rig.batch.flush();
      await flushPromises();
      const second = rig.batch.flush();
      await second;
      expect(rig.uploader.sends).toHaveLength(1);

      rig.uploader.resolveLast(200);
      await flushPromises();
      rig.uploader.resolveLast(200);
      await first;
    });
  });

  describe('scheduler integration', () => {
    it('re-arms the next flush after the timer-driven one settles', async () => {
      const rig = buildRig();
      pushPair(rig.collector, makeTrace(), makeEvent());

      expect(rig.scheduler.queue).toHaveLength(1);
      rig.scheduler.runNext();
      await flushPromises();

      rig.uploader.resolveLast(200);
      await flushPromises();
      rig.uploader.resolveLast(200);
      await flushPromises();

      expect(rig.scheduler.queue).toHaveLength(1);
    });
  });

  describe('verbose diagnostics', () => {
    let consoleLog: jest.SpyInstance;
    let consoleWarn: jest.SpyInstance;

    beforeEach(() => {
      consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
      consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLog.mockRestore();
      consoleWarn.mockRestore();
    });

    it('emits per-batch start + ok lines in verbose mode', async () => {
      const rig = buildRig({ verbose: true });
      pushPair(rig.collector, makeTrace(), makeEvent());

      const flushed = rig.batch.flush();
      await flushPromises();
      rig.uploader.resolveLast(200);
      await flushPromises();
      rig.uploader.resolveLast(200);
      await flushed;

      const findLog = (prefix: string) =>
        consoleLog.mock.calls.find((c) => String(c[1]).startsWith(prefix));

      const traceStart = findLog('reportTrace start');
      const traceOk = findLog('reportTrace ok');
      const eventStart = findLog('reportEvent start');
      const eventOk = findLog('reportEvent ok');

      expect(traceStart?.[0]).toBe('[StripeTerminal:Logger]');
      expect(String(traceStart?.[1])).toMatch(
        /^reportTrace start, entries=\d+, bytes=\d+$/
      );
      expect(String(traceOk?.[1])).toMatch(/^reportTrace ok, ms=\d+$/);
      expect(String(eventStart?.[1])).toMatch(
        /^reportEvent start, entries=\d+, bytes=\d+$/
      );
      expect(String(eventOk?.[1])).toMatch(/^reportEvent ok, ms=\d+$/);

      // No combined "flush success" line — per-batch end logs replace it.
      expect(
        consoleLog.mock.calls.find((c) =>
          String(c[1]).startsWith('flush success')
        )
      ).toBeUndefined();
    });

    it('emits a per-batch failed line with the HTTP status', async () => {
      const rig = buildRig({ verbose: true });
      pushPair(rig.collector, makeTrace(), makeEvent());

      const flushed = rig.batch.flush();
      await flushPromises();
      rig.uploader.resolveLast(413);
      await flushPromises();
      rig.uploader.resolveLast(500);
      await flushed;

      const findWarn = (prefix: string) =>
        consoleWarn.mock.calls.find((c) => String(c[1]).startsWith(prefix));

      const traceFailed = findWarn('reportTrace failed');
      const eventFailed = findWarn('reportEvent failed');

      expect(traceFailed?.[0]).toBe('[StripeTerminal:Logger]');
      expect(String(traceFailed?.[1])).toMatch(
        /^reportTrace failed \(HTTP413\), ms=\d+$/
      );
      expect(String(eventFailed?.[1])).toMatch(
        /^reportEvent failed \(HTTP500\), ms=\d+$/
      );
    });

    it('includes the message on non-HTTP rejections (e.g. fetch network failure)', async () => {
      const rig = buildRig({ verbose: true });
      pushPair(rig.collector, makeTrace(), makeEvent());

      const flushed = rig.batch.flush();
      await flushPromises();
      // Mirrors what fetch throws when offline: a TypeError whose message
      // is the only thing distinguishing "no network" from a real bug.
      const networkErr = new TypeError('Network request failed');
      rig.uploader.rejectLast(networkErr);
      await flushPromises();
      rig.uploader.resolveLast(200);
      await flushed;

      const traceFailed = consoleWarn.mock.calls.find((c) =>
        String(c[1]).startsWith('reportTrace failed')
      );
      expect(String(traceFailed?.[1])).toMatch(
        /^reportTrace failed \(TypeError: Network request failed\), ms=\d+$/
      );
    });

    it('labels AbortError-style timeouts as `timeout`', async () => {
      const rig = buildRig({ verbose: true });
      pushPair(rig.collector, makeTrace(), makeEvent());

      const flushed = rig.batch.flush();
      await flushPromises();
      const abortErr = new Error('aborted');
      abortErr.name = 'AbortError';
      rig.uploader.rejectLast(abortErr);
      await flushPromises();
      rig.uploader.resolveLast(200);
      await flushed;

      const traceFailed = consoleWarn.mock.calls.find((c) =>
        String(c[1]).startsWith('reportTrace failed')
      );
      expect(String(traceFailed?.[1])).toMatch(
        /^reportTrace failed \(timeout\), ms=\d+$/
      );
    });

    it('stays silent when isVerbose() is false', async () => {
      const rig = buildRig({ verbose: false });
      pushPair(rig.collector, makeTrace(), makeEvent());

      const flushed = rig.batch.flush();
      await flushPromises();
      rig.uploader.resolveLast(200);
      await flushPromises();
      rig.uploader.resolveLast(200);
      await flushed;

      expect(consoleLog).not.toHaveBeenCalled();
      expect(consoleWarn).not.toHaveBeenCalled();
    });
  });
});
