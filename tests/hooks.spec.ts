import {
  executeAfterRenderHooks,
  executeBeforeRenderHooks,
  validatePlugin
} from '../src/hooks';
import { Plugin } from '../src/types/plugin';

describe('Hooks System', () => {
  describe('executeBeforeRenderHooks', () => {
    it('should execute all beforeRender hooks in order', async () => {
      const executionOrder: string[] = [];

      const plugin1: Plugin = {
        name: 'plugin1',
        hooks: {
          beforeRender: async (html: string) => {
            executionOrder.push('plugin1');
            return `${html}-plugin1`;
          }
        }
      };

      const plugin2: Plugin = {
        name: 'plugin2',
        hooks: {
          beforeRender: async (html: string) => {
            executionOrder.push('plugin2');
            return `${html}-plugin2`;
          }
        }
      };

      const result = await executeBeforeRenderHooks('html', {}, [
        plugin1,
        plugin2
      ]);

      expect(result).toBe('html-plugin1-plugin2');
      expect(executionOrder).toEqual(['plugin1', 'plugin2']);
    });

    it('should handle plugins without beforeRender hook', async () => {
      const plugin: Plugin = {
        name: 'plugin',
        hooks: {
          afterRender: (html: string) => html
        }
      };

      const result = await executeBeforeRenderHooks('html', {}, [plugin]);
      expect(result).toBe('html');
    });

    it('should continue on error and return original html', async () => {
      const plugin1: Plugin = {
        name: 'plugin1',
        hooks: {
          beforeRender: async () => {
            throw new Error('Plugin error');
          }
        }
      };

      const plugin2: Plugin = {
        name: 'plugin2',
        hooks: {
          beforeRender: async (html: string) => `${html}-plugin2`
        }
      };

      const result = await executeBeforeRenderHooks('html', {}, [
        plugin1,
        plugin2
      ]);
      expect(result).toBe('html-plugin2');
    });
  });

  describe('executeAfterRenderHooks', () => {
    it('should execute all afterRender hooks in order', async () => {
      const plugin1: Plugin = {
        name: 'plugin1',
        hooks: {
          afterRender: async (html: string) => `${html}-after1`
        }
      };

      const plugin2: Plugin = {
        name: 'plugin2',
        hooks: {
          afterRender: async (html: string) => `${html}-after2`
        }
      };

      const result = await executeAfterRenderHooks('html', [plugin1, plugin2]);
      expect(result).toBe('html-after1-after2');
    });

    it('should handle errors gracefully', async () => {
      const plugin1: Plugin = {
        name: 'plugin1',
        hooks: {
          afterRender: async () => {
            throw new Error('Error');
          }
        }
      };

      const plugin2: Plugin = {
        name: 'plugin2',
        hooks: {
          afterRender: async (html: string) => `${html}-after2`
        }
      };

      const result = await executeAfterRenderHooks('html', [plugin1, plugin2]);
      expect(result).toBe('html-after2');
    });
  });

  describe('validatePlugin', () => {
    it('should validate a valid plugin', () => {
      const plugin: Plugin = {
        name: 'test',
        hooks: {
          beforeRender: (html: string) => html
        }
      };

      expect(() => validatePlugin(plugin)).not.toThrow();
    });

    it('should throw error for plugin without name', () => {
      const plugin = {
        name: '',
        hooks: {}
      } as Plugin;

      expect(() => validatePlugin(plugin)).toThrow('Plugin must have a name');
    });

    it('should throw error for plugin without hooks', () => {
      const plugin = {
        name: 'test',
        hooks: null
      } as unknown as Plugin;

      expect(() => validatePlugin(plugin)).toThrow('must have hooks defined');
    });

    it('should throw error for invalid hook type', () => {
      const plugin = {
        name: 'test',
        hooks: {
          beforeRender: 'not a function'
        }
      } as unknown as Plugin;

      expect(() => validatePlugin(plugin)).toThrow(
        'beforeRender must be a function'
      );
    });
  });
});
