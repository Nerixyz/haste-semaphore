import { Semaphore } from '../src';

export function waiting(sem: Semaphore) {
  expect(sem.isWaiting).toBe(true);
}

export function notWaiting(sem: Semaphore) {
  expect(sem.isWaiting).toBe(false);
}

export function oneshot<T = void>(): { promise: Promise<T>, resolve: (value: T) => void, reject: (error: Error) => void } {
  let resolve = null;
  let reject = null;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  if(!resolve || !reject) {
    throw new Error("No resolve or reject");
  }

  return {promise, resolve, reject};
}

export function orderedThen() {
  let stage = 0;

  return {
    expect: (expectedStage: number) => () => {
      if (stage != expectedStage) {
        throw new Error(`Expected stage ${expectedStage} but was actually in stage ${stage}`);
      }
      stage++;
    }
  }
}
