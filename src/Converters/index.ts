import { JSONValue } from '@battis/typescript-tricks';

export interface Converter<T = unknown, V extends JSONValue = JSONValue> {
  deflate(value: T): V;
  inflate(value: V): T;
}

export type ConverterSpecification = Record<string, Converter>;

export function convert(
  action: keyof Converter,
  value: object,
  spec: ConverterSpecification = {},
  path?: string
): object {
  if (typeof value !== 'object' || value === null) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value).map(([prop, value]) => {
      const key = `${path || ''}${!!path ? '.' : ''}${prop}`;
      if (key in spec) {
        return [prop, spec[key][action](value)];
      } else if (Array.isArray(value)) {
        return [
          prop,
          value.map((elt, i) => convert(action, elt, spec, `${key}[${i}]`))
        ];
      } else if (typeof value === 'object') {
        return [prop, convert(action, value, spec, key)];
      } else {
        return [prop, value];
      }
    })
  );
}
