import { validatePlugin } from './hooks';
import { Plugin, PluginFactory } from './types/plugin';
import { logger } from './utils/logger';

/**
 * Plugin Registry - manages registered plugins
 */
class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();

  /**
   * Register a plugin
   * @param plugin - The plugin to register
   * @throws Error if plugin is invalid or already registered
   */
  register(plugin: Plugin): void {
    // Validate plugin structure
    validatePlugin(plugin);

    // Check if plugin is already registered
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`);
    }

    // Register the plugin
    this.plugins.set(plugin.name, plugin);
    logger.info(`[Plugin System] Registered plugin: ${plugin.name}`);
  }

  /**
   * Unregister a plugin by name
   * @param name - The name of the plugin to unregister
   * @returns true if plugin was removed, false if not found
   */
  unregister(name: string): boolean {
    const result = this.plugins.delete(name);
    if (result) {
      logger.info(`[Plugin System] Unregistered plugin: ${name}`);
    }
    return result;
  }

  /**
   * Get a plugin by name
   * @param name - The name of the plugin to retrieve
   * @returns The plugin or undefined if not found
   */
  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all registered plugins
   * @returns Array of all registered plugins
   */
  getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Check if a plugin is registered
   * @param name - The name of the plugin to check
   * @returns true if plugin is registered
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get the number of registered plugins
   * @returns Number of registered plugins
   */
  count(): number {
    return this.plugins.size;
  }

  /**
   * Clear all registered plugins
   */
  clear(): void {
    this.plugins.clear();
    logger.info('[Plugin System] Cleared all plugins');
  }

  /**
   * Get plugins that have a specific hook implemented
   * @param hookName - Name of the hook to filter by
   * @returns Array of plugins that implement the specified hook
   */
  getPluginsWithHook(hookName: keyof Plugin['hooks']): Plugin[] {
    return this.getAll().filter((plugin) => plugin.hooks[hookName] !== undefined);
  }
}

// Global plugin registry instance
const registry = new PluginRegistry();

/**
 * Register a plugin globally
 * @param plugin - The plugin to register
 */
export function registerPlugin(plugin: Plugin): void {
  registry.register(plugin);
}

/**
 * Unregister a plugin globally
 * @param name - The name of the plugin to unregister
 * @returns true if plugin was removed
 */
export function unregisterPlugin(name: string): boolean {
  return registry.unregister(name);
}

/**
 * Get a plugin by name
 * @param name - The name of the plugin
 * @returns The plugin or undefined if not found
 */
export function getPlugin(name: string): Plugin | undefined {
  return registry.get(name);
}

/**
 * Get all registered plugins
 * @returns Array of all registered plugins
 */
export function getAllPlugins(): Plugin[] {
  return registry.getAll();
}

/**
 * Clear all registered plugins
 */
export function clearPlugins(): void {
  registry.clear();
}

/**
 * Get plugins that implement a specific hook
 * @param hookName - Name of the hook
 * @returns Array of plugins with the specified hook
 */
export function getPluginsWithHook(hookName: keyof Plugin['hooks']): Plugin[] {
  return registry.getPluginsWithHook(hookName);
}

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

export { PluginRegistry };
export default {
  registerPlugin,
  unregisterPlugin,
  getPlugin,
  getAllPlugins,
  clearPlugins,
  getPluginsWithHook,
  createPlugin,
  createPluginFactory
};
