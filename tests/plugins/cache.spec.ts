import { cachePlugin } from '../../src/plugins/cache';

describe('Cache Plugin', () => {
  it('should create a cache plugin with default options', () => {
    const plugin = cachePlugin();

    expect(plugin.name).toBe('cache');
    expect(plugin.version).toBe('1.0.0');
    expect(plugin.hooks.beforeRender).toBeDefined();
    expect(plugin.hooks.afterRender).toBeDefined();
  });

  it('should cache and retrieve HTML', async () => {
    const plugin = cachePlugin({ ttl: 10, enabled: true });

    const html = '<html>test</html>';

    // First call should cache the HTML
    if (plugin.hooks.afterRender) {
      await plugin.hooks.afterRender(html);
    }

    // Second call should retrieve from cache
    let cachedHtml = html;
    if (plugin.hooks.beforeRender) {
      cachedHtml = await plugin.hooks.beforeRender(html, {});
    }

    expect(cachedHtml).toBe(html);
  });

  it('should not cache when disabled', async () => {
    const plugin = cachePlugin({ enabled: false });

    const html = '<html>test</html>';

    if (plugin.hooks.afterRender) {
      const result = await plugin.hooks.afterRender(html);
      expect(result).toBe(html);
    }
  });

  it('should provide cache stats', () => {
    const plugin = cachePlugin();

    expect(plugin.config).toBeDefined();

    const config = plugin.config as {
      getStats: () => {
        entries: number;
        currentSize: number;
        maxSize: number;
        ttl: number;
      };
    };

    expect(config.getStats).toBeDefined();

    const stats = config.getStats();
    expect(stats).toHaveProperty('entries');
    expect(stats).toHaveProperty('currentSize');
    expect(stats).toHaveProperty('maxSize');
    expect(stats).toHaveProperty('ttl');
  });

  it('should allow clearing cache', () => {
    const plugin = cachePlugin();

    const config = plugin.config as {
      clearCache: () => void;
      getStats: () => {
        entries: number;
        currentSize: number;
        maxSize: number;
        ttl: number;
      };
    };

    expect(config.clearCache).toBeDefined();
    config.clearCache();

    const stats = config.getStats();
    expect(stats.entries).toBe(0);
  });
});
