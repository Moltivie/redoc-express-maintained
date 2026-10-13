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

/**
 * Pinned ReDoc release served from the CDN.
 * Single source of truth - bump here only, tests and CI read it from this constant.
 */
export const REDOC_VERSION = '2.5.4';

const REDOC_CDN_URL = `https://unpkg.com/redoc@${REDOC_VERSION}/bundles/redoc.standalone.js`;

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
    <script nonce='[[nonce]]' src="${REDOC_CDN_URL}"> </script>
  </body>
  <script nonce='[[nonce]]'>
    Redoc.init(
      "[[spec-url]]",
      [[options]],
      document.getElementById("redoc-container")
    );
  </script>
</html>`;

/**
 * Fills every placeholder in a single pass. A replacer function is used so
 * `$&`, `$'` etc. in values are inserted literally, and substituted values are
 * never rescanned, so a title containing `[[spec-url]]` stays text.
 */
function renderTemplate(
  title: string,
  specUrl: string,
  nonce: string,
  redocOptions: object
): string {
  const values: Record<string, string> = {
    title: xss.escapeHtml(title.replace(/&/g, '&amp;')),
    'spec-url': escapeScriptTagContent(escapeJsString(specUrl)),
    nonce: xss.escapeAttrValue(nonce.replace(/'/g, '&#39;')),
    options: escapeScriptTagContent(JSON.stringify(redocOptions))
  };

  return html.replace(
    /\[\[(title|spec-url|nonce|options)\]\]/g,
    (_, key: string) => values[key]
  );
}

async function redocHtml(
  options: Ioption = {
    title: 'ReDoc',
    specUrl: 'http://petstore.swagger.io/v2/swagger.json'
  }
): Promise<string> {
  const {
    title,
    specUrl,
    nonce = '',
    redocOptions = {},
    plugins = []
  } = options;

  let renderedHtml = renderTemplate(title, specUrl, nonce, redocOptions);

  // Execute beforeRender hooks
  if (plugins.length > 0) {
    renderedHtml = await executeBeforeRenderHooks(
      renderedHtml,
      options as RedocOptions,
      plugins
    );
  }

  // Execute afterRender hooks
  if (plugins.length > 0) {
    renderedHtml = await executeAfterRenderHooks(
      renderedHtml,
      plugins,
      options as RedocOptions
    );
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

  return renderTemplate(title, specUrl, nonce, redocOptions);
}

export { redocHtml, redocHtmlSync };
export default redocHtml;
