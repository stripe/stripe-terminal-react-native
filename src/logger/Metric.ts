export const MetricTag = {
  ERROR_SOURCE: 'error_source',
  DISCOVERY_METHOD: 'discovery_method',
} as const;

export interface MetricFields {
  domain: string;
  scope: string;
  event: string;
  result: 'OK' | 'ERROR';
  outcome?: string;
  tags?: Record<string, string>;
}

export interface Metric {
  toPayload(): MetricFields;
}

export class CounterMetric implements Metric {
  constructor(private readonly fields: MetricFields) {}

  toPayload() {
    return this.fields;
  }
}

/** A timer metric with duration in milliseconds. */
export class TimerMetric implements Metric {
  constructor(
    private readonly fields: MetricFields,
    private readonly durationMs: number
  ) {}

  toPayload() {
    return {
      ...this.fields,
      duration: this.durationMs,
    };
  }
}

export class GaugeMetric implements Metric {
  constructor(
    private readonly fields: MetricFields,
    private readonly measurement: number
  ) {}

  toPayload() {
    return {
      ...this.fields,
      measurement: this.measurement,
    };
  }
}
