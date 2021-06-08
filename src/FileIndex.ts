import { MakeError, Type } from '@freik/core-utils';
import { arrayToTextFileAsync, textFileToArrayAsync } from './file';
import { ForFiles } from './forFiles';
import * as path from './path';

const err = MakeError('FileIndex-err');

export type PathHandlerAsync = (pathName: string) => Promise<void>;
export type PathHandlerSync = (pathName: string) => void;
export type PathHandlerEither = PathHandlerSync | PathHandlerAsync;
export type PathHandlerBoth = (pathName: string) => Promise<void> | void;

export type FileIndex = {
  getLocation: () => string;
  forEachFile: (fn: PathHandlerEither | PathHandlerBoth) => Promise<void>;
  forEachFileSync: (fn: PathHandlerSync) => void;
  getLastScanTime: () => Date | null;
  // When we rescan files, look at file path diffs
  rescanFiles: (
    addFile?: PathHandlerBoth | PathHandlerEither,
    delFile?: PathHandlerBoth | PathHandlerEither,
  ) => Promise<void>;
};

export function pathCompare(a: string | null, b: string | null): number {
  if (a === null) return b !== null ? 1 : 0;
  if (b === null) return a !== null ? -1 : 0;
  const m = a.toLocaleUpperCase();
  const n = b.toLocaleUpperCase();
  // Don't use localeCompare: it will make some things equal that aren't *quite*
  return (m > n ? 1 : 0) - (m < n ? 1 : 0);
}

/* This requires that both arrays are already sorted */
export async function SortedArrayDiff(
  oldList: string[],
  newList: string[],
  addFn?: PathHandlerBoth | PathHandlerEither,
  delFn?: PathHandlerBoth | PathHandlerEither,
): Promise<void> {
  let oldIndex = 0;
  let newIndex = 0;
  for (; oldIndex < oldList.length || newIndex < newList.length; ) {
    const oldItem = oldIndex < oldList.length ? oldList[oldIndex] : null;
    const newItem = newIndex < newList.length ? newList[newIndex] : null;
    const comp = pathCompare(oldItem, newItem);
    if (comp === 0) {
      oldIndex++;
      newIndex++;
      continue;
    } else if (comp < 0 && oldItem !== null) {
      // old item goes "before" new item, so we've deleted old item
      if (delFn) {
        const foo = delFn(oldItem);
        if (Type.isPromise(foo)) {
          await foo;
        }
      }
      oldIndex++;
    } else if (comp > 0 && newItem !== null) {
      // new item goes "before" old item, so we've added new item
      if (addFn) {
        const bar = addFn(newItem);
        if (Type.isPromise(bar)) {
          await bar;
        }
      }
      newIndex++;
    }
  }
}

export function SortedArrayDiffSync(
  oldList: string[],
  newList: string[],
  addFn?: PathHandlerSync,
  delFn?: PathHandlerSync,
): void {
  let oldIndex = 0;
  let newIndex = 0;
  for (; oldIndex < oldList.length || newIndex < newList.length; ) {
    const oldItem = oldIndex < oldList.length ? oldList[oldIndex] : null;
    const newItem = newIndex < newList.length ? newList[newIndex] : null;
    const comp = pathCompare(oldItem, newItem);
    if (comp === 0) {
      oldIndex++;
      newIndex++;
      continue;
    } else if (comp < 0 && oldItem !== null) {
      // old item goes "before" new item, so we've deleted old item
      if (delFn) {
        delFn(oldItem);
      }
      oldIndex++;
    } else if (comp > 0 && newItem !== null) {
      // new item goes "before" old item, so we've added new item
      if (addFn) {
        addFn(newItem);
      }
      newIndex++;
    }
  }
}

/*
 * Begin crap to deal with overloading and whatnot
 */
type FolderLocation = string;
export type Watcher = (obj: string) => boolean;
function fileWatcher(obj: unknown): Watcher {
  return Type.isFunction(obj)
    ? (obj as Watcher)
    : // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (o: string) => true;
}
// This is used to deal with the weird overloads below
function getIndexLocation(
  defaultLoc: string,
  obj?: Watcher | FolderLocation,
): FolderLocation {
  if (obj !== undefined && !Type.isFunction(obj) && Type.isString(obj)) {
    return obj;
  } else {
    return path.join(defaultLoc, '.fileIndex.txt');
  }
}

export async function MakeFileIndex(
  location: string,
  indexFolderLocation?: FolderLocation,
): Promise<FileIndex>;
export async function MakeFileIndex(
  location: string,
  shouldWatch: Watcher,
  indexFolderLocation?: FolderLocation,
): Promise<FileIndex>;
export async function MakeFileIndex(
  location: string,
  shouldWatchFileOrFolderLocation?: Watcher | FolderLocation,
  maybeIndexFolderLocation?: FolderLocation,
): Promise<FileIndex> {
  const shouldWatchFile: Watcher = fileWatcher(shouldWatchFileOrFolderLocation);
  const indexFile: FolderLocation = getIndexLocation(
    location,
    maybeIndexFolderLocation || shouldWatchFileOrFolderLocation,
  );
  /*
   * End crap to deal with overloading and whatnot
   */

  /*
   * "member" data goes here
   */
  // non-const: these things update "atomically" so the whole array gets changed
  let fileList: string[] = [];
  let lastScanTime: Date | null = null;
  const theLocation =
    path.xplat(location) + (location.endsWith('/') ? '' : '/');
  // Read the file list from disk, either from the MDF cache,
  // or directly from the path provided
  async function loadFileIndex(): Promise<boolean> {
    try {
      fileList = await textFileToArrayAsync(indexFile);
      return true;
    } catch (e) {
      /* */
    }
    return false;
  }
  async function saveFileIndex(): Promise<boolean> {
    try {
      await arrayToTextFileAsync(fileList, indexFile);
      return true;
    } catch (e) {
      /* */
    }
    return false;
  }

  // Rescan the location, calling a function for each add/delete of image
  // or audio files
  async function rescanFiles(
    addFileFn?: PathHandlerEither | PathHandlerBoth,
    delFileFn?: PathHandlerEither | PathHandlerBoth,
  ): Promise<void> {
    const oldFileList = fileList;
    const newFileList: string[] = [];
    const newLastScanTime = new Date();
    await ForFiles(
      theLocation,
      (platPath: string) => {
        const filePath = path.xplat(platPath);
        if (!filePath.startsWith(theLocation)) {
          err(`File ${filePath} doesn't appear to be under ${theLocation}`);
          return false;
        }
        const subPath = path.xplat(filePath.substr(theLocation.length));
        if (
          !filePath.endsWith('/' + path.basename(indexFile)) &&
          shouldWatchFile(filePath)
        ) {
          // the file path is relative to the root, and should always use /
          newFileList.push(subPath);
        }
        return true;
      },
      {
        recurse: true,
        keepGoing: true,
      },
    );
    fileList = newFileList.sort(pathCompare);
    lastScanTime = newLastScanTime;
    await saveFileIndex();
    // Alright, we've got the new list, now call the handlers to
    // post-process any differences from the previous list
    if (delFileFn || addFileFn) {
      // Don't waste time if we don't have funcs to call...
      await SortedArrayDiff(oldFileList, fileList, addFileFn, delFileFn);
    }
    // TODO: Save the new list back to disk in the .emp file index
  }

  /*
   *
   * Begin 'constructor' code here:
   *
   */
  if (!(await loadFileIndex())) {
    fileList = [];
    // Just rebuild the file list, don't do any processing right now
    await rescanFiles();
    // TODO: Write the stuff we just read into the .emp file
    await saveFileIndex();
  }
  return {
    // Don't know if this is necessary, but it seems useful
    getLocation: () => theLocation,
    getLastScanTime: () => lastScanTime,
    forEachFileSync: (fn: PathHandlerSync) => fileList.forEach(fn),
    forEachFile: async (
      fn: PathHandlerBoth | PathHandlerEither,
    ): Promise<void> => {
      for (const f of fileList) {
        const res = fn(f);
        if (Type.isPromise(res)) {
          await res;
        }
      }
    },
    rescanFiles,
  };
}
