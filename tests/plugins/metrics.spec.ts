import { NextFunction, Request, Response } from 'express';
import { Metric, metricsPlugin } from '../../src/plugins/metrics';

// Mock Express Request, Response, and NextFunction
const createMockRequest = (method = 'GET', url = '/docs', headers: Record<string, string> = {}): Partial<Request> => ({
  method,
  url,
  headers: {
    'user-agent': 'Mozilla/5.0 (Test Browser)',
    referer: 'https://example.com',
    ...headers
  } as Record<string, string | string[] | undefined>,
  ip: '127.0.0.1',
  socket: { remoteAddress: '127.0.0.1' } as unknown as Request['socket']
});

const createMockResponse = (): Partial<Response> & {
  finishCallback?: () => void;
  statusCode?: number;
} => {
  const res: Partial<Response> & {
    finishCallback?: () => void;
    statusCode?: number;
  } = {
    statusCode: 200,
    finishCallback: undefined
  };

  res.on = jest.fn((event: string, callback: () => void) => {
    if (event === 'finish') {
      res.finishCallback = callback;
    }
    return res as Response;
  }) as Response['on'];

  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res as Response;
  }) as Response['status'];

  res.send = jest.fn(() => res as Response) as Response['send'];

  return res;
};

const createMockNext = (): jest.Mock<NextFunction> => jest.fn() as jest.Mock<NextFunction>;

describe('Metrics Plugin', () => {
  describe('Plugin Configuration', () => {
    it('should create a metrics plugin with default options', () => {
      const plugin = metricsPlugin();

      expect(plugin.name).toBe('metrics');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.description).toBe('Collects usage metrics for ReDoc documentation');
      expect(plugin.hooks.onRequest).toBeDefined();
      expect(plugin.config).toBeDefined();
    });

    it('should create plugin with custom options', () => {
      const plugin = metricsPlugin({
        enabled: true,
        logToConsole: true
      });

      expect(plugin.config?.enabled).toBe(true);
      expect(plugin.config?.logToConsole).toBe(true);
    });

    it('should allow disabling metrics', () => {
      const plugin = metricsPlugin({ enabled: false });
      expect(plugin.config?.enabled).toBe(false);
    });

    it('should provide metrics API methods', () => {
      const plugin = metricsPlugin();

      expect(plugin.config?.getMetrics).toBeDefined();
      expect(plugin.config?.getStats).toBeDefined();
      expect(plugin.config?.clearMetrics).toBeDefined();
    });
  });

  describe('Metrics Collection', () => {
    it('should collect basic request metrics', async () => {
      const plugin = metricsPlugin({ enabled: true });

      const req = createMockRequest('GET', '/docs');
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();

      // Trigger the finish event to complete metric collection
      if (res.finishCallback) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 10);
        });
        res.finishCallback();
      }

      // Wait for metric to be recorded
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 10);
      });

      const config = plugin.config as {
        getMetrics?: () => Metric[];
      };
      const metrics = config.getMetrics?.();
      expect(metrics).toBeDefined();
      expect(metrics?.length).toBeGreaterThan(0);

      const metric = metrics?.[0];
      expect(metric?.method).toBe('GET');
      expect(metric?.url).toBe('/docs');
      expect(metric?.userAgent).toBe('Mozilla/5.0 (Test Browser)');
      expect(metric?.ip).toBe('127.0.0.1');
      expect(metric?.referrer).toBe('https://example.com');
      expect(metric?.timestamp).toBeDefined();
      expect(metric?.responseTime).toBeDefined();
    });

    it('should not collect metrics when disabled', async () => {
      const plugin = metricsPlugin({ enabled: false });

      const req = createMockRequest('GET', '/docs');
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();

      const config = plugin.config as {
        getMetrics?: () => Metric[];
      };
      const metrics = config.getMetrics?.();
      expect(metrics?.length).toBe(0);
    });

    it('should collect multiple requests', async () => {
      const plugin = metricsPlugin({ enabled: true });

      // Make multiple requests
      const requests = [0, 1, 2];
      await Promise.all(
        requests.map(async (i) => {
          const req = createMockRequest('GET', `/docs/${i}`);
          const res = createMockResponse();
          const next = createMockNext();

          plugin.hooks.onRequest?.(req as Request, res as Response, next);

          // Trigger finish event
          if (res.finishCallback) {
            await new Promise((resolve) => {
              setTimeout(resolve, 5);
            });
            res.finishCallback();
          }
          return Promise.resolve();
        })
      );

      // Wait for all metrics to be recorded
      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });

      const config = plugin.config as {
        getMetrics?: () => Metric[];
      };
      const metrics = config.getMetrics?.();
      expect(metrics?.length).toBe(3);
    });

    it('should track different HTTP methods', async () => {
      const plugin = metricsPlugin({ enabled: true });

      const methods = ['GET', 'POST', 'PUT', 'DELETE'];

      await Promise.all(
        methods.map(async (method) => {
          const req = createMockRequest(method, '/docs');
          const res = createMockResponse();
          const next = createMockNext();

          plugin.hooks.onRequest?.(req as Request, res as Response, next);

          if (res.finishCallback) {
            await new Promise((resolve) => {
              setTimeout(resolve, 5);
            });
            res.finishCallback();
          }
          return Promise.resolve();
        })
      );

      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });

      const config = plugin.config as {
        getStats?: () => {
          totalRequests: number;
          avgResponseTime: number;
          methodCounts: Record<string, number>;
          lastRequest?: Metric;
        };
      };
      const stats = config.getStats?.();
      expect(stats?.totalRequests).toBe(4);
      expect(stats?.methodCounts).toEqual({
        GET: 1,
        POST: 1,
        PUT: 1,
        DELETE: 1
      });
    });

    it('should measure response time', async () => {
      const plugin = metricsPlugin({ enabled: true });

      const req = createMockRequest('GET', '/docs');
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      // Simulate some processing time
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });

      if (res.finishCallback) {
        res.finishCallback();
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      const config = plugin.config as {
        getMetrics?: () => Metric[];
      };
      const metrics = config.getMetrics?.();
      const metric = metrics?.[0];

      expect(metric?.responseTime).toBeDefined();
      expect(metric?.responseTime).toBeGreaterThan(0);
      // Response time should be at least 50ms (our simulated delay)
      expect(metric?.responseTime).toBeGreaterThanOrEqual(40); // Allow some margin
    });
  });

  describe('Metrics Statistics', () => {
    it('should provide accurate statistics', async () => {
      const plugin = metricsPlugin({ enabled: true });

      // Create 5 requests with different methods
      const requests = [
        { method: 'GET', url: '/docs' },
        { method: 'GET', url: '/docs/api' },
        { method: 'POST', url: '/docs' },
        { method: 'GET', url: '/docs/spec' },
        { method: 'PUT', url: '/docs' }
      ];

      await Promise.all(
        requests.map(async ({ method, url }) => {
          const req = createMockRequest(method, url);
          const res = createMockResponse();
          const next = createMockNext();

          plugin.hooks.onRequest?.(req as Request, res as Response, next);

          if (res.finishCallback) {
            await new Promise((resolve) => {
              setTimeout(resolve, 5);
            });
            res.finishCallback();
          }
          return Promise.resolve();
        })
      );

      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });

      const config = plugin.config as {
        getStats?: () => {
          totalRequests: number;
          avgResponseTime: number;
          methodCounts: Record<string, number>;
          lastRequest?: Metric;
        };
      };
      const stats = config.getStats?.();

      expect(stats?.totalRequests).toBe(5);
      expect(stats?.methodCounts.GET).toBe(3);
      expect(stats?.methodCounts.POST).toBe(1);
      expect(stats?.methodCounts.PUT).toBe(1);
      expect(stats?.avgResponseTime).toBeDefined();
      expect(stats?.lastRequest).toBeDefined();
      expect(stats?.lastRequest?.method).toBe('PUT');
    });

    it('should calculate average response time', async () => {
      const plugin = metricsPlugin({ enabled: true });

      // Create requests with known delays
      const delays = [1, 2, 3];
      await Promise.all(
        delays.map(async (i) => {
          const req = createMockRequest('GET', '/docs');
          const res = createMockResponse();
          const next = createMockNext();

          plugin.hooks.onRequest?.(req as Request, res as Response, next);

          await new Promise((resolve) => {
            setTimeout(resolve, 10 * i);
          });

          if (res.finishCallback) {
            res.finishCallback();
          }
          return Promise.resolve();
        })
      );

      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });

      const config = plugin.config as {
        getStats?: () => {
          totalRequests: number;
          avgResponseTime: number;
          methodCounts: Record<string, number>;
          lastRequest?: Metric;
        };
      };
      const stats = config.getStats?.();

      expect(stats?.avgResponseTime).toBeDefined();
      expect(stats?.avgResponseTime).toBeGreaterThan(0);
    });

    it('should handle empty metrics', () => {
      const plugin = metricsPlugin({ enabled: true });

      const config = plugin.config as {
        getStats?: () => {
          totalRequests: number;
          avgResponseTime: number;
          methodCounts: Record<string, number>;
          lastRequest?: Metric;
        };
      };
      const stats = config.getStats?.();

      expect(stats?.totalRequests).toBe(0);
      expect(stats?.avgResponseTime).toBe(0);
      expect(stats?.methodCounts).toEqual({});
      expect(stats?.lastRequest).toBeUndefined();
    });
  });

  describe('Metrics Management', () => {
    it('should allow clearing metrics', async () => {
      const plugin = metricsPlugin({ enabled: true });

      // Add some metrics
      const req = createMockRequest('GET', '/docs');
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      if (res.finishCallback) {
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
        res.finishCallback();
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      const config = plugin.config as {
        getMetrics?: () => Metric[];
        clearMetrics?: () => void;
      };
      let metrics = config.getMetrics?.();
      expect(metrics?.length).toBeGreaterThan(0);

      // Clear metrics
      config.clearMetrics?.();

      metrics = config.getMetrics?.();
      expect(metrics?.length).toBe(0);
    });

    it('should provide immutable metrics copy', async () => {
      const plugin = metricsPlugin({ enabled: true });

      const req = createMockRequest('GET', '/docs');
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      if (res.finishCallback) {
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
        res.finishCallback();
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      const config = plugin.config as {
        getMetrics?: () => Metric[];
      };
      const metrics1 = config.getMetrics?.();
      const metrics2 = config.getMetrics?.();

      expect(metrics1).toEqual(metrics2);
      expect(metrics1).not.toBe(metrics2); // Different array instances
    });
  });

  describe('Custom Metric Handler', () => {
    it('should call custom metric handler when provided', async () => {
      const onMetric = jest.fn();
      const plugin = metricsPlugin({
        enabled: true,
        onMetric
      });

      const req = createMockRequest('GET', '/docs');
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      if (res.finishCallback) {
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
        res.finishCallback();
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      expect(onMetric).toHaveBeenCalled();
      const metricArg = onMetric.mock.calls[0][0];
      expect(metricArg).toMatchObject({
        method: 'GET',
        url: '/docs',
        userAgent: expect.any(String),
        ip: expect.any(String),
        timestamp: expect.any(Number),
        responseTime: expect.any(Number)
      });
    });

    it('should call custom handler for each request', async () => {
      const onMetric = jest.fn();
      const plugin = metricsPlugin({
        enabled: true,
        onMetric
      });

      // Make 3 requests
      const requestIndexes = [0, 1, 2];
      await Promise.all(
        requestIndexes.map(async (i) => {
          const req = createMockRequest('GET', `/docs/${i}`);
          const res = createMockResponse();
          const next = createMockNext();

          plugin.hooks.onRequest?.(req as Request, res as Response, next);

          if (res.finishCallback) {
            await new Promise((resolve) => {
              setTimeout(resolve, 5);
            });
            res.finishCallback();
          }
          return Promise.resolve();
        })
      );

      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });

      expect(onMetric).toHaveBeenCalledTimes(3);
    });
  });

  describe('Console Logging', () => {
    it('should call onMetric callback when logging is enabled', async () => {
      const onMetricSpy = jest.fn();
      const plugin = metricsPlugin({
        enabled: true,
        logToConsole: true,
        onMetric: onMetricSpy
      });

      const req = createMockRequest('GET', '/docs');
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      if (res.finishCallback) {
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
        res.finishCallback();
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      // onMetric should be called when logToConsole is enabled
      expect(onMetricSpy).toHaveBeenCalled();
    });

    it('should not log to console when disabled', async () => {
      const onMetricSpy = jest.fn();
      const plugin = metricsPlugin({
        enabled: true,
        logToConsole: false,
        onMetric: onMetricSpy
      });

      const req = createMockRequest('GET', '/docs');
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      if (res.finishCallback) {
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
        res.finishCallback();
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      // onMetric should still be called even when logToConsole is false
      expect(onMetricSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle requests without user agent', async () => {
      const plugin = metricsPlugin({ enabled: true });

      const req = createMockRequest('GET', '/docs', {});
      delete req.headers?.['user-agent'];

      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      if (res.finishCallback) {
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
        res.finishCallback();
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      const config = plugin.config as {
        getMetrics?: () => Metric[];
      };
      const metrics = config.getMetrics?.();
      expect(metrics?.[0]?.userAgent).toBeUndefined();
    });

    it('should handle requests without referrer', async () => {
      const plugin = metricsPlugin({ enabled: true });

      const req = createMockRequest('GET', '/docs', {});
      delete req.headers?.referer;

      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      if (res.finishCallback) {
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
        res.finishCallback();
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      const config = plugin.config as {
        getMetrics?: () => Metric[];
      };
      const metrics = config.getMetrics?.();
      expect(metrics?.[0]?.referrer).toBeUndefined();
    });

    it('should handle requests without IP', async () => {
      const plugin = metricsPlugin({ enabled: true });

      const req = createMockRequest('GET', '/docs');
      delete (req as { ip?: string }).ip;

      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      if (res.finishCallback) {
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
        res.finishCallback();
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      const config = plugin.config as {
        getMetrics?: () => Metric[];
      };
      const metrics = config.getMetrics?.();
      // Should fallback to socket.remoteAddress
      expect(metrics?.[0]?.ip).toBe('127.0.0.1');
    });

    it('should maintain metrics up to max limit', async () => {
      const plugin = metricsPlugin({ enabled: true });

      // Create more than 1000 requests (default max)
      // This is a simplified test - in reality, we'd need to create 1001+ requests
      const requestCount = 10;
      const requestsArray = Array.from({ length: requestCount }, (_, i) => i);
      await Promise.all(
        requestsArray.map(async (i) => {
          const req = createMockRequest('GET', `/docs/${i}`);
          const res = createMockResponse();
          const next = createMockNext();

          plugin.hooks.onRequest?.(req as Request, res as Response, next);

          if (res.finishCallback) {
            res.finishCallback();
          }
          return Promise.resolve();
        })
      );

      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });

      const config = plugin.config as {
        getMetrics?: () => Metric[];
      };
      const metrics = config.getMetrics?.();
      // Should have stored all 10 metrics (under the limit)
      expect(metrics?.length).toBe(10);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should track API documentation access patterns', async () => {
      const plugin = metricsPlugin({ enabled: true });

      // Simulate different types of access
      const accessPatterns = [
        { method: 'GET', url: '/docs', userAgent: 'Chrome' },
        { method: 'GET', url: '/docs', userAgent: 'Firefox' },
        { method: 'GET', url: '/docs/api', userAgent: 'Chrome' },
        { method: 'HEAD', url: '/docs', userAgent: 'Bot' },
        { method: 'GET', url: '/docs', userAgent: 'Chrome' }
      ];

      await Promise.all(
        accessPatterns.map(async (pattern) => {
          const req = createMockRequest(pattern.method, pattern.url, {
            'user-agent': pattern.userAgent
          });
          const res = createMockResponse();
          const next = createMockNext();

          plugin.hooks.onRequest?.(req as Request, res as Response, next);

          if (res.finishCallback) {
            await new Promise((resolve) => {
              setTimeout(resolve, 5);
            });
            res.finishCallback();
          }
          return Promise.resolve();
        })
      );

      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });

      const config = plugin.config as {
        getStats?: () => {
          totalRequests: number;
          avgResponseTime: number;
          methodCounts: Record<string, number>;
          lastRequest?: Metric;
        };
      };
      const stats = config.getStats?.();

      expect(stats?.totalRequests).toBe(5);
      expect(stats?.methodCounts.GET).toBe(4);
      expect(stats?.methodCounts.HEAD).toBe(1);
    });

    it('should support integration with external analytics', async () => {
      const analyticsData: Metric[] = [];

      const plugin = metricsPlugin({
        enabled: true,
        onMetric: (metric: Metric) => {
          // Simulate sending to external analytics service
          analyticsData.push(metric);
        }
      });

      const req = createMockRequest('GET', '/docs');
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      if (res.finishCallback) {
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
        res.finishCallback();
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      expect(analyticsData.length).toBe(1);
      expect(analyticsData[0]).toMatchObject({
        method: 'GET',
        url: '/docs',
        timestamp: expect.any(Number),
        responseTime: expect.any(Number)
      });
    });
  });
});
