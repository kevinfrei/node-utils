import os from 'os';
import {
  changeExt,
  dirname,
  getExtNoDot,
  getRoots,
  getTemp,
  join,
  resolve,
  trailingSlash,
  xplat,
} from '../PathUtil';

it('temp file names', () => {
  const tmp = getTemp('MyTempFile');
  const tmpSfx = getTemp('ATempFile', 'sfx');
  expect(tmp.indexOf('MyTempFile')).toBeGreaterThan(2);
  expect(tmp.lastIndexOf('/')).toBeLessThan(tmp.indexOf('MyTempFile'));
  expect(tmpSfx.lastIndexOf('.sfx')).toBe(tmpSfx.length - 4);
});

it('File extension stuff', () => {
  const justExt = getExtNoDot('A/File/name.txt');
  expect(justExt).toBe('txt');
  const another = getExtNoDot('//a/file.nam/is.in.here');
  expect(another).toBe('here');
  const noExt = getExtNoDot('theFol.der/FIleName');
  expect(noExt).toBe('');
  const newExt1 = changeExt('abc', 'def');
  expect(newExt1).toBe('abc.def');
  const newExt2 = changeExt(newExt1, '.jpg');
  expect(newExt2).toBe('abc.jpg');
  const newExt3 = changeExt('abc', '.jpg');
  expect(newExt3).toBe('abc.jpg');
  const lastExt = changeExt('abc.def', 'ghi');
  expect(lastExt).toBe('abc.ghi');
});

it('A few other operations', () => {
  expect(xplat('/a/b')).toBe('/a/b');
  expect(xplat('\\a\\b')).toBe('/a/b');
  expect(trailingSlash('/a/b/c')).toBe('/a/b/c/');
  expect(trailingSlash('\\a/b\\c')).toBe('/a/b/c/');
  expect(trailingSlash('\\a\\b\\')).toBe('/a/b/');
  const prefix = os.platform() === 'win32' ? 'c:' : '';
  expect(resolve('/a/../b/c/..').toLowerCase()).toBe(prefix + '/b');
  expect(resolve('\\a\\.\\b\\c\\.').toLowerCase()).toBe(prefix + '/a/b/c');
  expect(join('a', 'b')).toBe('a/b');
  expect(join('a/b', 'c\\d')).toBe('a/b/c/d');
  expect(dirname('a/b')).toBe('a');
});

it('Roots', async () => {
  const roots = await getRoots();
  switch (os.platform()) {
    case 'darwin':
      for (const r of roots) {
        expect(r.indexOf('/Volumes/')).toBe(0);
      }
      break;
    case 'win32':
      for (const r of roots) {
        expect(r.indexOf(':')).toBe(1);
      }
      break;
    default:
      // Test for linux!
      expect(false).toBeTruthy();
  }
});
