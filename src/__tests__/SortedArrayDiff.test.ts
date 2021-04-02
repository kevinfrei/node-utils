import { Operations as Ops } from '@freik/core-utils';
import { pathCompare, SortedArrayDiffSync } from '../index';

it('SortedArrayDiff', () => {
  const array1 = ['a', 'b', 'd', 'f'];
  const array2 = ['b', 'e', 'f'];
  const subs: string[] = [];
  const adds: string[] = [];
  SortedArrayDiffSync(
    array1,
    array2,
    (str: string) => adds.push(str),
    (str: string) => subs.push(str),
  );
  expect(adds).toEqual(['e']);
  expect(subs).toEqual(['a', 'd']);
});

it('SortedArrayDiff - case insensitive validation', () => {
  const array1 = ['B', 'e', 'f'];
  const array2 = ['a', 'b', 'd', 'F'];
  const subs: string[] = [];
  const adds: string[] = [];
  SortedArrayDiffSync(
    array1,
    array2,
    (str: string) => adds.push(str),
    (str: string) => subs.push(str),
  );
  expect(adds).toEqual(['a', 'd']);
  expect(subs).toEqual(['e']);
});

function GetNumber(max: number): number {
  return Math.floor(Math.random() * max);
}

function GenerateRandomString(len: number): string {
  let str = '';
  for (var i = 0; i < len; i++) {
    str += String.fromCharCode(GetNumber(0x1fdf) + 32);
  }
  return str;
}

function GenerateRandomArray(): string[] {
  return Array.from({ length: GetNumber(200) + 100 }, () =>
    GenerateRandomString(GetNumber(5) + 5),
  );
}

function AddAndRemoveSomeStuff(
  arr: string[],
): { addCount: number; subCount: number; val: string[] } {
  const val: string[] = [];
  let subCount = 0;
  let addCount = 0;
  for (let i = 0; i < arr.length; i++) {
    const which = GetNumber(4);
    if (which === 0) {
      addCount++;
      val.push(GenerateRandomString(GetNumber(5) + 5));
      i--;
    } else if (which < 3) {
      val.push(arr[i]);
    } else {
      subCount++;
    }
  }
  return { val, subCount, addCount };
}

it('Random SortedArrayDiff testing', () => {
  const tmp1 = GenerateRandomArray();
  const { addCount, subCount, val: tmp2 } = AddAndRemoveSomeStuff(tmp1);
  const array1 = tmp1.sort(pathCompare);
  const array2 = tmp2.sort(pathCompare);
  const set1 = new Set(array1);
  const set2 = new Set(array2);
  const actual_adds = Ops.SetDifference(set2, set1);
  const actual_subs = Ops.SetDifference(set1, set2);
  expect(addCount).toEqual(actual_adds.size);
  expect(subCount).toEqual(actual_subs.size);
  const subs = new Set<string>();
  const adds = new Set<string>();
  SortedArrayDiffSync(
    array1,
    array2,
    (str: string) => adds.add(str),
    (str: string) => subs.add(str),
  );
  expect(subs).toEqual(actual_subs);
  expect(adds).toEqual(actual_adds);
});
