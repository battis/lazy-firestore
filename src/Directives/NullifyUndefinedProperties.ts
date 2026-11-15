export function nullifyUndefinedProperties<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).map(<P, V>([prop, value]: [string, any]) => {
      if (value === undefined || value === null) {
        return [prop, null];
      } else if (typeof value === 'object') {
        return [prop, nullifyUndefinedProperties(value)];
      }
      return [prop, value];
    })
  ) as T;
}
