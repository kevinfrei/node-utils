import { MakeError, Type } from '@freik/core-utils';
import * as fs from 'fs';
import * as path from './path.js';

const fsp = fs.promises;

const err = MakeError('forFiles');

export async function ForFiles(
  seed: string | string[],
  func: (fileName: string) => Promise<boolean> | boolean,
  opts?: {
    recurse?: boolean;
    keepGoing?: boolean;
    fileTypes?: string[] | string;
  },
): Promise<boolean> {
  // Helper function to match the file types
  const recurse = opts && opts.recurse;
  const keepGoing = opts && opts.keepGoing;
  const fileTypes = opts && opts.fileTypes;
  const fileMatcher = fileTypes
    ? (str: string): boolean => {
        const uc = str.toLocaleUpperCase();
        if (Type.isString(fileTypes)) {
          return uc.endsWith(fileTypes.toLocaleUpperCase());
        }
        const fsfx = fileTypes.map((val) => val.toLocaleUpperCase());
        for (const ft of fsfx) {
          if (uc.endsWith(ft)) {
            return true;
          }
        }
        return false;
      }
    : (): boolean => true;

  const queue: string[] = Type.isString(seed) ? [seed] : seed;
  let overallResult = true;
  while (queue.length > 0) {
    const i = queue.pop();
    if (!i) {
      continue;
    }
    const st = await fsp.stat(i);
    if (st.isFile() && fileMatcher(i)) {
      let res = func(i);
      if (!Type.isBoolean(res)) {
        res = await res;
      }
      if (res !== true) {
        overallResult = false;
        if (!keepGoing) {
          return false;
        }
      }
    } else if (st.isDirectory()) {
      // For directories in the queue, we walk all their files
      let dirents: fs.Dirent[] | null = null;
      try {
        dirents = await fsp.readdir(i, { withFileTypes: true });
      } catch (e) {
        err(`Unable to read ${i || '<unknown>'}`);
        continue;
      }
      if (!dirents) {
        continue;
      }
      for (const dirent of dirents) {
        try {
          if (dirent.isSymbolicLink()) {
            const ap = await fsp.realpath(path.join(i, dirent.name));
            const lst = await fsp.stat(ap);
            if (lst.isDirectory() && recurse) {
              queue.push(ap);
            } else if (lst.isFile()) {
              queue.push(ap);
            }
          } else if (dirent.isDirectory() && recurse) {
            queue.push(path.join(i, dirent.name));
          } else if (dirent.isFile()) {
            queue.push(path.join(i, dirent.name));
          }
        } catch (e) {
          err('Unable to process dirent:');
          err(dirent);
          continue;
        }
      }
    }
  }
  return overallResult;
}

export function ForFilesSync(
  seed: string | string[],
  func: (fileName: string) => boolean,
  opts?: { recurse?: boolean; keepGoing?: boolean; fileTypes?: string[] },
): boolean {
  const recurse = opts && opts.recurse;
  const keepGoing = opts && opts.keepGoing;
  const fileTypes = opts && opts.fileTypes;
  const fileMatcher = fileTypes
    ? (str: string): boolean => {
        const uc = str.toLocaleUpperCase();
        if (Type.isString(fileTypes)) {
          return uc.endsWith(fileTypes.toLocaleUpperCase());
        }
        const fsfx = fileTypes.map((val) => val.toLocaleUpperCase());
        for (const ft of fsfx) {
          if (uc.endsWith(ft)) {
            return true;
          }
        }
        return false;
      }
    : (): boolean => true;
  const queue: string[] = Type.isString(seed) ? [seed] : seed;
  let overallResult = true;
  while (queue.length > 0) {
    const i = queue.pop();
    if (!i) {
      continue;
    }
    const st = fs.statSync(i);
    if (st.isFile() && fileMatcher(i)) {
      if (!func(i)) {
        overallResult = false;
        if (!keepGoing) {
          return false;
        }
      }
    } else if (st.isDirectory()) {
      // For directories in the queue, we walk all their files
      let dirents: fs.Dirent[] | null = null;
      try {
        dirents = fs.readdirSync(i, { withFileTypes: true });
      } catch (e) {
        err(`Unable to read ${i || '<unknown>'}`);
        continue;
      }
      if (!dirents) {
        continue;
      }
      for (const dirent of dirents) {
        try {
          if (dirent.isSymbolicLink()) {
            const ap = fs.realpathSync(path.join(i, dirent.name));
            const lst = fs.statSync(ap);
            if (lst.isDirectory() && recurse) {
              queue.push(ap);
            } else if (lst.isFile()) {
              queue.push(ap);
            }
          } else if (dirent.isDirectory() && recurse) {
            queue.push(path.join(i, dirent.name));
          } else if (dirent.isFile()) {
            queue.push(path.join(i, dirent.name));
          }
        } catch (e) {
          err('Unable to process dirent:');
          err(dirent);
          continue;
        }
      }
    }
  }
  return overallResult;
}
