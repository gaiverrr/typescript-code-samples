/**
 * Custom Parameter Decorators
 *
 * NestJS parameter decorators for extracting request context data.
 * Provides clean abstractions for accessing request-scoped information.
 *
 * Key Features:
 * - Type-safe parameter extraction
 * - Request context integration
 * - User/tenant context accessors
 * - Clean controller signatures
 */

import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Request } from 'express';

/**
 * User context interface
 */
export interface CurrentUser {
  id: string;
  email: string;
  roles: string[];
  tenantId?: string;
  [key: string]: unknown;
}

/**
 * Request with context
 */
interface ContextRequest extends Request {
  context?: {
    user?: CurrentUser;
    tenant?: { id: string; name: string };
    [key: string]: unknown;
  };
  user?: CurrentUser; // Passport-style user
}

/**
 * Get the current authenticated user from request context
 *
 * @example
 * @Get('profile')
 * getProfile(@GetUser() user: CurrentUser) {
 *   return this.userService.findById(user.id);
 * }
 *
 * @example
 * // Get specific property
 * @Get('my-email')
 * getEmail(@GetUser('email') email: string) {
 *   return { email };
 * }
 */
export const GetUser = createParamDecorator<string | undefined, ExecutionContext, CurrentUser | unknown>(
  (property: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<ContextRequest>();

    // Support both context-based and passport-style user
    const user = request.context?.user ?? request.user;

    if (!user) {
      return undefined;
    }

    return property ? user[property] : user;
  },
);

/**
 * Get specific user property or throw if not authenticated
 *
 * @example
 * @Get('dashboard')
 * getDashboard(@RequireUser() user: CurrentUser) {
 *   // Guaranteed to have user
 *   return this.dashboardService.getForUser(user.id);
 * }
 */
export const RequireUser = createParamDecorator<string | undefined, ExecutionContext, CurrentUser | unknown>(
  (property: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<ContextRequest>();
    const user = request.context?.user ?? request.user;

    if (!user) {
      throw new BadRequestException('User context is required');
    }

    return property ? user[property] : user;
  },
);

/**
 * Get the current tenant ID
 *
 * @example
 * @Get('tenant-data')
 * getTenantData(@GetTenantId() tenantId: string) {
 *   return this.dataService.findByTenant(tenantId);
 * }
 */
export const GetTenantId = createParamDecorator<void, ExecutionContext, string | undefined>(
  (_data: void, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<ContextRequest>();

    return (
      request.context?.tenant?.id ??
      request.context?.user?.tenantId ??
      (request.headers['x-tenant-id'] as string)
    );
  },
);

/**
 * Get request trace ID
 *
 * @example
 * @Post('action')
 * performAction(@GetTraceId() traceId: string, @Body() data: ActionDto) {
 *   this.logger.log(`Performing action ${traceId}`);
 *   return this.actionService.perform(data);
 * }
 */
export const GetTraceId = createParamDecorator<void, ExecutionContext, string | undefined>(
  (_data: void, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<ContextRequest>();

    return (
      (request.headers['x-request-id'] as string) ??
      (request as any).traceData?.requestId ??
      (request as any).id
    );
  },
);

/**
 * Get client IP address
 *
 * @example
 * @Post('login')
 * login(@GetClientIp() ip: string, @Body() credentials: LoginDto) {
 *   return this.authService.login(credentials, ip);
 * }
 */
export const GetClientIp = createParamDecorator<void, ExecutionContext, string | undefined>(
  (_data: void, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();

    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return ips.split(',')[0]?.trim();
    }

    return request.ip ?? request.socket.remoteAddress;
  },
);

/**
 * Get user agent string
 *
 * @example
 * @Get('analytics')
 * trackVisit(@GetUserAgent() userAgent: string) {
 *   return this.analyticsService.track(userAgent);
 * }
 */
export const GetUserAgent = createParamDecorator<void, ExecutionContext, string | undefined>(
  (_data: void, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.headers['user-agent'];
  },
);

/**
 * Get specific header value
 *
 * @example
 * @Get('data')
 * getData(@GetHeader('x-api-version') apiVersion: string) {
 *   return this.dataService.getForVersion(apiVersion);
 * }
 */
export const GetHeader = createParamDecorator<string, ExecutionContext, string | undefined>(
  (headerName: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const value = request.headers[headerName.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
  },
);

/**
 * Get bearer token from Authorization header
 *
 * @example
 * @Get('verify')
 * verifyToken(@GetBearerToken() token: string) {
 *   return this.authService.verify(token);
 * }
 */
export const GetBearerToken = createParamDecorator<void, ExecutionContext, string | undefined>(
  (_data: void, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const auth = request.headers.authorization;

    if (!auth) return undefined;

    if (auth.toLowerCase().startsWith('bearer ')) {
      return auth.slice(7);
    }

    return auth;
  },
);

/**
 * Get pagination parameters from query
 *
 * @example
 * @Get('items')
 * getItems(@GetPagination() pagination: PaginationParams) {
 *   return this.itemService.findAll(pagination);
 * }
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export const GetPagination = createParamDecorator<
  { defaultLimit?: number; maxLimit?: number },
  ExecutionContext,
  PaginationParams
>((options = {}, ctx: ExecutionContext) => {
  const { defaultLimit = 20, maxLimit = 100 } = options;
  const request = ctx.switchToHttp().getRequest<Request>();

  const page = Math.max(1, parseInt(String(request.query.page), 10) || 1);
  const requestedLimit = parseInt(String(request.query.limit), 10) || defaultLimit;
  const limit = Math.min(Math.max(1, requestedLimit), maxLimit);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
});
