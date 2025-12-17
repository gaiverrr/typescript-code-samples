/**
 * Global Exception Filter with Type Discrimination
 *
 * Production-grade exception filter with standardized error responses.
 *
 * Key Features:
 * - REQUEST-scoped for access to request context
 * - Type guards (isAppError, isHttpException) instead of `in` operator
 * - randomBytes from crypto for secure trace IDs
 * - LoggerService type from NestJS instead of `any`
 * - Handle `unknown` exception type properly
 * - Conditional stack trace exposure based on debug mode
 */

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Injectable,
  LoggerService,
  Scope,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { randomBytes } from 'crypto';
import { AppError, ErrorData } from '../error-handling/app-error';

interface AppConfig {
  readonly isDebugMode: boolean;
}

interface ErrorResponse {
  readonly timestamp: string;
  readonly errorTraceId: string;
  readonly requestTraceId: string | undefined;
  readonly status: number;
  readonly error: {
    readonly name: string;
    readonly data?: unknown;
    readonly stack?: string;
    readonly innerError?: unknown;
  };
}

// Type guard for AppError
function isAppError(error: unknown): error is AppError<ErrorData> {
  return error instanceof AppError;
}

// Type guard for HttpException
function isHttpException(error: unknown): error is HttpException {
  return error instanceof HttpException;
}

@Injectable({ scope: Scope.REQUEST })
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: LoggerService,
    private readonly config: AppConfig,
  ) {}

  // Cryptographically secure trace ID generation
  private generateTraceId(prefix: string, length = 8): string {
    const bytes = randomBytes(length);
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    return `${prefix}-${Array.from(bytes, (b) => chars[b % chars.length]).join('')}`;
  }

  private extractErrorData(exception: unknown): {
    status: number;
    name: string;
    data?: unknown;
    stack?: string;
    innerError?: unknown;
  } {
    if (isAppError(exception)) {
      return {
        status: exception.status,
        name: exception.name,
        data: exception.data,
        stack: exception.stack,
        innerError: exception.innerError,
      };
    }

    if (isHttpException(exception)) {
      const response = exception.getResponse();
      return {
        status: exception.getStatus(),
        name: exception.name,
        data: typeof response === 'object' ? response : { message: response },
        stack: exception.stack,
      };
    }

    if (exception instanceof Error) {
      return {
        status: 500,
        name: exception.name,
        stack: exception.stack,
      };
    }

    return {
      status: 500,
      name: 'UnknownError',
      data: { message: String(exception) },
    };
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorData = this.extractErrorData(exception);

    this.logger.log(
      `${request.method} ${request.path} Failed: ${errorData.status}`,
    );

    if (this.config.isDebugMode || errorData.status >= 500) {
      this.logger.error(exception);
    }

    const errorResponse: ErrorResponse = {
      timestamp: new Date().toISOString(),
      errorTraceId: this.generateTraceId('ERR'),
      requestTraceId: request.headers['x-request-id'] as string | undefined,
      status: errorData.status,
      error: {
        name: errorData.name,
        data: errorData.data,
        ...(this.config.isDebugMode && {
          stack: errorData.stack,
          innerError: errorData.innerError,
        }),
      },
    };

    response.status(errorData.status).json(errorResponse);
  }
}
