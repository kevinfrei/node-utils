import { spawnAsync, spawnRes, spawnResAsync } from '../ProcUtil';

it('spawnAsync test 1', async () => {
  const res = await spawnAsync('git', ['status']);
  expect(res.stdout.indexOf('On branch ')).toBe(0);
});
it('spawnAsync test 2', async () => {
  const badRes = await spawnAsync('yarn', ['shit']);
  //  console.log(badRes);
  expect(badRes.status).toBe(1);
  expect(badRes.stdout.indexOf('Usage Error')).toBeGreaterThanOrEqual(0);
});
it('spawnAsync test 3', async () => {
  const res2 = await spawnAsync('clang');
  expect(res2.status).toBe(1);
  expect(res2.stderr.indexOf('clang error: no input files')).toBe(-1);
  //  expect(res2.stderr.length).toBeGreaterThan(0);
});
it('spawnAsync test 4', async () => {
  const res3 = await spawnResAsync('git', ['status']);
  expect(res3).toBeTruthy();
});
it('more spawn async tests', async () => {
  try {
    const res4 = await spawnResAsync('clang', undefined, { env: { a: 'b' } });
    expect(res4).toBeFalsy();
  } catch (e) {
    console.log(e);
  }
  const badRe2 = await spawnResAsync('yarn', ['shit']);
  expect(badRe2).toBeFalsy();
});

it('spawnRes test 1', () => {
  const res = spawnRes('git', ['status']);
  expect(res).toBeTruthy();
});
it('spawnRes test 12', () => {
  const res2 = spawnRes('git', undefined, { timeout: 1 });
  expect(res2).toBeFalsy();
});
it('spawnRes test 3', () => {
  const badRes = spawnRes('yarn', ['shit']);
  //  console.log(badRes);
  expect(badRes).toBeFalsy();
});
