import os from 'os';
import path from 'path';

export function getTemp(name: string, ext?: string): string {
  const extension: string = ext && ext[0] !== '.' ? '.' + ext : ext ? ext : '';
  return path.join(os.tmpdir(), `${name}-tmp-${process.pid}${extension}`);
}

export function getExtNoDot(fileName: string): string {
  const ext: string = path.extname(fileName);
  if (!ext) return ext;
  return ext.substr(1);
}

export function changeExt(fileName: string, newExt: string): string {
  const ext: string = getExtNoDot(fileName);
  if (newExt && newExt.length > 1 && newExt[0] === '.') {
    newExt = newExt.substr(1);
  }
  return fileName.substr(0, fileName.length - ext.length) + newExt;
}

// Backslashes are annoying
export function xplat(pathName: string): string {
  return pathName.replaceAll('\\', '/');
}

// Make sure the path has a final slash on it
export function trailingSlash(pathName: string): string {
  if (pathName.endsWith(path.sep) || pathName.endsWith('/')) {
    return xplat(pathName);
  } else {
    return xplat(pathName + path.sep);
  }
}

// xplat helpers
export function resolve(pathName: string): string {
  return xplat(path.resolve(pathName));
}

export function join(...pathNames: string[]): string {
  return xplat(path.join(...pathNames));
}

export function dirname(pathname: string): string {
  return xplat(path.dirname(pathname));
}

// eslint-disable-next-line @typescript-eslint/unbound-method
export const basename = path.basename;
// eslint-disable-next-line @typescript-eslint/unbound-method
export const extname = path.extname;
