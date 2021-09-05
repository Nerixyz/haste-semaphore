import { Semaphore } from '../src';
import { notWaiting } from './utils';

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
  })
});
