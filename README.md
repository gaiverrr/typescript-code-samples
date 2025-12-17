# TypeScript Code Samples

> Senior TypeScript/NestJS code samples demonstrating advanced patterns and best practices.

## Overview

This repository contains production-grade code samples showcasing:

- **Type Safety** - Generics, type guards, strict null checks
- **Design Patterns** - Factory, Builder/Fluent API, Decorator, Strategy
- **Security** - PII masking, cryptographic randomness, input validation
- **Clean Code** - Single responsibility, immutability, DRY

## Modules

### Error Handling

#### 1. Custom Error Framework
[`src/error-handling/app-error.ts`](src/error-handling/app-error.ts)

Type-safe, fluent API error system with proper stack traces.

```typescript
const NotFoundError = createErrorClass<{ userId: string }>('NotFound');

new NotFoundError({ userId: '123' })
  .setStatus(404)
  .mergeData({ reason: 'User deleted' })
  .raise();
```

---

### Decorators

#### 2. Composite Auth Decorator
[`src/decorators/composite-auth.decorator.ts`](src/decorators/composite-auth.decorator.ts)

Combines multiple NestJS decorators into a single reusable auth decorator.

```typescript
@Auth(AuthScopes.admin)
@Get('admin-only')
getAdminData() { ... }

@Public()
@Get('health')
healthCheck() { ... }
```

#### 3. Custom Validation Decorators
[`src/decorators/custom-validators.decorator.ts`](src/decorators/custom-validators.decorator.ts)

Cross-property validation with class-validator.

```typescript
class RegisterDto {
  @IsString() password: string;

  @Match('password')
  confirmPassword: string;

  @IsDate() startDate: Date;

  @IsAfter('startDate')
  endDate: Date;
}
```

#### 4. Transform Decorators
[`src/decorators/transform.decorator.ts`](src/decorators/transform.decorator.ts)

Reusable class-transformer decorators.

```typescript
class FilterDto {
  @TransformToBoolean() isActive: boolean;
  @TransformToArray() tags: string[];
  @TransformToInt() page: number;
  @TransformToLowerCase() email: string;
}
```

#### 5. Parameter Decorators
[`src/decorators/param.decorator.ts`](src/decorators/param.decorator.ts)

Custom parameter extractors for clean controller signatures.

```typescript
@Get('profile')
getProfile(
  @GetUser() user: CurrentUser,
  @GetTenantId() tenantId: string,
  @GetPagination() pagination: PaginationParams,
) { ... }
```

#### 6. Validation Pipeline Decorator
[`src/decorators/validate-input.ts`](src/decorators/validate-input.ts)

Method decorator for automatic DTO validation.

```typescript
class UserService {
  @ValidateInput(CreateUserDto)
  async createUser(data: CreateUserDto) { ... }
}
```

---

### Guards

#### 7. Environment Guard
[`src/guards/environment.guard.ts`](src/guards/environment.guard.ts)

Guards endpoints based on deployment environment.

```typescript
@TestOnly()
@Post('seed-data')
seedTestData() { ... }

@BlockedIn(Environment.PRODUCTION)
@Delete('reset-database')
resetDatabase() { ... }
```

---

### Interceptors

#### 8. Trace Context Interceptor
[`src/interceptors/trace-context.interceptor.ts`](src/interceptors/trace-context.interceptor.ts)

Distributed tracing with request metadata capture.

```typescript
// Automatically adds:
// - X-Request-Id header
// - X-Response-Time header
// - Client platform detection
// - Request timing
```

---

### Context

#### 9. Request Context Service
[`src/context/request-context.service.ts`](src/context/request-context.service.ts)

Request-scoped context management.

```typescript
@Injectable()
export class UserService {
  constructor(private readonly ctx: RequestContextService) {}

  getCurrentUser() {
    return this.ctx.user;
  }

  hasAdminAccess() {
    return this.ctx.hasRole('admin');
  }
}
```

---

### Builders

#### 10. Entity Builder
[`src/builders/entity.builder.ts`](src/builders/entity.builder.ts)

Fluent builder pattern for entity construction.

```typescript
const user = new EntityBuilder<User>()
  .set({ name: 'John', email: 'john@example.com' })
  .setProperty('age', 30)
  .build();

// With defaults
class UserBuilder extends DefaultsEntityBuilder<User> {
  protected getDefaults() {
    return { role: 'user', isActive: true };
  }
}
```

---

### Pipes

#### 11. Validation Pipes
[`src/pipes/defined-params.pipe.ts`](src/pipes/defined-params.pipe.ts)

Custom pipes for parameter validation.

```typescript
@Get(':id')
findOne(@Param('id', DefinedParamPipe) id: string) { ... }

@Get('items')
findMany(
  @Query('ids', ParseArrayPipe) ids: string[],
  @Query('status', new EnumValidationPipe(['active', 'inactive'])) status: string,
) { ... }
```

---

### Helpers

#### 12. JWT Helper
[`src/helpers/jwt.helper.ts`](src/helpers/jwt.helper.ts)

JWT token generation, parsing, and validation.

```typescript
const jwtHelper = new JwtHelper();

const token = jwtHelper.generateHS256({ sub: 'user123' }, secret, '1h');
const payload = jwtHelper.verify(token, secret);
const isExpired = jwtHelper.isExpired(token);
```

#### 13. Deferred Promise
[`src/helpers/deferred.ts`](src/helpers/deferred.ts)

Promise with externally accessible resolve/reject.

```typescript
const deferred = defer<string>();

// Later...
deferred.resolve('success');

// With timeout
const withTimeout = deferWithTimeout<string>(5000);
```

#### 14. Utils Helper
[`src/utils/utils.helper.ts`](src/utils/utils.helper.ts)

Security-conscious utilities.

```typescript
const id = generateTrackingId('USR'); // "USR-A7K3M"
const masked = helper.mask({ password: 'secret', name: 'John' });
// { password: '*****', name: 'John' }
```

---

### Other

#### 15. Object Diff
[`src/diff/object-diff.ts`](src/diff/object-diff.ts)

Deep object comparison with change tracking.

```typescript
const changes = diff(oldUser, newUser, 'user');
```

#### 16. Document Validators
[`src/validators/document.validator.ts`](src/validators/document.validator.ts)

International document validation with checksums.

```typescript
validator.isValidDNI('12345678Z');      // Spanish DNI
validator.isValidIBAN('ES9121000418...'); // IBAN MOD-97
```

#### 17. Exception Filter
[`src/filters/global-exception.filter.ts`](src/filters/global-exception.filter.ts)

Production-grade exception handling with standardized responses.

---

## Tech Stack

- **TypeScript 5.x** - Strict mode enabled
- **NestJS 10.x** - Decorators, DI, filters
- **class-validator** - DTO validation
- **class-transformer** - Object transformation

## License

MIT
