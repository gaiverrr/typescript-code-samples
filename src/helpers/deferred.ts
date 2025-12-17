/**
 * Deferred Promise Pattern
 *
 * Creates a promise with externally accessible resolve/reject functions.
 * Useful for event-driven patterns and bridging callback-based APIs.
 *
 * Key Features:
 * - Type-safe generic implementation
 * - External control over promise resolution
 * - Timeout support
 * - Status tracking
 */

/**
 * Deferred promise interface
 */
export interface Deferred<T> {
  /** The promise to await */
  readonly promise: Promise<T>;
  /** Resolve the promise with a value */
  resolve: (value: T | PromiseLike<T>) => void;
  /** Reject the promise with a reason */
  reject: (reason?: unknown) => void;
  /** Check if the promise has been settled */
  readonly isSettled: boolean;
  /** Check if the promise was resolved */
  readonly isResolved: boolean;
  /** Check if the promise was rejected */
  readonly isRejected: boolean;
}

/**
 * Create a deferred promise
 *
 * @example
 * // Basic usage
 * const deferred = defer<string>();
 *
 * // Later, resolve it
 * deferred.resolve('success');
 *
 * // Or reject it
 * deferred.reject(new Error('failed'));
 *
 * // Await the result
 * const result = await deferred.promise;
 *
 * @example
 * // Event-driven pattern
 * function waitForEvent<T>(emitter: EventEmitter, event: string): Promise<T> {
 *   const deferred = defer<T>();
 *
 *   emitter.once(event, (data: T) => deferred.resolve(data));
 *   emitter.once('error', (err) => deferred.reject(err));
 *
 *   return deferred.promise;
 * }
 *
 * @example
 * // With timeout
 * const deferred = deferWithTimeout<string>(5000);
 * // Will reject after 5 seconds if not resolved
 */
export function defer<T>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  let isSettled = false;
  let isResolved = false;
  let isRejected = false;

  const promise = new Promise<T>((res, rej) => {
    resolve = (value: T | PromiseLike<T>) => {
      if (!isSettled) {
        isSettled = true;
        isResolved = true;
        res(value);
      }
    };

    reject = (reason?: unknown) => {
      if (!isSettled) {
        isSettled = true;
        isRejected = true;
        rej(reason);
      }
    };
  });

  return {
    promise,
    resolve,
    reject,
    get isSettled() {
      return isSettled;
    },
    get isResolved() {
      return isResolved;
    },
    get isRejected() {
      return isRejected;
    },
  };
}

/**
 * Create a deferred promise with automatic timeout
 *
 * @param timeoutMs - Timeout in milliseconds
 * @param timeoutMessage - Custom timeout error message
 *
 * @example
 * const deferred = deferWithTimeout<string>(5000, 'Operation timed out');
 *
 * try {
 *   const result = await deferred.promise;
 * } catch (err) {
 *   if (err.message === 'Operation timed out') {
 *     // Handle timeout
 *   }
 * }
 */
export function deferWithTimeout<T>(
  timeoutMs: number,
  timeoutMessage = 'Operation timed out',
): Deferred<T> & { clearTimeout: () => void } {
  const deferred = defer<T>();

  const timeoutId = setTimeout(() => {
    deferred.reject(new Error(timeoutMessage));
  }, timeoutMs);

  const originalResolve = deferred.resolve;
  const originalReject = deferred.reject;

  return {
    ...deferred,
    resolve: (value: T | PromiseLike<T>) => {
      clearTimeout(timeoutId);
      originalResolve(value);
    },
    reject: (reason?: unknown) => {
      clearTimeout(timeoutId);
      originalReject(reason);
    },
    clearTimeout: () => clearTimeout(timeoutId),
  };
}

/**
 * Create multiple deferred promises and wait for all
 *
 * @example
 * const deferreds = deferAll<string>(3);
 *
 * // Resolve each one
 * deferreds[0].resolve('first');
 * deferreds[1].resolve('second');
 * deferreds[2].resolve('third');
 *
 * // Wait for all
 * const results = await Promise.all(deferreds.map(d => d.promise));
 */
export function deferAll<T>(count: number): Deferred<T>[] {
  return Array.from({ length: count }, () => defer<T>());
}

/**
 * Create a deferred that resolves after a delay
 *
 * @example
 * const delayed = deferDelayed('result', 1000);
 * const result = await delayed.promise; // resolves after 1 second
 */
export function deferDelayed<T>(value: T, delayMs: number): Deferred<T> {
  const deferred = defer<T>();
  setTimeout(() => deferred.resolve(value), delayMs);
  return deferred;
}
