# [redoc-express][redoc-express]

> Express Middleware for OpenAPI/Swagger-generated API Reference Documentation

[![Build Status][azure]][azure-url]
[![code style: prettier][prettier]][prettier-url]
[![npm][npm-download]][npm-dl-url]
[![contributions welcome][contri]][contri-url]
[![License: MIT][license]][license-url]

## Demo

- [Live Demo][live-demo-url]

## Install

```shell
npm install redoc-express
```

## Usage

```javascript
const express = require('express');
const redoc = require('redoc-express');

const app = express();
const port = 3000;

// serve your swagger.json file
app.get('/docs/swagger.json', (req, res) => {
  res.sendFile('swagger.json', { root: '.' });
});

// define title and specUrl location
// serve redoc
app.get(
  '/docs',
  redoc({
    title: 'API Docs',
    specUrl: '/docs/swagger.json'
  })
);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
```

## Development

### Install Dependencies

```shell
npm i
```

### Run Test

```shell
npm t
```

## Check ReDoc Project for more INFO

- [redoc][redoc-url]

## License

MIT © [Aung Myo Kyaw](https://github.com/AungMyoKyaw)

[redoc-express]: https://github.com/AungMyoKyaw/redoc-express
[contri]: https://img.shields.io/badge/contributions-welcome-brightgreen.svg
[contri-url]: https://github.com/AungMyoKyaw/redoc-express/issues
[azure]: https://dev.azure.com/AungMyoKyaw/redoc-express/_apis/build/status/redoc-express?branchName=master
[azure-url]: https://dev.azure.com/AungMyoKyaw/redoc-express/_build/latest?definitionId=4&branchName=master
[npm-download]: https://img.shields.io/npm/dt/redoc-express.svg
[npm-dl-url]: https://www.npmjs.com/package/redoc-express
[license]: https://img.shields.io/badge/License-MIT-brightgreen.svg
[license-url]: https://opensource.org/licenses/MIT
[prettier]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg
[prettier-url]: https://github.com/prettier/prettier
[redoc-url]: https://github.com/Redocly/redoc
[live-demo-url]: http://redocly.github.io/redoc/
