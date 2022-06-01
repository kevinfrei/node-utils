import { MakeError, MakeQueue, MakeStack, Type } from '@freik/core-utils';
import { isHiddenFile } from 'is-hidden-file';
import * as fs from 'fs';
import * as path from 'path';
import * as PathUtil from './PathUtil.js';

const fsp = fs.promises;

const err = MakeError('forFiles');

export type ForFilesOptions = {
  recurse: boolean | ((dirName: string) => boolean);
  keepGoing: boolean;
  fileTypes: string[] | string;
  order: 'breadth' | 'depth';
  skipHiddenFiles: boolean;
  skipHiddenFolders: boolean;
  dontAssumeDotsAreHidden: boolean;
  dontFollowSymlinks: boolean;
};

function isDotFile(filepath: string): boolean {
  const slashed = PathUtil.trailingSlash(filepath);
  const trimmed = slashed.substring(0, slashed.length - 1);
  let lastSplit = trimmed.lastIndexOf('/');
  /* istanbul ignore if */
  if (lastSplit < 0 && path.sep === '\\') {
    lastSplit = trimmed.lastIndexOf('\\');
  }
  return filepath[lastSplit < 0 ? 0 : lastSplit + 1] === '.';
}

function isHidden(
  file: string,
  skipHidden: boolean,
  hideDots: boolean,
): boolean {
  if (!skipHidden) {
    return false;
  }
  if (hideDots) {
    if (isDotFile(file)) {
      return true;
    }
  }
  return isHiddenFile(file);
}

function tru(dirName: string): boolean {
  return true;
}
function fal(dirName: string): boolean {
  return true;
}

function getRecurseFunc(
  opts?: Partial<ForFilesOptions>,
): (dirName: string) => boolean {
  if (Type.isUndefined(opts) || Type.isUndefined(opts.recurse)) {
    return tru;
  }
  if (Type.isBoolean(opts.recurse)) {
    return opts.recurse ? tru : fal;
  }
  return opts.recurse;
}

export async function ForFiles(
  seed: string | string[],
  func: (fileName: string) => Promise<boolean> | boolean,
  opts?: Partial<ForFilesOptions>,
): Promise<boolean> {
  // Helper function to match the file types
  const recurse = getRecurseFunc(opts);
  const keepGoing = opts && opts.keepGoing;
  const fileTypes = opts && opts.fileTypes;
  const depth = opts && opts.order === 'depth';
  const skipHiddenFiles = opts ? !!opts.skipHiddenFiles : true;
  const skipHiddenFolders = opts ? !!opts.skipHiddenFolders : true;
  const hideDots = opts ? !opts.dontAssumeDotsAreHidden : true;
  const followSymlinks = opts ? opts.dontFollowSymlinks : true;
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

  const theSeed = Type.isString(seed) ? [seed] : seed;
  const worklist = depth
    ? MakeStack<string>(...theSeed)
    : MakeQueue<string>(...theSeed);
  let overallResult = true;
  while (!worklist.empty()) {
    const i = worklist.pop();
    /* istanbul ignore if */
    if (!i) {
      continue;
    }
    const st = await fsp.stat(i);
    if (
      st.isFile() &&
      !isHidden(i, skipHiddenFiles, hideDots) &&
      fileMatcher(i)
    ) {
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
    } else if (st.isDirectory() && !isHidden(i, skipHiddenFolders, hideDots)) {
      // For directories in the queue, we walk all their files
      let dirents: fs.Dirent[] | null = null;
      try {
        dirents = await fsp.readdir(i, { withFileTypes: true });
      } catch (e) /* istanbul ignore next */ {
        err(`Unable to read ${i || '<unknown>'}`);
        continue;
      }
      /* istanbul ignore if */
      if (!dirents) {
        continue;
      }
      for (const dirent of dirents) {
        try {
          if (dirent.isSymbolicLink() && followSymlinks) {
            const ap = await fsp.realpath(PathUtil.join(i, dirent.name));
            const lst = await fsp.stat(ap);
            if (lst.isDirectory() || lst.isFile()) {
              if (!lst.isDirectory() || recurse(ap)) {
                worklist.push(ap);
              }
            }
          } else if (dirent.isDirectory() || dirent.isFile()) {
            const fullPath = PathUtil.join(i, dirent.name);
            if (!dirent.isDirectory() || recurse(fullPath)) {
              worklist.push(fullPath);
            }
          }
        } catch (e) /* istanbul ignore next */ {
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
  opts?: Partial<ForFilesOptions>,
): boolean {
  const recurse = opts && opts.recurse;
  const keepGoing = opts && opts.keepGoing;
  const fileTypes = opts && opts.fileTypes;
  const depth = opts && opts.order === 'depth';
  const skipHiddenFiles = opts ? !!opts.skipHiddenFiles : true;
  const skipHiddenFolders = opts ? !!opts.skipHiddenFolders : true;
  const hideDots = opts ? !opts.dontAssumeDotsAreHidden : true;
  const followSymlinks = opts ? opts.dontFollowSymlinks : true;
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
  const theSeed: string[] = Type.isString(seed) ? [seed] : seed;
  const worklist = depth
    ? MakeStack<string>(...theSeed)
    : MakeQueue<string>(...theSeed);
  let overallResult = true;
  while (!worklist.empty()) {
    const i = worklist.pop();
    /* istanbul ignore if */
    if (!i) {
      continue;
    }
    const st = fs.statSync(i);
    if (
      st.isFile() &&
      !isHidden(i, skipHiddenFiles, hideDots) &&
      fileMatcher(i)
    ) {
      if (!func(i)) {
        overallResult = false;
        if (!keepGoing) {
          return false;
        }
      }
    } else if (st.isDirectory() && !isHidden(i, skipHiddenFolders, hideDots)) {
      // For directories in the queue, we walk all their files
      let dirents: fs.Dirent[] | null = null;
      try {
        dirents = fs.readdirSync(i, { withFileTypes: true });
      } catch (e) /* istanbul ignore next */ {
        err(`Unable to read ${i || '<unknown>'}`);
        continue;
      }
      /* istanbul ignore if */
      if (!dirents) {
        continue;
      }
      for (const dirent of dirents) {
        try {
          if (dirent.isSymbolicLink() && followSymlinks) {
            const ap = fs.realpathSync(PathUtil.join(i, dirent.name));
            const lst = fs.statSync(ap);
            if ((lst.isDirectory() && recurse) || lst.isFile()) {
              worklist.push(ap);
            }
          } else if ((dirent.isDirectory() && recurse) || dirent.isFile()) {
            worklist.push(PathUtil.join(i, dirent.name));
          }
        } catch (e) /* istanbul ignore next */ {
          err('Unable to process dirent:');
          err(dirent);
          continue;
        }
      }
    }
  }
  return overallResult;
}
