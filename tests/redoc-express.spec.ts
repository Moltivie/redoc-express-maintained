import { redocHtml } from '../src/redoc-html-template';

test('should return redocHtml Template', async () => {
  const redocHtmlTemplate = `<!DOCTYPE html>
<html>
  <head>
    <title>ReDoc</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet" />
    <style>
      body {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <div id="redoc-container"></div>
    <script nonce='' src="https://unpkg.com/redoc@latest/bundles/redoc.standalone.js"> </script>
  </body>
  <script>
    Redoc.init(
      "http://petstore.swagger.io/v2/swagger.json",
      {},
      document.getElementById("redoc-container")
    );
  </script>
</html>`;

  expect(
    redocHtml({
      title: 'ReDoc',
      specUrl: 'http://petstore.swagger.io/v2/swagger.json'
    })
  ).toBe(redocHtmlTemplate);
});

test('should return redocHtml Template [nonce]', async () => {
  const redocHtmlTemplate = `<!DOCTYPE html>
<html>
  <head>
    <title>ReDoc</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet" />
    <style>
      body {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <div id="redoc-container"></div>
    <script nonce='rAnd0m' src="https://unpkg.com/redoc@latest/bundles/redoc.standalone.js"> </script>
  </body>
  <script>
    Redoc.init(
      "http://petstore.swagger.io/v2/swagger.json",
      {},
      document.getElementById("redoc-container")
    );
  </script>
</html>`;

  expect(
    redocHtml({
      title: 'ReDoc',
      specUrl: 'http://petstore.swagger.io/v2/swagger.json',
      nonce: 'rAnd0m'
    })
  ).toBe(redocHtmlTemplate);
});

test('should return redocHtml Template [redoc options]', async () => {
  const redocHtmlTemplate = `<!DOCTYPE html>
<html>
  <head>
    <title>ReDoc</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet" />
    <style>
      body {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <div id="redoc-container"></div>
    <script nonce='rAnd0m' src="https://unpkg.com/redoc@latest/bundles/redoc.standalone.js"> </script>
  </body>
  <script>
    Redoc.init(
      "http://petstore.swagger.io/v2/swagger.json",
      {"theme":{"colors":{"primary":{"main":"#6EC5AB"}},"typography":{"fontFamily":"\\"museo-sans\\", 'Helvetica Neue', Helvetica, Arial, sans-serif"}}},
      document.getElementById("redoc-container")
    );
  </script>
</html>`;

  expect(
    redocHtml({
      title: 'ReDoc',
      specUrl: 'http://petstore.swagger.io/v2/swagger.json',
      nonce: 'rAnd0m',
      redocOptions: {
        theme: {
          colors: {
            primary: {
              main: '#6EC5AB'
            }
          },
          typography: {
            fontFamily: `"museo-sans", 'Helvetica Neue', Helvetica, Arial, sans-serif`,
          }
        }
      }
    })
  ).toBe(redocHtmlTemplate);
});
