import crypto from 'node:crypto';
import { Converter } from './index.js';

interface Options {
  password: crypto.BinaryLike;
  salt: crypto.BinaryLike;
  algorithm: crypto.CipherGCMTypes;
  encoding: BufferEncoding;
}

type Wrapper = {
  iv: string;
  ciphertext: string;
  tag: string;
};

export function EncryptedString({
  password,
  salt,
  algorithm = 'aes-256-gcm',
  encoding = 'base64'
}: Options): Converter<string, Wrapper> {
  return {
    deflate: (plaintext: string) => {
      const key = crypto.scryptSync(password, salt, 32);
      const iv = crypto.randomFillSync(new Uint8Array(32));
      const cipher = crypto.createCipheriv(algorithm, key, iv);

      const ciphertext =
        cipher.update(plaintext, 'utf-8', encoding) + cipher.final(encoding);
      const tag = cipher.getAuthTag();
      return {
        iv: Buffer.from(iv).toString(encoding),
        ciphertext,
        tag: cipher.getAuthTag().toString(encoding)
      };
    },

    inflate: (wrapper: Wrapper) => {
      const key = crypto.scryptSync(password, salt, 32);
      const decipher = crypto.createDecipheriv(
        algorithm,
        key,
        Buffer.from(wrapper.iv, encoding)
      );
      const plaintext = decipher.update(wrapper.ciphertext, encoding, 'utf-8');
      decipher.setAuthTag(Buffer.from(wrapper.tag, encoding));
      decipher.final('utf-8');
      return plaintext;
    }
  };
}
