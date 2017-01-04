const config = require('../lib/config');
const log = require('../lib/log')(module);
const fs = require('fs');
const fileServer = require('../lib/fileServer.js');
const resize = require('../lib/resize.js');
const _ = require('lodash');
const readdirPromise = require('../lib/readDir');
const statPromise = require('../lib/stat');

const uploadDir = config.get('uploadDir');

module.exports = (req, res) => {
  const dir = req.params.dir;
  const id = req.params.id;
  const name = req.params.name;

  if (
    _.find(config.get('acceptedPaths'), o => dir === o)
    && (name.split('.')[0] === 'x' || /^\d{1,4}x\d{1,4}$/g.test(name.split('.')[0]))
  ) {
    statPromise(`${uploadDir}/${dir}/${id}`)
      .then((stats) => {
        if (stats.isDirectory()) {
          return readdirPromise(`${uploadDir}/${dir}/${id}`);
        }
        return Promise.reject(new Error('Directory doesn`t exists'));
      })
      .then((list) => {
        let stats;

        for (let i = 0; i < list.length; i++) {
          if (list[i] === name) {
            stats = fs.statSync(`${uploadDir}/${dir}/${id}/${name}`);
            if (stats.isFile()) {
              return Promise.resolve();
            }
          }
        }

        const [fileName, fileExt] = name.split('.');

        for (let i = 0; i < list.length; i++) {
          stats = fs.statSync(`${uploadDir}/${dir}/${id}/x.${fileExt}`);
          if (stats.isFile()) {
            return resize(`${uploadDir}/${dir}/${id}/x.${fileExt}`,
              `${uploadDir}/${dir}/${id}/${name}`, fileName, dir);
          }
        }
        return Promise.reject();
      })
      .then(fileServer.serve.bind(fileServer, req, res))
      .catch(err => {
        log.error(`🖕 -> ${err.message}`);
        res.statusCode = 400; // eslint-disable-line
        return res.send({ status: 'ERROR', error: err.message });
      });
  } else {
    res.statusCode = 500;
    return res.send({ status: 'ERROR', error: 'Internal server error' });
  }
};
