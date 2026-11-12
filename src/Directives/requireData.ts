import { DocumentSnapshot } from '@google-cloud/firestore';

/**
 * @throws Error if snapshot does not have defined data
 */
export function requireData<T>(snapshot: DocumentSnapshot<T>) {
  const data = snapshot.data();
  if (data === undefined) {
    throw new Error('Data undefined', { cause: { path: snapshot.ref.path } });
  }
  return data;
}
