import { redocHtml, Ioption } from './redoc-html-template';

function redocExpressMiddleware(
  options: Ioption = {
    title: 'ReDoc',
    specUrl: 'http://petstore.swagger.io/v2/swagger.json'
  }
): any {
  return function middleware(req: any, res: any): void {
    res.type('html');
    res.send(redocHtml(options));
  };
}

export default redocExpressMiddleware;

module.exports = redocExpressMiddleware;
module.exports.default = redocExpressMiddleware;
