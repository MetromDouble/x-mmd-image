const config = require('../lib/config');
const gm = require('gm');
const _ = require('lodash');

module.exports = (pathIn, pathOut, size, collectionKey) => {
  const splittedStr = size.split('x');
  const w = splittedStr[0];
  const h = splittedStr[1];

  if (!_.find(config.get('acceptedFrames')[collectionKey], frame => {
    return Number(frame.w) === Number(w) && Number(frame.h) === Number(h);
  })) {
    return Promise.reject(new Error('Invalid frame size or mismatch filename'));
  }

  return new Promise((resolve, reject) => {
    gm(pathIn)
      .resize(w > h ? w : null, w <= h ? h : null)
      .crop(w, h, 0, 0)
      .write(pathOut, (err) => {
        console.log(err);
        if (err) return reject(err);
        return resolve();
      });
  });
};
