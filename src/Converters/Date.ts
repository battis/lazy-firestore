import { Converter } from './index.js';

/**
 * Firestore serializes Dates automatically, but the deserialization is _not_ automatic
 */

export const DateConverter: Converter<Date, string> = {
  deflate: (value: Date) => value.toISOString(),
  inflate: (value: string) => new Date(value)
};
