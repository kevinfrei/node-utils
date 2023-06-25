import { ForDirs, ForFiles, ForFilesSync } from '../index';

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

it('Basic ForDirs test', async () => {
  let count = 0;
  const adder = (dirname: string) => {
    count++;
    return true;
  };
  // Recursion
  await ForDirs('src/__tests__/SubdirTest', adder, { recurse: true });
  expect(count).toBe(4);
  count = 0;
  // No recursion
  await ForDirs('src/__tests__/SubdirTest', adder, { recurse: false });
  expect(count).toBe(3);
  count = 0;
  // Filtering
  await ForDirs(
    'src/__tests__/SubdirTest',
    (dirname) => {
      count++;
      return !dirname.endsWith('subdir2');
    },
    { recurse: true, keepGoing: true },
  );
  expect(count).toBe(3);
});

it('Skipping hidden file tests', async () => {
  let ga = 0;
  let gi = 0;
  let pack = 0;
  // Filtering
  const counter = (filename: string): boolean => {
    switch (filename) {
      case '.gitattributes':
        ga++;
        break;
      case '.gitignore':
        gi++;
        break;
      case 'package.json':
        pack++;
        break;
    }
    return true;
  };
  await ForFiles('.', counter, {
    recurse: false,
    keepGoing: true,
    skipHiddenFiles: false,
    dontAssumeDotsAreHidden: true,
  });
  expect(ga).toEqual(1);
  expect(gi).toEqual(1);
  expect(pack).toEqual(1);
  await ForFiles('.', counter, {
    recurse: false,
    keepGoing: true,
    skipHiddenFiles: true,
    dontAssumeDotsAreHidden: true,
  });
  if (process.platform === 'win32') {
    expect(ga).toEqual(2);
  } else {
    expect(ga).toEqual(1);
  }
  expect(gi).toEqual(2);
  expect(pack).toEqual(2);
});
it('Stragglers', async () => {
  let jsonCount = 0;
  await ForFiles(
    '.',
    () => {
      jsonCount++;
      return true;
    },
    { fileTypes: 'json', recurse: false },
  );
  expect(jsonCount).toEqual(7);
  jsonCount = 0;
  ForFilesSync(
    '.',
    () => {
      jsonCount++;
      return true;
    },
    { fileTypes: 'json', recurse: false },
  );
  expect(jsonCount).toEqual(7);
  jsonCount = 0;
  await ForFiles(
    '.',
    () => {
      jsonCount++;
      return true;
    },
    { fileTypes: ['gif'], recurse: false },
  );
  expect(jsonCount).toEqual(0);
  jsonCount = 0;
  ForFilesSync(
    '.',
    () => {
      jsonCount++;
      return true;
    },
    { fileTypes: ['gif'], recurse: false },
  );
  expect(jsonCount).toEqual(0);
});
