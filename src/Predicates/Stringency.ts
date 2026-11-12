export interface Stringency {
  strict?: boolean;
}

export type Strict<S extends Stringency> = S & { strict?: true };
export type Relaxed<S extends Stringency> = S & { strict: false };
