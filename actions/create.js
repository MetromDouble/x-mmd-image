const config = require('../lib/config');
const log = require('../lib/log')(module);
const fs = require('fs');
const path = require('path');
const FileInfo = require('../lib/FileInfo');
const checkoutPath = require('../lib/checkoutPath');
const hashGenerator = require('../lib/hashGenerator');
const formidable = require('formidable');

function handleResult(req, res, result, redirect) {
  if (redirect) {
    res.writeHead(302, {
      'Location': redirect.replace(/%s/, encodeURIComponent(JSON.stringify(result)))
    });
    res.end();
  } else {
    if (req.headers.accept) {
      res.writeHead(200, {
        'Content-Type': req.headers.accept
        .indexOf('application/json') !== -1 ?
        'application/json' : 'text/plain'
      });
    } else {
      res.writeHead(200, {
        'Content-Type': 'application/json'
      });
    }
    res.end(JSON.stringify(result));
  }
}

module.exports = (req, res) => {
  const uploadDir = config.get('uploadDir');
  const tmpDir = config.get('tmpDir');
  const dir = req.params.dir;
  const form = new formidable.IncomingForm();
  const tmpFiles = [];
  const map = {};
  const files = [];
  let counter = 1;
  let redirect;

  function finish(err) {
    if (err) {
      log.error('Error uploading images: %s', err.message);
    }
    counter -= 1;
    if (!counter) {
      files.forEach(fileInfo => {
        fileInfo.initUrl(req);
      });
      handleResult(req, res, { files }, redirect);
    }
  }

  form.uploadDir = tmpDir;
  form
    .on('fileBegin', (name, file) => {
      tmpFiles.push(file.path);
      const fileInfo = new FileInfo(file, hashGenerator(), dir);

      map[path.basename(file.path)] = fileInfo;
      fileInfo.safeName();
      files.push(fileInfo);
    })
    .on('field', (name, value) => {
      if (name === 'redirect') {
        redirect = value;
      }
    })
    .on('file', (name, file) => {
      const fileInfo = map[path.basename(file.path)];

      fileInfo.size = file.size;
      if (!fileInfo.validate()) {
        fs.unlink(file.path);
        return;
      }
      checkoutPath(`${uploadDir}/${dir}/${fileInfo.hash}`)
        .then(() => {
          fs.renameSync(file.path,
            `${uploadDir}/${dir}/${fileInfo.hash}/x.${fileInfo.name.split('.').reverse()[0]}`);
        })
        .catch(err => {
          log.error('Path not exist: %s', err.message);
        });
    })
    .on('aborted', () => {
      tmpFiles.forEach(file => {
        fs.unlink(file);
      });
    })
    .on('progress', bytesReceived => {
      if (bytesReceived > config.get('maxPostSize')) {
        req.socket.destroy();
      }
    })
    .on('error', err => {
      log.error('Form load error: %s', err.message);
    })
    .on('end', finish).parse(req);
};
