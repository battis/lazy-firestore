import { Document } from '../Predicates/Document.js';
import { Stringency } from '../Predicates/Stringency.js';

interface Options<T> extends Stringency {
  list: Document<T>[];
}
/**
 * @throws Error if `list.length` > 1
 * @throws Error if `strict` and `list.length` === 0
 */
export function requireUnique<T extends object>({
  list,
  strict = true
}: Options<T>): typeof strict extends true ? Document<T> : Document<T | null> {
  if (list.length == 1) {
    return list[0];
  } else if (list.length) {
    throw new Error('Expected unique document, retrieved multiple', {
      cause: {
        count: list.length,
        paths: list.map((doc) => doc.ref.path)
      }
    });
  } else if (strict) {
    throw new Error('Expected exactly one document, retrieved none');
  }
  return { data: null, ref: null } as Document<null>;
}
