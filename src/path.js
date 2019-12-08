// @flow
'use strict';

const path = require('path');
const os = require('os');

const getTemp = (name: string, ext: string): string => {
  return path.join(os.tmpdir(), name + '-tmp-' + process.pid + '.' + ext);
};

const getExtNoDot = (fileName: string): string => {
  const ext: string = path.extname(fileName);
  if (!ext) return ext;
  return ext.substr(1);
};

const changeExt = (fileName: string, newExt: string): string => {
  const ext: string = getExtNoDot(fileName);
  if (newExt && newExt.length > 1 && newExt[0] === '.') {
    newExt = newExt.substr(1);
  }
  return fileName.substr(0, fileName.length - ext.length) + newExt;
};

module.exports = { getTemp, getExtNoDot, changeExt };
