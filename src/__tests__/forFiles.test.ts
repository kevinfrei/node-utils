import { ForFiles, ForFilesSync } from '../index';

it('Very Basic', () => {
  const seen = Array<number>(7).fill(0);
  let count = 0;
  ForFilesSync(
    'src/__tests__/SubdirTest',
    (filename) => {
      count++;
      const dot = filename.lastIndexOf('.');
      expect(dot).toBe(filename.length - 4);
      const val = Number.parseInt(filename[dot - 1]);
      seen[val - 1]++;
      return true;
    },
    { recurse: true },
  );
  expect(count).toBe(8);
  ForFilesSync(
    'src/__tests__/SubdirTest',
    (filename) => {
      count++;
      const dot = filename.lastIndexOf('.');
      expect(dot).toBe(filename.length - 4);
      const val = Number.parseInt(filename[dot - 1]);
      seen[val - 1]++;
      return val !== 7;
    },
    { recurse: true },
  );
  expect(count).toBe(11);
  expect(seen).toEqual([2, 2, 1, 2, 1, 1, 2]);
});

it('Some file type filter', () => {
  let count = 0;
  ForFilesSync(
    'src/__tests__/SubdirTest/subdir2',
    (filename) => {
      count++;
      const dot = filename.lastIndexOf('.');
      expect(dot).toBe(filename.length - 4);
      return true;
    },
    { fileTypes: ['txt'] },
  );
  expect(count).toBe(3);
});

it('Very Basic Async', async () => {
  const seen = Array<number>(7).fill(0);
  let count = 0;
  await ForFiles(
    'src/__tests__/SubdirTest',
    (filename) => {
      count++;
      const dot = filename.lastIndexOf('.');
      expect(dot).toBe(filename.length - 4);
      const val = Number.parseInt(filename[dot - 1]);
      seen[val - 1]++;
      return true;
    },
    { recurse: true },
  );
  expect(count).toBe(8);
  await ForFiles(
    'src/__tests__/SubdirTest',
    async (filename) => {
      count++;
      const dot = filename.lastIndexOf('.');
      expect(dot).toBe(filename.length - 4);
      const val = Number.parseInt(filename[dot - 1]);
      seen[val - 1]++;
      return Promise.resolve(val !== 7);
    },
    { recurse: true },
  );
  expect(count).toBe(11);
  expect(seen).toEqual([2, 2, 1, 2, 1, 1, 2]);
});

it('Conditional recursion Async', async () => {
  const seen = Array<number>(7).fill(0);
  let count = 0;
  await ForFiles(
    'src/__tests__/SubdirTest',
    (filename) => {
      count++;
      const dot = filename.lastIndexOf('.');
      expect(dot).toBe(filename.length - 4);
      const val = Number.parseInt(filename[dot - 1]);
      seen[val - 1]++;
      return true;
    },
    { recurse: (dirName: string) => dirName.indexOf('3') < 0 },
  );
  expect(count).toBe(5);
  await ForFiles(
    'src/__tests__/SubdirTest',
    async (filename) => {
      count++;
      const dot = filename.lastIndexOf('.');
      expect(dot).toBe(filename.length - 4);
      const val = Number.parseInt(filename[dot - 1]);
      seen[val - 1]++;
      return Promise.resolve(val !== 7);
    },
    { recurse: (dirName: string) => dirName.indexOf('3') >= 0 },
  );
  expect(count).toBe(8);
  expect(seen).toEqual([1, 1, 1, 2, 1, 1, 1]);
});

it('Some file type filter async', async () => {
  let count = 0;
  await ForFiles(
    'src/__tests__/SubdirTest/subdir2',
    (filename) => {
      count++;
      const dot = filename.lastIndexOf('.');
      expect(dot).toBe(filename.length - 4);
      return true;
    },
    { fileTypes: ['txt'] },
  );
  expect(count).toBe(3);
});
