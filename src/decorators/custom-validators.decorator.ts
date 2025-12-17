/**
 * Custom Validation Decorators
 *
 * Custom class-validator decorators for cross-property validation.
 * Demonstrates how to create reusable validation constraints.
 *
 * Key Features:
 * - Cross-property validation (comparing two fields)
 * - Custom constraint implementation
 * - Proper TypeScript typing
 * - Reusable validation patterns
 */

import {
  ValidationOptions,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidatorConstraint,
  registerDecorator,
} from 'class-validator';

/**
 * Validates that a string property is longer than another property
 *
 * @example
 * class PasswordDto {
 *   @IsString()
 *   username: string;
 *
 *   @IsLongerThan('username', { message: 'Password must be longer than username' })
 *   password: string;
 * }
 */
export function IsLongerThan(property: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsLongerThanConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'isLongerThan', async: false })
export class IsLongerThanConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const [relatedPropertyName] = args.constraints as [string];
    const relatedValue = (args.object as Record<string, unknown>)[relatedPropertyName];

    return (
      typeof value === 'string' &&
      typeof relatedValue === 'string' &&
      value.length > relatedValue.length
    );
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedPropertyName] = args.constraints as [string];
    return `${args.property} must be longer than ${relatedPropertyName}`;
  }
}

/**
 * Validates that a property matches another property (e.g., password confirmation)
 *
 * @example
 * class RegisterDto {
 *   @IsString()
 *   @MinLength(8)
 *   password: string;
 *
 *   @Match('password', { message: 'Passwords do not match' })
 *   confirmPassword: string;
 * }
 */
export function Match(property: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: MatchConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'match', async: false })
export class MatchConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const [relatedPropertyName] = args.constraints as [string];
    const relatedValue = (args.object as Record<string, unknown>)[relatedPropertyName];
    return value === relatedValue;
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedPropertyName] = args.constraints as [string];
    return `${args.property} must match ${relatedPropertyName}`;
  }
}

/**
 * Validates that a date property is after another date property
 *
 * @example
 * class DateRangeDto {
 *   @IsDate()
 *   startDate: Date;
 *
 *   @IsAfter('startDate', { message: 'End date must be after start date' })
 *   endDate: Date;
 * }
 */
export function IsAfter(property: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsAfterConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'isAfter', async: false })
export class IsAfterConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const [relatedPropertyName] = args.constraints as [string];
    const relatedValue = (args.object as Record<string, unknown>)[relatedPropertyName];

    if (!(value instanceof Date) || !(relatedValue instanceof Date)) {
      return false;
    }

    return value.getTime() > relatedValue.getTime();
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedPropertyName] = args.constraints as [string];
    return `${args.property} must be after ${relatedPropertyName}`;
  }
}

/**
 * Validates that at least one of the specified properties is provided
 *
 * @example
 * class SearchDto {
 *   @IsOptional()
 *   @IsString()
 *   email?: string;
 *
 *   @IsOptional()
 *   @IsString()
 *   @RequireOneOf(['email', 'phone', 'username'])
 *   phone?: string;
 *
 *   @IsOptional()
 *   @IsString()
 *   username?: string;
 * }
 */
export function RequireOneOf(properties: string[], validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [properties],
      validator: RequireOneOfConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'requireOneOf', async: false })
export class RequireOneOfConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const [properties] = args.constraints as [string[]];
    const obj = args.object as Record<string, unknown>;

    return properties.some((prop) => {
      const val = obj[prop];
      return val !== undefined && val !== null && val !== '';
    });
  }

  defaultMessage(args: ValidationArguments): string {
    const [properties] = args.constraints as [string[]];
    return `At least one of [${properties.join(', ')}] must be provided`;
  }
}
