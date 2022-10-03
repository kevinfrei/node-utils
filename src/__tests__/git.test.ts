import { Type } from '@freik/core-utils';
import { Git } from '../index';

it('Simple git.files tests', async () => {
  const files = await Git.files({ all: true });
  expect(Type.isArray(files)).toBeTruthy();
  expect(files.length).toBeGreaterThan(25);
  expect(files.length).toBeLessThan(100);

  const noFiles = await Git.files();
  // This will fail if we have any edits :/
  // expect(Type.isArray(noFiles)).toBeTruthy();
  // This will faile if we have *all* files edited...
  expect(noFiles.length).toBeLessThan(files.length);
});

it('Grouped git.files tests', async () => {
  const files = await Git.files({
    all: true,
    groups: {
      prettier: (filename: string) => {
        if (filename === '.prettierrc') {
          return true;
        }
        return /\.(ts|tsx|js|jsx|md|html|css|json)$/i.test(filename);
      },
      clang: /\.(cpp|c|cc|h|hh|hpp)$/i,
      other: (_fn) => false,
    },
  });
  if (!Type.isMapOf(files.groups, Type.isString, Type.isArrayOfString)) {
    expect(files).toEqual('wrong type');
  }
  expect(files.remaining.length).toBeGreaterThan(10);
  const grps = files.groups;
  expect(grps.size).toEqual(1);
  expect(grps.get('clang')).toBeUndefined();
  expect(grps.get('other')).toBeUndefined();
  const p = grps.get('prettier');
  if (Type.isUndefined(p)) {
    expect('prettier not defined').toEqual('oops');
    throw 'oops';
  }
  expect(p.length).toBeGreaterThan(15);
});
