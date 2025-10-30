import { NextFunction, Request, Response } from 'express';
import { authPlugin } from '../../src/plugins/auth';

// Mock Express Request, Response, and NextFunction
const createMockRequest = (authHeader?: string, customHeaders?: Record<string, string>): Partial<Request> => ({
  headers: {
    authorization: authHeader,
    ...customHeaders
  } as Record<string, string | string[] | undefined>
});

const createMockResponse = (): Partial<Response> & {
  statusCode?: number;
  headers?: Record<string, string>;
  body?: string;
} => {
  const res: Partial<Response> & {
    statusCode?: number;
    headers?: Record<string, string>;
    body?: string;
  } = {
    statusCode: 200,
    headers: {},
    body: ''
  };

  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res as Response;
  }) as Response['status'];

  res.send = jest.fn((data: unknown) => {
    res.body = typeof data === 'string' ? data : JSON.stringify(data);
    return res as Response;
  }) as Response['send'];

  res.setHeader = jest.fn((name: string, value: string | number | string[]) => {
    res.headers = res.headers || {};
    res.headers[name] = String(value);
    return res as Response;
  }) as Response['setHeader'];

  return res;
};

const createMockNext = (): jest.Mock<NextFunction> => jest.fn() as jest.Mock<NextFunction>;

describe('Auth Plugin', () => {
  describe('Plugin Configuration', () => {
    it('should create an auth plugin with default options', () => {
      const plugin = authPlugin();

      expect(plugin.name).toBe('auth');
      expect(plugin.version).toBe('1.0.0');
      expect(plugin.description).toBe('Adds authentication to ReDoc documentation');
      expect(plugin.hooks.onRequest).toBeDefined();
      expect(plugin.config).toBeDefined();
    });

    it('should create plugin with custom realm', () => {
      const plugin = authPlugin({
        type: 'basic',
        username: 'admin',
        password: 'secret',
        realm: 'My Custom API'
      });

      expect(plugin.config?.realm).toBe('My Custom API');
    });

    it('should allow disabling authentication', () => {
      const plugin = authPlugin({ enabled: false });
      expect(plugin.config?.enabled).toBe(false);
    });
  });

  describe('Basic Authentication', () => {
    it('should allow valid basic auth credentials', () => {
      const plugin = authPlugin({
        type: 'basic',
        username: 'admin',
        password: 'secret123'
      });

      const req = createMockRequest('Basic YWRtaW46c2VjcmV0MTIz'); // admin:secret123
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject invalid basic auth credentials', () => {
      const plugin = authPlugin({
        type: 'basic',
        username: 'admin',
        password: 'secret123'
      });

      const req = createMockRequest('Basic aW52YWxpZDppbnZhbGlk'); // invalid:invalid
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith('Unauthorized');
      expect(res.setHeader).toHaveBeenCalledWith('WWW-Authenticate', 'Basic realm="ReDoc"');
    });

    it('should reject missing auth header for basic auth', () => {
      const plugin = authPlugin({
        type: 'basic',
        username: 'admin',
        password: 'secret123'
      });

      const req = createMockRequest(); // No auth header
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.setHeader).toHaveBeenCalledWith('WWW-Authenticate', 'Basic realm="ReDoc"');
    });

    it('should reject malformed basic auth header', () => {
      const plugin = authPlugin({
        type: 'basic',
        username: 'admin',
        password: 'secret123'
      });

      const req = createMockRequest('Basic not-valid-base64!!!');
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should use custom realm in WWW-Authenticate header', () => {
      const plugin = authPlugin({
        type: 'basic',
        username: 'admin',
        password: 'secret123',
        realm: 'My API Documentation'
      });

      const req = createMockRequest(); // No auth
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      expect(res.setHeader).toHaveBeenCalledWith('WWW-Authenticate', 'Basic realm="My API Documentation"');
    });
  });

  describe('Bearer Token Authentication', () => {
    it('should allow valid bearer token', () => {
      const plugin = authPlugin({
        type: 'bearer',
        token: 'my-secret-token-12345'
      });

      const req = createMockRequest('Bearer my-secret-token-12345');
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject invalid bearer token', () => {
      const plugin = authPlugin({
        type: 'bearer',
        token: 'my-secret-token-12345'
      });

      const req = createMockRequest('Bearer wrong-token');
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith('Unauthorized');
      expect(res.setHeader).toHaveBeenCalledWith('WWW-Authenticate', 'Bearer realm="ReDoc"');
    });

    it('should reject missing bearer token', () => {
      const plugin = authPlugin({
        type: 'bearer',
        token: 'my-secret-token-12345'
      });

      const req = createMockRequest(); // No auth header
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.setHeader).toHaveBeenCalledWith('WWW-Authenticate', 'Bearer realm="ReDoc"');
    });

    it('should reject malformed bearer token header', () => {
      const plugin = authPlugin({
        type: 'bearer',
        token: 'my-secret-token-12345'
      });

      const req = createMockRequest('Bearer'); // Missing token value
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should be case-sensitive for bearer token', () => {
      const plugin = authPlugin({
        type: 'bearer',
        token: 'CaseSensitiveToken'
      });

      const req = createMockRequest('Bearer casesensitivetoken');
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Custom Authentication', () => {
    it('should allow valid custom authentication (sync)', async () => {
      const customAuth = jest.fn((req: Request) => {
        const apiKey = req.headers['x-api-key'];
        return apiKey === 'valid-api-key';
      });

      const plugin = authPlugin({
        type: 'custom',
        customAuth
      });

      const req = createMockRequest(undefined, {
        'x-api-key': 'valid-api-key'
      });
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      // Wait for promise to resolve
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(customAuth).toHaveBeenCalledWith(req);
          expect(next).toHaveBeenCalled();
          expect(res.status).not.toHaveBeenCalled();
          resolve();
        }, 10);
      });
    });

    it('should reject invalid custom authentication (sync)', async () => {
      const customAuth = jest.fn((req: Request) => {
        const apiKey = req.headers['x-api-key'];
        return apiKey === 'valid-api-key';
      });

      const plugin = authPlugin({
        type: 'custom',
        customAuth
      });

      const req = createMockRequest(undefined, { 'x-api-key': 'invalid-key' });
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      // Wait for promise to resolve
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(customAuth).toHaveBeenCalledWith(req);
          expect(next).not.toHaveBeenCalled();
          expect(res.status).toHaveBeenCalledWith(401);
          expect(res.setHeader).toHaveBeenCalledWith('WWW-Authenticate', 'Custom realm="ReDoc"');
          resolve();
        }, 10);
      });
    });

    it('should allow valid custom authentication (async)', async () => {
      const customAuth = jest.fn(async (req: Request) => {
        // Simulate async operation (e.g., database lookup)
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 5);
        });
        const apiKey = req.headers['x-api-key'];
        return apiKey === 'valid-api-key';
      });

      const plugin = authPlugin({
        type: 'custom',
        customAuth
      });

      const req = createMockRequest(undefined, {
        'x-api-key': 'valid-api-key'
      });
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      // Wait for async auth to complete
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 20);
      });

      expect(customAuth).toHaveBeenCalledWith(req);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject invalid custom authentication (async)', async () => {
      const customAuth = jest.fn(async (req: Request) => {
        // Simulate async operation
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 5);
        });
        const apiKey = req.headers['x-api-key'];
        return apiKey === 'valid-api-key';
      });

      const plugin = authPlugin({
        type: 'custom',
        customAuth
      });

      const req = createMockRequest(undefined, { 'x-api-key': 'wrong-key' });
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      // Wait for async auth to complete
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 20);
      });

      expect(customAuth).toHaveBeenCalledWith(req);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle custom auth errors gracefully', async () => {
      const customAuth = jest.fn(async () => {
        throw new Error('Database connection failed');
      });

      const plugin = authPlugin({
        type: 'custom',
        customAuth
      });

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      // Wait for error handling
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 20);
      });

      expect(customAuth).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should support JWT validation in custom auth', async () => {
      // Mock JWT validation
      const customAuth = jest.fn(async (req: Request) => {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return false;

        // Simulate JWT verification
        if (token === 'valid.jwt.token') {
          // Mock decoded payload with role check
          return true; // User has 'admin' role
        }
        return false;
      });

      const plugin = authPlugin({
        type: 'custom',
        customAuth
      });

      const req = createMockRequest('Bearer valid.jwt.token');
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 20);
      });

      expect(customAuth).toHaveBeenCalledWith(req);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should support IP whitelist in custom auth', async () => {
      const allowedIPs = ['192.168.1.100', '10.0.0.5'];
      const customAuth = jest.fn((req: Request) => {
        const clientIP = (req as { ip?: string }).ip;
        return clientIP ? allowedIPs.includes(clientIP) : false;
      });

      const plugin = authPlugin({
        type: 'custom',
        customAuth
      });

      const req = {
        ...createMockRequest(),
        ip: '192.168.1.100'
      } as Request;
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req, res as Response, next);

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(next).toHaveBeenCalled();
          resolve();
        }, 10);
      });
    });
  });

  describe('Authentication Enabled/Disabled', () => {
    it('should bypass authentication when disabled', () => {
      const plugin = authPlugin({
        type: 'basic',
        username: 'admin',
        password: 'secret',
        enabled: false
      });

      const req = createMockRequest(); // No auth header
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should enforce authentication when enabled (default)', () => {
      const plugin = authPlugin({
        type: 'basic',
        username: 'admin',
        password: 'secret'
      });

      const req = createMockRequest(); // No auth header
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty username and password for basic auth', () => {
      const plugin = authPlugin({
        type: 'basic',
        username: '',
        password: ''
      });

      const req = createMockRequest('Basic Og=='); // Empty credentials (":") in base64
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle empty bearer token', () => {
      const plugin = authPlugin({
        type: 'bearer',
        token: 'non-empty-token'
      });

      const req = createMockRequest('Bearer ');
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle basic auth with special characters in password', () => {
      const plugin = authPlugin({
        type: 'basic',
        username: 'admin',
        password: 'p@ssw0rd!#$%'
      });

      // Base64 encode "admin:p@ssw0rd!#$%"
      const credentials = Buffer.from('admin:p@ssw0rd!#$%').toString('base64');
      const req = createMockRequest(`Basic ${credentials}`);
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle bearer token with special characters', () => {
      const specialToken = 'token-with-dashes_and_underscores.and.dots';
      const plugin = authPlugin({
        type: 'bearer',
        token: specialToken
      });

      const req = createMockRequest(`Bearer ${specialToken}`);
      const res = createMockResponse();
      const next = createMockNext();

      plugin.hooks.onRequest?.(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
