import { Waiter } from "./waiter";
import { MaybeAsyncFn, ReleaseFn } from './types';

export class Semaphore {
  #permits: number;
  #nextWaiter: null | Waiter = null;
  #lastWaiter: null | Waiter = null;
  #closed = false;

  get availablePermits() {
    return this.#permits;
  }

  get isWaiting() {
    return this.#nextWaiter !== null;
  }

  constructor(permits: number) {
    this.#permits = permits;
  }

  acquireWith<T>(fn: MaybeAsyncFn<T>): Promise<T> {
    return this.acquireManyWith(1, fn);
  }

  async acquireManyWith<T>(permits: number, fn: MaybeAsyncFn<T>): Promise<T> {
    const release = await this.acquireMany(permits);
    try {
      return await fn();
    } catch (e) {
      throw e;
    } finally {
      release();
    }
  }

  acquire(): Promise<ReleaseFn> {
    return this.acquireMany(1);
  }

  acquireMany(permits: number): Promise<ReleaseFn> {
    return new Promise<ReleaseFn>((resolve, reject) => {
      if(this.#closed) {
        reject(/* TODO */);
        // store max permits?
      } else {
        const waiter = new Waiter(permits, resolve);

        if(this.#lastWaiter !== null) {
          // put the waiter at the end of the list
          this.#lastWaiter.next = waiter;
          // replace the tail with the new waiter
          this.#lastWaiter = waiter;
        }

        if(this.#nextWaiter === null) {
          // the list is empty, we're the only ones waiting
          this.#nextWaiter = waiter;
          this.#lastWaiter = waiter;
        }

        this.#wakeWaiters();
      }
    });
  }

  #wakeWaiters() {
    while(this.#nextWaiter !== null && this.#permits >= this.#nextWaiter.permits) {
      this.#permits -= this.#nextWaiter.permits;
      this.#nextWaiter.wake(this.#releasePermits.bind(this));

      if(this.#lastWaiter === this.#nextWaiter) {
        // we're the last waiter - remove us
        this.#lastWaiter = null;
        this.#nextWaiter = null;

        // not really necessary since this.#nextWaiter will be null
        break;
      } else {
        this.#nextWaiter = this.#nextWaiter.next;
      }
    }
  }

  #releasePermits(permits: number) {
    this.#permits += permits;
    this.#wakeWaiters();
  }
}
