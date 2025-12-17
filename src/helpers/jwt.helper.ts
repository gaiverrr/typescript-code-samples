/**
 * JWT Helper Service
 *
 * Utility service for JWT token generation, parsing, and validation.
 * Supports multiple algorithms and provides typed error handling.
 *
 * Key Features:
 * - Multiple algorithm support (HS256, HS512, RS256)
 * - Type-safe token payload interface
 * - Custom error types for different failure scenarios
 * - Bearer token stripping utility
 * - Token comparison for validation
 */

import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

/**
 * Supported JWT algorithms
 */
export type JwtAlgorithm = 'HS256' | 'HS512' | 'RS256' | 'RS384' | 'RS512';

/**
 * JWT payload interface with common claims
 */
export interface JwtPayload {
  /** Subject (usually user ID) */
  sub?: string;
  /** Issuer */
  iss?: string;
  /** Audience */
  aud?: string | string[];
  /** Expiration time (Unix timestamp) */
  exp?: number;
  /** Issued at (Unix timestamp) */
  iat?: number;
  /** JWT ID */
  jti?: string;
  /** Tenant ID (for multi-tenant apps) */
  tid?: string;
  /** Application ID */
  appid?: string;
  /** Custom claims */
  [key: string]: unknown;
}

/**
 * Options for JWT generation
 */
export interface JwtGenerateOptions {
  /** Algorithm to use */
  algorithm?: JwtAlgorithm;
  /** Expiration time (e.g., '1h', '7d', or Unix timestamp) */
  expiresIn?: string | number;
  /** Issuer claim */
  issuer?: string;
  /** Audience claim */
  audience?: string | string[];
  /** Subject claim */
  subject?: string;
  /** JWT ID */
  jwtid?: string;
}

/**
 * Options for JWT verification
 */
export interface JwtVerifyOptions {
  /** Allowed algorithms */
  algorithms?: JwtAlgorithm[];
  /** Expected issuer */
  issuer?: string;
  /** Expected audience */
  audience?: string | string[];
  /** Clock tolerance in seconds */
  clockTolerance?: number;
  /** Ignore expiration */
  ignoreExpiration?: boolean;
}

/**
 * JWT error types
 */
export class JwtError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'JwtError';
    Error.captureStackTrace(this, JwtError);
  }
}

export class JwtExpiredError extends JwtError {
  constructor() {
    super('JWT token has expired', 'JWT_EXPIRED');
    this.name = 'JwtExpiredError';
  }
}

export class JwtMalformedError extends JwtError {
  constructor() {
    super('JWT token is malformed', 'JWT_MALFORMED');
    this.name = 'JwtMalformedError';
  }
}

export class JwtInvalidAlgorithmError extends JwtError {
  constructor() {
    super('JWT algorithm is not allowed', 'JWT_INVALID_ALGORITHM');
    this.name = 'JwtInvalidAlgorithmError';
  }
}

export class JwtInvalidSignatureError extends JwtError {
  constructor() {
    super('JWT signature is invalid', 'JWT_INVALID_SIGNATURE');
    this.name = 'JwtInvalidSignatureError';
  }
}

export class JwtValidationError extends JwtError {
  constructor(reason: string) {
    super(`JWT validation failed: ${reason}`, 'JWT_VALIDATION_FAILED');
    this.name = 'JwtValidationError';
  }
}

@Injectable()
export class JwtHelper {
  /**
   * Strip "Bearer " prefix from authorization header value
   */
  stripBearer(token: string): string {
    if (token.toLowerCase().startsWith('bearer ')) {
      return token.slice(7);
    }
    return token;
  }

  /**
   * Decode JWT payload without verification
   * Useful for inspecting token contents
   */
  decode(token: string): JwtPayload | null {
    try {
      const decoded = jwt.decode(this.stripBearer(token));
      return decoded as JwtPayload | null;
    } catch {
      return null;
    }
  }

  /**
   * Decode JWT with full token information (header + payload)
   */
  decodeComplete(token: string): jwt.Jwt | null {
    try {
      return jwt.decode(this.stripBearer(token), { complete: true });
    } catch {
      return null;
    }
  }

  /**
   * Generate a JWT token
   */
  generate(payload: JwtPayload, secret: string, options: JwtGenerateOptions = {}): string {
    const { algorithm = 'HS256', expiresIn, issuer, audience, subject, jwtid } = options;

    const signOptions: jwt.SignOptions = {
      algorithm,
      ...(expiresIn && { expiresIn }),
      ...(issuer && { issuer }),
      ...(audience && { audience }),
      ...(subject && { subject }),
      ...(jwtid && { jwtid }),
    };

    return jwt.sign(payload, secret, signOptions);
  }

  /**
   * Generate HS256 token (convenience method)
   */
  generateHS256(payload: JwtPayload, secret: string, expiresIn: string | number = '1h'): string {
    return this.generate(payload, secret, { algorithm: 'HS256', expiresIn });
  }

  /**
   * Generate HS512 token (convenience method)
   */
  generateHS512(payload: JwtPayload, secret: string, expiresIn: string | number = '1h'): string {
    return this.generate(payload, secret, { algorithm: 'HS512', expiresIn });
  }

  /**
   * Generate RS256 token (convenience method)
   */
  generateRS256(payload: JwtPayload, privateKey: string, expiresIn: string | number = '1h'): string {
    return this.generate(payload, privateKey, { algorithm: 'RS256', expiresIn });
  }

  /**
   * Verify and parse JWT token
   * Throws typed errors for different failure scenarios
   */
  verify(token: string, secret: string, options: JwtVerifyOptions = {}): JwtPayload {
    const { algorithms = ['HS256'], clockTolerance = 0, ...restOptions } = options;

    try {
      const decoded = jwt.verify(this.stripBearer(token), secret, {
        algorithms,
        clockTolerance,
        ...restOptions,
      });

      return decoded as JwtPayload;
    } catch (err) {
      if (err instanceof Error) {
        switch (err.message) {
          case 'jwt expired':
            throw new JwtExpiredError();
          case 'jwt malformed':
          case 'jwt must be a string':
            throw new JwtMalformedError();
          case 'invalid algorithm':
            throw new JwtInvalidAlgorithmError();
          case 'invalid signature':
            throw new JwtInvalidSignatureError();
          default:
            throw new JwtValidationError(err.message);
        }
      }
      throw new JwtValidationError('Unknown error');
    }
  }

  /**
   * Verify token and compare payload values
   * Returns true if all provided values match the token payload
   */
  verifyAndCompare(
    token: string,
    secret: string,
    expectedValues: Partial<JwtPayload>,
    options: JwtVerifyOptions = {},
  ): boolean {
    const payload = this.verify(token, secret, options);

    for (const [key, expected] of Object.entries(expectedValues)) {
      const actual = payload[key];

      // Deep equality check for arrays/objects
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if a token is expired (without verification)
   */
  isExpired(token: string): boolean {
    const payload = this.decode(token);
    if (!payload?.exp) return false;

    return Date.now() >= payload.exp * 1000;
  }

  /**
   * Get time until token expires in seconds
   * Returns negative number if already expired
   */
  getTimeToExpiry(token: string): number | null {
    const payload = this.decode(token);
    if (!payload?.exp) return null;

    return payload.exp - Math.floor(Date.now() / 1000);
  }

  /**
   * Extract user information from authorization header
   */
  extractUser(authorizationHeader: string): JwtPayload | null {
    return this.decode(this.stripBearer(authorizationHeader));
  }
}
