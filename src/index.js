// @flow
// @format

const FileUtil = require('./file');
const PathUtil = require('./path');
const ProcUtil = require('./process');
const OpenLocalBrowser = require('./OpenLocalBrowser');
const AppConfig = require('./AppConfig');

import type { FTONData, FTONObject } from 'my-utils';

export type spawnResult = {
  output: Array<string>,    // Array of results from stdio output.
  stdout: Buffer | string,  // The contents of output[1].
  stderr: Buffer | string,  // The contents of output[2].
  signal: string | null,    // The signal that terminated the output
  status: number | null,    // The exit code of the subprocess, or null if the subprocess terminated due to a signal.
  error?: Object            // The error
};

module.exports = {
  AppConfig,
  FileUtil,
  PathUtil,
  ProcUtil,
  OpenLocalBrowser
};
