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

// Make sure the path has a final slash on it
export function trailingSlash(pathName: string): string {
  if (pathName.endsWith(path.sep)) {
    return pathName;
  } else {
    return pathName + path.sep;
  }
}
