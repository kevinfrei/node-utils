import * as FileUtil from './file';
import * as PathUtil from './path';
import * as ProcUtil from './process';
import * as OpenLocalBrowser from './OpenLocalBrowser';
import * as AppConfig from './AppConfig';
import { ForFiles, ForFilesSync } from './forFiles';

export type SpawnResult = {
  output: string[]; // Array of results from stdio output.
  stdout: Buffer | string; // The contents of output[1].
  stderr: Buffer | string; // The contents of output[2].
  signal: string | null; // The signal that terminated the output
  status: number | null; // The exit code of the subprocess, or null if the subprocess terminated due to a signal.
  error?: unknown; // The error
};

export {
  AppConfig,
  FileUtil,
  PathUtil,
  ProcUtil,
  OpenLocalBrowser,
  ForFiles,
  ForFilesSync,
};
