# redoc-express-maintained

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License: MIT][license-src]][license-href]
[![Code Style: Prettier][prettier-src]][prettier-href]

> **Community-maintained Express middleware for serving OpenAPI/Swagger documentation using ReDoc.**

This is a maintained fork of `redoc-express`, ensuring compatibility with modern Node.js/Express environments and providing active support.

---

## 🚀 What's New in v2.1.0

We've completely overhauled the package with powerful new features:

- **Extensible Plugin System**: Hook into the lifecycle (`beforeRender`, `afterRender`, `onRequest`, `onError`) to customize behavior.
- **Built-in Plugins**: Ready-to-use plugins for **Authentication**, **Caching**, and **Metrics**.
- **Full TypeScript Support**: Full type definitions and a new named export `redocExpressMiddleware` for better ESM compatibility.
- **Improved Stability**: Locked ReDoc version to prevent unexpected breaking changes.

---

## Key Features

- **Drop-in Replacement**: Works exactly like the original, but better.
- **Zero Configuration**: Get started with just one line of code.
- **Highly Customizable**: Configure ReDoc themes, options, and UI.
- **Production Ready**: Built-in caching and error handling.
- **Type Safe**: Written in TypeScript with comprehensive type definitions.

## Installation

```bash
npm install redoc-express-maintained
```

## Usage

### Basic Usage (CommonJS)

```javascript
const express = require('express');
const redoc = require('redoc-express-maintained');

const app = express();

// Serve your Swagger/OpenAPI spec
app.get('/docs/swagger.json', (req, res) => {
  res.sendFile('swagger.json', { root: '.' });
});

// Serve ReDoc
app.get(
  '/docs',
  redoc({
    title: 'API Documentation',
    specUrl: '/docs/swagger.json'
  })
);

app.listen(3000);
```

### Usage with TypeScript / ESM

**Recommended for v2+**: Use the named export for better type inference.

```typescript
import express, { Express } from 'express';
import {
  redocExpressMiddleware,
  type RedocExpressOptions
} from 'redoc-express-maintained';

const app: Express = express();

const options: RedocExpressOptions = {
  title: 'API Documentation',
  specUrl: '/docs/swagger.json'
};

app.get('/docs', redocExpressMiddleware(options));

app.listen(3000);
```

## Plugin System

Extend functionality without modifying the core. v2.0 introduces a powerful plugin architecture. Plugins are configured **only** via the `plugins` option when creating the middleware—pass an array of plugin instances to enable them for that route.

### Using Built-in Plugins

```javascript
const { authPlugin, cachePlugin } = require('redoc-express-maintained');

app.get(
  '/docs',
  redoc({
    title: 'API Documentation',
    specUrl: '/docs/swagger.json',
    plugins: [
      // Protect docs with Basic Auth
      authPlugin({
        type: 'basic',
        users: { admin: 'password123' }
      }),
      // Cache rendered HTML for 1 hour
      cachePlugin({
        ttl: 3600
      })
    ]
  })
);
```

### Available Built-in Plugins

| Plugin      | Description                                                     |
| ----------- | --------------------------------------------------------------- |
| **Auth**    | Protect your docs with Basic, Bearer, or Custom authentication. |
| **Cache**   | Cache rendered HTML to improve performance.                     |
| **Metrics** | Track documentation usage and performance.                      |

### Creating Custom Plugins

You can easily create your own plugins to inject scripts, modify HTML, or add logging.

```typescript
import { createPlugin } from 'redoc-express-maintained';

const analyticsPlugin = createPlugin({
  name: 'analytics',
  hooks: {
    afterRender: (html) => {
      // Inject Google Analytics script
      return html.replace('</body>', '<script>/* GA Code */</script></body>');
    }
  }
});
```

👉 **[Read the full Plugin Documentation on our Wiki](https://github.com/Moltivie/redoc-express-maintained/wiki)**

### Error handling

Plugins can define an `onError` hook to log, report, or customize error responses. Because Express error handlers run only when you pass an error to `next()`, you must attach the error middleware **after** the ReDoc route. Use the same `plugins` array you pass to the middleware:

```javascript
const {
  redocExpressMiddleware,
  createOnErrorMiddleware
} = require('redoc-express-maintained');

const plugins = [
  /* your plugins */
];

app.get(
  '/docs',
  redocExpressMiddleware({ title: 'API Docs', specUrl: '/spec.json', plugins })
);
app.use(createOnErrorMiddleware(plugins)); // must come after the ReDoc route
```

In TypeScript/ESM, import `createOnErrorMiddleware` from the package and add `app.use(createOnErrorMiddleware(plugins))` after your ReDoc route so `onError` hooks run when the route calls `next(error)`.

## Configuration Options

| Option         | Type       | Description                                                                                             |
| -------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `title`        | `string`   | Page title (required).                                                                                  |
| `specUrl`      | `string`   | URL to your OpenAPI spec (required).                                                                    |
| `nonce`        | `string`   | Content Security Policy nonce.                                                                          |
| `redocOptions` | `object`   | [ReDoc configuration object](https://redocly.com/docs/api-reference-docs/configuration/functionality/). |
| `plugins`      | `Plugin[]` | Array of plugins to apply.                                                                              |

## Contributing

Contributions are welcome! Please see our [Contributing Guide](https://github.com/Moltivie/redoc-express-maintained/blob/main/CONTRIBUTING.md).

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

[npm-version-src]: https://img.shields.io/npm/v/redoc-express-maintained?style=flat-square
[npm-version-href]: https://npmjs.com/package/redoc-express-maintained
[npm-downloads-src]: https://img.shields.io/npm/dm/redoc-express-maintained?style=flat-square
[npm-downloads-href]: https://npmjs.com/package/redoc-express-maintained
[license-src]: https://img.shields.io/badge/license-MIT-blue?style=flat-square
[license-href]: LICENSE
[prettier-src]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[prettier-href]: https://github.com/prettier/prettier
