const nconf = require('nconf');
const path = require('path');

nconf.argv({
  f: {
    alias: 'file',
    demand: true,
    describe: 'Config file',
    type: 'string'
  }
}).env();
if (!nconf.get('file')) {
  console.log('Usage: node index.js -f <config-path>');
  process.exit(1);
}
nconf.file({ file: path.resolve(__dirname, nconf.get('file')) });

module.exports = nconf;
