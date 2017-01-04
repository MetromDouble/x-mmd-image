const config = require('../lib/config');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const _existsSync = fs.existsSync || path.existsSync;
const nameCountRegexp = /(?:(?: \(([\d]+)\))?(\.[^.]+))?$/;
const mime = require('mime-types');

function nameCountFunc(s, index, ext) {
  return ` (${((parseInt(index, 10) || 0) + 1)})${(ext || '')}`;
}

class FileInfo {
  constructor(file, hash, mainPath) {
    this.extension = file.name ? file.name.split('.').reverse()[0] : mime.extension(file.type);
    this.name = file.name || `noname.${mime.extension(file.type)}`;
    this.size = file.size;
    this.type = file.type;
    this.mainPath = mainPath;
    this.hash = hash;
    const acceptedFrames = config.get('acceptedFrames')[mainPath];

    if (acceptedFrames) {
      this.acceptedFrames = acceptedFrames;
    }
  }
  initUrl() {
    if (!this.error) {
      const baseUrl = `/img/${this.mainPath}/${this.hash}/`;

      this.url = baseUrl + encodeURIComponent(`x.${this.extension}`);
    }
  }
  safeName() {
    // prevent directory traversal and creating system hidden files
    this.name = path.basename(this.name || 'default').replace(/^\.+/, '');
    while (_existsSync(`${config.get('uploadDir')}/${this.name || 'default'}`)) {
      this.name = this.name.replace(nameCountRegexp, nameCountFunc);
    }
  }
  validate() {
    if (config.get('minFileSize') && config.get('minFileSize') > this.size) {
      this.error = 'File is too small';
    }
    if (config.get('maxFileSize') && config.get('maxFileSize') < this.size) {
      this.error = 'File is too big';
    }
    if (!_.find(_.concat(config.get('imageTypes'), config.get('acceptedFileTypes'), [ mime.extension(this.type) ]),
      o => o === this.name.split('.').reverse()[0])) {
      this.error = 'File type wrong';
    }

    return !this.error;
  }
}

module.exports = FileInfo;
