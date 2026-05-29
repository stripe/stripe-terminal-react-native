import * as packageJson from '../../package.json';
import { Platform } from 'react-native';
import { b64EncodeUnicode } from '../utils/b64EncodeDecode';
import type { Collector } from './inMemoryCollector';

// Pause between flush attempts. Sets the upper bound on flush
// throughput; sized so a single failing endpoint can't burn through the
// network budget on retries.
const FLUSH_COOLDOWN_MS = 30_000;

// Per-request abort budget. After this elapses with no `fetch`
// resolution, we abort and treat the batch as failed (the buffer is
// preserved for the next flush).
const FLUSH_TIMEOUT_MS = 30_000;

// Per-batch JSON budget. The wire body grows by ~1.33x once base64-
// encoded into `content`, plus envelope overhead, so 500 KB raw JSON
// keeps the eventual fetch body comfortably under 1 MB. Anything that
// doesn't fit stays in the collector for the next flush.
const MAX_UPLOAD_JSON_BYTES = 500_000;

const LOG_PREFIX = '[StripeTerminal:Logger]';

const GATOR_URL = 'https://gator.stripe.com:443/protojsonservice/GatorService';

/**
 * Surfaced when `fetch` resolves with a non-2xx response. We turn the
 * `Response` into an error so the batch logic preserves the buffer for
 * retry instead of treating the upload as silently successful.
 */
export class HTTPError extends Error {
  status: number;
  constructor(status: number) {
    super(`HTTP ${status}`);
    this.name = 'HTTPError';
    this.status = status;
  }
}

const getDeviceInfo = (deviceUuid: string) => ({
  device_uuid: deviceUuid,
  device_class: 'POS',
  host_os_version: Platform.Version.toString(),
  hardware_model: {
    pos_info: {
      description: Platform.select({
        ios: 'iOS',
        android: 'Android',
      })?.toString(),
    },
  },
});

/**
 * Wrap a payload in the GatorService envelope. Top-level helper, called
 * directly from `BatchUploader.flush` — not injected, since there's
 * only ever one wire format and a builder param would add indirection
 * without value. `deviceUuid` is threaded through so requests can be
 * correlated server-side back to a single SDK instance.
 */
export function buildGatorRequest(
  method: 'reportTrace' | 'reportEvent',
  payload: object,
  deviceUuid: string
): object {
  return {
    id: Date.now(),
    service: 'GatorService',
    method,
    content: b64EncodeUnicode(JSON.stringify(payload)),
    session_token: '',
    version_info: {
      client_type: 'RN_SDK',
      client_version: packageJson.version,
    },
    parent_trace_id: '',
    device_info: getDeviceInfo(deviceUuid),
  };
}

// I/O dependency interfaces. Narrow on purpose — only what the batch
// loop touches — so test fakes are trivial to write.

export interface Uploader {
  send(request: object): Promise<Response>;
}

export interface Clock {
  now(): number;
}

export interface Scheduler {
  schedule(fn: () => void, ms: number): unknown;
  cancel(handle: unknown): void;
}

/**
 * Real `Uploader`: `fetch` with an `AbortController` enforcing
 * `FLUSH_TIMEOUT_MS`. The timer is always cleared in `finally` so a
 * resolved request doesn't leave a dangling abort scheduled.
 */
export class RealUploader implements Uploader {
  async send(request: object): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FLUSH_TIMEOUT_MS);
    try {
      return await fetch(GATOR_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }
}

export const realClock: Clock = {
  now: () => Date.now(),
};

/**
 * Real `Scheduler`: `setTimeout` / `clearTimeout`. Kept as a class so
 * tests can swap in a `FakeScheduler` whose `runNext()` advances time
 * deterministically.
 */
export class RealScheduler implements Scheduler {
  schedule(fn: () => void, ms: number): unknown {
    return setTimeout(fn, ms);
  }
  cancel(handle: unknown): void {
    clearTimeout(handle as ReturnType<typeof setTimeout>);
  }
}

/**
 * Verbose-gated console writer. The `isVerbose` closure is re-evaluated
 * on every call so `Logger.setLogLevel(...)` takes effect immediately,
 * without having to plumb the level through to existing instances.
 */
export class ConsoleWriter {
  private readonly _isVerbose: () => boolean;
  constructor(isVerbose: () => boolean) {
    this._isVerbose = isVerbose;
  }
  info(...args: unknown[]): void {
    if (!this._isVerbose()) return;
    // eslint-disable-next-line no-console
    console.log(LOG_PREFIX, ...args);
  }
  warn(...args: unknown[]): void {
    if (!this._isVerbose()) return;
    // eslint-disable-next-line no-console
    console.warn(LOG_PREFIX, ...args);
  }
}

interface AttemptResult {
  ok: boolean;
  ms: number;
  err?: unknown;
}

/**
 * Owns scheduling, HTTP, and the verbose flush diagnostic. Holds a
 * reference to a `Collector` and drives drains via peek/remove.
 *
 * Each flush processes the trace batch fully (peek → upload → remove)
 * before touching the event batch. Serial — and one-batch-at-a-time —
 * because (a) both batches hit the same Gator endpoint so there's no
 * independent capacity to unlock by parallelizing, and (b) we don't
 * have to hold both peeked batches in memory at once.
 *
 * On failure the buffer is preserved (we don't call `removeXEntries`),
 * so the next flush retries the same prefix. On partial failure (e.g.
 * trace OK, event 5xx), only the failing batch is preserved. Note: the
 * event peek runs after the trace upload settles, so events pushed
 * during that window are eligible to drain in the same flush — slight
 * asymmetry vs traces, but Gator's two RPCs are independent so no
 * cross-batch ordering invariant is violated.
 */
export class BatchUploader {
  private readonly _collector: Collector;
  private readonly _uploader: Uploader;
  private readonly _clock: Clock;
  private readonly _scheduler: Scheduler;
  private readonly _writer: ConsoleWriter;
  private readonly _deviceUuid: string;
  // Re-entry lock. The self-rescheduling loop already serializes
  // flushes, but `flush()` is public so tests can drive it directly —
  // the lock keeps a manual call from racing with a timer-driven one.
  private _isFlushing: boolean = false;

  constructor(opts: {
    collector: Collector;
    uploader: Uploader;
    clock: Clock;
    scheduler: Scheduler;
    writer: ConsoleWriter;
    deviceUuid: string;
  }) {
    this._collector = opts.collector;
    this._uploader = opts.uploader;
    this._clock = opts.clock;
    this._scheduler = opts.scheduler;
    this._writer = opts.writer;
    this._deviceUuid = opts.deviceUuid;
    this.scheduleNext();
  }

  /**
   * Drain a prefix of the trace and event queues to Gator. Public so
   * tests can drive a single flush deterministically; production calls
   * it via the self-rescheduling loop wired up in the constructor.
   */
  async flush(): Promise<void> {
    if (this._isFlushing) return;
    this._isFlushing = true;
    try {
      await this.processTraceBatch();
      await this.processEventBatch();
    } finally {
      this._isFlushing = false;
    }
  }

  private async processTraceBatch(): Promise<void> {
    const batch = this._collector.peekTraceEntries(MAX_UPLOAD_JSON_BYTES);
    if (batch.items.length === 0) return;
    this._writer.info(
      `reportTrace start, entries=${batch.items.length}, bytes=${batch.bytes}`
    );
    const result = await this.measure(
      buildGatorRequest(
        'reportTrace',
        { proxy_traces: batch.items },
        this._deviceUuid
      )
    );
    if (result.ok) {
      this._collector.removeTraceEntries(batch.items.length);
      this._writer.info(`reportTrace ok, ms=${result.ms}`);
    } else {
      this._writer.warn(
        `reportTrace failed (${failureLabel(result.err)}), ms=${result.ms}`
      );
    }
  }

  private async processEventBatch(): Promise<void> {
    const batch = this._collector.peekProxyEventEntries(MAX_UPLOAD_JSON_BYTES);
    if (batch.items.length === 0) return;
    this._writer.info(
      `reportEvent start, entries=${batch.items.length}, bytes=${batch.bytes}`
    );
    const result = await this.measure(
      buildGatorRequest(
        'reportEvent',
        { proxy_events: batch.items },
        this._deviceUuid
      )
    );
    if (result.ok) {
      this._collector.removeProxyEventEntries(batch.items.length);
      this._writer.info(`reportEvent ok, ms=${result.ms}`);
    } else {
      this._writer.warn(
        `reportEvent failed (${failureLabel(result.err)}), ms=${result.ms}`
      );
    }
  }

  // Wraps `flush()` so a thrown error doesn't break the
  // self-rescheduling loop. `flush` shouldn't throw, but if it does the
  // next attempt must still be armed.
  private flushSafe = async (): Promise<void> => {
    try {
      await this.flush();
    } catch (err) {
      this._writer.warn('flush threw unexpectedly:', err);
    } finally {
      this.scheduleNext();
    }
  };

  private scheduleNext(): void {
    this._scheduler.schedule(this.flushSafe, FLUSH_COOLDOWN_MS);
  }

  private async measure(req: object): Promise<AttemptResult> {
    const start = this._clock.now();
    try {
      const response = await this._uploader.send(req);
      if (!response.ok) {
        return {
          ok: false,
          ms: this._clock.now() - start,
          err: new HTTPError(response.status),
        };
      }
      return { ok: true, ms: this._clock.now() - start };
    } catch (err) {
      return { ok: false, ms: this._clock.now() - start, err };
    }
  }
}

function failureLabel(err: unknown): string {
  const status = (err as { status?: number })?.status;
  if (typeof status === 'number') return `HTTP${status}`;
  const name = (err as { name?: string })?.name;
  const message = (err as { message?: string })?.message;
  // `fetch` rejects with `TypeError: Network request failed` on no-network
  // (WHATWG spec); include the message so it's distinguishable from a real
  // TypeError elsewhere in the code.
  if (name === 'AbortError') return 'timeout';
  if (name && message) return `${name}: ${message}`;
  return name ?? 'unknown';
}
