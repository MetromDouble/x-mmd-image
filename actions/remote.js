const config = require('../lib/config');
const log = require('../lib/log')(module);
const fs = require('fs');
const https = require('https');
const http = require('http');
const mime = require('mime-types');
const _ = require('lodash');
const querystring = require('querystring');
const checkoutPath = require('../lib/checkoutPath');
const hashGenerator = require('../lib/hashGenerator');

const uploadDir = config.get('uploadDir');
const tmpDir = config.get('tmpDir');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const requester = querystring.unescape(url).split(':')[0] === 'https' ? https : http;

    requester.get(querystring.unescape(url), (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close((err) => {
          if (err) return reject(err);
          return resolve({
            path: file.path,
            mime: response.headers['content-type']
          });
        });
      });
    }).on('error', (err) => {
      fs.unlink(dest, log.error.bind(log, 'File deleted: %s\n', file.path));
      return reject(err);
    });
  });
}

module.exports = (req, res) => {
  const dir = req.params.dir;
  const url = req.body.src || req.query.src;
  const tmpHash = hashGenerator();

  if (!url) return res.send({ status: 'ERROR', error: 'Param `src` not exist' });

  return download(url, `${tmpDir}/${tmpHash}`)
    .then((file) => {
      return checkoutPath(`${uploadDir}/${dir}/${tmpHash}`)
        .then(() => {
          return Promise.resolve(file);
        });
    })
    .then((file) => {
      const ext = mime.extension(file.mime);

      if (ext && _.concat(config.get('acceptedFileTypes'), config.get('imageTypes'))
        .reduce((prev, curr) => prev || (curr === ext), false)) {
        fs.renameSync(file.path,
          `${uploadDir}/${dir}/${tmpHash}/x.${ext}`);
        fs.unlink(file.path, log.error.bind(log, 'File deleted: %s\n', file.path));
        return res.send({ status: 'OK', data: {
          path: dir,
          hash: tmpHash,
          ext,
          original: `/img/${dir}/${tmpHash}/x.${ext}`,
          acceptedFrames: config.get('acceptedFrames')[dir].map((o) => `${o.w}x${o.h}`)
        } });
      }
      fs.unlink(file.path, log.error.bind(log, 'File deleted: %s\n', file.path));

      return res.send({ status: 'ERROR', error: 'Something wrong with file rename' });
    })
    .catch(err => {
      log.error(`🖕 -> ${err.message}`);
      res.statusCode = 400; // eslint-disable-line
      return res.send({ status: 'ERROR', error: err.message });
    });
};
