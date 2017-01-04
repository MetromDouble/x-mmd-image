const config = require('../lib/config');
const log = require('../lib/log')(module);
const dto = require('../lib/dto');
const path = require('path');

const uploadDir = config.get('uploadDir');

module.exports = (req, res) => {
  dto(path.resolve(uploadDir))
    .then((json) => {
      return res.send({ status: 'OK', data: json });
    })
    .catch(err => {
      log.error(`🖕 -> ${err.message}`);
      res.statusCode = 400; // eslint-disable-line
      return res.send({ status: 'ERROR', error: err.message });
    });
};
