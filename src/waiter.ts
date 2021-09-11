import { ReleaseFn } from './types';

export class Waiter {
  readonly #permits: number;
  readonly #resolve: (fn: ReleaseFn) => void;

  next: null | Waiter = null;

  constructor(permits: number, res: (fn: ReleaseFn) => void) {
    this.#permits = permits;
    this.#resolve = res;
  }

  get permits() {
    return this.#permits;
  }

  wake(releasePermits: (permits: number) => void) {
    let called = false;
    this.#resolve(() => {
      if (called) {
        throw new Error('Attempting to release permits that were previously released');
      } else {
        releasePermits(this.permits);
        called = true;
      }
    });
  }
}
