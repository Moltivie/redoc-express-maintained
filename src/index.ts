import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { createOnRequestMiddleware } from './hooks';
import { createPlugin, createPluginFactory } from './plugin-system';
import type { Ioption } from './redoc-html-template';
import { redocHtml } from './redoc-html-template';
import type { Plugin } from './types/plugin';
// Import plugins namespace once to avoid dynamic require in CJS compatibility block
import * as cjsPlugins from './plugins';

/**
 * Extended options interface for redoc-express middleware
 */
export interface RedocExpressOptions extends Ioption {
  plugins?: Plugin[];
}

/**
 * Creates Express middleware for serving ReDoc documentation
 * @param options - Configuration options including plugins
 * @returns Express middleware function
 */
function redocExpressMiddleware(
  options: RedocExpressOptions = {
    title: 'ReDoc',
    specUrl: 'http://petstore.swagger.io/v2/swagger.json'
  }
): RequestHandler {
  const { plugins = [] } = options;

  // Create array of middleware functions
  const middlewares: RequestHandler[] = [];

  // Add onRequest hooks middleware if plugins exist
  if (plugins.length > 0) {
    middlewares.push(createOnRequestMiddleware(plugins));
  }

  // Add main rendering middleware
  middlewares.push(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.type('html');
      const html = await redocHtml(options);
      res.send(html);
    } catch (error) {
      next(error);
    }
  });

  // Return composed middleware
  if (middlewares.length === 1) {
    return middlewares[0];
  }

  // Compose multiple middleware functions
  return (req: Request, res: Response, next: NextFunction): void => {
    function dispatch(i: number): void {
      if (i >= middlewares.length) {
        return;
      }

      const fn = middlewares[i];
      try {
        fn(req, res, (err?: unknown) => {
          if (err) {
            next(err);
          } else {
            dispatch(i + 1);
          }
        });
      } catch (err) {
        next(err);
      }
    }

    dispatch(0);
  };
}

// Re-export types and utilities for ESM
export { createPlugin, createPluginFactory } from './plugin-system';
export { redocHtml } from './redoc-html-template';
export { Plugin } from './types/plugin';

// Re-export all plugins
export { authPlugin, cachePlugin, metricsPlugin } from './plugins';
export type { AuthPluginOptions, CachePluginOptions, Metric, MetricsPluginOptions } from './plugins';

// Default export
export default redocExpressMiddleware;

// CommonJS compatibility
// TypeScript will compile this properly for CommonJS output
if (typeof module !== 'undefined' && module.exports) {
  module.exports = redocExpressMiddleware;
  module.exports.default = redocExpressMiddleware;
  module.exports.createPlugin = createPlugin;
  module.exports.createPluginFactory = createPluginFactory;
  module.exports.redocHtml = redocHtml;

  // Export plugins for CommonJS
  module.exports.authPlugin = cjsPlugins.authPlugin;
  module.exports.cachePlugin = cjsPlugins.cachePlugin;
  module.exports.metricsPlugin = cjsPlugins.metricsPlugin;
}
