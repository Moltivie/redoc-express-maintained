import {
  clearPlugins,
  createPlugin,
  getAllPlugins,
  getPlugin,
  getPluginsWithHook,
  registerPlugin,
  unregisterPlugin
} from '../src/plugin-system';
import { Plugin } from '../src/types/plugin';

describe('Plugin System', () => {
  beforeEach(() => {
    clearPlugins();
  });

  afterEach(() => {
    clearPlugins();
  });

  describe('createPlugin', () => {
    it('should create a valid plugin', () => {
      const plugin = createPlugin({
        name: 'test-plugin',
        hooks: {
          beforeRender: (html: string) => html
        }
      });

      expect(plugin.name).toBe('test-plugin');
      expect(plugin.hooks.beforeRender).toBeDefined();
    });

    it('should throw error for plugin without name', () => {
      expect(() => {
        createPlugin({
          name: '',
          hooks: {}
        });
      }).toThrow('Plugin must have a name');
    });

    it('should throw error for plugin without hooks', () => {
      expect(() => {
        createPlugin({
          name: 'test',
          // @ts-expect-error Testing invalid plugin
          hooks: null
        });
      }).toThrow('must have hooks defined');
    });
  });

  describe('registerPlugin', () => {
    it('should register a plugin', () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        hooks: {
          beforeRender: (html: string) => html
        }
      };

      registerPlugin(plugin);
      expect(getPlugin('test-plugin')).toBe(plugin);
    });

    it('should throw error when registering duplicate plugin', () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        hooks: {}
      };

      registerPlugin(plugin);
      expect(() => registerPlugin(plugin)).toThrow('already registered');
    });
  });

  describe('unregisterPlugin', () => {
    it('should unregister a plugin', () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        hooks: {}
      };

      registerPlugin(plugin);
      expect(unregisterPlugin('test-plugin')).toBe(true);
      expect(getPlugin('test-plugin')).toBeUndefined();
    });

    it('should return false for non-existent plugin', () => {
      expect(unregisterPlugin('non-existent')).toBe(false);
    });
  });

  describe('getAllPlugins', () => {
    it('should return all registered plugins', () => {
      const plugin1: Plugin = { name: 'plugin1', hooks: {} };
      const plugin2: Plugin = { name: 'plugin2', hooks: {} };

      registerPlugin(plugin1);
      registerPlugin(plugin2);

      const plugins = getAllPlugins();
      expect(plugins).toHaveLength(2);
      expect(plugins).toContainEqual(plugin1);
      expect(plugins).toContainEqual(plugin2);
    });

    it('should return empty array when no plugins registered', () => {
      expect(getAllPlugins()).toHaveLength(0);
    });
  });

  describe('getPluginsWithHook', () => {
    it('should return plugins with specific hook', () => {
      const plugin1: Plugin = {
        name: 'plugin1',
        hooks: {
          beforeRender: (html: string) => html
        }
      };

      const plugin2: Plugin = {
        name: 'plugin2',
        hooks: {
          afterRender: (html: string) => html
        }
      };

      const plugin3: Plugin = {
        name: 'plugin3',
        hooks: {
          beforeRender: (html: string) => html
        }
      };

      registerPlugin(plugin1);
      registerPlugin(plugin2);
      registerPlugin(plugin3);

      const withBeforeRender = getPluginsWithHook('beforeRender');
      expect(withBeforeRender).toHaveLength(2);
      expect(withBeforeRender).toContainEqual(plugin1);
      expect(withBeforeRender).toContainEqual(plugin3);
    });
  });

  describe('clearPlugins', () => {
    it('should clear all plugins', () => {
      registerPlugin({ name: 'plugin1', hooks: {} });
      registerPlugin({ name: 'plugin2', hooks: {} });

      clearPlugins();
      expect(getAllPlugins()).toHaveLength(0);
    });
  });
});
