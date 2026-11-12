import { PathString } from '@battis/descriptive-types';
import { Firestore, Settings, Transaction } from '@google-cloud/firestore';
import { convert, ConverterSpecification } from './Converters/index.js';
import { requireData } from './Directives/requireData.js';
import { requireUnique } from './Directives/requireUnique.js';
import {
  CreateOptions,
  DeleteOptions,
  ListOptions,
  ReadOptions,
  RequireIdentifierOptions,
  UpdateOptions
} from './Options.js';
import { Atomic } from './Predicates/Atomic.js';
import { Document } from './Predicates/Document.js';
import { Relaxed, Strict } from './Predicates/Stringency.js';

export interface CollectionOptions {
  /**
   * A Firestore instance where the collection is stored (do not also provide
   * additional `firestore` settings if `db` is provided)
   */
  db?: Firestore;

  /**
   * The `databaseId` for a Firestore database where the collection is stored
   */
  databaseId?: string;

  /**
   * The path to the collection within the Firestore dtabase
   */
  path: PathString;

  /**
   * {@link ConverterSpecification} for deflating/re-inflating data as it is
   * stored to and retrieved from Firestore
   */
  converter?: ConverterSpecification;

  /**
   * Any additional Firestore settings for a new instance (do not provide if
   * providing a `db` instance)
   */
  firestore?: Settings;
}

/**
 * A Firestore document collection with atomic CRUDL methods
 */
export class Collection<T extends object> {
  protected db;
  protected ref;

  /**
   * @throws Error if both `db` and `databaseId` are passed do not match
   * @throws Error if both `db` instance and `firestore` settings to
   *   construct an instance are provided
   */
  public constructor({
    db,
    databaseId,
    path,
    converter,
    firestore
  }: CollectionOptions) {
    this.db = db || new Firestore({ databaseId, ...firestore });
    if (db && databaseId && db.databaseId !== databaseId) {
      throw new Error(
        'Mismatch between provided Firestore instance and databaseId',
        { cause: { 'db.databaseId': db.databaseId, databaseId } }
      );
    }
    if (db && firestore) {
      throw new Error(
        'Both a Firestore instance and Firestore settings to construct an ' +
          'instance were provided'
      );
    }
    this.ref = this.db.collection(path).withConverter({
      toFirestore: (value: T) => convert('deflate', value, converter),
      fromFirestore: (snap) => convert('inflate', snap.data(), converter) as T
    });
  }

  /**
   * Create a new document.
   *
   * When `strict` is set to `true`, behaves as "create-if-not-exists",
   * searching for either or both the `id` and any `query` matches for
   * conflicting documents.
   *
   * @param strict defaults to `true`
   * @throws Error if `strict` and `id` provided and document already exists
   * @throws Error if `strict` and `query` provided and document(s) already
   *   exist
   * @throws Error if `id` is not a valid Firestore document ID
   * @returns `null` if not `strict` and either `id` or `query` finds
   *   pre-existing document
   */
  public create(options: Strict<CreateOptions<T>>): Promise<Document<T>>;
  public create(
    options: Relaxed<CreateOptions<T>>
  ): Promise<Document<T | null>>;
  public create(options: CreateOptions<T>): Promise<Document<T | null>>;
  public async create({
    data,
    id,
    query,
    injectId,
    strict = true
  }: CreateOptions<T>) {
    return await this.db.runTransaction(async (transaction: Transaction) => {
      if (id) {
        const snapshot = await transaction.get(this.ref.doc(id));
        if (snapshot.exists) {
          if (strict) {
            throw new Error(`Document already exists`, {
              cause: { id, path: snapshot.ref.path }
            });
          }
          return { data: null, ref: null };
        }
      }
      if (query) {
        const snapshot = await transaction.get(query(this.ref));
        if (snapshot.docs.length) {
          if (strict) {
            throw new Error(
              `Document${snapshot.docs.length > 1 ? 's' : ''} already exist${
                snapshot.docs.length > 1 ? '' : 's'
              }`,
              {
                cause: {
                  id,
                  paths: snapshot.docs.map((doc) => doc.ref.path)
                }
              }
            );
          }
          return { data: null, ref: null };
        }
      }
      const ref = id ? this.ref.doc(id) : this.ref.doc();
      try {
        transaction.create(ref, {
          ...data,
          ...(injectId ? { [injectId]: ref.id } : {})
        });
        return { data, ref };
      } catch (error) {
        throw new Error('Error creating document', {
          cause: { data, path: ref.path, error }
        });
      }
    });
  }

  /**
   * Read a specific document
   *
   * @param strict defaults to `true`
   * @throws Error if `strict` and identified document does not exist
   * @returns `null` if not `strict` and identified document does not exist
   */
  public read(options: Strict<ReadOptions>): Promise<Document<T>>;
  public read(options: Relaxed<ReadOptions>): Promise<Document<T | null>>;
  public read(options: ReadOptions): Promise<Document<T | null>>;
  public async read({
    strict,
    ...options
  }: ReadOptions): typeof strict extends true
    ? Promise<Document<T>>
    : Promise<Document<T | null>> {
    return await this.db.runTransaction(async (transaction) => {
      return this._read({ strict, ...options, transaction });
    });
  }

  /** Internal implementation of {@link read()} */
  private async _read({ id, strict = true, transaction }: Atomic<ReadOptions>) {
    const snapshot = await transaction.get(this.ref.doc(id));
    if (snapshot.exists) {
      return {
        data: requireData(snapshot),
        ref: snapshot.ref
      } as Document<T>;
    }
    if (strict) {
      throw new Error(`Document does not exist`, {
        cause: { path: snapshot.ref.path }
      });
    }
    return { data: null, ref: null };
  }

  /**
   * Update a specific document
   *
   * @param strict defaults to `true`
   * @throws Error if `strict` and identified document does not exist
   * @returns null if not `strict` and identified document does not exist
   */
  public update(options: Strict<UpdateOptions<T>>): Promise<Document<T>>;
  public update(
    options: Relaxed<UpdateOptions<T>>
  ): Promise<Document<T | null>>;
  public update(options: UpdateOptions<T>): Promise<Document<T | null>>;
  public async update({
    patch,
    strict = true,
    ...identifiers
  }: UpdateOptions<T>) {
    return await this.db.runTransaction(async (transaction) => {
      const { data, ref } = await this.requireIdentifier({
        ...identifiers,
        transaction,
        strict
      });
      if (ref) {
        const _patch = Object.fromEntries(
          Object.entries(patch).filter(([_, value]) => value !== undefined)
        );
        transaction.update(ref, _patch);
        return { data: { ...data, ..._patch }, ref } as Document<T>;
      } else if (strict) {
        throw new Error(`Could not find document to update`);
      }
      return { data: null, ref: null };
    });
  }

  /**
   * Delete a document
   *
   * TODO Expand to allow deleting multiple documents with `query` and not
   Issue URL: https://github.com/battis/lazy-firestorm/issues/1
   *   `strict`
   *
   * @param strict defaults to `true`
   * @throws Error if `strict` and identified document does not exist
   * @returns document that was deleted or `null` if not `strict` and identified
   *   document does not exist
   */
  public delete(options: Strict<DeleteOptions<T>>): Promise<Document<T>>;
  public delete(
    options: Relaxed<DeleteOptions<T>>
  ): Promise<Document<T | null>>;
  public delete(options: DeleteOptions<T>): Promise<Document<T | null>>;
  public async delete({ strict = true, ...identifiers }: DeleteOptions<T>) {
    return await this.db.runTransaction(async (transaction) => {
      const { data, ref } = await this.requireIdentifier({
        ...identifiers,
        transaction,
        strict: false
      });
      if (ref) {
        transaction.delete(ref);
        return { data, ref } as Document<T>;
      } else if (strict) {
        throw new Error(`Could not find document to delete`);
      }
      return { data: null, ref: null };
    });
  }

  /**
   * List matching documents
   *
   * @param strict defaults to `false`
   * @throws Error if `strict` and list is empty
   */
  public async list(options: ListOptions<T>): Promise<Document<T>[]> {
    return await this.db.runTransaction(async (transaction) => {
      return await this._list({ ...options, transaction });
    });
  }

  /** Internal implementation of {@link list()} */
  private async _list({
    query,
    transaction,
    strict = false
  }: Atomic<ListOptions<T>>): Promise<Document<T>[]> {
    const snapshot = await transaction.get(query(this.ref));
    if (strict && !snapshot.docs.length) {
      throw new Error('Empty list');
    }
    const result = snapshot.docs.map(
      (doc) =>
        ({
          data: requireData(doc),
          ref: doc.ref
        }) as Document<T>
    );
    return result;
  }

  /**
   * Internal helper to identify a unique document from `id` or `query`
   *
   * @param strict defaults to `true`
   * @throws Error if neither id or query provided
   * @throws Error if `strict` and no document is found
   */
  private requireIdentifier(
    options: Strict<RequireIdentifierOptions<T>>
  ): Promise<Document<T>>;
  private requireIdentifier(
    options: Relaxed<RequireIdentifierOptions<T>>
  ): Promise<Document<T | null>>;
  private requireIdentifier(
    options: RequireIdentifierOptions<T>
  ): Promise<Document<T | null>>;
  private async requireIdentifier({
    id,
    query,
    transaction,
    strict = true
  }: RequireIdentifierOptions<T>) {
    if (id) {
      return await this._read({ id, transaction, strict });
    } else if (query) {
      return requireUnique<T>({
        list: await this._list({ query, transaction, strict }),
        strict
      });
    }
    throw new Error(
      'Unique identifier required, neither id nor query provided'
    );
  }
}
