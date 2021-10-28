import {
  MakeError,
  MakeLogger,
  MakeReaderWriter,
  ReaderWriter,
  SeqNum,
} from '@freik/core-utils';
import fs, { promises as fsp } from 'fs';
import * as path from './PathUtil.js';

const log = MakeLogger('persist');
const err = MakeError('persist-err', false);

export type ValueUpdateListener = (val: string) => void;

export type Persist = {
  getLocation(): string;
  getItem(key: string): string | void;
  getItemAsync(key: string): Promise<string | void>;
  setItem(key: string, value: string): void;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItem(key: string): void;
  deleteItemAsync(key: string): Promise<void>;
  subscribe(key: string, listener: ValueUpdateListener): string;
  unsubscribe(id: string): boolean;
};

export function MakePersistence(location: string): Persist {
  const memoryCache = new Map<string, string>();
  const listeners = new Map<string, Map<string, ValueUpdateListener>>();
  const getNextListenerId = SeqNum();

  const lockers = new Map<string, ReaderWriter>();

  function getLock(id: string): ReaderWriter {
    const locker = lockers.get(id);
    if (locker !== undefined) {
      return locker;
    } else {
      const res = MakeReaderWriter(1);
      lockers.set(id, res);
      return res;
    }
  }

  // Here's a place for app settings & stuff...
  function getLocation(): string {
    return path.xplat(location);
  }
  function storageLocation(id: string): string {
    return path.join(getLocation(), `${id}.json`);
  }

  log(`User data location: ${storageLocation('test')}`);

  function readFile(id: string): string | void {
    let data = memoryCache.get(id);
    if (data) {
      return data;
    }
    try {
      data = fs.readFileSync(storageLocation(id), 'utf8');
      memoryCache.set(id, data);
      return data;
    } catch (e) {
      err('Error occurred during readFile');
      err(e);
    }
  }

  async function readFileAsync(id: string): Promise<string | void> {
    const data = memoryCache.get(id);
    if (data) {
      log('returning cached data for ' + id);
      return data;
    }
    const lock = getLock(id);
    await lock.read();
    try {
      const contents = await fsp.readFile(storageLocation(id), 'utf8');
      memoryCache.set(id, contents);
      return contents;
    } catch (e) {
      err('Error occurred during readFileAsync');
      err(e);
    } finally {
      lock.leaveRead();
    }
  }

  function writeFile(id: string, val: string): void {
    try {
      fs.mkdirSync(getLocation(), { recursive: true });
    } catch (e) {
      /* */
    }
    fs.writeFileSync(storageLocation(id), val, 'utf8');
    memoryCache.set(id, val);
  }

  async function writeFileAsync(id: string, val: string): Promise<void> {
    try {
      await fsp.mkdir(getLocation(), { recursive: true });
    } catch (e) {
      /* */
    }
    const lock = getLock(id);
    await lock.write();
    try {
      await fsp.writeFile(storageLocation(id), val, 'utf8');
      memoryCache.set(id, val);
    } finally {
      lock.leaveWrite();
    }
  }

  function deleteFile(id: string) {
    try {
      fs.unlinkSync(storageLocation(id));
      memoryCache.delete(id);
    } catch (e) {
      err('Error occurred during deleteFile');
      err(e);
    }
  }

  async function deleteFileAsync(id: string) {
    const lock = getLock(id);
    await lock.write();
    try {
      await fsp.unlink(storageLocation(id));
      memoryCache.delete(id);
    } catch (e) {
      err('Error occurred during deleteFileAsync');
      err(e);
    } finally {
      lock.leaveWrite();
    }
  }

  function notify(key: string, val: string) {
    // For each listener, invoke the listening function
    const ls = listeners.get(key);
    if (!ls) return;
    for (const [, fn] of ls) {
      log(`Updating ${key} to ${val}`);
      fn(val);
    }
  }

  // Add a function to run when a value is persisted
  function subscribe(key: string, listener: ValueUpdateListener): string {
    const id = getNextListenerId();
    let keyListeners = listeners.get(key);
    if (!keyListeners) {
      keyListeners = new Map();
      listeners.set(key, keyListeners);
    }
    keyListeners.set(id, listener);
    return `${id}-${key}`;
  }

  // Remove the listening function with the given id
  function unsubscribe(id: string): boolean {
    const splitPt = id.indexOf('-');
    const actualId = id.substr(0, splitPt);
    const keyName = id.substr(splitPt + 1);
    const keyListeners = listeners.get(keyName);
    if (!keyListeners) {
      return false;
    }
    return keyListeners.delete(actualId);
  }

  // Get a value from disk/memory
  function getItem(key: string): string | void {
    log('Reading ' + key);
    return readFile(key);
  }

  // Get a value from disk/memory
  async function getItemAsync(key: string): Promise<string | void> {
    log('Async Reading ' + key);
    return await readFileAsync(key);
  }

  // Save a value to disk and cache it
  function setItem(key: string, value: string): void {
    if (getItem(key) === value) {
      log(`No change to ${key} - not re-writing`);
    } else {
      log(`Writing ${key}:`);
      log(value);
      writeFile(key, value);
      notify(key, value);
    }
  }

  // Async Save a value to disk and cache it
  async function setItemAsync(key: string, value: string): Promise<void> {
    if ((await getItemAsync(key)) === value) {
      log(`No change to ${key} - not re-writing`);
    } else {
      log(`Async Writing ${key}:`);
      log(value);
      await writeFileAsync(key, value);
      notify(key, value);
    }
  }

  // Delete an item (and remove it from the cache)
  function deleteItem(key: string): void {
    log(`deleting ${key}`);
    deleteFile(key);
  }

  // Async Delete an item (and remove it from the cache)
  async function deleteItemAsync(key: string): Promise<void> {
    log(`deleting ${key}`);
    await deleteFileAsync(key);
  }
  return {
    getLocation,
    getItem,
    getItemAsync,
    setItem,
    setItemAsync,
    deleteItem,
    deleteItemAsync,
    subscribe,
    unsubscribe,
  };
}
