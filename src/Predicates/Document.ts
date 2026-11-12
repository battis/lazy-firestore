import { DocumentReference } from '@google-cloud/firestore';

export type Document<T> = T extends null
  ? { data: null; ref: null }
  : { data: T; ref: DocumentReference<T> };
