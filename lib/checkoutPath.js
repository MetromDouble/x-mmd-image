const fs = require('fs');
const mkpath = require('mkpath');

function statPromise(path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) return reject(err);
      return resolve(stats);
    });
  });
}

function mkpathPromise(path) {
  return new Promise((resolve, reject) => {
    mkpath(path, (err) => {
      if (err) return reject(err);
      return resolve();
    });
  });
}

module.exports = (path) => {
  return statPromise(path)
    .then(() => {
      return Promise.resolve();
    })
    .catch((err) => {
      console.log(err.message);
      return mkpathPromise(path);
    });
};
