import { UpdateData } from '@google-cloud/firestore';
import { Atomic } from './Predicates/Atomic.js';
import { Identifier } from './Predicates/Identifier.js';
import { QueryFunction } from './Predicates/QueryFunction.js';
import { Stringency } from './Predicates/Stringency.js';

export interface CreateOptions<T extends object> extends Stringency {
  data: T;
  id?: string;
  injectId?: string;
  query?: QueryFunction<T>;
}

export interface ReadOptions extends Stringency {
  id: string;
}

export interface ListOptions<T extends object> extends Stringency {
  query: QueryFunction<T>;
}

export interface UpdateOptions<T extends object>
  extends Stringency, Identifier<T> {
  patch: UpdateData<T>;
}

export interface DeleteOptions<T extends object>
  extends Stringency, Identifier<T> {}

export interface RequireIdentifierOptions<T extends object>
  extends Stringency, Atomic<Identifier<T>> {}
