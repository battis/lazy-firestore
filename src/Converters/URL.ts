import { Converter } from './index.js';

export const URLConverter: Converter<URL, string> = {
  deflate: (value: URL) => {
    if (value instanceof URL) {
      return value.toString();
    }
    throw new Error('Cannot deflate non-URL with URLConverter', {
      cause: { type: typeof value, value: JSON.stringify(value, null, 2) }
    });
  },
  inflate: (value: string) => {
    try {
      return new URL(value);
    } catch (error) {
      throw new Error('Cannot inflate non_URL with URLConverter', {
        cause: { value, error }
      });
    }
  }
};
