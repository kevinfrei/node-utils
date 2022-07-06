import { promises as fsp } from 'fs';
import {
  MakeFileIndex,
  pathCompare,
  SortedArrayDiff,
  SortedArrayDiffSync,
} from '../FileIndex';
import { MakeSuffixWatcher } from '../StringWatcher';

async function cleanup() {
  for (const i of ['FileIndexTest', 'FileIndexTest2', 'FileIndexTest3']) {
    try {
      await fsp.rm(`src/__tests__/${i}/.fileIndex.txt`);
    } catch (e) {}
  }
  try {
    await fsp.rm('src/__tests__/SubdirTest/.customFileIndex.txt');
  } catch (e) {}
}

beforeEach(cleanup);
afterEach(cleanup);

it('Make a little File Index', async () => {
  const fi = await MakeFileIndex('src/__tests__/FileIndexTest');
  expect(fi.getLocation()).toEqual('src/__tests__/FileIndexTest/');
  const files: string[] = [];
  fi.forEachFileSync((pathName: string) => files.push(pathName));
  expect(files.sort(pathCompare)).toEqual([
    'file1.txt',
    'file2.txt',
    'file3.tmp',
    'file4.dat',
  ]);
});

const isTxt = MakeSuffixWatcher('txt');
const notTxt = MakeSuffixWatcher().addToIgnoreList('.txt');

it('Make a little File Index with only .txt files', async () => {
  const fi = await MakeFileIndex('src/__tests__/FileIndexTest2', {
    fileWatcher: isTxt,
  });
  expect(fi.getLocation()).toEqual('src/__tests__/FileIndexTest2/');
  const files: string[] = [];
  fi.forEachFileSync((pathName: string) => files.push(pathName));
  expect(files.sort(pathCompare)).toEqual(['file1.txt', 'file2.txt']);
});

it('Make a little File Index without .txt files', async () => {
  const fi = await MakeFileIndex('src/__tests__/FileIndexTest3', {
    fileWatcher: notTxt,
  });
  expect(fi.getLocation()).toEqual('src/__tests__/FileIndexTest3/');
  const files: string[] = [];
  fi.forEachFileSync((pathName: string) => files.push(pathName));
  expect(files.sort(pathCompare)).toEqual(['file3.tmp', 'file4.dat']);
});

it('Make a little File Index and see some file movement', async () => {
  const fi = await MakeFileIndex('src/__tests__/FileIndexTest3', {
    fileWatcher: notTxt,
    watchHidden: true,
  });
  expect(fi.getLocation()).toEqual('src/__tests__/FileIndexTest3/');
  const files: string[] = [];
  fi.forEachFileSync((pathName: string) => files.push(pathName));
  expect(files.sort(pathCompare)).toEqual([
    '.hidden.dat',
    'file3.tmp',
    'file4.dat',
  ]);
  const adds: string[] = [];
  const subs: string[] = [];
  try {
    await fsp.rename(
      'src/__tests__/FileIndexTest3/file3.tmp',
      'src/__tests__/FileIndexTest3/file3.txt',
    );
    await fi.rescanFiles(
      (added: string) => adds.push(added),
      async (subbed: string) => {
        subs.push(subbed);
        return Promise.resolve();
      },
    );
  } finally {
    await fsp.rename(
      'src/__tests__/FileIndexTest3/file3.txt',
      'src/__tests__/FileIndexTest3/file3.tmp',
    );
  }
  expect(adds).toEqual([]);
  expect(subs).toEqual(['file3.tmp']);
  subs.pop();
  await fi.rescanFiles(
    async (added: string) => {
      adds.push(added);
      await Promise.resolve();
    },
    (subbed: string) => subs.push(subbed),
  );
  expect(adds).toEqual(['file3.tmp']);
  expect(subs).toEqual([]);
});

it('Subdirs!', async () => {
  const fi = await MakeFileIndex('src/__tests__/SubdirTest', {
    indexFolderLocation: 'src/__tests__/SubdirTest/.customFileIndex.txt',
  });
  expect(fi).toBeDefined();
});

it('Sorted Array Diff', () => {
  const arr1 = ['a', 'b', 'd'];
  const arr2 = ['a', 'c', 'd'];
  const adds: string[] = [];
  const subs: string[] = [];
  SortedArrayDiffSync(
    arr1,
    arr2,
    (add) => adds.push(add),
    (sub) => subs.push(sub),
  );
  expect(adds).toEqual(['c']);
  expect(subs).toEqual(['b']);
});
