import { MakeError, MakeQueue, MakeStack, Type } from '@freik/core-utils';
import { isHiddenFile } from '@freik/is-hidden-file';
import { promises as fsp } from 'fs';
import * as fs from 'fs';
import * as path from 'path';
import * as PathUtil from './PathUtil.js';

// const fsp = fs.promises;

const err = MakeError('forFiles');

export type ForDirsOptions = {
  keepGoing: boolean;
  order: 'breadth' | 'depth';
  skipHiddenFolders: boolean;
  dontAssumeDotsAreHidden: boolean;
  dontFollowSymlinks: boolean;
  recurse: boolean | ((dirName: string) => Promise<boolean> | boolean);
};

export type ForFilesCommonOptions = {
  keepGoing: boolean;
  fileTypes: string[] | string;
  order: 'breadth' | 'depth';
  skipHiddenFiles: boolean;
  skipHiddenFolders: boolean;
  dontAssumeDotsAreHidden: boolean;
  dontFollowSymlinks: boolean;
};

export type ForFilesSyncOptions = {
  recurse: boolean | ((dirName: string) => boolean);
} & ForFilesCommonOptions;

export type ForFilesOptions = {
  recurse: boolean | ((dirName: string) => Promise<boolean> | boolean);
} & ForFilesCommonOptions;

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function tru(dirName: string): boolean {
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fal(dirName: string): boolean {
  return false;
}

function getRecurseFunc(
  opts?: Partial<ForFilesOptions> | Partial<ForDirsOptions>,
): (dirName: string) => Promise<boolean> | boolean {
  if (Type.isUndefined(opts) || Type.isUndefined(opts.recurse)) {
    return tru;
  }
  if (Type.isBoolean(opts.recurse)) {
    return opts.recurse ? tru : fal;
  }
  return opts.recurse;
}

async function callMaybeFunc(
  func: (param: string) => Promise<boolean> | boolean,
  val: string,
): Promise<boolean> {
  const res = func(val);
  return Type.isBoolean(res) ? res : await res;
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
      if ((await callMaybeFunc(func, i)) !== true) {
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
            if (lst.isFile()) {
              worklist.push(ap);
            } else if (lst.isDirectory()) {
              if (await callMaybeFunc(recurse, ap)) {
                worklist.push(ap);
              }
            }
          } else if (dirent.isDirectory() || dirent.isFile()) {
            const fullPath = PathUtil.join(i, dirent.name);
            if (!dirent.isDirectory()) {
              worklist.push(fullPath);
            } else {
              if (await callMaybeFunc(recurse, fullPath)) {
                worklist.push(fullPath);
              }
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

function getRecurseFuncSync(
  opts?: Partial<ForFilesSyncOptions>,
): (dirName: string) => boolean {
  if (Type.isUndefined(opts) || Type.isUndefined(opts.recurse)) {
    return tru;
  }
  if (Type.isBoolean(opts.recurse)) {
    return opts.recurse ? tru : fal;
  }
  return opts.recurse;
}

export function ForFilesSync(
  seed: string | string[],
  func: (fileName: string) => boolean,
  opts?: Partial<ForFilesSyncOptions>,
): boolean {
  const recurse = getRecurseFuncSync(opts);
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
            if ((lst.isDirectory() && recurse(ap)) || lst.isFile()) {
              worklist.push(ap);
            }
          } else if (dirent.isDirectory() || dirent.isFile()) {
            const fullPath = PathUtil.join(i, dirent.name);
            if (dirent.isFile() || recurse(fullPath)) {
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

export async function ForDirs(
  seed: string | string[],
  dirProcessor: (dirName: string) => Promise<boolean> | boolean,
  opts?: Partial<ForDirsOptions>,
): Promise<boolean> {
  // Helper function to match the file types
  const recurse = getRecurseFunc(opts);
  const keepGoing = opts && opts.keepGoing;
  const depth = opts && opts.order === 'depth';
  const skipHiddenFolders = opts ? !!opts.skipHiddenFolders : true;
  const hideDots = opts ? !opts.dontAssumeDotsAreHidden : true;
  const followSymlinks = opts ? opts.dontFollowSymlinks : true;
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
    if (st.isDirectory() && !isHidden(i, skipHiddenFolders, hideDots)) {
      // For directories in the queue, we put all their dirs on the queue
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
            const symFullPath = PathUtil.join(i, dirent.name);
            const ap = await fsp.realpath(symFullPath);
            const lst = await fsp.stat(ap);
            if (lst.isDirectory()) {
              if ((await callMaybeFunc(dirProcessor, symFullPath)) !== true) {
                overallResult = false;
                if (!keepGoing) {
                  return false;
                }
              } else if (await callMaybeFunc(recurse, ap)) {
                worklist.push(ap);
              }
            }
          } else if (dirent.isDirectory()) {
            const fullPath = PathUtil.join(i, dirent.name);
            if (dirent.isDirectory()) {
              if ((await callMaybeFunc(dirProcessor, fullPath)) !== true) {
                overallResult = false;
                if (!keepGoing) {
                  return false;
                }
              } else if (await callMaybeFunc(recurse, fullPath)) {
                worklist.push(fullPath);
              }
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
