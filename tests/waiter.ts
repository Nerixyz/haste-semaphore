import sinon = require('sinon');
import { Waiter } from '../src/waiter';

describe('Waiter', function () {
  describe('permits', function () {
    it('should return the same number of permits configured', function () {
      const waiter = new Waiter(3, () => undefined);
      expect(waiter.permits).toBe(3);
    });
  });
  describe('wake', function () {
    it('should call the release function', function () {
      const promise = sinon.fake();
      const release = sinon.fake();

      const waiter = new Waiter(4, promise);

      waiter.wake(release);

      expect(promise.calledOnce).toBe(true);
      expect(release.callCount).toBe(0);

      const fn = promise.firstCall.firstArg;
      // the release function
      fn();
      release.calledOnceWithExactly(4);
    });

    it('should only allow one call to the release function', function () {
      // it's easier since typescript can't figure out that the function will be set after `wake()`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let waiterRelease: any = null;
      const release = sinon.fake();

      const waiter = new Waiter(4, rel => (waiterRelease = rel));
      waiter.wake(release);

      if (waiterRelease === null) {
        throw new Error('Waiter resolve function not called with release function');
      }

      expect(release.callCount).toBe(0);
      waiterRelease();
      release.calledOnceWithExactly(4);

      expect(() => waiterRelease()).toThrow();
      release.calledOnceWithExactly(4);

      expect(() => waiterRelease()).toThrow();
      release.calledOnceWithExactly(4);
    });
  });
});
