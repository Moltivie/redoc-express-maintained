export interface Ioption {
  title: string;
  specUrl: string;
}

const html = `<!DOCTYPE html>
<html>
  <head>
    <title>[[title]]</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>
      body {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <redoc spec-url='[[spec-url]]'></redoc>
    <script src="https://unpkg.com/redoc@latest/bundles/redoc.standalone.js"> </script>
  </body>
</html>`;

function redocHtml(
  options: Ioption = {
    title: 'ReDoc',
    specUrl: 'http://petstore.swagger.io/v2/swagger.json'
  }
): string {
  const { title, specUrl } = options;
  return html.replace('[[title]]', title).replace('[[spec-url]]', specUrl);
}

export { redocHtml };
export default redocHtml;
