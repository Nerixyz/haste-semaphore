import { Waiter } from './waiter';
import { MaybeAsyncFn, ReleaseFn } from './types';

export class Semaphore {
  #permits: number;
  #nextWaiter: null | Waiter = null;
  #lastWaiter: null | Waiter = null;

  get availablePermits() {
    return this.#permits;
  }

  get isWaiting() {
    return this.#nextWaiter !== null;
  }

  constructor(permits: number) {
    if (!Number.isSafeInteger(permits) || permits < 1) {
      throw new Error('Invalid number of permits specified');
    }
    this.#permits = permits;
  }

  /**
   * Acquire one permit with a callback that's called once the permits are acquired.
   * Throwing (or rejecting) in the callback is fine and properly handled.
   *
   * **The promise will never reject.**
   *
   * @param fn The callback function. It may return a promise which is then awaited.
   * @returns {Promise<T>} This promise resolves once the permits are released, i.e. when the callback has been called.
   * It resolves with the return value of the callback.
   */
  acquireWith<T>(fn: MaybeAsyncFn<T>): Promise<T> {
    return this.acquireManyWith(1, fn);
  }

  /**
   * Acquire many permits at once with a callback that's called once the permits are acquired.
   * Throwing (or rejecting) in the callback is fine and properly handled.
   *
   * **The promise will never reject.**
   *
   * If `permits` is greater than the maximum number of permits for this semaphore,
   * the promise will _never_ resolve and the semaphore will be blocked forever.
   * @param {number} permits The number of permits to acquire
   * @param fn The callback function. It may return a promise which is then awaited.
   * @returns {Promise<T>} This promise resolves once the permits are released, i.e. when the callback has been called.
   * It resolves with the return value of the callback.
   */
  async acquireManyWith<T>(permits: number, fn: MaybeAsyncFn<T>): Promise<T> {
    const release = await this.acquireMany(permits);
    try {
      return await fn();
      // we need to re-throw but still catch an error for the finally block
      // eslint-disable-next-line no-useless-catch
    } catch (e) {
      throw e;
    } finally {
      release();
    }
  }

  /**
   * Acquire one permit.
   *
   * **The promise will never reject.**
   * @returns {Promise<ReleaseFn>} The cleanup function. Call this function to release the permits.
   */
  acquire(): Promise<ReleaseFn> {
    return this.acquireMany(1);
  }

  /**
   * Acquire many permits at once.
   *
   * **The promise will never reject.**
   *
   * If `permits` is greater than the maximum number of permits for this semaphore,
   * the promise will _never_ resolve and the semaphore will be blocked forever.
   * @param {number} permits The number of permits to acquire
   * @returns {Promise<ReleaseFn>} The cleanup function. Call this function to release the permits.
   */
  acquireMany(permits: number): Promise<ReleaseFn> {
    return new Promise<ReleaseFn>(resolve => {
      const waiter = new Waiter(permits, resolve);

      if (this.#lastWaiter !== null) {
        // put the waiter at the end of the list
        this.#lastWaiter.next = waiter;
        // replace the tail with the new waiter
        this.#lastWaiter = waiter;
      }

      if (this.#nextWaiter === null) {
        // the list is empty, we're the only ones waiting
        this.#nextWaiter = waiter;
        this.#lastWaiter = waiter;
      }

      this.#wakeWaiters();
    });
  }

  #wakeWaiters() {
    while (this.#nextWaiter !== null && this.#permits >= this.#nextWaiter.permits) {
      this.#permits -= this.#nextWaiter.permits;
      this.#nextWaiter.wake(this.#releasePermits.bind(this));

      if (this.#lastWaiter === this.#nextWaiter) {
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
