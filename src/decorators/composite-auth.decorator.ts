/**
 * Composite Authentication Decorator
 *
 * Combines multiple NestJS decorators into a single reusable auth decorator.
 * Demonstrates the decorator composition pattern for clean, DRY authentication.
 *
 * Key Features:
 * - Combines SetMetadata, UseGuards, and ApiBearerAuth in one decorator
 * - Supports scope-based authorization
 * - Reduces boilerplate in controllers
 * - Type-safe scope definitions
 */

import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';

// Example auth guard (would be imported from your auth module)
import { AuthGuard } from '@nestjs/passport';

/**
 * Define your application's authorization scopes
 */
export const AuthScopes = {
  admin: 'admin',
  user: 'user',
  manager: 'manager',
  readonly: 'readonly',
} as const;

export type AuthScope = (typeof AuthScopes)[keyof typeof AuthScopes];

/**
 * Metadata key for storing scopes
 */
export const SCOPES_KEY = 'auth:scopes';

/**
 * Composite authentication decorator
 *
 * @example
 * // Require admin scope
 * @Auth(AuthScopes.admin)
 * @Get('admin-only')
 * getAdminData() { ... }
 *
 * @example
 * // Require any of multiple scopes
 * @Auth(AuthScopes.admin, AuthScopes.manager)
 * @Get('management')
 * getManagementData() { ... }
 *
 * @example
 * // Just require authentication (no specific scope)
 * @Auth()
 * @Get('protected')
 * getProtectedData() { ... }
 */
export function Auth(...scopes: AuthScope[]) {
  return applyDecorators(
    SetMetadata(SCOPES_KEY, scopes),
    UseGuards(AuthGuard('jwt')),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized - Invalid or missing token' }),
    ApiForbiddenResponse({ description: 'Forbidden - Insufficient permissions' }),
  );
}

/**
 * Decorator for public endpoints that don't require authentication
 * Useful for explicitly marking public routes
 */
export const IS_PUBLIC_KEY = 'auth:isPublic';

export function Public() {
  return SetMetadata(IS_PUBLIC_KEY, true);
}

/**
 * Decorator for test-only endpoints
 * These endpoints are disabled in production environments
 */
export const TEST_ONLY_KEY = 'auth:testOnly';

export function TestOnly() {
  return SetMetadata(TEST_ONLY_KEY, true);
}
