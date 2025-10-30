import { NextFunction, Request, Response } from 'express';
import { Plugin } from '../../types/plugin';
import { logger } from '../../utils/logger';

/**
 * Metric data structure
 */
export interface Metric {
  /** Timestamp of the request */
  timestamp: number;
  /** Request method */
  method: string;
  /** Request URL */
  url: string;
  /** User agent */
  userAgent?: string;
  /** IP address */
  ip?: string;
  /** Referrer */
  referrer?: string;
  /** Response time in milliseconds */
  responseTime?: number;
}

/**
 * Metrics plugin configuration options
 */
export interface MetricsPluginOptions {
  /** Enable metrics collection (default: true) */
  enabled?: boolean;
  /** Log to console (default: false) */
  logToConsole?: boolean;
  /** Custom metrics handler */
  onMetric?: (metric: Metric) => void;
}

/**
 * Simple metrics collector
 */
class MetricsCollector {
  private metrics: Metric[] = [];

  private maxMetrics: number;

  constructor(maxMetrics = 1000) {
    this.maxMetrics = maxMetrics;
  }

  addMetric(metric: Metric): void {
    this.metrics.push(metric);

    // Keep only the last maxMetrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getMetrics(): Metric[] {
    return [...this.metrics];
  }

  getStats() {
    const totalRequests = this.metrics.length;
    const avgResponseTime = this.metrics.reduce((sum, m) => sum + (m.responseTime || 0), 0) / totalRequests || 0;

    const methodCounts = this.metrics.reduce((acc, m) => {
      acc[m.method] = (acc[m.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRequests,
      avgResponseTime: Math.round(avgResponseTime),
      methodCounts,
      lastRequest: this.metrics[this.metrics.length - 1]
    };
  }

  clear(): void {
    this.metrics = [];
  }
}

/**
 * Creates a metrics plugin for tracking ReDoc usage
 * @param options - Metrics configuration options
 * @returns Metrics plugin
 */
export function metricsPlugin(options: MetricsPluginOptions = {}): Plugin {
  const { enabled = true, logToConsole = false, onMetric } = options;

  const collector = new MetricsCollector();

  return {
    name: 'metrics',
    version: '1.0.0',
    description: 'Collects usage metrics for ReDoc documentation',
    hooks: {
      onRequest: (req: Request, res: Response, next: NextFunction): void => {
        if (!enabled) {
          next();
          return;
        }

        const startTime = Date.now();

        const metric: Metric = {
          timestamp: startTime,
          method: req.method,
          url: req.url,
          userAgent: req.headers['user-agent'],
          ip: req.ip || req.socket.remoteAddress,
          referrer: req.headers.referer
        };

        // Capture response time when response finishes
        res.on('finish', () => {
          metric.responseTime = Date.now() - startTime;
          collector.addMetric(metric);

          if (logToConsole) {
            logger.info(`[Metrics] ${metric.method} ${metric.url} - ${metric.responseTime}ms - ${metric.userAgent}`);
          }

          if (onMetric) {
            onMetric(metric);
          }
        });

        next();
      }
    },
    config: {
      enabled,
      logToConsole,
      getMetrics: () => collector.getMetrics(),
      getStats: () => collector.getStats(),
      clearMetrics: () => collector.clear()
    }
  };
}

export default metricsPlugin;
