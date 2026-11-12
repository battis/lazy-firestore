import { Transaction } from '@google-cloud/firestore';

export type Atomic<T> = T & { transaction: Transaction };
