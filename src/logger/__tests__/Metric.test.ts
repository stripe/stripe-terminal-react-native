import { CounterMetric, GaugeMetric, TimerMetric } from '../Metric';
import type { Metric, MetricFields } from '../Metric';

const fields: MetricFields = {
  domain: 'test',
  scope: 'terminal',
  event: 'operation',
  result: 'OK',
};

describe('Metric', () => {
  it('serializes a counter without duration or measurement', () => {
    const payload = new CounterMetric(fields).toPayload();

    expect(JSON.parse(JSON.stringify(payload))).toEqual(fields);
    expect(payload).not.toHaveProperty('duration');
    expect(payload).not.toHaveProperty('measurement');
    expect(payload).not.toHaveProperty('outcome');
    expect(payload).not.toHaveProperty('tags');
  });

  it.each([0, 125])(
    'preserves a timer duration of %i milliseconds',
    (duration) => {
      const payload = new TimerMetric(fields, duration).toPayload();

      expect(JSON.parse(JSON.stringify(payload))).toEqual({
        ...fields,
        duration,
      });
      expect(payload.duration).toBe(duration);
      expect(payload).not.toHaveProperty('measurement');
    }
  );

  it.each([0, 12])('preserves a gauge measurement of %i', (measurement) => {
    const payload = new GaugeMetric(fields, measurement).toPayload();

    expect(JSON.parse(JSON.stringify(payload))).toEqual({
      ...fields,
      measurement,
    });
    expect(payload.measurement).toBe(measurement);
    expect(payload).not.toHaveProperty('duration');
  });

  const implementations: {
    name: string;
    create: (metricFields: MetricFields) => Metric;
    value: { duration?: number; measurement?: number };
  }[] = [
    {
      name: 'counter',
      create: (metricFields) => new CounterMetric(metricFields),
      value: {},
    },
    {
      name: 'timer',
      create: (metricFields) => new TimerMetric(metricFields, 25),
      value: { duration: 25 },
    },
    {
      name: 'gauge',
      create: (metricFields) => new GaugeMetric(metricFields, 12),
      value: { measurement: 12 },
    },
  ];

  it.each(implementations)(
    'preserves supplied outcome and tags for a $name',
    ({ create, value }) => {
      const errorFields: MetricFields = {
        ...fields,
        result: 'ERROR',
        outcome: 'CANCELED',
        tags: { error_source: 'native' },
      };
      const payload = create(errorFields).toPayload();

      expect(JSON.parse(JSON.stringify(payload))).toEqual({
        ...errorFields,
        ...value,
      });
      expect(payload.outcome).toBe('CANCELED');
      expect(payload.tags).toEqual({ error_source: 'native' });
    }
  );
});
