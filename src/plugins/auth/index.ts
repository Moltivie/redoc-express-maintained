import { NextFunction, Request, Response } from 'express';
import { Plugin } from '../../types/plugin';

/**
 * Authentication plugin configuration options
 */
export interface AuthPluginOptions {
  /** Authentication type: 'basic' | 'bearer' | 'custom' */
  type?: 'basic' | 'bearer' | 'custom';
  /** Username for basic auth */
  username?: string;
  /** Password for basic auth */
  password?: string;
  /** Bearer token for bearer auth */
  token?: string;
  /** Custom authentication function */
  customAuth?: (req: Request) => boolean | Promise<boolean>;
  /** Realm for WWW-Authenticate header (default: 'ReDoc') */
  realm?: string;
  /** Enable authentication (default: true) */
  enabled?: boolean;
}

/**
 * Parse Basic Authentication header
 */
function parseBasicAuth(
  authHeader: string
): { username: string; password: string } | null {
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Basic') {
    return null;
  }

  try {
    const credentials = Buffer.from(parts[1], 'base64').toString('utf8');
    const [username, password] = credentials.split(':');
    return { username, password };
  } catch {
    return null;
  }
}

/**
 * Parse Bearer Authentication header
 */
function parseBearerAuth(authHeader: string): string | null {
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  return parts[1];
}

/**
 * Send 401 Unauthorized response
 */
function sendUnauthorized(res: Response, realm: string, type: string): void {
  res.setHeader('WWW-Authenticate', `${type} realm="${realm}"`);
  res.status(401).send('Unauthorized');
}

/**
 * Creates an authentication plugin for ReDoc
 * @param options - Authentication configuration options
 * @returns Authentication plugin
 */
export function authPlugin(options: AuthPluginOptions = {}): Plugin {
  const {
    type = 'basic',
    username = '',
    password = '',
    token = '',
    customAuth,
    realm = 'ReDoc',
    enabled = true
  } = options;

  return {
    name: 'auth',
    version: '1.0.0',
    description: 'Adds authentication to ReDoc documentation',
    hooks: {
      onRequest: (req: Request, res: Response, next: NextFunction): void => {
        if (!enabled) {
          next();
          return;
        }

        const authHeader = req.headers.authorization;

        // Custom authentication
        if (type === 'custom' && customAuth) {
          Promise.resolve(customAuth(req))
            .then((isAuthenticated) => {
              if (isAuthenticated) {
                next();
              } else {
                sendUnauthorized(res, realm, 'Custom');
              }
            })
            .catch(() => {
              sendUnauthorized(res, realm, 'Custom');
            });
          return;
        }

        // No auth header provided
        if (!authHeader) {
          sendUnauthorized(res, realm, type === 'basic' ? 'Basic' : 'Bearer');
          return;
        }

        // Basic authentication
        if (type === 'basic') {
          const credentials = parseBasicAuth(authHeader);
          if (
            credentials
            && credentials.username === username
            && credentials.password === password
          ) {
            next();
          } else {
            sendUnauthorized(res, realm, 'Basic');
          }
          return;
        }

        // Bearer authentication
        if (type === 'bearer') {
          const providedToken = parseBearerAuth(authHeader);
          if (providedToken === token) {
            next();
          } else {
            sendUnauthorized(res, realm, 'Bearer');
          }
          return;
        }

        // Unknown auth type
        sendUnauthorized(res, realm, 'Basic');
      }
    },
    config: {
      type,
      realm,
      enabled
    }
  };
}

export default authPlugin;
