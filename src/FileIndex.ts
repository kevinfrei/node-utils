import { isFunction, isPromise, isString, typecheck } from '@freik/typechk';
import { NormalizedStringCompare } from '@freik/text';
import { SortedArrayDiff } from '@freik/helpers';
import { arrayToTextFileAsync, textFileToArrayAsync } from './FileUtil.js';
import { ForFiles } from './forFiles.js';
import * as path from './PathUtil.js';
import { MakeLog } from '@freik/logger';

const { err } = MakeLog('node-utils:FileIndex');

export type PathHandlerAsync = (pathName: string) => Promise<void>;
export type PathHandlerSync = (pathName: string) => void;
export type PathHandlerEither = PathHandlerSync | PathHandlerAsync;
export type PathHandlerBoth = (pathName: string) => Promise<void> | void;
export type PathHandlerAll = PathHandlerBoth | PathHandlerEither;

export type FileIndex = {
  getLocation: () => string;
  forEachFile: (fn: PathHandlerAll) => Promise<void>;
  forEachFileSync: (fn: PathHandlerSync) => void;
  getLastScanTime: () => Date | null;
  // When we rescan files, look at file path diffs
  rescanFiles: (
    addFile?: PathHandlerAll,
    delFile?: PathHandlerAll,
  ) => Promise<void>;
};

/*
 * Begin crap to deal with overloading and whatnot
 */
type FolderLocation = string;
const isFolderLocation: typecheck<FolderLocation> = isString;
export type Watcher = (obj: string) => boolean;
const isWatcher: typecheck<Watcher> = isFunction as typecheck<Watcher>;

function fileWatcher(watcher: Watcher | undefined): Watcher {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return isWatcher(watcher) ? watcher : (o: string) => true;
}

// This is used to deal with the weird overloads below
function getIndexLocation(
  defaultLoc: string,
  obj?: Watcher | FolderLocation,
): FolderLocation {
  return isFolderLocation(obj) ? obj : path.join(defaultLoc, '.fileIndex.txt');
}

export type FileIndexOptions = {
  indexFolderLocation: string;
  fileWatcher: Watcher;
  watchHidden: boolean;
};

export async function MakeFileIndex(
  location: string,
  options?: Partial<FileIndexOptions>,
): Promise<FileIndex> {
  const indexFile = getIndexLocation(location, options?.indexFolderLocation);
  const shouldWatchFile = fileWatcher(options?.fileWatcher);
  const ignoreHidden = !(options && options.watchHidden);
  /*
   * "member" data goes here
   */
  // non-const: these things update "atomically" so the whole array gets changed
  let fileList: string[] = [];
  let lastScanTime: Date | null = null;
  const tmpLoc = path.xplat(location);
  const theLocation = tmpLoc.endsWith('/') ? tmpLoc : tmpLoc + '/';
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
    /* istanbul ignore next */
    return false;
  }

  // Rescan the location, calling a function for each add/delete of image
  // or audio files
  async function rescanFiles(
    addFileFn?: PathHandlerAll,
    delFileFn?: PathHandlerAll,
  ): Promise<void> {
    const oldFileList = fileList;
    const newFileList: string[] = [];
    const newLastScanTime = new Date();
    await ForFiles(
      theLocation,
      (platPath: string) => {
        const filePath = path.xplat(platPath);
        /* istanbul ignore if */
        if (!filePath.startsWith(theLocation)) {
          err(`File ${filePath} doesn't appear to be under ${theLocation}`);
          return false;
        }
        const subPath = path.xplat(filePath.substring(theLocation.length));
        if (
          filePath.toLocaleUpperCase() !== indexFile.toLocaleUpperCase() &&
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
        skipHiddenFiles: ignoreHidden,
        skipHiddenFolders: ignoreHidden,
      },
    );
    fileList = newFileList.sort(NormalizedStringCompare);
    lastScanTime = newLastScanTime;
    await saveFileIndex();
    // Alright, we've got the new list, now call the handlers to
    // post-process any differences from the previous list
    if (delFileFn || addFileFn) {
      // Don't waste time if we don't have funcs to call...
      await SortedArrayDiff(
        oldFileList,
        fileList,
        NormalizedStringCompare,
        addFileFn,
        delFileFn,
      );
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
    forEachFile: async (fn: PathHandlerAll): Promise<void> => {
      for (const f of fileList) {
        const res = fn(f);
        if (isPromise(res)) {
          await res;
        }
      }
    },
    rescanFiles,
  };
}
