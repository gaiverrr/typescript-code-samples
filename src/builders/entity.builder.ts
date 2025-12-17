/**
 * Generic Entity Builder
 *
 * Fluent builder pattern for constructing entities and DTOs.
 * Useful for test fixtures, factory patterns, and complex object construction.
 *
 * Key Features:
 * - Generic type parameter for any entity type
 * - Fluent API with method chaining
 * - Partial initialization support
 * - Type-safe property assignment
 * - Individual property setters via Proxy (optional pattern)
 */

/**
 * Base builder class with fluent API
 *
 * @example
 * // Simple usage
 * const user = new EntityBuilder<User>()
 *   .set({ name: 'John', email: 'john@example.com' })
 *   .set({ age: 30 })
 *   .build();
 *
 * @example
 * // With initial data
 * const user = new EntityBuilder<User>({ id: '123' })
 *   .set({ name: 'John' })
 *   .build();
 */
export class EntityBuilder<T extends object> {
  protected data: Partial<T> = {};

  constructor(initial?: Partial<T>) {
    if (initial) {
      this.set(initial);
    }
  }

  /**
   * Set multiple properties at once
   */
  set(data: Partial<T>): this {
    Object.assign(this.data, data);
    return this;
  }

  /**
   * Set a single property
   */
  setProperty<K extends keyof T>(key: K, value: T[K]): this {
    this.data[key] = value;
    return this;
  }

  /**
   * Build the final object
   * Override in subclasses for custom construction logic
   */
  build(): T {
    return this.data as T;
  }

  /**
   * Get current data (useful for inspection during building)
   */
  getData(): Partial<T> {
    return { ...this.data };
  }

  /**
   * Reset the builder to initial state
   */
  reset(): this {
    this.data = {};
    return this;
  }
}

/**
 * Extended builder with default values support
 *
 * @example
 * class UserBuilder extends DefaultsEntityBuilder<User> {
 *   protected getDefaults(): Partial<User> {
 *     return {
 *       role: 'user',
 *       isActive: true,
 *       createdAt: new Date(),
 *     };
 *   }
 * }
 *
 * const user = new UserBuilder()
 *   .set({ name: 'John', email: 'john@example.com' })
 *   .build();
 * // Result: { name: 'John', email: '...', role: 'user', isActive: true, createdAt: Date }
 */
export abstract class DefaultsEntityBuilder<T extends object> extends EntityBuilder<T> {
  constructor(initial?: Partial<T>) {
    super();
    // Apply defaults first, then initial data
    this.data = { ...this.getDefaults(), ...initial };
  }

  /**
   * Override to provide default values
   */
  protected abstract getDefaults(): Partial<T>;

  /**
   * Build with defaults merged
   */
  override build(): T {
    return { ...this.getDefaults(), ...this.data } as T;
  }
}

/**
 * Builder with validation support
 *
 * @example
 * class UserBuilder extends ValidatedEntityBuilder<User> {
 *   protected validate(data: Partial<User>): void {
 *     if (!data.email) throw new Error('Email is required');
 *     if (!data.name) throw new Error('Name is required');
 *   }
 * }
 */
export abstract class ValidatedEntityBuilder<T extends object> extends EntityBuilder<T> {
  /**
   * Override to implement validation logic
   * Throw an error if validation fails
   */
  protected abstract validate(data: Partial<T>): void;

  override build(): T {
    this.validate(this.data);
    return this.data as T;
  }

  /**
   * Check if current data is valid without throwing
   */
  isValid(): boolean {
    try {
      this.validate(this.data);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Factory function to create typed builders quickly
 *
 * @example
 * interface Product {
 *   id: string;
 *   name: string;
 *   price: number;
 * }
 *
 * const createProduct = createBuilderFactory<Product>();
 * const product = createProduct({ name: 'Widget' })
 *   .set({ price: 9.99 })
 *   .build();
 */
export function createBuilderFactory<T extends object>() {
  return (initial?: Partial<T>) => new EntityBuilder<T>(initial);
}

/**
 * Utility type for builder result
 */
export type BuilderResult<B extends EntityBuilder<unknown>> =
  B extends EntityBuilder<infer T> ? T : never;
