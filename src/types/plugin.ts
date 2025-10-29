import { NextFunction, Request, Response } from 'express';

// Forward declaration - will be properly defined in options.ts
// We use a flexible type here to avoid circular dependencies
// Partial type to allow hooks to work with minimal options
export interface RedocOptions {
  title?: string;
  specUrl?: string;
  nonce?: string;
  redocOptions?: Record<string, unknown>;
  plugins?: unknown[]; // Avoid circular dependency, actual type is Plugin[]
}

/**
 * Hook function that runs before HTML rendering
 * @param html - The HTML string to be modified
 * @param options - The redoc options being used
 * @returns Modified HTML string or Promise of HTML string
 */
export type BeforeRenderHook = (
  html: string,
  options: RedocOptions
) => string | Promise<string>;

/**
 * Hook function that runs after HTML rendering
 * @param html - The final HTML string
 * @returns Modified HTML string or Promise of HTML string
 */
export type AfterRenderHook = (html: string) => string | Promise<string>;

/**
 * Hook function that runs on each request (middleware)
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export type OnRequestHook = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

/**
 * Hook function that runs when an error occurs
 * @param error - The error that occurred
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export type OnErrorHook = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

/**
 * Collection of all available hooks
 */
export interface PluginHooks {
  /** Runs before HTML is rendered - can modify HTML */
  beforeRender?: BeforeRenderHook;
  /** Runs after HTML is rendered - final modification opportunity */
  afterRender?: AfterRenderHook;
  /** Runs on each request - acts as middleware */
  onRequest?: OnRequestHook;
  /** Runs when an error occurs - error handling */
  onError?: OnErrorHook;
}

/**
 * Plugin configuration
 */
export interface Plugin {
  /** Unique name for the plugin */
  name: string;
  /** Version of the plugin (optional) */
  version?: string;
  /** Plugin description (optional) */
  description?: string;
  /** Hook implementations */
  hooks: PluginHooks;
  /** Plugin-specific configuration (optional) */
  config?: Record<string, unknown>;
}

/**
 * Plugin factory function type
 */
export type PluginFactory = (config?: Record<string, unknown>) => Plugin;

/**
 * Plugin execution context
 */
export interface PluginContext {
  /** Request object (available in onRequest and onError hooks) */
  req?: Request;
  /** Response object (available in onRequest and onError hooks) */
  res?: Response;
  /** Current HTML being processed (available in render hooks) */
  html?: string;
  /** Current options being used */
  options?: RedocOptions;
  /** Error that occurred (available in onError hook) */
  error?: Error;
}
