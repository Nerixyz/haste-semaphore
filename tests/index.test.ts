import { Semaphore } from '../src';
import { notWaiting, oneshot, orderedThen, waiting } from './utils';
import * as timers from 'timers/promises';

describe('Semaphore', function () {
  it('works', async function () {
    const semaphore = new Semaphore(1);
    notWaiting(semaphore);
    const drop = await semaphore.acquire();
    expect(semaphore.availablePermits).toBe(0);
    notWaiting(semaphore);
    drop();
    expect(semaphore.availablePermits).toBe(1);
    notWaiting(semaphore);
  });

  describe('constructor', function () {
    it('should construct valid instances', function () {
      new Semaphore(1);
      new Semaphore(5);
      new Semaphore(8);
      new Semaphore(Number.MAX_SAFE_INTEGER);
    });
    it('should throw if the number of permits is invalid', function () {
      expect(() => new Semaphore(-1)).toThrow();
      expect(() => new Semaphore(0)).toThrow();
      expect(() => new Semaphore(-5)).toThrow();
      expect(() => new Semaphore(Number.MIN_SAFE_INTEGER)).toThrow();
      expect(() => new Semaphore(-0.1)).toThrow();
      expect(() => new Semaphore(0.1)).toThrow();
      expect(() => new Semaphore(2.2)).toThrow();
      expect(() => new Semaphore(Infinity)).toThrow();
      expect(() => new Semaphore(NaN)).toThrow();
      expect(() => new Semaphore(Number.MAX_SAFE_INTEGER + 1)).toThrow();
      expect(() => new Semaphore(Number.MAX_VALUE)).toThrow();
    });
  });

  describe('with', function () {
    describe('one', function () {
      it('should work sync', async function () {
        const semaphore = new Semaphore(1);
        await expect(semaphore.acquireWith(() => 'xd')).resolves.toBe('xd');
        expect(semaphore.availablePermits).toBe(1);
        notWaiting(semaphore);
      });

      it('should work async', async function () {
        const semaphore = new Semaphore(1);
        await expect(semaphore.acquireWith(async () => 'xd')).resolves.toBe('xd');
        expect(semaphore.availablePermits).toBe(1);
        notWaiting(semaphore);
      });

      it('should await promises', async function () {
        const semaphore = new Semaphore(1);
        let check = false;
        await semaphore.acquireWith(async () => {
          await timers.setTimeout();
          check = true;
        });
        expect(check).toBe(true);
      });

      it('should rethrow in sync functions', async function () {
        const semaphore = new Semaphore(1);
        const promise = semaphore.acquireWith(() => {
          throw new Error('xd');
        });
        await expect(promise).rejects.toBeDefined();
        expect(semaphore.availablePermits).toBe(1);
        notWaiting(semaphore);
      });

      it('should rethrow in async functions', async function () {
        const semaphore = new Semaphore(1);
        const promise = semaphore.acquireWith(async () => {
          await timers.setTimeout();
          throw new Error('xd');
        });
        await expect(promise).rejects.toBeDefined();
        expect(semaphore.availablePermits).toBe(1);
        notWaiting(semaphore);
      });
    });
    describe('many', function () {
      it('should work sync', async function () {
        const semaphore = new Semaphore(4);
        await expect(semaphore.acquireManyWith(2, () => 'xd')).resolves.toBe('xd');
        expect(semaphore.availablePermits).toBe(4);
        notWaiting(semaphore);
      });

      it('should work async', async function () {
        const semaphore = new Semaphore(2);
        await expect(semaphore.acquireManyWith(2, async () => 'xd')).resolves.toBe('xd');
        expect(semaphore.availablePermits).toBe(2);
        notWaiting(semaphore);
      });

      it('should await promises', async function () {
        const semaphore = new Semaphore(8);
        let check = false;
        await semaphore.acquireManyWith(7, async () => {
          await timers.setTimeout();
          check = true;
        });
        expect(check).toBe(true);
      });

      it('should rethrow in sync functions', async function () {
        const semaphore = new Semaphore(4);
        const promise = semaphore.acquireManyWith(4, () => {
          throw new Error('xd');
        });
        await expect(promise).rejects.toBeDefined();
        expect(semaphore.availablePermits).toBe(4);
        notWaiting(semaphore);
      });

      it('should rethrow in async functions', async function () {
        const semaphore = new Semaphore(6);
        const promise = semaphore.acquireManyWith(4, async () => {
          await timers.setTimeout();
          throw new Error('xd');
        });
        await expect(promise).rejects.toBeDefined();
        expect(semaphore.availablePermits).toBe(6);
        notWaiting(semaphore);
      });
    });
  });

  describe('multiple waiters', function () {
    it('should handle multiple waiters correctly', async function () {
      const semaphore = new Semaphore(1);

      const ordered = orderedThen();

      const waiter1 = oneshot();
      const waiter2 = oneshot();
      const waiter3 = oneshot();

      const acq1 = semaphore.acquireWith(() => waiter1.promise).then(ordered.expect(0));
      const acq2 = semaphore.acquireWith(() => waiter2.promise).then(ordered.expect(1));
      const acq3 = semaphore.acquireWith(() => waiter3.promise).then(ordered.expect(2));

      waiting(semaphore);

      waiter1.resolve();
      await acq1;
      waiting(semaphore);

      waiter2.resolve();
      await acq2;
      waiter3.resolve();
      await acq3;
      notWaiting(semaphore);
    });
  });
});
