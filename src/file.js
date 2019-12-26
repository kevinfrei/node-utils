// @flow
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

const size = (file: string): number => {
  try {
    return fs.statSync(file).size;
  } catch (e) {
    return -1;
  }
};
const sizeAsync = async (file: string): Promise<number> => {
  try {
    return (await fs.statAsync(file)).size;
  } catch (e) {
    return -1;
  }
};

const toTextFile = (arr: Array<string>, fileName: string): void => {
  const sep: string = path.sep === '/' ? '\n' : '\r\n';
  const str: string = arr.join(sep);
  fsx.writeFileSync(fileName, str);
};

const toTextFileAsync = async (
  arr: Array<string>,
  fileName: string
): Promise<void> => {
  const sep: string = path.sep === '/' ? '\n' : '\r\n';
  const str: string = arr.join(sep);
  await fs.writeFileAsync(fileName, str);
};

const textFileToArray = (fileName: string): Array<string> => {
  const contents: string = fsx.readFileSync(fileName, 'utf8');
  const resultArray = contents.split(/\n|\r/);
  return resultArray.filter(str => str.trim().length > 0);
};

const textFileToArrayAsync = async (
  fileName: string
): Promise<Array<string>> => {
  const contents: string = await fs.readFileAsync(fileName, 'utf8');
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
