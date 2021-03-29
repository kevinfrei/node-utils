import { Type } from '@freik/core-utils';

export type FileTypeWatcher = {
  addToIgnoreList(
    this: FileTypeWatcher,
    ...types: (string | Iterable<string>)[]
  ): FileTypeWatcher;
  addToWatchList(
    this: FileTypeWatcher,
    ...types: (string | Iterable<string>)[]
  ): FileTypeWatcher;
  watching(type: string): boolean;
};

export function MakeFileTypeWatcher(): FileTypeWatcher {
  const toWatch = new Set<string>();
  const toIgnore = new Set<string>();
  function shouldWatch(type: string): boolean {
    return toWatch.size === 0 || toWatch.has(type);
  }
  function shouldIgnore(type: string): boolean {
    return toIgnore.size !== 0 && toIgnore.has(type);
  }
  function addToWatchList(
    this: FileTypeWatcher,
    ...types: (string | Iterable<string>)[]
  ): FileTypeWatcher {
    for (const type of types) {
      for (const elem of Type.isString(type) ? [type] : type) {
        toWatch.add(elem);
        toIgnore.delete(elem);
      }
    }
    return this;
  }
  function addToIgnoreList(
    this: FileTypeWatcher,
    ...types: (string | Iterable<string>)[]
  ): FileTypeWatcher {
    for (const type of types) {
      for (const elem of Type.isString(type) ? [type] : type) {
        toIgnore.add(elem);
        toWatch.delete(elem);
      }
    }
    return this;
  }
  function watching(type: string) {
    return !shouldIgnore(type) && shouldWatch(type);
  }
  return { addToIgnoreList, addToWatchList, watching };
}
