import type { SpawnResult } from './public-defs.js';
import cp from 'child_process';

export async function spawnAsync(
  command: string,
  args?: string[],
  options?:
    | cp.SpawnOptionsWithStdioTuple<'pipe', 'pipe', 'pipe'>
    | cp.SpawnOptionsWithoutStdio
    | cp.SpawnSyncOptions,
): Promise<SpawnResult> {
  const res: Promise<SpawnResult> = new Promise((resolve, reject) => {
    const sr: SpawnResult = {
      output: [],
      stdout: '',
      stderr: '',
      signal: null,
      status: null,
    };
    const child = args
      ? cp.spawn(command, args, options as cp.SpawnSyncOptions)
      : cp.spawn(command, options as cp.SpawnSyncOptions);
    /* istanbul ignore if */
    if (!child.stdout) {
      return { error: 'no stdout' };
    }
    child.stdout.on('data', (data: Buffer | string) => {
      // 'close', 'end'
      sr.stdout = sr.stdout.toString() + data.toString();
    });
    /* istanbul ignore if */
    if (!child.stderr) {
      return { error: 'no stderr' };
    }
    child.stderr.on('data', (data: Buffer | string) => {
      // 'close', 'end'
      sr.stderr = sr.stderr.toString() + data.toString();
    });
    child.on('close', (code: number, signal: string | null) => {
      if (signal) {
        /* istanbul ignore next */
        reject(signal);
      } else {
        sr.status = code;
        sr.signal = signal;
        sr.output = ['', sr.stdout.toString(), sr.stderr.toString()];
        resolve(sr);
      }
    });
    child.on('error', (err: any) => {
      /* istanbul ignore next */
      reject(err);
    });
  });
  return res;
}

// Process spawning stuff
export function spawnRes(
  command: string,
  args?: string[],
  options?: cp.SpawnSyncOptions,
): boolean {
  if (!args) {
    args = [];
  }
  let opts = options;
  if (!opts) {
    opts = { cwd: process.cwd() };
  } else if (!opts.cwd) {
    opts.cwd = process.cwd();
  }
  const spRes = args
    ? cp.spawnSync(command, args, opts)
    : cp.spawnSync(command, opts);
  if (!spRes.error && !spRes.status) {
    // && !spRes.stderr.toString()) {
    return true;
  }
  // console.log("stderr:");
  // console.log(spRes.stderr.toString());
  // console.log(`Error from spRes ${command}: ${spRes.error}`);
  return false;
}

// Process spawning stuff
export async function spawnResAsync(
  command: string,
  args?: string[],
  options?:
    | cp.SpawnOptionsWithStdioTuple<'pipe', 'pipe', 'pipe'>
    | cp.SpawnOptionsWithoutStdio
    | cp.SpawnSyncOptions,
): Promise<boolean> {
  if (!args) {
    args = [];
  }
  let opts = options;
  if (!opts) {
    opts = { cwd: process.cwd(), stdio: ['pipe', 'pipe', 'pipe'] };
  } else if (!opts.cwd) {
    opts.cwd = process.cwd();
  }
  const spRes = await spawnAsync(command, args, options);
  if (!spRes.error && !spRes.status) {
    // && !spRes.stderr.toString()) {
    return true;
  }
  // console.log("stderr:");
  // console.log(spRes.stderr.toString());
  // console.log(`Error from spRes ${command}: ${spRes.error}`);
  return false;
}
