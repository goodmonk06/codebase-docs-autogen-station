/**
 * Metrics Adapter Interface
 * Allows pushing metrics to Prometheus, DataDog, CloudWatch, etc.
 */
export interface IMetricsAdapter {
  name: string;

  /**
   * Record a counter metric
   */
  recordCounter(name: string, value: number, labels?: Record<string, string>): void;

  /**
   * Record a gauge metric
   */
  recordGauge(name: string, value: number, labels?: Record<string, string>): void;

  /**
   * Record a histogram metric
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void;

  /**
   * Record timing information
   */
  recordTiming(name: string, durationMs: number, labels?: Record<string, string>): void;

  /**
   * Flush metrics to backend (if needed)
   */
  flush(): Promise<void>;
}

export interface MetricPoint {
  name: string;
  value: number;
  type: 'counter' | 'gauge' | 'histogram' | 'timing';
  labels?: Record<string, string>;
  timestamp?: Date;
}
