import { Plugin } from './plugin';

/**
 * Extended options interface that includes plugin support
 */
export interface RedocExpressOptions {
  /** Page title */
  title: string;
  /** URL to the OpenAPI/Swagger spec */
  specUrl: string;
  /** Content Security Policy nonce (optional) */
  nonce?: string;
  /** ReDoc-specific options passed to Redoc.init() */
  redocOptions?: Record<string, unknown>;
  /** Array of plugins to use */
  plugins?: Plugin[];
}

/**
 * Backward compatibility - maps to RedocExpressOptions
 * @deprecated Use RedocExpressOptions instead
 */
export interface Ioption {
  title: string;
  specUrl: string;
  nonce?: string;
  redocOptions?: Record<string, unknown>;
}
