import { Semaphore } from '../src';
import { notWaiting } from './utils';
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
  describe('#acquireWith', function () {
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
});
