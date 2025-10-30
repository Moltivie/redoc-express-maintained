# redoc-express-maintained

Express middleware for serving OpenAPI/Swagger documentation using ReDoc.

[![npm][npm-download]][npm-dl-url]
[![License: MIT][license]][license-url]
[![code style: prettier][prettier]][prettier-url]

## About

This is a community-maintained fork of [redoc-express](https://github.com/AungMyoKyaw/redoc-express) by Aung Myo Kyaw. This version addresses compatibility issues and provides ongoing maintenance for modern Node.js and Express environments.

**ReDoc Version:** 2.5.2 (locked for stability - new versions released after testing)

Key improvements:

- ReDoc version locked to prevent unexpected breaking changes
- Maintained compatibility with current Node.js and Express versions
- Active issue resolution and community support
- Tested releases when upgrading ReDoc versions
- **NEW:** Extensible plugin system with built-in auth, cache, and metrics plugins

## Install

```shell
npm install redoc-express-maintained
```

## Usage

### Basic Usage

```javascript
const express = require('express');
const redoc = require('redoc-express-maintained');

const app = express();

app.get('/docs/swagger.json', (req, res) => {
  res.sendFile('swagger.json', { root: '.' });
});

app.get(
  '/docs',
  redoc({
    title: 'API Documentation',
    specUrl: '/docs/swagger.json'
  })
);

app.listen(3000);
```

### Advanced Configuration

```javascript
app.get(
  '/docs',
  redoc({
    title: 'API Documentation',
    specUrl: '/docs/swagger.json',
    nonce: '', // Optional CSP nonce
    redocOptions: {
      theme: {
        colors: {
          primary: {
            main: '#6EC5AB'
          }
        },
        typography: {
          fontFamily:
            '"museo-sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
          fontSize: '15px',
          lineHeight: '1.5',
          code: {
            code: '#87E8C7',
            backgroundColor: '#4D4D4E'
          }
        },
        menu: {
          backgroundColor: '#ffffff'
        }
      }
    }
  })
);
```

For more configuration options, see the [ReDoc documentation](https://redocly.com/docs/api-reference-docs/configuration/functionality/).

### Plugin System

**NEW in v2.x:** `redoc-express-maintained` now includes a powerful plugin system to extend functionality!

#### Built-in Plugins

**Authentication Plugin**

```javascript
const { authPlugin } = require('redoc-express-maintained');

app.get(
  '/docs',
  redoc({
    title: 'API Documentation',
    specUrl: '/docs/swagger.json',
    plugins: [
      authPlugin({
        type: 'bearer',
        token: 'your-secret-token-here'
      })
    ]
  })
);
```

**Cache Plugin**

```javascript
const { cachePlugin } = require('redoc-express-maintained');

app.get(
  '/docs',
  redoc({
    title: 'API Documentation',
    specUrl: '/docs/swagger.json',
    plugins: [
      cachePlugin({
        ttl: 3600, // 1 hour
        maxSize: 100
      })
    ]
  })
);
```

**Metrics Plugin**

```javascript
const { metricsPlugin } = require('redoc-express-maintained');

app.get(
  '/docs',
  redoc({
    title: 'API Documentation',
    specUrl: '/docs/swagger.json',
    plugins: [
      metricsPlugin({
        endpoint: '/docs/metrics',
        enablePrometheus: true
      })
    ]
  })
);
```

#### Creating Custom Plugins

```javascript
const { createPlugin } = require('redoc-express-maintained');

const myPlugin = createPlugin({
  name: 'my-custom-plugin',
  version: '1.0.0',
  hooks: {
    onRequest: (req, res, next) => {
      // Custom logic before rendering
      next();
    },
    afterRender: (html) => {
      // Modify the HTML output
      return html;
    }
  }
});

app.get(
  '/docs',
  redoc({
    title: 'API Documentation',
    specUrl: '/docs/swagger.json',
    plugins: [myPlugin]
  })
);
```

**For comprehensive plugin documentation, examples, and advanced usage, visit our [Wiki](https://github.com/Moltivie/redoc-express-maintained/wiki)!**

## Development

Install dependencies:

```shell
npm install
```

Run tests:

```shell
npm test
```

Build:

```shell
npm run build
```

## Resources

- [Wiki & Documentation](https://github.com/Moltivie/redoc-express-maintained/wiki) - Complete guides, examples, and API reference
- [ReDoc Project](https://github.com/Redocly/redoc)
- [ReDoc Demo](http://redocly.github.io/redoc/)
- [Original Repository](https://github.com/AungMyoKyaw/redoc-express)

## Contributing

Contributions are welcome. Please open an issue or submit a pull request on [GitHub](https://github.com/Moltivie/redoc-express-maintained).

## License

MIT - See [LICENSE](LICENSE) file for details.

Original work by [Aung Myo Kyaw](https://github.com/AungMyoKyaw)

[npm-download]: https://img.shields.io/npm/dt/redoc-express-maintained.svg?style=flat-square
[npm-dl-url]: https://www.npmjs.com/package/redoc-express-maintained
[license]: https://img.shields.io/badge/License-MIT-brightgreen.svg?style=flat-square
[license-url]: https://opensource.org/licenses/MIT
[prettier]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[prettier-url]: https://github.com/prettier/prettier
