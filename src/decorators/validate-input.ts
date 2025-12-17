/**
 * Method Decorator for Validation Pipeline
 *
 * Validates DTO objects at method entry using decorators and class-validator.
 *
 * Key Features:
 * - ClassConstructor<T> from class-transformer for type safety
 * - plainToInstance for proper class transformation
 * - Explicit types throughout - no `any`
 * - Function name preserved for debugging
 * - Async validation support with proper error extraction
 */

import { SetMetadata } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance, ClassConstructor } from 'class-transformer';

interface ValidationErrorDetail {
  constraints?: Record<string, string>;
  value?: unknown;
  children?: Record<string, ValidationErrorDetail>;
}

export class ValidationFailedError extends Error {
  constructor(public readonly details: Record<string, ValidationErrorDetail>) {
    super(`Validation failed: ${JSON.stringify(details)}`);
    this.name = 'ValidationFailedError';
    Error.captureStackTrace(this, ValidationFailedError);
  }
}

function extractConstraints(
  errors: ValidationError[],
): Record<string, ValidationErrorDetail> | null {
  if (!errors.length) return null;

  const result: Record<string, ValidationErrorDetail> = {};

  for (const error of errors) {
    if (error.children?.length) {
      const nested = extractConstraints(error.children);
      if (nested) {
        result[error.property] = { children: nested };
      }
    } else {
      result[error.property] = {
        constraints: error.constraints,
        value: error.value,
      };
    }
  }

  return result;
}

/**
 * Decorator factory for input validation
 *
 * @example
 * class CreateUserDto {
 *   @IsEmail() email: string;
 *   @MinLength(8) password: string;
 * }
 *
 * class UserService {
 *   @ValidateInput(CreateUserDto)
 *   async createUser(data: CreateUserDto) {
 *     // data is validated here
 *   }
 * }
 */
export function ValidateInput<T extends object>(
  schema: ClassConstructor<T>,
): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<unknown>,
  ) => {
    SetMetadata('validated', true)(target, propertyKey, descriptor);

    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;

    descriptor.value = async function (
      this: unknown,
      ...args: unknown[]
    ): Promise<unknown> {
      const [input] = args;

      // Transform plain object to class instance
      const instance = plainToInstance(schema, input);
      const errors = await validate(instance);
      const errorDetails = extractConstraints(errors);

      if (errorDetails) {
        throw new ValidationFailedError(errorDetails);
      }

      return originalMethod.apply(this, args);
    };

    // Preserve function name for debugging
    Object.defineProperty(descriptor.value, 'name', {
      value: `validated_${String(propertyKey)}`,
    });

    return descriptor;
  };
}
