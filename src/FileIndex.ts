import { FTON, MakeError, Type } from '@freik/core-utils';
import { ForFiles } from './forFiles';
import { MakePersistence, Persist } from './persist';
import { getExtNoDot } from './path';
import path from 'path';
import { mkdir, stat } from 'fs/promises';
import { hideFile } from './file';

const err = MakeError('FileIndex-err');

type PathHandler = (pathName: string) => void;

export type FileIndex = {
  getLocation: () => string;
  forEachFile: (fn: PathHandler) => void;
  getLastScanTime: () => Date | null;
  // When we rescan files, look at file path diffs
  rescanFiles: (addFile?: PathHandler, delFile?: PathHandler) => Promise<void>;
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
export function SortedArrayDiff(
  oldList: string[],
  newList: string[],
  addFn?: PathHandler,
  delFn?: PathHandler,
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
      if (delFn) delFn(oldItem);
      oldIndex++;
    } else if (comp > 0 && newItem !== null) {
      // new item goes "before" old item, so we've added new item
      if (addFn) addFn(newItem);
      newIndex++;
    }
  }
}

/*
 * Begin crap to deal with overloading and whatnot
 */
type PersistID = { persist: Persist; id: string };
type FolderLocation = string | PersistID;
export type Watcher = (obj: string) => boolean;
function fileWatcher(obj: unknown): Watcher {
  return Type.isFunction(obj)
    ? (obj as Watcher)
    : // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (o: string) => true;
}
// This is used to deal with the weird overloads below
function getPersister(
  defaultLoc: string,
  obj?: Watcher | FolderLocation,
): PersistID {
  if (obj !== undefined && !Type.isFunction(obj)) {
    if (Type.hasStr(obj, 'id') && Type.has(obj, 'persist')) {
      return obj;
    } else if (Type.isString(obj)) {
      return {
        persist: MakePersistence(path.join(defaultLoc, '.kfi')),
        id: 'fileList',
      };
    }
  }
  return {
    persist: MakePersistence(path.join(defaultLoc, '.kfi')),
    id: 'fileList',
  };
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
  const persister: PersistID = getPersister(
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
    location +
    (location[location.length - 1] === '/' ||
    location[location.length - 1] === '\\'
      ? ''
      : '/');
  // Read the file list from disk, either from the MDF cache,
  // or directly from the path provided
  async function loadFileIndex(): Promise<boolean> {
    try {
      const flat = await persister.persist.getItemAsync(persister.id);
      if (flat) {
        const fton = FTON.parse(flat);
        if (Type.isArrayOfString(fton)) {
          fileList = fton;
          return true;
        }
      }
      // TODO: Make this check it for validity?
    } catch (e) {
      /* */
    }
    return false;
  }
  async function saveFileIndex(): Promise<boolean> {
    try {
      const flat = FTON.stringify(fileList);
      await persister.persist.setItemAsync(persister.id, flat);
      return true;
    } catch (e) {
      /* */
    }
    return false;
  }

  // Rescan the location, calling a function for each add/delete of image
  // or audio files
  async function rescanFiles(
    addFileFn?: PathHandler,
    delFileFn?: PathHandler,
  ): Promise<void> {
    const oldFileList = fileList;
    const newFileList: string[] = [];
    const newLastScanTime = new Date();
    await ForFiles(
      theLocation,
      (filePath: string) => {
        if (!filePath.startsWith(theLocation)) {
          err(`File ${filePath} doesn't appear to be under ${theLocation}`);
          return false;
        }
        const subPath = filePath
          .substr(theLocation.length)
          .replaceAll('\\', '/');
        if (
          !filePath.endsWith('/' + persister.id + '.json') &&
          shouldWatchFile(getExtNoDot(filePath))
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
      SortedArrayDiff(oldFileList, fileList, addFileFn, delFileFn);
    }
    // TODO: Save the new list back to disk in the .emp file index
  }

  /*
   *
   * Begin 'constructor' code here:
   *
   */
  // First, make the persistence location if it doesn't already exist
  try {
    await stat(persister.persist.getLocation());
  } catch (e) {
    try {
      await mkdir(persister.persist.getLocation(), { recursive: true });
      // Try to hide the thing, even on Windows, because .files are annoying
      await hideFile(persister.persist.getLocation());
    } catch (f) {
      /* */
    }
  }
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
    forEachFile: (fn: PathHandler) => fileList.forEach(fn),
    rescanFiles,
  };
}
