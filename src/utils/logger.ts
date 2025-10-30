/**
 * Simple logger interface for plugin system
 * Can be extended to use custom logging libraries
 */

export interface Logger {
  error(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

/**
 * Default console logger implementation
 * Only logs in development mode
 */
function createConsoleLogger(): Logger {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  return {
    error(message: string, ...args: unknown[]): void {
      if (isDevelopment) {
        // Console is acceptable in a logger utility
        // eslint-disable-next-line no-console
        console.error(message, ...args);
      }
    },

    warn(message: string, ...args: unknown[]): void {
      if (isDevelopment) {
        // eslint-disable-next-line no-console
        console.warn(message, ...args);
      }
    },

    info(message: string, ...args: unknown[]): void {
      if (isDevelopment) {
        // eslint-disable-next-line no-console
        console.log(message, ...args);
      }
    },

    debug(message: string, ...args: unknown[]): void {
      if (isDevelopment) {
        // eslint-disable-next-line no-console
        console.debug(message, ...args);
      }
    }
  };
}

/**
 * Silent logger for production or testing
 */
function createSilentLogger(): Logger {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    error(message: string, ...args: unknown[]): void {
      // Silent
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    warn(message: string, ...args: unknown[]): void {
      // Silent
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    info(message: string, ...args: unknown[]): void {
      // Silent
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    debug(message: string, ...args: unknown[]): void {
      // Silent
    }
  };
}

// Export default logger instance
const isTestEnvironment = process.env.NODE_ENV === 'test';
export const logger: Logger = isTestEnvironment ? createSilentLogger() : createConsoleLogger();

/**
 * Create a custom logger instance
 */
export function createLogger(customLogger?: Logger): Logger {
  return customLogger || logger;
}
