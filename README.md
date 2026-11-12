# @battis/lazy-firestore

Atomic CRUDL convenience wrapper for working with Firestore

[![npm version](https://badge.fury.io/js/@battis%2Fprettier.svg)](https://npmjs.com/package/@battis/prettier)
[![Module type: ESM](https://img.shields.io/badge/module%20type-esm-brightgreen)](https://nodejs.org/api/esm.html)

## Install

```bash
pnpm i @battis/lazy-firestore @google-cloud/firestore
```

### Use

```ts
import { Collection } from '@battis/lazy-firestore';
import { DateConverter } from '@battis/lazy-firestore/converters/date';
import { URLConverter } from '@battis/lazy-firestore/converters/url';
import { Firestore } from '@google-cloud/firestore';

interface Foo {
  foo: string;
  when: Date;
}

interface Bar {
  bar: number;
  where: URL;
}

interface Baz {
  baz: boolean;
  biz: string;
}

// if working with multiple collections, more efficient to pass a db than databaseId
const db = new Firestore({ databaseId: 'my-firestore-database' });

const colls = {
  foo: new Collection<Foo>({
    db,
    path: 'path/to/foo',
    converter: { when: DateConverter }
  }),
  bar: new Collection<Bar>({
    db,
    path: 'path/to/bar',
    converter: { where: URLConverter }
  }),
  // No converter needed because Baz is pure JSON
  baz: new Collection<Baz>({ db, path: 'path/to/baz' })
};

// create a new document (typed)
const id = (
  await colls.foo.create({ data: { foo: 'abc123', when: new Date() } })
).ref.id;

// read the document
let theFoo = (await colls.foo.read({ id })).data;

// update the document
theFoo = (await colls.foo.update({ id, patch: { foo: 'def446' } })).data;

// delete the document
await colls.foo.delete({ id });

// list documents
const foos = await colls.foo
  .list({
    query: (ref) => ref.where('when', '<', '2026-06-01')
  })
  .map((doc) => doc.data);
```

## Norms

### Atomicity

All methods are atomic -- all required database reads and writes are executed as a single transaction.

### Types

All argument properties and return types are strongly typed.

### `id` and/or `query`

In general, all methods take either an `id` value or a `query` function. When operating on a single record (`create`, `update`, `delete`) that query must return a unique documemt (employing the `requireUnique()` directive). `read` expects only an `id` value: if querying for a unique document, use:

```ts
requireUnique({ list: colls.foo.list(/*...*/) });
```

### Return values

The return types from all methods are simplified document structures: a `data` property containing the document's JSON data value and a `ref` property with the document reference information. For the `list` method, an array of these simplified documents is returned.

### Stringency

All methods accept a `strict` argument property.

| Method   | `strict` = `true`                                                                      | `strict` = `false`                                                      |
| -------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `create` | _Default_, equivalent of "create if not exists", and will throw an `Error` if it fails | Returns `null` on if a document matching `id` or `query` already exists |
| `read`   | _Default_, throws an error if the document is not found                                | Returns `null` on failure                                               |
| `update` | _Default_, throws an error if the document is not found                                | Returns `null` on failure                                               |
| `delete` | _Default_, throws an error if the docment is not found                                 | Returns `null` on failure                                               |
| `list`   | Throws an `Error` if no documents are found                                            | _Default_, return an empty list if no documents are found               |
