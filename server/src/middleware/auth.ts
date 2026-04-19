import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errorHandler';
import { UserRole, AuthTokenPayload } from '@dooars/shared';

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

/**
 * Verifies the JWT access token from the Authorization header.
 * Attaches decoded payload to req.user.
 */
export function verifyToken(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthTokenPayload;
    req.user = payload;
    next();
  } catch (err) {
    next(err); // caught by errorHandler as JsonWebTokenError / TokenExpiredError
  }
}

/**
 * Role-based access control guard.
 * Always used AFTER verifyToken.
 *
 * Usage:
 *   router.post('/profiles', verifyToken, requireRole('tutor', 'org', 'admin'), ...)
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
}