import { Converter } from './index.js';

export const DateConverter: Converter<URL, string> = {
  deflate: (value: URL) => value.toString(),
  inflate: (value: string) => new URL(value)
};
