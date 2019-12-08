// @flow
// @format
'use strict';

// NodeJS modules
const path = require('path');
const ofs = require('fs');
const os = require('os');
const util = require('util');

const fs = {
  readFileAsync: util.promisify(ofs.readFile),
  writeFileAsync: util.promisify(ofs.writeFile),
  ...ofs
};

// My modules
const { FTON } = require('my-utils');

// Some Flow types & whatnot
import type { FTONData } from 'my-utils';

const GetFilePath = (name: string): string => {
  return path.join(os.homedir(), '.config', `${name}.json`);
};

const Get = (name: string): ?FTONData => {
  const configFile = GetFilePath(name);
  try {
    const contents: string = fs.readFileSync(configFile, 'utf8');
    return FTON.parse(contents);
  } catch (e) { }
};

const GetAsync = async (name: string): Promise<?FTONData> => {
  const configFile = GetFilePath(name);
  try {
    const contents: string = await fs.readFileAsync(configFile, 'utf8');
    return FTON.parse(contents);
  } catch (e) { }
};

const Save = (name: string, data: FTONData): boolean => {
  const configFile = GetFilePath(name);
  try {
    fs.writeFileSync(configFile, JSON.stringify(data), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
};

const SaveAsync = async (name: string, data: FTONData): Promise<boolean> => {
  const configFile = GetFilePath(name);
  try {
    await fs.writeFileAsync(configFile, JSON.stringify(data), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
};

module.exports = { Get, GetAsync, Save, SaveAsync, GetFilePath };
