import { MakeFileTypeWatcher } from '../FileTypeWatcher';

it('File Type Watcher Ignore, then Watch testing', () => {
  const ftw = MakeFileTypeWatcher();
  expect(ftw).toBeDefined();
  expect(ftw.watching('.txt')).toBe(true);
  expect(ftw.watching('.jpg')).toBe(true);
  expect(ftw.watching('.mp3')).toBe(true);
  ftw.addToIgnoreList('.txt');
  expect(ftw.watching('.txt')).toBe(false);
  expect(ftw.watching('.jpg')).toBe(true);
  expect(ftw.watching('.mp3')).toBe(true);
  ftw.addToWatchList('.mp3');
  expect(ftw.watching('.txt')).toBe(false);
  expect(ftw.watching('.jpg')).toBe(false);
  expect(ftw.watching('.mp3')).toBe(true);
});

it('File Type Watcher Watch, then Ignore testing', () => {
  const ftw = MakeFileTypeWatcher();
  ftw.addToWatchList('.mp3');
  expect(ftw.watching('.txt')).toBe(false);
  expect(ftw.watching('.jpg')).toBe(false);
  expect(ftw.watching('.mp3')).toBe(true);
  ftw.addToIgnoreList('.txt');
  expect(ftw.watching('.txt')).toBe(false);
  expect(ftw.watching('.jpg')).toBe(false);
  expect(ftw.watching('.mp3')).toBe(true);
});

it('File Type Watcher multiples testing', () => {
  const ftw = MakeFileTypeWatcher();
  ftw.addToIgnoreList('.txt', '.jpg');
  expect(ftw.watching('.txt')).toBe(false);
  expect(ftw.watching('.jpg')).toBe(false);
  expect(ftw.watching('.mp3')).toBe(true);
  expect(ftw.watching('.mp4')).toBe(true);
  ftw.addToWatchList(['.flac', '.mp3']);
  expect(ftw.watching('.txt')).toBe(false);
  expect(ftw.watching('.jpg')).toBe(false);
  expect(ftw.watching('.mp3')).toBe(true);
  expect(ftw.watching('.mp4')).toBe(false);
  expect(ftw.watching('.flac')).toBe(true);
});

it('File Type Watcher Chaining Ignore then Watch', () => {
  const ftw = MakeFileTypeWatcher()
    .addToIgnoreList(['.txt', '.jpg'])
    .addToWatchList(new Set(['.mp3', '.flac']));
  expect(ftw.watching('.txt')).toBe(false);
  expect(ftw.watching('.jpg')).toBe(false);
  expect(ftw.watching('.mp3')).toBe(true);
  expect(ftw.watching('.mp4')).toBe(false);
  expect(ftw.watching('.flac')).toBe(true);
});

it('File Type Watcher Chaining Watch then Ignore', () => {
  const ftw = MakeFileTypeWatcher()
    .addToWatchList('.mp3', ['.flac'])
    .addToIgnoreList(['.txt'], '.jpg');
  expect(ftw.watching('.txt')).toBe(false);
  expect(ftw.watching('.jpg')).toBe(false);
  expect(ftw.watching('.mp3')).toBe(true);
  expect(ftw.watching('.mp4')).toBe(false);
  expect(ftw.watching('.flac')).toBe(true);
});
