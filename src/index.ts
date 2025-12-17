/**
 * TypeScript Code Samples
 *
 * Senior TypeScript/NestJS code samples demonstrating advanced patterns
 */

// Error Handling
export { AppError, ErrorData, createErrorClass } from './error-handling/app-error';

// Decorators
export { ValidateInput, ValidationFailedError } from './decorators/validate-input';

// Filters
export { GlobalExceptionFilter } from './filters/global-exception.filter';

// Utils
export {
  UtilsHelper,
  isObject,
  isString,
  randomNumber,
  randomString,
  generateTrackingId,
  delay,
} from './utils/utils.helper';

// Diff
export { diff, DiffResult } from './diff/object-diff';

// Validators
export { DocumentValidator } from './validators/document.validator';
