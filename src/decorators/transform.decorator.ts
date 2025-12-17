/**
 * Class Transformer Utility Decorators
 *
 * Reusable transform decorators for class-transformer.
 * Handles common data transformations in DTOs.
 *
 * Key Features:
 * - Boolean conversion from various formats
 * - String to array parsing
 * - Date parsing and formatting
 * - Number parsing (int/float)
 * - Null/undefined handling
 * - Trimming and sanitization
 */

import { Transform, TransformFnParams } from 'class-transformer';

/**
 * Convert various formats to boolean
 * Handles: 'true', 'false', '1', '0', 1, 0, true, false
 *
 * @example
 * class FilterDto {
 *   @TransformToBoolean()
 *   isActive: boolean;
 * }
 *
 * // All these inputs become true:
 * // { isActive: 'true' }
 * // { isActive: '1' }
 * // { isActive: 1 }
 * // { isActive: true }
 */
export function TransformToBoolean() {
  return Transform(({ value }: TransformFnParams): boolean => {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      if (lower === 'true' || lower === '1' || lower === 'yes') {
        return true;
      }
      if (lower === 'false' || lower === '0' || lower === 'no' || lower === '') {
        return false;
      }
      // Parse as number
      return !!Number(value);
    }

    if (typeof value === 'number') {
      return value !== 0;
    }

    return Boolean(value);
  });
}

/**
 * Transform comma-separated string to array
 *
 * @example
 * class FilterDto {
 *   @TransformToArray()
 *   tags: string[];
 * }
 *
 * // Input: { tags: 'a,b,c' }
 * // Output: { tags: ['a', 'b', 'c'] }
 */
export function TransformToArray(separator = ',') {
  return Transform(({ value }: TransformFnParams): string[] => {
    if (Array.isArray(value)) {
      return value.map(String);
    }

    if (typeof value === 'string') {
      return value
        .split(separator)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (value === null || value === undefined) {
      return [];
    }

    return [String(value)];
  });
}

/**
 * Transform string to Date (UTC)
 *
 * @example
 * class EventDto {
 *   @TransformToDate()
 *   startDate: Date;
 * }
 */
export function TransformToDate() {
  return Transform(({ value }: TransformFnParams): Date | null => {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (value instanceof Date) {
      return value;
    }

    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  });
}

/**
 * Transform comma-separated string to array of Dates
 *
 * @example
 * class RangeDto {
 *   @TransformToDateArray()
 *   dates: Date[];
 * }
 */
export function TransformToDateArray(separator = ',') {
  return Transform(({ value }: TransformFnParams): Date[] => {
    if (!value) return [];

    const values = Array.isArray(value)
      ? value
      : String(value).split(separator).map((s) => s.trim());

    return values
      .map((v) => new Date(v))
      .filter((d) => !isNaN(d.getTime()));
  });
}

/**
 * Transform to integer
 *
 * @example
 * class PaginationDto {
 *   @TransformToInt()
 *   page: number;
 * }
 */
export function TransformToInt() {
  return Transform(({ value }: TransformFnParams): number | null => {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = parseInt(String(value), 10);
    return isNaN(parsed) ? null : parsed;
  });
}

/**
 * Transform to float
 *
 * @example
 * class ProductDto {
 *   @TransformToFloat()
 *   price: number;
 * }
 */
export function TransformToFloat() {
  return Transform(({ value }: TransformFnParams): number | null => {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? null : parsed;
  });
}

/**
 * Trim whitespace from string
 *
 * @example
 * class UserDto {
 *   @TransformTrim()
 *   name: string;
 * }
 */
export function TransformTrim() {
  return Transform(({ value }: TransformFnParams): string | null => {
    if (typeof value === 'string') {
      return value.trim() || null;
    }
    return value ?? null;
  });
}

/**
 * Transform to lowercase
 *
 * @example
 * class UserDto {
 *   @TransformToLowerCase()
 *   email: string;
 * }
 */
export function TransformToLowerCase() {
  return Transform(({ value }: TransformFnParams): string | null => {
    if (typeof value === 'string') {
      return value.toLowerCase().trim();
    }
    return value ?? null;
  });
}

/**
 * Transform to uppercase
 */
export function TransformToUpperCase() {
  return Transform(({ value }: TransformFnParams): string | null => {
    if (typeof value === 'string') {
      return value.toUpperCase().trim();
    }
    return value ?? null;
  });
}

/**
 * Transform empty strings to null
 *
 * @example
 * class UserDto {
 *   @TransformEmptyToNull()
 *   middleName?: string | null;
 * }
 */
export function TransformEmptyToNull() {
  return Transform(({ value }: TransformFnParams): unknown => {
    if (value === '' || value === undefined) {
      return null;
    }
    return value;
  });
}

/**
 * Transform null/undefined to default value
 *
 * @example
 * class SettingsDto {
 *   @TransformDefault(10)
 *   pageSize: number;
 * }
 */
export function TransformDefault<T>(defaultValue: T) {
  return Transform(({ value }: TransformFnParams): T => {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    return value as T;
  });
}

/**
 * Transform JSON string to object
 *
 * @example
 * class ConfigDto {
 *   @TransformJsonParse()
 *   settings: Record<string, unknown>;
 * }
 */
export function TransformJsonParse<T = unknown>() {
  return Transform(({ value }: TransformFnParams): T | null => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    }
    return (value as T) ?? null;
  });
}

/**
 * Sanitize string by removing special characters
 * Keeps alphanumeric, spaces, and basic punctuation
 *
 * @example
 * class SearchDto {
 *   @TransformSanitize()
 *   query: string;
 * }
 */
export function TransformSanitize(allowedPattern = /[^a-zA-Z0-9\s\-_.@]/g) {
  return Transform(({ value }: TransformFnParams): string | null => {
    if (typeof value === 'string') {
      return value.replace(allowedPattern, '').trim() || null;
    }
    return value ?? null;
  });
}
