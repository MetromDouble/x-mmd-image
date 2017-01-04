const dto = require('directory-to-object');

module.exports = (path) => {
  return new Promise((resolve, reject) => {
    dto(path, (err, data) => {
      if (err) return reject(err);
      return resolve(data);
    });
  });
};
