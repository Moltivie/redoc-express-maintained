import * as xss from 'xss';
import { escapeJsString, escapeScriptTagContent } from './escape';
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

  const safeTitle = xss.escapeHtml(title.replace(/&/g, '&amp;'));
  const safeSpecUrl = escapeScriptTagContent(escapeJsString(specUrl));
  const safeNonce = xss.escapeAttrValue(nonce.replace(/'/g, '&#39;'));
  const safeOptions = escapeScriptTagContent(JSON.stringify(redocOptions));

  let renderedHtml = html
    .replace('[[title]]', safeTitle)
    .replace('[[spec-url]]', safeSpecUrl)
    .replace('[[nonce]]', safeNonce)
    .replace('[[options]]', safeOptions);

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

  const safeTitle = xss.escapeHtml(title.replace(/&/g, '&amp;'));
  const safeSpecUrl = escapeScriptTagContent(escapeJsString(specUrl));
  const safeNonce = xss.escapeAttrValue(nonce.replace(/'/g, '&#39;'));
  const safeOptions = escapeScriptTagContent(JSON.stringify(redocOptions));

  return html
    .replace('[[title]]', safeTitle)
    .replace('[[spec-url]]', safeSpecUrl)
    .replace('[[nonce]]', safeNonce)
    .replace('[[options]]', safeOptions);
}

export { redocHtml, redocHtmlSync };
export default redocHtml;
