import { Data } from '../index';

test('Encryption/Decryption', () => {
  const key = Data.MakeKey('This is a sample cypher key, I guess');
  expect(key.iv.length).toBe(16);
  expect(key.key.length).toBe(32);
  const buf = Buffer.from("Some text that I'd like to encrypt should go here");
  const encr = Data.Encrypt(key, buf);
  const decr = Data.Decrypt(key, encr);
  console.log(encr);
  console.log(decr);
  expect(buf.compare(decr)).toBe(0);
});
