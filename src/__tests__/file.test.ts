import { promises as fsp } from 'fs';
import { textFileToArrayAsync, arrayToTextFileAsync, hideFile } from '../file';
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

module.exports.getGitUser = async function getGitUser() {
  const name = await exec('git config --global user.name');
  const email = await exec('git config --global user.email');
  return { name, email };
};
test('array to text file and back again', async () => {
  const data = 'a b c d e f g';
  const fileName = 'textFile.txt';
  try {
    await fsp.unlink(fileName);
  } catch (e) {}
  await arrayToTextFileAsync(data.split(' '), fileName);
  const newData = await textFileToArrayAsync(fileName);
  const result = newData.join(' ');
  try {
    await fsp.unlink(fileName);
  } catch (e) {}
  expect(data).toEqual(result);
});

test('hiding a file on MacOS/Windows', async () => {
  const pathName = 'testFile.empty';
  if (process.platform === 'darwin') {
    try {
      await fsp.unlink(pathName);
    } catch (e) {}
    await arrayToTextFileAsync(['this', 'is', 'a', 'test'], pathName);
    const lsBefore = await exec('/bin/ls -lO');
    expect(lsBefore.stdout.indexOf(pathName)).toBeGreaterThanOrEqual(0);
    const newPath = await hideFile(pathName);
    expect(newPath).toEqual('.' + pathName);
    const lsAfter = await exec('/bin/ls -lO');
    expect(lsAfter.stdout.indexOf(pathName)).toBeLessThan(0);
    const lsHidden = await exec('/bin/ls -laO');
    const hidden = lsHidden.stdout.indexOf('hidden');
    const fileLoc = lsHidden.stdout.indexOf(pathName);
    expect(hidden).toBeLessThan(fileLoc);
    expect(hidden).toBeGreaterThan(fileLoc - 30);
    try {
      await fsp.unlink('.' + pathName);
      await fsp.unlink(pathName);
    } catch (e) {}
  } else if (process.platform === 'win32') {
    try {
      await fsp.unlink(pathName);
    } catch (e) {}
    await arrayToTextFileAsync(['this', 'is', 'a', 'test'], pathName);
    const lsBefore = await exec('dir');
    expect(lsBefore.stdout.indexOf(pathName)).toBeGreaterThanOrEqual(0);
    const newPath = await hideFile(pathName);
    expect(newPath).toEqual('.' + pathName);
    const lsAfter = await exec('dir');
    expect(lsAfter.stdout.indexOf(pathName)).toBeLessThan(0);
    const lsHidden = await exec('dir /a');
    const fileLoc = lsHidden.stdout.indexOf(pathName);
    expect(fileLoc).toBeGreaterThan(-1);
    try {
      await fsp.unlink('.' + pathName);
      await fsp.unlink(pathName);
    } catch (e) {}
  } else {
    console.log('hiding files NYI on Windows or Linux');
  }
});
