const config = require('../lib/config');
const nodeStatic = require('node-static');
const _ = require('lodash');
/* HACK: node-static bug - it can't handle string keys */
const fileServer = new nodeStatic.Server(config.get('uploadDir'), _.extend({}, config.get('nodeStatic')));

function utf8encode(str) {
  return decodeURI(encodeURIComponent(str));
}

/*eslint-disable */
fileServer.respond = function (pathname, status, _headers, files, stat, req, res, finish) {
  _headers['X-Content-Type-Options'] = 'nosniff';
  if (!_.find(config.get('imageTypes'), o => o === files[0].split('.').reverse()[0])) {
    _headers['Content-Type'] = 'application/octet-stream';
    _headers['Content-Disposition'] = `attachment; filename="${utf8encode(path.basename(files[0]))}"`;
  }
  nodeStatic.Server.prototype.respond.call(this, pathname, status, _headers, files, stat, req, res, finish);
};
/*eslint-enable */

module.exports = fileServer;
