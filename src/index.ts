export * as FileUtil from './file';
export * as PathUtil from './path';
export * as ProcUtil from './process';
export * as OpenLocalBrowser from './OpenLocalBrowser';
export * as AppConfig from './AppConfig';
export * from './forFiles';
export * from './persist';
export * from './StringWatcher';
export * from './FileIndex';

export type SpawnResult = {
  output: string[]; // Array of results from stdio output.
  stdout: Buffer | string; // The contents of output[1].
  stderr: Buffer | string; // The contents of output[2].
  signal: string | null; // The signal that terminated the output
  status: number | null; // The exit code of the subprocess, or null if the subprocess terminated due to a signal.
  error?: unknown; // The error
};
