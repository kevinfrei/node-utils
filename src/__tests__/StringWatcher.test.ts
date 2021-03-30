import { MakeStringWatcher } from '../StringWatcher';

it('File Type Watcher Ignore, then Watch testing', () => {
  const ftw = MakeStringWatcher();
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
  const ftw = MakeStringWatcher();
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
  const ftw = MakeStringWatcher();
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
  const ftw = MakeStringWatcher()
    .addToIgnoreList(['.txt', '.jpg'])
    .addToWatchList(new Set(['.mp3', '.flac']));
  expect(ftw.watching('.txt')).toBe(false);
  expect(ftw.watching('.jpg')).toBe(false);
  expect(ftw.watching('.mp3')).toBe(true);
  expect(ftw.watching('.mp4')).toBe(false);
  expect(ftw.watching('.flac')).toBe(true);
});

it('File Type Watcher Chaining Watch then Ignore', () => {
  const ftw = MakeStringWatcher()
    .addToWatchList('.mp3', ['.flac'])
    .addToIgnoreList(['.txt'], '.jpg');
  expect(ftw.watching('.txt')).toBe(false);
  expect(ftw.watching('.jpg')).toBe(false);
  expect(ftw.watching('.mp3')).toBe(true);
  expect(ftw.watching('.mp4')).toBe(false);
  expect(ftw.watching('.flac')).toBe(true);
});

it('File Type Watcher Chaining Watch then Ignore, with direct function call', () => {
  const ftw = MakeStringWatcher()
    .addToWatchList('.mp3', ['.flac'])
    .addToIgnoreList(['.txt'], '.jpg');
  expect(ftw('.txt')).toBe(false);
  expect(ftw('.jpg')).toBe(false);
  expect(ftw('.mp3')).toBe(true);
  expect(ftw('.flac')).toBe(true);
  expect(ftw('.mp4')).toBe(false);
});
