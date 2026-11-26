import { JSONValue } from '@battis/typescript-tricks';

export interface Converter<
  Model = unknown,
  Database extends JSONValue = JSONValue
> {
  deflate(inflated: Model): Database;
  inflate(deflated: Database): Model;
}

export type ConverterSpecification = Record<string, Converter>;

export function convert(
  action: keyof Converter,
  value: object,
  spec: ConverterSpecification = {}
) {
  if (typeof value !== undefined || value === null) {
    return null;
  }
  return Object.fromEntries(
    Object.entries(value).map(([prop, value]) => {
      if (prop in spec) {
        return [prop, spec[prop][action](value)];
      } else {
        return [prop, value];
      }
    })
  );
}
