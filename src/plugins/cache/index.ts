import { Plugin } from '../../types/plugin';

/**
 * Cache plugin configuration options
 */
export interface CachePluginOptions {
  /** Time-to-live in seconds (default: 3600) */
  ttl?: number;
  /** Maximum cache size in bytes (default: 10MB) */
  maxSize?: number;
  /** Enable cache (default: true) */
  enabled?: boolean;
}

/**
 * Simple in-memory cache implementation
 */
class HtmlCache {
  private cache: Map<string, { html: string; timestamp: number; size: number }> = new Map();

  private ttl: number;

  private maxSize: number;

  private currentSize = 0;

  constructor(ttl: number, maxSize: number) {
    this.ttl = ttl * 1000; // Convert to milliseconds
    this.maxSize = maxSize;
  }

  set(key: string, html: string): void {
    const size = Buffer.byteLength(html, 'utf8');

    // Check if adding this entry would exceed max size
    if (this.currentSize + size > this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      html,
      timestamp: Date.now(),
      size
    });

    this.currentSize += size;
  }

  get(key: string): string | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.currentSize -= entry.size;
      return null;
    }

    return entry.html;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    // Find oldest entry
    this.cache.forEach((value, key) => {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    });

    // Remove oldest entry
    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      if (entry) {
        this.currentSize -= entry.size;
        this.cache.delete(oldestKey);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  getStats() {
    return {
      entries: this.cache.size,
      currentSize: this.currentSize,
      maxSize: this.maxSize,
      ttl: this.ttl / 1000
    };
  }
}

/**
 * Creates a cache plugin for ReDoc HTML responses
 * @param options - Cache configuration options
 * @returns Cache plugin
 */
export function cachePlugin(options: CachePluginOptions = {}): Plugin {
  const { ttl = 3600, maxSize = 10 * 1024 * 1024, enabled = true } = options;

  const cache = new HtmlCache(ttl, maxSize);

  return {
    name: 'cache',
    version: '1.0.0',
    description: 'Caches rendered HTML to improve performance',
    hooks: {
      afterRender: async (html: string): Promise<string> => {
        if (!enabled) {
          return html;
        }

        // Cache the rendered HTML using a simple key
        const cacheKey = 'redoc-html';
        cache.set(cacheKey, html);

        return html;
      },
      beforeRender: async (html: string): Promise<string> => {
        if (!enabled) {
          return html;
        }

        // Try to get cached HTML
        const cacheKey = 'redoc-html';
        const cached = cache.get(cacheKey);

        if (cached) {
          // Return cached version
          return cached;
        }

        return html;
      }
    },
    config: {
      ttl,
      maxSize,
      enabled,
      getStats: () => cache.getStats(),
      clearCache: () => cache.clear()
    }
  };
}

export default cachePlugin;
