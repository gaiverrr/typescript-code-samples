# TypeScript Code Samples

> Senior TypeScript/NestJS code samples demonstrating advanced patterns and best practices.

## Overview

This repository contains production-grade code samples showcasing:

- **Type Safety** - Generics, type guards, strict null checks
- **Design Patterns** - Factory, Builder/Fluent API, Decorator, Strategy
- **Security** - PII masking, cryptographic randomness, input validation
- **Clean Code** - Single responsibility, immutability, DRY

## Modules

### 1. Error Handling Framework
[`src/error-handling/app-error.ts`](src/error-handling/app-error.ts)

Type-safe, fluent API error system with proper stack traces.

```typescript
const NotFoundError = createErrorClass<{ userId: string }>('NotFound');

throw new NotFoundError({ userId: '123' });

// Or with fluent API
new NotFoundError({ userId: '123' })
  .setStatus(404)
  .mergeData({ reason: 'User deleted' })
  .raise();
```

**Highlights:**
- ES6 class inheritance with `Error.captureStackTrace()`
- Generic type parameter for error data
- Fluent setter methods

---

### 2. Validation Decorator
[`src/decorators/validate-input.ts`](src/decorators/validate-input.ts)

Method decorator for automatic DTO validation using class-validator.

```typescript
class CreateUserDto {
  @IsEmail() email: string;
  @MinLength(8) password: string;
}

class UserService {
  @ValidateInput(CreateUserDto)
  async createUser(data: CreateUserDto) {
    // data is validated before execution
  }
}
```

**Highlights:**
- `ClassConstructor<T>` for type safety
- Recursive error extraction for nested DTOs
- Async validation support

---

### 3. Global Exception Filter
[`src/filters/global-exception.filter.ts`](src/filters/global-exception.filter.ts)

Production-grade NestJS exception filter with standardized responses.

```typescript
// Response format
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "errorTraceId": "ERR-A7K3M9P2",
  "requestTraceId": "req-123",
  "status": 400,
  "error": {
    "name": "ValidationError",
    "data": { ... }
  }
}
```

**Highlights:**
- Type guards for error discrimination
- Cryptographically secure trace IDs
- Conditional stack trace exposure

---

### 4. Utility Helper
[`src/utils/utils.helper.ts`](src/utils/utils.helper.ts)

Security-conscious utilities for common operations.

```typescript
// Pure functions
const id = generateTrackingId('USR'); // "USR-A7K3M"
await delay(1000);

// Injectable service
const helper = new UtilsHelper();
const value = helper.getValue<string>(obj, 'user.profile.name');
const masked = helper.mask({ password: 'secret', name: 'John' });
// { password: '*****', name: 'John' }
```

**Highlights:**
- `Set` for O(1) lookups
- PII masking for GDPR compliance
- Cryptographically secure randomness

---

### 5. Object Diff
[`src/diff/object-diff.ts`](src/diff/object-diff.ts)

Deep object comparison with detailed change tracking.

```typescript
const changes = diff(
  { name: 'John', age: 30 },
  { name: 'Jane', age: 30 },
  'user'
);
// { user: [{ description: 'Value changed', oldValue: 'John', newValue: 'Jane' }] }
```

**Highlights:**
- Deep array comparison via serialization
- Tracks added/removed/changed properties
- Type-safe with `DiffResult` type

---

### 6. Document Validators
[`src/validators/document.validator.ts`](src/validators/document.validator.ts)

International document validation with checksum algorithms.

```typescript
const validator = new DocumentValidator();

validator.isValidDNI('12345678Z');      // Spanish DNI
validator.isValidNIE('X1234567L');      // Spanish NIE
validator.isValidSpanishSSN('...');     // Spanish SSN
validator.isValidIBAN('ES9121000418...');  // Full MOD-97 validation
```

**Highlights:**
- Modulo-based checksum algorithms
- Full IBAN MOD-97 validation
- Input normalization

---

## Tech Stack

- **TypeScript 5.x** - Strict mode enabled
- **NestJS 10.x** - Decorators, DI, filters
- **class-validator** - DTO validation
- **class-transformer** - Object transformation

## License

MIT
