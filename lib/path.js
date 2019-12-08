'use strict';

const path = require('path');

const os = require('os');

const getTemp = (name, ext) => {
  return path.join(os.tmpdir(), name + '-tmp-' + process.pid + '.' + ext);
};

const getExtNoDot = fileName => {
  const ext = path.extname(fileName);
  if (!ext) return ext;
  return ext.substr(1);
};

const changeExt = (fileName, newExt) => {
  const ext = getExtNoDot(fileName);

  if (newExt && newExt.length > 1 && newExt[0] === '.') {
    newExt = newExt.substr(1);
  }

  return fileName.substr(0, fileName.length - ext.length) + newExt;
};

module.exports = {
  getTemp,
  getExtNoDot,
  changeExt
};
//# sourceMappingURL=path.js.map