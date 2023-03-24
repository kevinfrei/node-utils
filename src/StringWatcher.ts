import { Type } from '@freik/core-utils';
import * as path from 'path';

export type StringWatcher = {
  (str: string): boolean;
  addToIgnoreList(
    this: StringWatcher,
    ...types: (string | Iterable<string>)[]
  ): StringWatcher;
  addToWatchList(
    this: StringWatcher,
    ...types: (string | Iterable<string>)[]
  ): StringWatcher;
  watching(type: string): boolean;
};

/**
 * Returns a data structure designed to let you opt in, or opt out, of specific
 * strings. Use `addToWatchList` to "opt in", and use `addToIgnoreList` to opt
 * out. These two combine (and preempt eachother). If you only have an ignore
 * list, `watching(str)` will return `true` for everything not on the list. If
 * you only have a watch list, `watching(str)` will return `false` for
 * everything not on the list.
 * @returns StringWatcher
 */
export function MakeStringWatcher(...maybeWatchList: string[]): StringWatcher {
  const toWatch = new Set<string>();
  const toIgnore = new Set<string>();
  function shouldWatch(type: string): boolean {
    return toWatch.size === 0 || toWatch.has(type);
  }
  function shouldIgnore(type: string): boolean {
    return toIgnore.size !== 0 && toIgnore.has(type);
  }
  function addToWatchList(
    this: StringWatcher,
    ...types: (string | Iterable<string>)[]
  ): StringWatcher {
    for (const type of types) {
      for (const elem of Type.isString(type) ? [type] : type) {
        toWatch.add(elem);
        toIgnore.delete(elem);
      }
    }
    return this;
  }
  function addToIgnoreList(
    this: StringWatcher,
    ...types: (string | Iterable<string>)[]
  ): StringWatcher {
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
  watching.addToIgnoreList = addToIgnoreList;
  watching.addToWatchList = addToWatchList;
  watching.watching = watching;
  if (maybeWatchList) {
    watching.addToWatchList(maybeWatchList);
  }
  return watching;
}

/**
 * Returns a data structure designed to let you opt in, or opt out, of specific
 * strings. Use `addToWatchList` to "opt in", and use `addToIgnoreList` to opt
 * out. These two combine (and preempt eachother). If you only have an ignore
 * list, `watching(str)` will return `true` for everything not on the list. If
 * you only have a watch list, `watching(str)` will return `false` for
 * everything not on the list.
 * @returns StringWatcher
 */
export function MakeSuffixWatcher(...maybeWatchList: string[]): StringWatcher {
  const toWatch = new Set<string>();
  const toIgnore = new Set<string>();
  function getExt(str: string): string {
    return path.extname(str).toLocaleLowerCase();
  }
  function shouldWatch(type: string): boolean {
    return toWatch.size === 0 || toWatch.has(getExt(type));
  }
  function shouldIgnore(type: string): boolean {
    return toIgnore.size !== 0 && toIgnore.has(getExt(type));
  }
  function addToWatchList(
    this: StringWatcher,
    ...types: (string | Iterable<string>)[]
  ): StringWatcher {
    for (const type of types) {
      for (const elem of Type.isString(type) ? [type] : type) {
        const val = elem.startsWith('.')
          ? elem.toLocaleLowerCase()
          : '.' + elem.toLocaleLowerCase();
        toWatch.add(val);
        toIgnore.delete(val);
      }
    }
    return this;
  }
  function addToIgnoreList(
    this: StringWatcher,
    ...types: (string | Iterable<string>)[]
  ): StringWatcher {
    for (const type of types) {
      for (const elem of Type.isString(type) ? [type] : type) {
        const val = elem.startsWith('.')
          ? elem.toLocaleLowerCase()
          : '.' + elem.toLocaleLowerCase();
        toIgnore.add(val);
        toWatch.delete(val);
      }
    }
    return this;
  }
  function watching(type: string) {
    return !shouldIgnore(type) && shouldWatch(type);
  }
  watching.addToIgnoreList = addToIgnoreList;
  watching.addToWatchList = addToWatchList;
  watching.watching = watching;
  if (maybeWatchList) {
    watching.addToWatchList(maybeWatchList);
  }
  return watching;
}
