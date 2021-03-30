import { Operations as Ops, Sleep } from '@freik/core-utils';
import { SortedArrayDiff, pathCompare, MakeFileIndex } from '../FileIndex';
import { promises as fsp } from 'fs';
import path from 'path';

it('SortedArrayDiff', () => {
  const array1 = ['a', 'b', 'd', 'f'];
  const array2 = ['b', 'e', 'f'];
  const subs: string[] = [];
  const adds: string[] = [];
  SortedArrayDiff(
    array1,
    array2,
    (str: string) => adds.push(str),
    (str: string) => subs.push(str),
  );
  expect(adds).toEqual(['e']);
  expect(subs).toEqual(['a', 'd']);
});

it('SortedArrayDiff - case insensitive validation', () => {
  const array1 = ['B', 'e', 'f'];
  const array2 = ['a', 'b', 'd', 'F'];
  const subs: string[] = [];
  const adds: string[] = [];
  SortedArrayDiff(
    array1,
    array2,
    (str: string) => adds.push(str),
    (str: string) => subs.push(str),
  );
  expect(adds).toEqual(['a', 'd']);
  expect(subs).toEqual(['e']);
});

function GetNumber(max: number): number {
  return Math.floor(Math.random() * max);
}

function GenerateRandomString(len: number): string {
  let str = '';
  for (var i = 0; i < len; i++) {
    str += String.fromCharCode(GetNumber(0x1fdf) + 32);
  }
  return str;
}

function GenerateRandomArray(): string[] {
  return Array.from({ length: GetNumber(200) + 100 }, () =>
    GenerateRandomString(GetNumber(5) + 5),
  );
}

function AddAndRemoveSomeStuff(
  arr: string[],
): { addCount: number; subCount: number; val: string[] } {
  const val: string[] = [];
  let subCount = 0;
  let addCount = 0;
  for (let i = 0; i < arr.length; i++) {
    const which = GetNumber(4);
    if (which === 0) {
      addCount++;
      val.push(GenerateRandomString(GetNumber(5) + 5));
      i--;
    } else if (which < 3) {
      val.push(arr[i]);
    } else {
      subCount++;
    }
  }
  return { val, subCount, addCount };
}

it('Random SortedArrayDiff testing', () => {
  const tmp1 = GenerateRandomArray();
  const { addCount, subCount, val: tmp2 } = AddAndRemoveSomeStuff(tmp1);
  const array1 = tmp1.sort(pathCompare);
  const array2 = tmp2.sort(pathCompare);
  const set1 = new Set(array1);
  const set2 = new Set(array2);
  const actual_adds = Ops.SetDifference(set2, set1);
  const actual_subs = Ops.SetDifference(set1, set2);
  expect(addCount).toEqual(actual_adds.size);
  expect(subCount).toEqual(actual_subs.size);
  const subs = new Set<string>();
  const adds = new Set<string>();
  SortedArrayDiff(
    array1,
    array2,
    (str: string) => adds.add(str),
    (str: string) => subs.add(str),
  );
  expect(subs).toEqual(actual_subs);
  expect(adds).toEqual(actual_adds);
});

it('Make a little File Index', async () => {
  const fi = await MakeFileIndex('src/__tests__/FileIndexTest');
  expect(fi.getLocation()).toEqual('src/__tests__/FileIndexTest/');
  const files: string[] = [];
  fi.forEachFile((pathName: string) => files.push(pathName));
  expect(files.sort(pathCompare)).toEqual([
    'file1.txt',
    'file2.txt',
    'file3.tmp',
    'file4.dat',
  ]);
});

function isTxt(str: string) {
  return str.endsWith('.txt');
}
function notTxt(str: string) {
  return !isTxt(str);
}

it('Make a little File Index with only .txt files', async () => {
  const fi = await MakeFileIndex('src/__tests__/FileIndexTest2', isTxt);
  expect(fi.getLocation()).toEqual('src/__tests__/FileIndexTest2/');
  const files: string[] = [];
  fi.forEachFile((pathName: string) => files.push(pathName));
  expect(files.sort(pathCompare)).toEqual(['file1.txt', 'file2.txt']);
});

it('Make a little File Index without .txt files', async () => {
  const fi = await MakeFileIndex('src/__tests__/FileIndexTest3', notTxt);
  expect(fi.getLocation()).toEqual('src/__tests__/FileIndexTest3/');
  const files: string[] = [];
  fi.forEachFile((pathName: string) => files.push(pathName));
  expect(files.sort(pathCompare)).toEqual(['file3.tmp', 'file4.dat']);
});

it('Make a little File Index and see some file movement', async () => {
  const fi = await MakeFileIndex('src/__tests__/FileIndexTest3', notTxt);
  expect(fi.getLocation()).toEqual('src/__tests__/FileIndexTest3/');
  const files: string[] = [];
  fi.forEachFile((pathName: string) => files.push(pathName));
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

it('Make a little File Index and see some file movement', async () => {
  const fi = await MakeFileIndex('src/__tests__/FileIndexTest3', notTxt);
  await fi.rescanFiles();
  expect(fi.getLocation()).toEqual('src/__tests__/FileIndexTest3/');
  const files: string[] = [];
  fi.forEachFile((pathName: string) => files.push(pathName));
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
