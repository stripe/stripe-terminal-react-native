import type { ProxyEvent, Trace } from './';

// Per-queue caps on in-memory buffering. Bound RN-side memory growth
// during long offline windows where logs can accumulate.
const DEFAULT_MAX_TRACE_BUFFERED_BYTES = 2_000_000;
const DEFAULT_MAX_PROXY_EVENT_BUFFERED_BYTES = 2_000_000;

// Per-entry ceiling. Oversize traces are slow for the client to
// serialize/upload and slow for the analytics service to ingest, so
// drop them at the door rather than ship them.
const DEFAULT_MAX_ENTRY_BYTES = 500_000;

export interface BatchPeek<T> {
  items: T[];
  bytes: number;
}

/**
 * Trace storage contract that `BatchUploader` depends on. Implemented
 * by `InMemoryCollector`; named as an interface to leave room for
 * future siblings (e.g. a persisted-to-disk collector for long offline
 * windows) without renaming the uploader's collaborator slot.
 */
export interface Collector {
  pushTrace(trace: Trace): void;
  pushProxyEvent(event: ProxyEvent): void;
  peekTraceEntries(maxBytes: number): BatchPeek<Trace>;
  peekProxyEventEntries(maxBytes: number): BatchPeek<ProxyEvent>;
  removeTraceEntries(count: number): void;
  removeProxyEventEntries(count: number): void;
}

/**
 * Bounded in-memory `Collector`. Holds an in-memory buffer for `Trace`
 * logs and one for `ProxyEvent` logs.
 *
 * Rejected pushes return silently — drop tracking is intentionally not
 * coupled to this layer.
 */
export class InMemoryCollector implements Collector {
  _traces: Trace[] = [];
  _proxyEvents: ProxyEvent[] = [];
  _traceBytes: number[] = [];
  _proxyEventBytes: number[] = [];
  _traceBufferedBytes: number = 0;
  _proxyEventBufferedBytes: number = 0;

  private readonly _maxTraceBufferedBytes: number;
  private readonly _maxProxyEventBufferedBytes: number;
  private readonly _maxEntryBytes: number;

  constructor(opts?: {
    maxTraceBufferedBytes?: number;
    maxProxyEventBufferedBytes?: number;
    maxEntryBytes?: number;
  }) {
    this._maxTraceBufferedBytes =
      opts?.maxTraceBufferedBytes ?? DEFAULT_MAX_TRACE_BUFFERED_BYTES;
    this._maxProxyEventBufferedBytes =
      opts?.maxProxyEventBufferedBytes ?? DEFAULT_MAX_PROXY_EVENT_BUFFERED_BYTES;
    this._maxEntryBytes = opts?.maxEntryBytes ?? DEFAULT_MAX_ENTRY_BYTES;
  }

  pushTrace(trace: Trace): void {
    const sz = JSON.stringify(trace).length;
    if (sz > this._maxEntryBytes) return;
    if (this._traceBufferedBytes + sz > this._maxTraceBufferedBytes) return;
    this._traces.push(trace);
    this._traceBytes.push(sz);
    this._traceBufferedBytes += sz;
  }

  pushProxyEvent(event: ProxyEvent): void {
    const sz = JSON.stringify(event).length;
    if (
      this._proxyEventBufferedBytes + sz >
      this._maxProxyEventBufferedBytes
    ) {
      return;
    }
    this._proxyEvents.push(event);
    this._proxyEventBytes.push(sz);
    this._proxyEventBufferedBytes += sz;
  }

  peekTraceEntries(maxBytes: number): BatchPeek<Trace> {
    return peekEntriesForUpload(this._traces, this._traceBytes, maxBytes);
  }

  peekProxyEventEntries(maxBytes: number): BatchPeek<ProxyEvent> {
    return peekEntriesForUpload(
      this._proxyEvents,
      this._proxyEventBytes,
      maxBytes
    );
  }

  removeTraceEntries(count: number): void {
    const n = Math.min(count, this._traceBytes.length);
    if (n <= 0) return;
    let removedBytes = 0;
    for (let i = 0; i < n; i++) removedBytes += this._traceBytes[i];
    this._traces.splice(0, n);
    this._traceBytes.splice(0, n);
    this._traceBufferedBytes -= removedBytes;
  }

  removeProxyEventEntries(count: number): void {
    const n = Math.min(count, this._proxyEventBytes.length);
    if (n <= 0) return;
    let removedBytes = 0;
    for (let i = 0; i < n; i++) removedBytes += this._proxyEventBytes[i];
    this._proxyEvents.splice(0, n);
    this._proxyEventBytes.splice(0, n);
    this._proxyEventBufferedBytes -= removedBytes;
  }
}

function peekEntriesForUpload<T>(
  items: T[],
  sizes: number[],
  maxBytes: number
): BatchPeek<T> {
  const packed: T[] = [];
  let bytes = 0;
  for (let i = 0; i < items.length; i++) {
    if (bytes + sizes[i] > maxBytes) break;
    packed.push(items[i]);
    bytes += sizes[i];
  }
  return { items: packed, bytes };
}
