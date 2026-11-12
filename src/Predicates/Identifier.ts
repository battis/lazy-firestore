import { QueryFunction } from './QueryFunction.js';

export interface Identifier<T> {
  id?: string;
  query?: QueryFunction<T>;
}
