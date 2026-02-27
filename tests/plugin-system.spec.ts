import { createPlugin } from '../src/plugin-system';

describe('Plugin System', () => {
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
});
