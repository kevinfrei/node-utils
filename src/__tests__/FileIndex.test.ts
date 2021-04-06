import { promises as fsp } from 'fs';
import { MakeFileIndex, pathCompare } from '../FileIndex';
import { MakeSuffixWatcher } from '../StringWatcher';

async function cleanup() {
  for (const i of ['', '2', '3']) {
    try {
      await fsp.rm('src/__tests__/FileIndexTest' + i + '/.fileIndex.txt');
    } catch (e) {}
  }
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

const isTxt = MakeSuffixWatcher().addToWatchList('txt');
const notTxt = MakeSuffixWatcher().addToIgnoreList('.txt');

it('Make a little File Index with only .txt files', async () => {
  const fi = await MakeFileIndex('src/__tests__/FileIndexTest2', isTxt);
  expect(fi.getLocation()).toEqual('src/__tests__/FileIndexTest2/');
  const files: string[] = [];
  fi.forEachFileSync((pathName: string) => files.push(pathName));
  expect(files.sort(pathCompare)).toEqual(['file1.txt', 'file2.txt']);
});

it('Make a little File Index without .txt files', async () => {
  const fi = await MakeFileIndex('src/__tests__/FileIndexTest3', notTxt);
  expect(fi.getLocation()).toEqual('src/__tests__/FileIndexTest3/');
  const files: string[] = [];
  fi.forEachFileSync((pathName: string) => files.push(pathName));
  expect(files.sort(pathCompare)).toEqual(['file3.tmp', 'file4.dat']);
});

it('Make a little File Index and see some file movement', async () => {
  const fi = await MakeFileIndex('src/__tests__/FileIndexTest3', notTxt);
  expect(fi.getLocation()).toEqual('src/__tests__/FileIndexTest3/');
  const files: string[] = [];
  fi.forEachFileSync((pathName: string) => files.push(pathName));
  expect(files.sort(pathCompare)).toEqual(['file3.tmp', 'file4.dat']);
  const adds: string[] = [];
  const subs: string[] = [];
  try {
    await fsp.rename(
      'src/__tests__/FileIndexTest3/file3.tmp',
      'src/__tests__/FileIndexTest3/file3.txt',
    );
    await fi.rescanFiles(
      (added: string) => adds.push(added),
      (subbed: string) => subs.push(subbed),
    );
  } finally {
    await fsp.rename(
      'src/__tests__/FileIndexTest3/file3.txt',
      'src/__tests__/FileIndexTest3/file3.tmp',
    );
  }
  expect(adds).toEqual([]);
  expect(subs).toEqual(['file3.tmp']);
});
