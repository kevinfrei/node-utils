import path from 'path';
import ofs from 'fs';

const fs = {
  readFileAsync: ofs.promises.readFile,
  readFileSync: ofs.readFileSync,
  writeFileAsync: ofs.promises.writeFile,
  writeFileSync: ofs.writeFileSync,
  statAsync: ofs.promises.stat,
  statSync: ofs.statSync,
};

export function size(file: string): number {
  try {
    return fs.statSync(file).size;
  } catch (e) {
    return -1;
  }
}

export async function sizeAsync(file: string): Promise<number> {
  try {
    return (await fs.statAsync(file)).size;
  } catch (e) {
    return -1;
  }
}

export function toTextFile(arr: string[], fileName: string): void {
  const sep: string = path.sep === '/' ? '\n' : '\r\n';
  const str: string = arr.join(sep);
  fs.writeFileSync(fileName, str);
}

const toTextFileAsync = async (
  arr: string[],
  fileName: string,
): Promise<void> => {
  const sep: string = path.sep === '/' ? '\n' : '\r\n';
  const str: string = arr.join(sep);
  await fs.writeFileAsync(fileName, str);
};

export function textFileToArray(fileName: string): string[] {
  const contents: string = fs.readFileSync(fileName, 'utf8');
  const resultArray = contents.split(/\n|\r/);
  return resultArray.filter((str) => str.trim().length > 0);
}

export async function textFileToArrayAsync(
  fileName: string,
): Promise<string[]> {
  const contents: string = await fs.readFileAsync(fileName, 'utf8');
  const resultArray = contents.split(/\n|\r/);
  return resultArray.filter((str) => str.trim().length > 0);
}

export {
  toTextFile as arrayToTextFile,
  toTextFileAsync as arrayToTextFileAsync,
};
