import { Pickle, Unpickle } from '@freik/core-utils';
import ofs from 'fs';
import os from 'os';
import path from 'path';

const fs = {
  readFileAsync: ofs.promises.readFile,
  writeFileAsync: ofs.promises.writeFile,
  readFileSync: ofs.readFileSync,
  writeFileSync: ofs.writeFileSync,
};

export function GetFilePath(name: string): string {
  return path.join(os.homedir(), '.config', `${name}.json`);
}

export function Get(name: string): unknown | void {
  const configFile = GetFilePath(name);
  try {
    const contents: string = fs.readFileSync(configFile, 'utf8');
    return Unpickle(contents);
  } catch (e) {
    return;
  }
}

export async function GetAsync(name: string): Promise<unknown | void> {
  const configFile = GetFilePath(name);
  try {
    const contents: string = await fs.readFileAsync(configFile, 'utf8');
    return Unpickle(contents);
  } catch (e) {
    return;
  }
}

export function Save(name: string, data: unknown): boolean {
  const configFile = GetFilePath(name);
  try {
    fs.writeFileSync(configFile, Pickle(data), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

export async function SaveAsync(name: string, data: unknown): Promise<boolean> {
  const configFile = GetFilePath(name);
  try {
    await fs.writeFileAsync(configFile, Pickle(data), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

export {
  Get as GetSync,
  Get as Read,
  Get as ReadSync,
  Get as Load,
  Get as LoadSync,
  GetAsync as ReadAsync,
  GetAsync as LoadAsync,
  Save as SaveSync,
  Save as Set,
  Save as SetSync,
  Save as Write,
  Save as WriteSync,
  SaveAsync as SetAsync,
  SaveAsync as WriteAsync,
};
