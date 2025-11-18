import { IMetricsAdapter, MetricPoint } from '../IMetricsAdapter';

/**
 * Console Metrics Adapter (for development/testing)
 * Logs metrics to console
 */
export class ConsoleMetricsAdapter implements IMetricsAdapter {
  name = 'console';
  private metrics: MetricPoint[] = [];

  recordCounter(name: string, value: number, labels?: Record<string, string>): void {
    this.record({ name, value, type: 'counter', labels });
  }

  recordGauge(name: string, value: number, labels?: Record<string, string>): void {
    this.record({ name, value, type: 'gauge', labels });
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    this.record({ name, value, type: 'histogram', labels });
  }

  recordTiming(name: string, durationMs: number, labels?: Record<string, string>): void {
    this.record({ name, value: durationMs, type: 'timing', labels });
  }

  private record(metric: MetricPoint): void {
    metric.timestamp = new Date();
    this.metrics.push(metric);

    const labelsStr = metric.labels ? ` ${JSON.stringify(metric.labels)}` : '';
    console.log(`[METRIC] ${metric.type} ${metric.name}=${metric.value}${labelsStr}`);
  }

  async flush(): Promise<void> {
    if (this.metrics.length > 0) {
      console.log(`[METRICS] Flushed ${this.metrics.length} metrics`);
      this.metrics = [];
    }
  }

  getMetrics(): MetricPoint[] {
    return [...this.metrics];
  }
}
