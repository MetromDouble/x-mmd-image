const config = require('./lib/config');
const log = require('./lib/log')(module);
const checkoutPath = require('./lib/checkoutPath.js');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

if (!config.get('port')) {
  log.error('App port is not set. Exiting...');
  process.exit(1);
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const dirPromises = [checkoutPath(config.get('uploadDir')), checkoutPath(config.get('tmpDir'))];

config.get('acceptedPaths').forEach((path) => {
  dirPromises.push(checkoutPath(`${config.get('uploadDir')}/${path}`));
});
Promise.all([checkoutPath(config.get('uploadDir')), checkoutPath(config.get('tmpDir'))])
  .catch((err) => {
    log.error('Cannot stat necessary directories: %s', err.message);
  });

app.use('/static', express.static(config.get('uploadDir')));
require('./lib/routes.js')(app);

app.use((req, res, next) => {
  res.status(404);
  log.debug('Not found URL: %s', req.url);
  res.send({ error: 'Not found' });
  return next;
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  console.log(err);
  log.error('Internal error(%d): %s', res.statusCode, err.message);
  res.send({ error: err.message });
  return next;
});

app.listen(config.get('port'), () => {
  console.log(`IMAGE server listening on port ${config.get('port')}`);
});
