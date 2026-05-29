import { InMemoryCollector } from '../inMemoryCollector';
import type { ProxyEvent, Trace } from '../';

const makeTrace = (method: string = 'getOfflineStatus'): Trace => ({
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

const makeProxyEvent = (
  method: string = 'getOfflineStatus',
  result: 'OK' | 'ERROR' = 'OK'
): ProxyEvent => ({
  origin_role: 'pos-rn',
  origin_id: 'pos-test',
  event: { domain: 'd', scope: 's', event: method, result },
});

const makeTraceWithBytes = (responseBytes: number): Trace => {
  const trace = makeTrace('big');
  trace.trace.response = 'x'.repeat(responseBytes);
  return trace;
};

const pushPair = (
  c: InMemoryCollector,
  trace: Trace,
  event: ProxyEvent
): void => {
  c.pushTrace(trace);
  c.pushProxyEvent(event);
};

const HUGE = Number.MAX_SAFE_INTEGER;

describe('InMemoryCollector', () => {
  describe('pushTrace / pushProxyEvent', () => {
    it('pushTrace appends to the trace queue and tracks per-entry bytes', () => {
      const c = new InMemoryCollector();
      const trace = makeTrace();
      const expectedSz = JSON.stringify(trace).length;

      c.pushTrace(trace);

      expect(c._traces).toEqual([trace]);
      expect(c._traceBytes).toEqual([expectedSz]);
      expect(c._traceBufferedBytes).toBe(expectedSz);
      // Proxy event side is untouched.
      expect(c._proxyEvents).toEqual([]);
      expect(c._proxyEventBufferedBytes).toBe(0);
    });

    it('pushProxyEvent appends to the proxy event queue and tracks per-entry bytes', () => {
      const c = new InMemoryCollector();
      const event = makeProxyEvent();
      const expectedSz = JSON.stringify(event).length;

      c.pushProxyEvent(event);

      expect(c._proxyEvents).toEqual([event]);
      expect(c._proxyEventBytes).toEqual([expectedSz]);
      expect(c._proxyEventBufferedBytes).toBe(expectedSz);
      expect(c._traces).toEqual([]);
      expect(c._traceBufferedBytes).toBe(0);
    });

    it('silently rejects a single trace whose JSON exceeds maxEntryBytes', () => {
      const c = new InMemoryCollector({ maxEntryBytes: 1_000 });
      c.pushTrace(makeTraceWithBytes(2_000));

      expect(c._traces).toEqual([]);
      expect(c._traceBufferedBytes).toBe(0);
    });

    it('silently rejects a trace that would exceed maxTraceBufferedBytes', () => {
      const c = new InMemoryCollector({ maxTraceBufferedBytes: 1_200 });
      c.pushTrace(makeTrace());
      const bytesAfterFirst = c._traceBufferedBytes;
      c.pushTrace(makeTraceWithBytes(1_000));

      expect(c._traces).toHaveLength(1);
      expect(c._traceBufferedBytes).toBe(bytesAfterFirst);
    });

    it('silently rejects a proxy event that would exceed maxProxyEventBufferedBytes', () => {
      // Sized to fit exactly one proxy event.
      const oneEventSz = JSON.stringify(makeProxyEvent()).length;
      const c = new InMemoryCollector({
        maxProxyEventBufferedBytes: oneEventSz,
      });

      c.pushProxyEvent(makeProxyEvent('a'));
      c.pushProxyEvent(makeProxyEvent('b'));

      expect(c._proxyEvents).toHaveLength(1);
      expect(c._proxyEvents[0].event.event).toBe('a');
    });

    it('caps the trace and proxy event queues independently', () => {
      // Trace cap exhausted; proxy event side still accepts pushes.
      const c = new InMemoryCollector({
        maxTraceBufferedBytes: 100,
        maxProxyEventBufferedBytes: 1_000_000,
      });
      c.pushTrace(makeTraceWithBytes(2_000)); // rejected (exceeds trace cap)
      c.pushProxyEvent(makeProxyEvent('a'));
      c.pushProxyEvent(makeProxyEvent('b'));

      expect(c._traces).toHaveLength(0);
      expect(c._proxyEvents).toHaveLength(2);
    });

    it('a saturated proxy event queue does not block trace pushes', () => {
      const oneEventSz = JSON.stringify(makeProxyEvent()).length;
      const c = new InMemoryCollector({
        maxProxyEventBufferedBytes: oneEventSz,
      });
      c.pushProxyEvent(makeProxyEvent());
      c.pushProxyEvent(makeProxyEvent()); // rejected

      c.pushTrace(makeTrace());

      expect(c._proxyEvents).toHaveLength(1);
      expect(c._traces).toHaveLength(1);
    });
  });

  describe('peekTraceEntries / peekProxyEventEntries', () => {
    it('returns a prefix whose cumulative bytes stay under maxBytes', () => {
      const c = new InMemoryCollector();
      pushPair(c, makeTrace('a'), makeProxyEvent('a'));
      pushPair(c, makeTrace('b'), makeProxyEvent('b'));
      pushPair(c, makeTrace('c'), makeProxyEvent('c'));

      const twoTraces = c._traceBytes[0] + c._traceBytes[1];
      const peek = c.peekTraceEntries(twoTraces);

      expect(peek.items).toHaveLength(2);
      expect(peek.bytes).toBe(twoTraces);
      expect(peek.items[0].trace.method).toBe('a');
    });

    it('peeks proxy events independently of traces', () => {
      const c = new InMemoryCollector();
      pushPair(c, makeTrace('a'), makeProxyEvent('a'));
      pushPair(c, makeTrace('b'), makeProxyEvent('b', 'ERROR'));

      const peek = c.peekProxyEventEntries(HUGE);

      expect(peek.items).toHaveLength(2);
      expect(peek.items[1].event.result).toBe('ERROR');
    });

    it('returns an empty batch when the head item alone exceeds the budget', () => {
      const c = new InMemoryCollector();
      c.pushTrace(makeTraceWithBytes(2_000));

      expect(c.peekTraceEntries(500).items).toEqual([]);
    });

    it('does not mutate the queue (peek is non-destructive)', () => {
      const c = new InMemoryCollector();
      pushPair(c, makeTrace('a'), makeProxyEvent('a'));
      const traceBefore = c._traceBufferedBytes;
      const eventBefore = c._proxyEventBufferedBytes;

      c.peekTraceEntries(HUGE);
      c.peekProxyEventEntries(HUGE);

      expect(c._traces).toHaveLength(1);
      expect(c._traceBufferedBytes).toBe(traceBefore);
      expect(c._proxyEventBufferedBytes).toBe(eventBefore);
    });
  });

  describe('removeTraceEntries / removeProxyEventEntries', () => {
    it('drops the requested prefix and decrements the trace counter only', () => {
      const c = new InMemoryCollector();
      pushPair(c, makeTrace('a'), makeProxyEvent('a'));
      pushPair(c, makeTrace('b'), makeProxyEvent('b'));
      pushPair(c, makeTrace('c'), makeProxyEvent('c'));

      const removedTraceBytes = c._traceBytes[0] + c._traceBytes[1];
      const traceBefore = c._traceBufferedBytes;
      const eventBefore = c._proxyEventBufferedBytes;

      c.removeTraceEntries(2);

      expect(c._traces).toHaveLength(1);
      expect(c._traces[0].trace.method).toBe('c');
      expect(c._traceBufferedBytes).toBe(traceBefore - removedTraceBytes);
      // Proxy event side untouched.
      expect(c._proxyEvents).toHaveLength(3);
      expect(c._proxyEventBufferedBytes).toBe(eventBefore);
    });

    it('drains the trace and proxy event queues independently', () => {
      const c = new InMemoryCollector();
      pushPair(c, makeTrace('a'), makeProxyEvent('a'));
      pushPair(c, makeTrace('b'), makeProxyEvent('b'));
      pushPair(c, makeTrace('c'), makeProxyEvent('c'));

      // Simulate: trace upload succeeded for all 3; proxy event upload
      // only succeeded for the first 1.
      c.removeTraceEntries(3);
      c.removeProxyEventEntries(1);

      expect(c._traces).toHaveLength(0);
      expect(c._proxyEvents).toHaveLength(2);
      expect(c._proxyEvents[0].event.event).toBe('b');
    });

    it('drops both buffered byte counters back to 0 once each queue is fully drained', () => {
      const c = new InMemoryCollector();
      pushPair(c, makeTrace('a'), makeProxyEvent('a'));
      pushPair(c, makeTrace('b'), makeProxyEvent('b'));

      c.removeTraceEntries(2);
      c.removeProxyEventEntries(2);

      expect(c._traceBufferedBytes).toBe(0);
      expect(c._proxyEventBufferedBytes).toBe(0);
      expect(c._traceBytes).toEqual([]);
      expect(c._proxyEventBytes).toEqual([]);
    });

    it('treats remove(0) and remove(negative) as a no-op', () => {
      const c = new InMemoryCollector();
      pushPair(c, makeTrace(), makeProxyEvent());
      const traceBefore = c._traceBufferedBytes;
      const eventBefore = c._proxyEventBufferedBytes;

      c.removeTraceEntries(0);
      c.removeProxyEventEntries(-3);

      expect(c._traces).toHaveLength(1);
      expect(c._proxyEvents).toHaveLength(1);
      expect(c._traceBufferedBytes).toBe(traceBefore);
      expect(c._proxyEventBufferedBytes).toBe(eventBefore);
    });

    it('clamps count > queue length so the byte counter never becomes NaN', () => {
      // Guards against a regression where reading past the end of
      // `_traceBytes` makes `removedBytes` NaN, which then permanently
      // disables the buffered-bytes cap (every subsequent
      // `_traceBufferedBytes + sz > _max...` comparison is false).
      const c = new InMemoryCollector();
      pushPair(c, makeTrace('a'), makeProxyEvent('a'));
      pushPair(c, makeTrace('b'), makeProxyEvent('b'));

      c.removeTraceEntries(10);
      c.removeProxyEventEntries(10);

      expect(c._traces).toHaveLength(0);
      expect(c._proxyEvents).toHaveLength(0);
      expect(c._traceBufferedBytes).toBe(0);
      expect(c._proxyEventBufferedBytes).toBe(0);
      expect(Number.isNaN(c._traceBufferedBytes)).toBe(false);
      expect(Number.isNaN(c._proxyEventBufferedBytes)).toBe(false);
    });
  });
});
