// @format
'use strict';

const path = require('path');

const os = require('os');

const ofs = require('fs');

const util = require('util');

const fsx = require('fs-extra');

const fs = {
  readFileAsync: util.promisify(ofs.readFile),
  writeFileAsync: util.promisify(ofs.writeFile),
  statAsync: util.promisify(ofs.stat),
  ...ofs
};

const size = file => {
  try {
    return fs.statSync(file).size;
  } catch (e) {
    return -1;
  }
};

const sizeAsync = async file => {
  try {
    return (await fs.statAsync(file)).size;
  } catch (e) {
    return -1;
  }
};

const toTextFile = (arr, fileName) => {
  const sep = path.sep === '/' ? '\n' : '\r\n';
  const str = arr.join(sep);
  fsx.writeFileSync(fileName, str);
};

const toTextFileAsync = async (arr, fileName) => {
  const sep = path.sep === '/' ? '\n' : '\r\n';
  const str = arr.join(sep);
  await fs.writeFileAsync(fileName, str);
};

const textFileToArray = fileName => {
  const contents = fsx.readFileSync(fileName, 'utf8');
  const resultArray = contents.split(/\n|\r/);
  return resultArray.filter(str => str.trim().length > 0);
};

const textFileToArrayAsync = async fileName => {
  const contents = await fs.readFileAsync(fileName, 'utf8');
  const resultArray = contents.split(/\n|\r/);
  return resultArray.filter(str => str.trim().length > 0);
};

module.exports = {
  size,
  sizeAsync,
  toTextFile,
  toTextFileAsync,
  arrayToTextFile: toTextFile,
  arrayToTextFileAsync: toTextFileAsync,
  textFileToArray,
  textFileToArrayAsync
};
//# sourceMappingURL=file.js.map