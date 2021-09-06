export type MaybeAsyncFn<T> = () => T | Promise<T>;

export type ReleaseFn = () => void;
