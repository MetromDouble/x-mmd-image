const fs = require('fs');

module.exports = (path) => {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, list) => {
      if (err) return reject(err);
      return resolve(list);
    });
  });
};
