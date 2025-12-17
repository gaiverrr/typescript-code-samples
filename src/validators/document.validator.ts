/**
 * Document Number Validators (Domain Logic)
 *
 * International document validation with checksum algorithms.
 *
 * Key Features:
 * - String lookup DNI_LETTERS[index] instead of Map (simpler, same O(1))
 * - Full IBAN MOD-97 checksum validation (not just format)
 * - Province range validation for SSN
 * - `null | undefined` in parameter types for safety
 * - `as const` for immutable string literal
 * - Extracted normalize() method (DRY principle)
 * - JSDoc comments for algorithm documentation
 */

import { Injectable } from '@nestjs/common';

@Injectable()
export class DocumentValidator {
  // DNI letter table: index = remainder, value = letter
  private static readonly DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE' as const;

  private normalize(value: string): string {
    return value.replace(/[-\s]/g, '').toUpperCase();
  }

  /**
   * Validates Spanish DNI (National ID)
   * Format: 8 digits + 1 letter
   * Algorithm: DNI_LETTERS[number % 23] === letter
   */
  isValidDNI(dni: string | null | undefined): boolean {
    if (!dni) return false;

    const normalized = this.normalize(dni);
    if (!/^[0-9]{8}[A-Z]$/.test(normalized)) return false;

    const number = parseInt(normalized.slice(0, 8), 10);
    const letter = normalized[8];
    const expectedLetter = DocumentValidator.DNI_LETTERS[number % 23];

    return letter === expectedLetter;
  }

  /**
   * Validates Spanish NIE (Foreigner ID)
   * Format: X/Y/Z + 7 digits + 1 letter
   * X->0, Y->1, Z->2, then same algorithm as DNI
   */
  isValidNIE(nie: string | null | undefined): boolean {
    if (!nie) return false;

    const normalized = this.normalize(nie);
    if (!/^[XYZ][0-9]{7}[A-Z]$/.test(normalized)) return false;

    const prefixValue = { X: '0', Y: '1', Z: '2' } as const;
    const prefix = normalized[0] as keyof typeof prefixValue;
    const numberStr = prefixValue[prefix] + normalized.slice(1, 8);
    const number = parseInt(numberStr, 10);
    const letter = normalized[8];

    return letter === DocumentValidator.DNI_LETTERS[number % 23];
  }

  /**
   * Validates Spanish SSN
   * Format: 12 digits (2 province + 8 number + 2 checksum)
   */
  isValidSpanishSSN(ssn: string | null | undefined): boolean {
    if (!ssn) return false;

    const normalized = this.normalize(ssn);
    if (!/^[0-9]{12}$/.test(normalized)) return false;

    const province = parseInt(normalized.slice(0, 2), 10);
    const number = parseInt(normalized.slice(2, 10), 10);
    const checksum = parseInt(normalized.slice(10), 10);

    // Validate province range (01-52)
    if (province < 1 || province > 52) return false;

    const multiplier = number < 10000000 ? 10000000 : 100000000;
    const expected = (province * multiplier + number) % 97;

    return checksum === expected;
  }

  /**
   * Validates IBAN with full MOD-97 checksum
   * Format: 2 letter country + 2 digit checksum + up to 30 alphanumeric
   */
  isValidIBAN(iban: string | null | undefined): boolean {
    if (!iban) return false;

    const normalized = this.normalize(iban);
    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{9,30}$/.test(normalized)) return false;

    // Move country and check digits to end
    const rearranged = normalized.slice(4) + normalized.slice(0, 4);

    // Convert letters to numbers (A=10, B=11, ..., Z=35)
    const numeric = rearranged
      .split('')
      .map((c) => {
        const code = c.charCodeAt(0);
        return code >= 65 ? (code - 55).toString() : c;
      })
      .join('');

    // MOD-97 on large number (process digit by digit)
    let remainder = 0;
    for (const digit of numeric) {
      remainder = (remainder * 10 + parseInt(digit, 10)) % 97;
    }

    return remainder === 1;
  }
}
