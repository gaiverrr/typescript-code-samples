/**
 * Custom Validation Pipes
 *
 * NestJS pipes for parameter validation and transformation.
 * Provides reusable validation patterns for route parameters.
 *
 * Key Features:
 * - Required parameter validation
 * - Type coercion pipes
 * - Custom error messages
 * - Composable validation
 */

import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';

/**
 * Validates that a parameter is defined and not empty
 *
 * @example
 * @Get(':id')
 * findOne(@Param('id', DefinedParamPipe) id: string) {
 *   return this.service.findById(id);
 * }
 */
@Injectable()
export class DefinedParamPipe implements PipeTransform<unknown, unknown> {
  constructor(private readonly paramName?: string) {}

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    const name = this.paramName ?? metadata.data ?? 'parameter';

    if (value === undefined || value === null || value === '' || value === 'null') {
      throw new BadRequestException(`${name} is required`);
    }

    return value;
  }
}

/**
 * Validates and trims string parameters
 *
 * @example
 * @Get('search')
 * search(@Query('q', TrimPipe) query: string) {
 *   return this.service.search(query);
 * }
 */
@Injectable()
export class TrimPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (typeof value !== 'string') {
      return value;
    }
    return value.trim();
  }
}

/**
 * Parses comma-separated string to array
 *
 * @example
 * @Get('items')
 * findMany(@Query('ids', ParseArrayPipe) ids: string[]) {
 *   return this.service.findByIds(ids);
 * }
 */
@Injectable()
export class ParseArrayPipe implements PipeTransform<string, string[]> {
  constructor(
    private readonly separator = ',',
    private readonly options: { trim?: boolean; unique?: boolean } = {},
  ) {}

  transform(value: string): string[] {
    if (!value) return [];

    if (Array.isArray(value)) {
      return value;
    }

    let result = value.split(this.separator);

    if (this.options.trim !== false) {
      result = result.map((item) => item.trim()).filter(Boolean);
    }

    if (this.options.unique) {
      result = [...new Set(result)];
    }

    return result;
  }
}

/**
 * Parses comma-separated string to array of integers
 *
 * @example
 * @Get('items')
 * findMany(@Query('ids', ParseIntArrayPipe) ids: number[]) {
 *   return this.service.findByIds(ids);
 * }
 */
@Injectable()
export class ParseIntArrayPipe implements PipeTransform<string, number[]> {
  constructor(private readonly separator = ',') {}

  transform(value: string, metadata: ArgumentMetadata): number[] {
    if (!value) return [];

    const name = metadata.data ?? 'parameter';

    const parts = value.split(this.separator).map((s) => s.trim()).filter(Boolean);

    return parts.map((part) => {
      const num = parseInt(part, 10);
      if (isNaN(num)) {
        throw new BadRequestException(`${name} must contain only integers`);
      }
      return num;
    });
  }
}

/**
 * Parses boolean from string ('true', 'false', '1', '0')
 *
 * @example
 * @Get('items')
 * findAll(@Query('active', ParseBooleanPipe) active: boolean) {
 *   return this.service.findAll({ active });
 * }
 */
@Injectable()
export class ParseBooleanPipe implements PipeTransform<string, boolean> {
  transform(value: string): boolean {
    if (value === undefined || value === null) {
      return false;
    }

    const lower = String(value).toLowerCase().trim();

    return lower === 'true' || lower === '1' || lower === 'yes';
  }
}

/**
 * Validates parameter matches a regex pattern
 *
 * @example
 * @Get(':code')
 * findByCode(
 *   @Param('code', new RegexValidationPipe(/^[A-Z]{2}-\d{4}$/))
 *   code: string
 * ) {
 *   return this.service.findByCode(code);
 * }
 */
@Injectable()
export class RegexValidationPipe implements PipeTransform<string, string> {
  constructor(
    private readonly pattern: RegExp,
    private readonly errorMessage?: string,
  ) {}

  transform(value: string, metadata: ArgumentMetadata): string {
    const name = metadata.data ?? 'parameter';

    if (!this.pattern.test(value)) {
      throw new BadRequestException(
        this.errorMessage ?? `${name} format is invalid`,
      );
    }

    return value;
  }
}

/**
 * Validates value is one of allowed values
 *
 * @example
 * @Get('items')
 * findAll(
 *   @Query('status', new EnumValidationPipe(['active', 'inactive', 'pending']))
 *   status: string
 * ) {
 *   return this.service.findAll({ status });
 * }
 */
@Injectable()
export class EnumValidationPipe<T extends string> implements PipeTransform<string, T> {
  constructor(private readonly allowedValues: readonly T[]) {}

  transform(value: string, metadata: ArgumentMetadata): T {
    const name = metadata.data ?? 'parameter';

    if (!this.allowedValues.includes(value as T)) {
      throw new BadRequestException(
        `${name} must be one of: ${this.allowedValues.join(', ')}`,
      );
    }

    return value as T;
  }
}

/**
 * Validates string length
 *
 * @example
 * @Post('comment')
 * create(
 *   @Body('text', new StringLengthPipe({ min: 1, max: 500 }))
 *   text: string
 * ) {
 *   return this.service.create(text);
 * }
 */
@Injectable()
export class StringLengthPipe implements PipeTransform<string, string> {
  constructor(
    private readonly options: { min?: number; max?: number },
  ) {}

  transform(value: string, metadata: ArgumentMetadata): string {
    const name = metadata.data ?? 'parameter';
    const { min, max } = this.options;

    if (min !== undefined && value.length < min) {
      throw new BadRequestException(`${name} must be at least ${min} characters`);
    }

    if (max !== undefined && value.length > max) {
      throw new BadRequestException(`${name} must be at most ${max} characters`);
    }

    return value;
  }
}

/**
 * Creates a configured ParseIntPipe with custom error message
 */
export function createParseIntPipe(paramName: string) {
  return new ParseIntPipe({
    errorHttpStatusCode: 400,
    exceptionFactory: () => new BadRequestException(`${paramName} must be a valid integer`),
  });
}

/**
 * Creates a configured ParseUUIDPipe with custom error message
 */
export function createParseUUIDPipe(paramName: string) {
  return new ParseUUIDPipe({
    errorHttpStatusCode: 400,
    exceptionFactory: () => new BadRequestException(`${paramName} must be a valid UUID`),
  });
}
