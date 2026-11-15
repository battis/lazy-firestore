export function deleteUndefinedProperties<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([prop, value]) => value !== undefined)
      .map(([prop, value]) =>
        value && typeof value === 'object'
          ? [prop, deleteUndefinedProperties(value)]
          : [prop, value]
      )
  ) as T;
}
