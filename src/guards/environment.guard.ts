/**
 * Environment Guard
 *
 * Guards endpoints based on environment/deployment stage.
 * Useful for test-only endpoints that shouldn't be accessible in production.
 *
 * Key Features:
 * - Environment-based access control
 * - Reflector metadata integration
 * - Configurable production identifiers
 * - Works with custom decorators
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Environment types
 */
export enum Environment {
  DEVELOPMENT = 'development',
  TEST = 'test',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

/**
 * Metadata keys
 */
export const ALLOWED_ENVIRONMENTS_KEY = 'guard:allowedEnvironments';
export const BLOCKED_ENVIRONMENTS_KEY = 'guard:blockedEnvironments';

/**
 * Configuration for environment guard
 */
export interface EnvironmentGuardConfig {
  /** Current environment */
  currentEnvironment: Environment | string;
  /** Additional production environment identifiers */
  productionIdentifiers?: string[];
  /** Whether to throw or just return false */
  throwOnForbidden?: boolean;
}

/**
 * Decorator to allow endpoint only in specific environments
 *
 * @example
 * @AllowedIn(Environment.DEVELOPMENT, Environment.TEST)
 * @Get('debug-info')
 * getDebugInfo() { ... }
 */
export function AllowedIn(...environments: (Environment | string)[]) {
  return SetMetadata(ALLOWED_ENVIRONMENTS_KEY, environments);
}

/**
 * Decorator to block endpoint in specific environments
 *
 * @example
 * @BlockedIn(Environment.PRODUCTION)
 * @Delete('reset-database')
 * resetDatabase() { ... }
 */
export function BlockedIn(...environments: (Environment | string)[]) {
  return SetMetadata(BLOCKED_ENVIRONMENTS_KEY, environments);
}

/**
 * Shortcut decorator for test-only endpoints
 *
 * @example
 * @TestOnly()
 * @Post('seed-data')
 * seedTestData() { ... }
 */
export function TestOnly() {
  return AllowedIn(Environment.DEVELOPMENT, Environment.TEST);
}

/**
 * Shortcut decorator for non-production endpoints
 *
 * @example
 * @NonProduction()
 * @Get('internal-metrics')
 * getInternalMetrics() { ... }
 */
export function NonProduction() {
  return BlockedIn(Environment.PRODUCTION);
}

/**
 * Environment guard implementation
 *
 * @example
 * // In app.module.ts
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_GUARD,
 *       useFactory: (reflector: Reflector) => {
 *         return new EnvironmentGuard(reflector, {
 *           currentEnvironment: process.env.NODE_ENV || 'development',
 *           productionIdentifiers: ['prod', 'production', 'live'],
 *         });
 *       },
 *       inject: [Reflector],
 *     },
 *   ],
 * })
 * export class AppModule {}
 */
@Injectable()
export class EnvironmentGuard implements CanActivate {
  private readonly config: Required<EnvironmentGuardConfig>;

  constructor(
    private readonly reflector: Reflector,
    config: EnvironmentGuardConfig,
  ) {
    this.config = {
      currentEnvironment: config.currentEnvironment,
      productionIdentifiers: config.productionIdentifiers ?? ['production', 'prod'],
      throwOnForbidden: config.throwOnForbidden ?? true,
    };
  }

  canActivate(context: ExecutionContext): boolean {
    const currentEnv = this.config.currentEnvironment.toLowerCase();

    // Check allowed environments
    const allowedEnvironments = this.reflector.get<string[]>(
      ALLOWED_ENVIRONMENTS_KEY,
      context.getHandler(),
    );

    if (allowedEnvironments?.length) {
      const isAllowed = allowedEnvironments
        .map((e) => e.toLowerCase())
        .includes(currentEnv);

      if (!isAllowed) {
        return this.handleForbidden(
          `This endpoint is only available in: ${allowedEnvironments.join(', ')}`,
        );
      }
    }

    // Check blocked environments
    const blockedEnvironments = this.reflector.get<string[]>(
      BLOCKED_ENVIRONMENTS_KEY,
      context.getHandler(),
    );

    if (blockedEnvironments?.length) {
      const isBlocked = blockedEnvironments
        .map((e) => e.toLowerCase())
        .includes(currentEnv);

      if (isBlocked) {
        return this.handleForbidden(
          `This endpoint is not available in: ${currentEnv}`,
        );
      }
    }

    return true;
  }

  /**
   * Check if current environment is production
   */
  isProduction(): boolean {
    const currentEnv = this.config.currentEnvironment.toLowerCase();
    return this.config.productionIdentifiers
      .map((id) => id.toLowerCase())
      .includes(currentEnv);
  }

  private handleForbidden(message: string): boolean {
    if (this.config.throwOnForbidden) {
      throw new ForbiddenException(message);
    }
    return false;
  }
}
