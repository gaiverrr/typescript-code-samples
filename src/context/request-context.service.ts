/**
 * Request-Scoped Context Service
 *
 * Manages request-scoped state across the application lifecycle.
 * Provides a clean way to access request context from any service.
 *
 * Key Features:
 * - REQUEST-scoped for per-request isolation
 * - Type-safe context accessors
 * - Supports multiple context types (user, tenant, trace, etc.)
 * - Clean getter/setter pattern
 */

import { Injectable, Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

/**
 * User context containing authenticated user information
 */
export interface UserContext {
  readonly id: string;
  readonly email: string;
  readonly roles: string[];
  readonly tenantId?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Tenant context for multi-tenant applications
 */
export interface TenantContext {
  readonly id: string;
  readonly name: string;
  readonly config?: Record<string, unknown>;
}

/**
 * Trace context for distributed tracing
 */
export interface TraceContext {
  readonly requestId: string;
  readonly clientTraceId?: string;
  readonly startTime: number;
  readonly path: string;
  readonly method: string;
  readonly userAgent?: string;
  readonly clientIp?: string;
}

/**
 * Combined request context
 */
interface RequestContext {
  user?: UserContext;
  tenant?: TenantContext;
  trace?: TraceContext;
  custom?: Record<string, unknown>;
}

/**
 * Extended Express Request with context
 */
interface ContextRequest extends Request {
  context?: RequestContext;
}

/**
 * Request-scoped context service
 *
 * @example
 * // In a service
 * @Injectable()
 * export class UserService {
 *   constructor(private readonly contextService: RequestContextService) {}
 *
 *   getCurrentUser(): UserContext | undefined {
 *     return this.contextService.user;
 *   }
 *
 *   getCurrentTenantId(): string | undefined {
 *     return this.contextService.tenant?.id;
 *   }
 * }
 *
 * @example
 * // In an interceptor - setting context
 * @Injectable()
 * export class AuthInterceptor implements NestInterceptor {
 *   constructor(private readonly contextService: RequestContextService) {}
 *
 *   intercept(context: ExecutionContext, next: CallHandler) {
 *     this.contextService.user = { id: '123', email: 'user@example.com', roles: ['user'] };
 *     return next.handle();
 *   }
 * }
 */
@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {
  private readonly context: RequestContext;

  constructor(@Inject(REQUEST) private readonly request: ContextRequest) {
    // Initialize context on request if not exists
    if (!this.request.context) {
      this.request.context = {};
    }
    this.context = this.request.context;
  }

  // User Context
  get user(): UserContext | undefined {
    return this.context.user;
  }

  set user(userContext: UserContext | undefined) {
    this.context.user = userContext;
  }

  // Tenant Context
  get tenant(): TenantContext | undefined {
    return this.context.tenant;
  }

  set tenant(tenantContext: TenantContext | undefined) {
    this.context.tenant = tenantContext;
  }

  // Trace Context
  get trace(): TraceContext | undefined {
    return this.context.trace;
  }

  set trace(traceContext: TraceContext | undefined) {
    this.context.trace = traceContext;
  }

  // Custom data storage
  getCustom<T>(key: string): T | undefined {
    return this.context.custom?.[key] as T | undefined;
  }

  setCustom<T>(key: string, value: T): void {
    if (!this.context.custom) {
      this.context.custom = {};
    }
    this.context.custom[key] = value;
  }

  // Convenience methods
  get isAuthenticated(): boolean {
    return this.context.user !== undefined;
  }

  get requestId(): string | undefined {
    return this.context.trace?.requestId;
  }

  hasRole(role: string): boolean {
    return this.context.user?.roles.includes(role) ?? false;
  }

  hasAnyRole(...roles: string[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  hasAllRoles(...roles: string[]): boolean {
    return roles.every((role) => this.hasRole(role));
  }
}
