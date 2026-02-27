import { executeAfterRenderHooks, executeBeforeRenderHooks } from './hooks';
import { Plugin, RedocOptions } from './types/plugin';

export interface Ioption {
  title: string;
  specUrl: string;
  nonce?: string;
  redocOptions?: object;
  plugins?: Plugin[];
}

const html = `<!DOCTYPE html>
<html>
  <head>
    <title>[[title]]</title>
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
    <script nonce='[[nonce]]' src="https://unpkg.com/redoc@2.5.2/bundles/redoc.standalone.js"> </script>
  </body>
  <script>
    Redoc.init(
      "[[spec-url]]",
      [[options]],
      document.getElementById("redoc-container")
    );
  </script>
</html>`;

async function redocHtml(
  options: Ioption = {
    title: 'ReDoc',
    specUrl: 'http://petstore.swagger.io/v2/swagger.json'
  }
): Promise<string> {
  const { title, specUrl, nonce = '', redocOptions = {}, plugins = [] } = options;

  let renderedHtml = html
    .replace('[[title]]', title)
    .replace('[[spec-url]]', specUrl)
    .replace('[[nonce]]', nonce)
    .replace('[[options]]', JSON.stringify(redocOptions));

  // Execute beforeRender hooks
  if (plugins.length > 0) {
    renderedHtml = await executeBeforeRenderHooks(renderedHtml, options as RedocOptions, plugins);
  }

  // Execute afterRender hooks
  if (plugins.length > 0) {
    renderedHtml = await executeAfterRenderHooks(renderedHtml, plugins, options as RedocOptions);
  }

  return renderedHtml;
}

/**
 * Synchronous version for backward compatibility
 * @deprecated Use redocHtml (async version) instead
 */
function redocHtmlSync(
  options: Ioption = {
    title: 'ReDoc',
    specUrl: 'http://petstore.swagger.io/v2/swagger.json'
  }
): string {
  const { title, specUrl, nonce = '', redocOptions = {} } = options;
  return html
    .replace('[[title]]', title)
    .replace('[[spec-url]]', specUrl)
    .replace('[[nonce]]', nonce)
    .replace('[[options]]', JSON.stringify(redocOptions));
}

export { redocHtml, redocHtmlSync };
export default redocHtml;
