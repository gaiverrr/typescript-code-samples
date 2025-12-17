/**
 * Distributed Tracing Interceptor
 *
 * Captures request metadata and generates trace IDs for distributed tracing.
 * Integrates with request context service for application-wide access.
 *
 * Key Features:
 * - Generates unique request trace IDs
 * - Captures client-provided trace IDs for correlation
 * - Extracts client platform information from headers
 * - Filters sensitive headers from logging
 * - Measures request timing
 */

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Scope,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomBytes } from 'crypto';

/**
 * Client platform detection
 */
export enum ClientPlatform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
  UNKNOWN = 'unknown',
}

/**
 * Trace context data structure
 */
export interface TraceData {
  readonly requestId: string;
  readonly clientTraceId?: string;
  readonly platform: ClientPlatform;
  readonly method: string;
  readonly path: string;
  readonly fullUrl: string;
  readonly startTime: number;
  readonly headers: Record<string, string>;
  readonly userAgent?: string;
  readonly clientIp?: string;
  readonly appVersion?: string;
}

/**
 * Headers to exclude from trace logging (security/noise)
 */
const FILTERED_HEADERS = new Set([
  'authorization',
  'cookie',
  'accept',
  'accept-encoding',
  'accept-language',
  'host',
  'connection',
  'content-length',
  'content-type',
  'cache-control',
  'postman-token',
  'x-forwarded-for',
  'x-forwarded-proto',
  'x-forwarded-port',
]);

/**
 * Generate a unique trace ID
 */
function generateTraceId(prefix = 'req'): string {
  const bytes = randomBytes(8);
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const id = Array.from(bytes, (b) => chars[b % chars.length]).join('');
  return `${prefix}-${id}`;
}

/**
 * Detect client platform from headers
 */
function detectPlatform(headers: Record<string, string | string[] | undefined>): ClientPlatform {
  const platform = (headers['x-device-platform'] as string)?.toLowerCase()?.trim();
  const deviceOs = (headers['x-device-os'] as string)?.toLowerCase()?.trim();

  if (platform === 'ios' || deviceOs?.startsWith('ios')) {
    return ClientPlatform.IOS;
  }
  if (platform === 'android' || deviceOs?.startsWith('android')) {
    return ClientPlatform.ANDROID;
  }

  const userAgent = (headers['user-agent'] as string)?.toLowerCase() ?? '';
  if (userAgent.includes('mozilla') || userAgent.includes('chrome') || userAgent.includes('safari')) {
    return ClientPlatform.WEB;
  }

  return ClientPlatform.UNKNOWN;
}

/**
 * Filter headers for safe logging
 */
function filterHeaders(headers: Record<string, string | string[] | undefined>): Record<string, string> {
  const filtered: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (!FILTERED_HEADERS.has(key.toLowerCase()) && value) {
      filtered[key] = Array.isArray(value) ? value.join(', ') : value;
    }
  }

  return filtered;
}

/**
 * Extract client IP from request
 */
function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(',')[0]?.trim();
  }
  return request.ip || request.socket.remoteAddress;
}

/**
 * Trace context interceptor
 *
 * @example
 * // In app.module.ts
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_INTERCEPTOR,
 *       useClass: TraceContextInterceptor,
 *     },
 *   ],
 * })
 * export class AppModule {}
 */
@Injectable({ scope: Scope.REQUEST })
export class TraceContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const startTime = Date.now();
    const requestId = generateTraceId('req');
    const clientTraceId = request.headers['x-client-trace-id'] as string | undefined;

    // Build trace data
    const traceData: TraceData = {
      requestId,
      clientTraceId,
      platform: detectPlatform(request.headers),
      method: request.method,
      path: request.path,
      fullUrl: `${request.protocol}://${request.hostname}${request.originalUrl}`,
      startTime,
      headers: filterHeaders(request.headers),
      userAgent: request.headers['user-agent'] as string,
      clientIp: getClientIp(request),
      appVersion: (request.headers['x-app-version'] ?? request.headers['x-appversion']) as string,
    };

    // Attach to request for downstream access
    (request as any).traceData = traceData;

    // Set response headers for client correlation
    response.setHeader('X-Request-Id', requestId);
    if (clientTraceId) {
      response.setHeader('X-Client-Trace-Id', clientTraceId);
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          response.setHeader('X-Response-Time', `${duration}ms`);
        },
        error: () => {
          const duration = Date.now() - startTime;
          response.setHeader('X-Response-Time', `${duration}ms`);
        },
      }),
    );
  }
}

/**
 * Helper to extract trace data from request
 */
export function getTraceData(request: Request): TraceData | undefined {
  return (request as any).traceData;
}
