const fs = require('fs');

module.exports = (path) => {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) return reject(err);
      return resolve(stats);
    });
  });
};
