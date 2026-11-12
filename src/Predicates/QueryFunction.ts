import { CollectionReference, Query } from '@google-cloud/firestore';

export type QueryFunction<T> = (ref: CollectionReference<T>) => Query<T>;
