/**
 * Custom Error Handling Framework
 *
 * A type-safe, fluent API error system with proper stack traces and deep merge support.
 *
 * Key Features:
 * - Proper ES6 class inheritance with Error.captureStackTrace()
 * - Private fields with getters for encapsulation
 * - Generic type parameter <T> for type-safe error data
 * - Factory function instead of metaprogramming
 * - Fluent API pattern with method chaining
 */

import { serializeError } from 'serialize-error';
import deepmerge from 'deepmerge';

export interface ErrorData<T = unknown> {
  message?: string;
  [key: string]: unknown;
}

export class AppError<T extends ErrorData = ErrorData> extends Error {
  private _status: number = 400;
  private _data?: T;
  private _innerError?: unknown;

  constructor(name: string, data?: T, innerError?: unknown) {
    super(data?.message ?? '');
    this.name = name;
    this._data = data;
    this._innerError = innerError;

    // Maintains proper stack trace in V8
    Error.captureStackTrace(this, this.constructor);
  }

  get status(): number {
    return this._status;
  }

  get data(): T | undefined {
    return this._data;
  }

  get innerError(): unknown {
    return this._innerError;
  }

  setStatus(status: number): this {
    this._status = status;
    return this;
  }

  setData(data: T): this {
    this._data = data;
    return this;
  }

  mergeData(data: Partial<T>): this {
    this._data = deepmerge(this._data ?? ({} as T), data) as T;
    return this;
  }

  setInnerError(error: unknown): this {
    this._innerError = serializeError(error);
    return this;
  }

  raise(): never {
    throw this;
  }
}

/**
 * Type-safe factory for creating error classes
 *
 * @example
 * const NotFoundError = createErrorClass<{ userId: string }>('NotFound');
 * const InvalidCredentialsError = createErrorClass<{ message: string }>('InvalidCredentials');
 *
 * throw new NotFoundError({ userId: '123' });
 * new InvalidCredentialsError({ message: 'Bad password' }).setStatus(401).raise();
 */
export function createErrorClass<T extends ErrorData = ErrorData>(name: string) {
  return class extends AppError<T> {
    static readonly errorName = name;
    constructor(data?: T, innerError?: unknown) {
      super(name, data, innerError);
    }
  };
}
