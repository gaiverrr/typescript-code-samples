/**
 * TypeScript Code Samples
 *
 * Senior TypeScript/NestJS code samples demonstrating advanced patterns
 */

// Error Handling
export { AppError, ErrorData, createErrorClass } from './error-handling/app-error';

// Decorators
export { ValidateInput, ValidationFailedError } from './decorators/validate-input';
export {
  Auth,
  AuthScopes,
  AuthScope,
  SCOPES_KEY,
  Public,
  IS_PUBLIC_KEY,
  TestOnly,
  TEST_ONLY_KEY,
} from './decorators/composite-auth.decorator';
export {
  IsLongerThan,
  IsLongerThanConstraint,
  Match,
  MatchConstraint,
  IsAfter,
  IsAfterConstraint,
  RequireOneOf,
  RequireOneOfConstraint,
} from './decorators/custom-validators.decorator';
export {
  TransformToBoolean,
  TransformToArray,
  TransformToDate,
  TransformToDateArray,
  TransformToInt,
  TransformToFloat,
  TransformTrim,
  TransformToLowerCase,
  TransformToUpperCase,
  TransformEmptyToNull,
  TransformDefault,
  TransformJsonParse,
  TransformSanitize,
} from './decorators/transform.decorator';
export {
  GetUser,
  RequireUser,
  GetTenantId,
  GetTraceId,
  GetClientIp,
  GetUserAgent,
  GetHeader,
  GetBearerToken,
  GetPagination,
  PaginationParams,
  CurrentUser,
} from './decorators/param.decorator';

// Filters
export { GlobalExceptionFilter } from './filters/global-exception.filter';

// Guards
export {
  EnvironmentGuard,
  EnvironmentGuardConfig,
  Environment,
  AllowedIn,
  BlockedIn,
  TestOnly as TestOnlyGuard,
  NonProduction,
  ALLOWED_ENVIRONMENTS_KEY,
  BLOCKED_ENVIRONMENTS_KEY,
} from './guards/environment.guard';

// Interceptors
export {
  TraceContextInterceptor,
  TraceData,
  ClientPlatform,
  getTraceData,
} from './interceptors/trace-context.interceptor';

// Context
export {
  RequestContextService,
  UserContext,
  TenantContext,
  TraceContext,
} from './context/request-context.service';

// Builders
export {
  EntityBuilder,
  DefaultsEntityBuilder,
  ValidatedEntityBuilder,
  createBuilderFactory,
  BuilderResult,
} from './builders/entity.builder';

// Pipes
export {
  DefinedParamPipe,
  TrimPipe,
  ParseArrayPipe,
  ParseIntArrayPipe,
  ParseBooleanPipe,
  RegexValidationPipe,
  EnumValidationPipe,
  StringLengthPipe,
  createParseIntPipe,
  createParseUUIDPipe,
} from './pipes/defined-params.pipe';

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

// Helpers
export {
  JwtHelper,
  JwtPayload,
  JwtAlgorithm,
  JwtGenerateOptions,
  JwtVerifyOptions,
  JwtError,
  JwtExpiredError,
  JwtMalformedError,
  JwtInvalidAlgorithmError,
  JwtInvalidSignatureError,
  JwtValidationError,
} from './helpers/jwt.helper';
export {
  defer,
  deferWithTimeout,
  deferAll,
  deferDelayed,
  Deferred,
} from './helpers/deferred';

// Diff
export { diff, DiffResult } from './diff/object-diff';

// Validators
export { DocumentValidator } from './validators/document.validator';
