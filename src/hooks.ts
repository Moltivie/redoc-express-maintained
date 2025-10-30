import { NextFunction, Request, Response } from 'express';
import { Plugin, RedocOptions } from './types/plugin';
import { logger } from './utils/logger';

/**
 * Executes all beforeRender hooks from registered plugins
 * @param html - The HTML string to process
 * @param options - The redoc options being used
 * @param plugins - Array of plugins to execute
 * @returns Modified HTML string
 */
export async function executeBeforeRenderHooks(
  html: string,
  options: RedocOptions,
  plugins: Plugin[]
): Promise<string> {
  // Process plugins sequentially using reduce to avoid linting issues
  const result = await plugins.reduce(async (previousPromise, plugin) => {
    const currentHtml = await previousPromise;
    if (plugin.hooks.beforeRender) {
      try {
        return await plugin.hooks.beforeRender(currentHtml, options);
      } catch (error) {
        // Continue with other plugins even if one fails
        logger.error(`[Plugin: ${plugin.name}] Error in beforeRender hook:`, error);
        return currentHtml;
      }
    }
    return currentHtml;
  }, Promise.resolve(html));

  return result;
}

/**
 * Executes all afterRender hooks from registered plugins
 * @param html - The HTML string to process
 * @param plugins - Array of plugins to execute
 * @returns Modified HTML string
 */
export async function executeAfterRenderHooks(html: string, plugins: Plugin[]): Promise<string> {
  // Process plugins sequentially using reduce to avoid linting issues
  const result = await plugins.reduce(async (previousPromise, plugin) => {
    const currentHtml = await previousPromise;
    if (plugin.hooks.afterRender) {
      try {
        return await plugin.hooks.afterRender(currentHtml);
      } catch (error) {
        // Continue with other plugins even if one fails
        logger.error(`[Plugin: ${plugin.name}] Error in afterRender hook:`, error);
        return currentHtml;
      }
    }
    return currentHtml;
  }, Promise.resolve(html));

  return result;
}

/**
 * Executes a single onRequest hook wrapped in a promise
 */
function executeOnRequestHook(plugin: Plugin, req: Request, res: Response): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (plugin.hooks.onRequest) {
      plugin.hooks.onRequest(req, res, (err?: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

/**
 * Creates an Express middleware that executes onRequest hooks
 * @param plugins - Array of plugins to execute
 * @returns Express middleware function
 */
export function createOnRequestMiddleware(plugins: Plugin[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Execute all onRequest hooks in sequence using reduce
      await plugins.reduce(async (previousPromise, plugin) => {
        await previousPromise;
        return executeOnRequestHook(plugin, req, res);
      }, Promise.resolve());
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Executes a single onError hook wrapped in a promise
 */
function executeOnErrorHook(plugin: Plugin, error: Error, req: Request, res: Response): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (plugin.hooks.onError) {
      plugin.hooks.onError(error, req, res, (err?: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

/**
 * Creates an Express error handler middleware that executes onError hooks
 * @param plugins - Array of plugins to execute
 * @returns Express error handler middleware function
 */
export function createOnErrorMiddleware(plugins: Plugin[]) {
  return async (error: Error, req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Execute all onError hooks using reduce
    await plugins.reduce(async (previousPromise, plugin) => {
      await previousPromise;
      try {
        return executeOnErrorHook(plugin, error, req, res);
      } catch (hookError) {
        logger.error(`[Plugin: ${plugin.name}] Error in onError hook:`, hookError);
        return Promise.resolve();
      }
    }, Promise.resolve());

    // Pass to next error handler
    next(error);
  };
}

/**
 * Validates that a plugin has the correct structure
 * @param plugin - The plugin to validate
 * @throws Error if plugin is invalid
 */
export function validatePlugin(plugin: Plugin): void {
  if (!plugin.name) {
    throw new Error('Plugin must have a name');
  }

  if (!plugin.hooks) {
    throw new Error(`Plugin "${plugin.name}" must have hooks defined`);
  }

  // Validate hook types
  const { beforeRender, afterRender, onRequest, onError } = plugin.hooks;

  if (beforeRender && typeof beforeRender !== 'function') {
    throw new Error(`Plugin "${plugin.name}": beforeRender must be a function`);
  }

  if (afterRender && typeof afterRender !== 'function') {
    throw new Error(`Plugin "${plugin.name}": afterRender must be a function`);
  }

  if (onRequest && typeof onRequest !== 'function') {
    throw new Error(`Plugin "${plugin.name}": onRequest must be a function`);
  }

  if (onError && typeof onError !== 'function') {
    throw new Error(`Plugin "${plugin.name}": onError must be a function`);
  }
}
