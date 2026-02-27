import { validatePlugin } from './hooks';
import type { Plugin, PluginFactory } from './types/plugin';

/**
 * Helper function to create a plugin
 * @param config - Plugin configuration
 * @returns A plugin object
 */
export function createPlugin(config: Plugin): Plugin {
  validatePlugin(config);
  return config;
}

/**
 * Helper function to create a plugin factory
 * @param factory - Function that creates a plugin
 * @returns Plugin factory function
 */
export function createPluginFactory(factory: PluginFactory): PluginFactory {
  return factory;
}

export default {
  createPlugin,
  createPluginFactory
};
