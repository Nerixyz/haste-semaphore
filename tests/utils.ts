import { Semaphore } from '../src';

export function notWaiting(sem: Semaphore) {
  expect(sem.isWaiting).toBe(false);
}
