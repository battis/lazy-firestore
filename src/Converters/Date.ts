import { Converter } from './index.js';

/**
 * Firestore serializes Dates automatically, but the deserialization is _not_ automatic
 */

export const DateConverter: Converter<Date, string> = {
  deflate: (value: Date) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    throw new Error(`Cannot delate non-Date with DateConverter`, {
      cause: {
        type: typeof value,
        value: JSON.stringify(value, null, 2)
      }
    });
  },
  inflate: (value: string) => {
    try {
      return new Date(value);
    } catch (error) {
      throw new Error('Cannot inflate non-date with DateConverter', {
        cause: {
          value,
          error
        }
      });
    }
  }
};
