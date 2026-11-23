import { Converter } from './index.js';

  deflate: (value: URL) => value.toString(),
  inflate: (value: string) => new URL(value)
export const URLConverter: Converter<URL, string> = {
};
