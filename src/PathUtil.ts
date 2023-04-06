import * as os from 'os';
import * as child from 'child_process';
import * as path from 'path';
import { promises as fsp } from 'fs';
import { promisify } from 'util';

const exec = promisify(child.exec);

export function getTemp(name: string, ext?: string): string {
  const extension: string = ext && ext[0] !== '.' ? '.' + ext : ext ? ext : '';
  return path.join(os.tmpdir(), `${name}-tmp-${process.pid}${extension}`);
}

export function getExtNoDot(fileName: string): string {
  const ext: string = path.extname(fileName);
  if (!ext) return ext;
  return ext.substring(1);
}

export function changeExt(fileName: string, newExt: string): string {
  const ext: string = getExtNoDot(fileName);
  if (newExt && newExt.length > 1 && newExt[0] === '.') {
    newExt = newExt.substring(1);
  }
  let baseName = fileName.substring(0, fileName.length - ext.length);
  if (!baseName.endsWith('.')) {
    baseName += '.';
  }
  return baseName + newExt;
}

// Backslashes are annoying
export function xplat(pathName: string): string {
  return pathName.replaceAll('\\', '/');
}

// Make sure the path has a final slash on it
export function trailingSlash(pathName: string): string {
  if (pathName.endsWith('\\') || pathName.endsWith('/')) {
    return xplat(pathName);
  } else {
    return xplat(pathName + path.sep);
  }
}

// xplat helpers
export function resolve(pathName: string): string {
  return xplat(path.resolve(xplat(pathName)));
}

export function join(...pathNames: string[]): string {
  return xplat(path.join(...pathNames));
}

export function dirname(pathname: string): string {
  return xplat(path.dirname(pathname));
}

export async function getRoots(): Promise<string[]> {
  switch (os.platform()) {
    case 'win32':
      const { stdout, stderr } = await exec('wmic logicaldisk get name');
      if (stderr.length > 0) {
        return [];
      }
      return stdout
        .split('\r\r\n')
        .filter((value) => /[A-Za-z]:/.test(value))
        .map((value) => value.trim());
    case 'darwin':
      const subdirs = await fsp.readdir('/Volumes');
      return subdirs.map((v) => path.join('/Volumes', v));
    default:
      // TODO: Linux support
      return ['linux NYI'];
  }
}

// eslint-disable-next-line @typescript-eslint/unbound-method
export const basename = path.basename;
// eslint-disable-next-line @typescript-eslint/unbound-method
export const extname = path.extname;
