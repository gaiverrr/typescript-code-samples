/**
 * Object Diff Utility
 *
 * Comprehensive object comparison with detailed change tracking.
 *
 * Key Features:
 * - Proper type definitions with DiffChange interface
 * - Set for O(1) lookups in array/object key comparison
 * - Deep array comparison using JSON serialization
 * - Type narrowing with type guard NonNullable<DiffResult>
 * - `readonly` properties on interfaces
 * - Nullish checks with `== null` pattern
 */

type Primitive = string | number | boolean | null | undefined;

interface DiffChange {
  readonly description: string;
  readonly oldValue?: unknown;
  readonly newValue?: unknown;
  readonly added?: unknown;
  readonly removed?: unknown;
  readonly properties?: Record<string, unknown> | string[];
}

export type DiffResult = Record<string, DiffChange | DiffResult[]> | null;

function isPrimitive(value: unknown): value is Primitive {
  return value === null || typeof value !== 'object';
}

function serializeValue(value: unknown): string {
  return JSON.stringify(value);
}

/**
 * Compare two values and return detailed differences
 *
 * @example
 * const changes = diff(oldUser, newUser, 'user');
 * console.log(changes);
 * // Output: { user: [{ description: 'Value changed', oldValue: 'John', newValue: 'Jane' }] }
 */
export function diff(
  oldValue: unknown,
  newValue: unknown,
  name: string,
): DiffResult {
  // Both nullish - no difference
  if (oldValue == null && newValue == null) return null;

  const oldType = typeof oldValue;
  const newType = typeof newValue;

  // Type changed
  if (oldType !== newType) {
    return {
      [name]: {
        description: `Type changed from ${oldType} to ${newType}`,
        oldValue: serializeValue(oldValue),
        newValue: serializeValue(newValue),
      },
    };
  }

  // Property added
  if (oldValue == null && newValue != null) {
    return {
      [name]: {
        description: 'Property added',
        newValue: serializeValue(newValue),
      },
    };
  }

  // Property removed
  if (oldValue != null && newValue == null) {
    return {
      [name]: {
        description: 'Property removed',
        oldValue: serializeValue(oldValue),
      },
    };
  }

  // Array comparison (deep using serialization)
  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    const oldSerialized = new Set(oldValue.map(serializeValue));
    const newSerialized = new Set(newValue.map(serializeValue));

    const added = newValue.filter(
      (x) => !oldSerialized.has(serializeValue(x)),
    );
    const removed = oldValue.filter(
      (x) => !newSerialized.has(serializeValue(x)),
    );

    if (!added.length && !removed.length) return null;

    return {
      [name]: {
        description: 'Array modified',
        ...(removed.length && { removed: serializeValue(removed) }),
        ...(added.length && { added: serializeValue(added) }),
      },
    };
  }

  // Object comparison (recursive)
  if (typeof oldValue === 'object' && typeof newValue === 'object') {
    const oldObj = oldValue as Record<string, unknown>;
    const newObj = newValue as Record<string, unknown>;

    const oldKeys = new Set(Object.keys(oldObj));
    const newKeys = new Set(Object.keys(newObj));

    const added = [...newKeys].filter((k) => !oldKeys.has(k));
    const removed = [...oldKeys].filter((k) => !newKeys.has(k));
    const common = [...oldKeys].filter((k) => newKeys.has(k));

    const changes = common
      .map((k) => diff(oldObj[k], newObj[k], k))
      .filter((c): c is NonNullable<DiffResult> => c !== null);

    const differences: DiffChange[] = [];

    if (added.length) {
      differences.push({
        description: 'Properties added',
        properties: Object.fromEntries(added.map((k) => [k, newObj[k]])),
      });
    }

    if (removed.length) {
      differences.push({
        description: 'Properties removed',
        properties: removed,
      });
    }

    if (changes.length) {
      differences.push(...(changes as unknown as DiffChange[]));
    }

    return differences.length ? { [name]: differences } : null;
  }

  // Primitive comparison
  if (oldValue !== newValue) {
    return {
      [name]: {
        description: 'Value changed',
        oldValue,
        newValue,
      },
    };
  }

  return null;
}
