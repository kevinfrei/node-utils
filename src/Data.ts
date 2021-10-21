import crypto from 'node:crypto';

export type Private = { salt: string; content: string };

const algorithm = 'aes-256-ctr';
const secretKey = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';
const salt = crypto.randomBytes(16);

export function Encrypt(text: string): Private {
  const cipher = crypto.createCipheriv(algorithm, secretKey, salt);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return {
    salt: salt.toString('hex'),
    content: encrypted.toString('hex'),
  };
}

export function Decrypt(hash: Private): string {
  const decipher = crypto.createDecipheriv(
    algorithm,
    secretKey,
    Buffer.from(hash.salt, 'hex'),
  );
  const decrpyted = Buffer.concat([
    decipher.update(Buffer.from(hash.content, 'hex')),
    decipher.final(),
  ]);
  return decrpyted.toString();
}
