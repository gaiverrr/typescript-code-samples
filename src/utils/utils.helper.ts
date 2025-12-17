/**
 * Utility Helper Class
 *
 * A collection of commonly needed utilities with security-conscious design.
 *
 * Key Features:
 * - Pure functions exported separately from class
 * - Set for O(1) lookups instead of array with .includes()
 * - Generic return type getValue<T>() for type-safe access
 * - `unknown` instead of `any` throughout
 * - Readable.from() instead of manual stream push
 * - Cryptographically secure randomness with crypto module
 * - PII masking for GDPR/security compliance
 */

import { randomBytes, randomInt, createHmac } from 'crypto';
import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Stream, Readable } from 'stream';

// Type guards
export const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export const isString = (value: unknown): value is string =>
  typeof value === 'string';

// Pure utility functions - no need for class instance
export function randomNumber(min = 0, max = 4294967295): number {
  return randomInt(min, max);
}

export function randomString(
  length = 10,
  charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => charset[b % charset.length]).join('');
}

export function generateTrackingId(prefix: string, length = 5): string {
  const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // No ambiguous chars
  return `${prefix}-${randomString(length, charset)}`;
}

export function delay<T>(ms: number, value?: T): Promise<T | undefined> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// Class for stateful/configurable utilities
@Injectable()
export class UtilsHelper {
  // Using Set for O(1) lookups instead of array
  private readonly sensitiveFields = new Set([
    'password',
    'token',
    'secret',
    'apikey',
    'firstname',
    'lastname',
    'email',
    'phone',
    'ssn',
    'socialsecuritynumber',
    'dateofbirth',
    'iban',
    'creditcard',
    'address',
  ]);

  private readonly sensitiveTrees = new Set(['personaldata', 'credentials']);

  uuid(): string {
    return uuid();
  }

  // Generic return type for type-safe access
  getValue<T = unknown>(
    obj: Record<string, unknown> | null | undefined,
    path: string,
  ): T | null {
    if (obj == null) return null;

    let current: unknown = obj;

    for (const key of path.split('.')) {
      if (!isObject(current) || !(key in current)) {
        return null;
      }
      current = current[key];
    }

    return current as T;
  }

  // Immutable deep merge
  deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
    const output = { ...target };

    for (const key of Object.keys(source) as Array<keyof T>) {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (isObject(sourceValue) && isObject(targetValue)) {
        output[key] = this.deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>,
        ) as T[keyof T];
      } else if (sourceValue !== undefined) {
        output[key] = sourceValue as T[keyof T];
      }
    }

    return output;
  }

  // Mask sensitive data for logging (PII protection)
  mask(data: unknown, maskAll = false): unknown {
    if (typeof data === 'string') {
      try {
        return this.mask(JSON.parse(data), maskAll);
      } catch {
        return data;
      }
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.mask(item, maskAll));
    }

    if (!isObject(data)) return data;

    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      const keyLower = key.toLowerCase();

      if (isObject(value)) {
        result[key] = this.mask(
          value,
          maskAll || this.sensitiveTrees.has(keyLower),
        );
      } else if (maskAll || this.sensitiveFields.has(keyLower)) {
        result[key] = '*****';
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  generateHash(data: string, salt?: string): string {
    const actualSalt = salt ?? randomBytes(16).toString('hex');
    return createHmac('sha256', actualSalt).update(data).digest('hex');
  }

  censorEmail(email: string): string | null {
    if (!email?.includes('@')) return null;

    const censorWord = (str: string): string =>
      str.length <= 2
        ? str
        : `${str[0]}${'*'.repeat(str.length - 2)}${str.slice(-1)}`;

    const [local, domain] = email.split('@');
    return `${censorWord(local)}@${censorWord(domain)}`;
  }

  static async streamToBase64(stream: Stream): Promise<string> {
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () =>
        resolve(Buffer.concat(chunks).toString('base64')),
      );
      stream.on('error', reject);
    });
  }

  static base64ToStream(base64: string): Readable {
    return Readable.from(Buffer.from(base64, 'base64'));
  }
}
