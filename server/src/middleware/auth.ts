import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errorHandler';
import { UserRole, AuthTokenPayload } from '@dooars/shared';

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload & { supabaseId?: string };
    }
  }
}

/**
 * Verifies the Supabase JWT access token from the Authorization header.
 */
export function verifyToken(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    // Note: Replace env.SUPABASE_JWT_SECRET with the actual variable if you map it differently
    const secret = process.env.SUPABASE_JWT_SECRET || env.JWT_ACCESS_SECRET;
    
    // Supabase JWTs contain `sub` which is the user's UUID
    const payload = jwt.verify(token, secret) as any;
    
    req.user = {
      userId: payload.sub, // Will be mapped to MongoDB _id manually in controllers, or we use supabaseId
      role: payload.user_role || 'student',
      supabaseId: payload.sub
    } as any;
    
    next();
  } catch (err) {
    next(new AppError('Invalid token or session expired', 401));
  }
}

/**
 * Role-based access control guard.
 * Always used AFTER verifyToken.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }
    // We will need to attach the correct role from MongoDB. 
    // Usually we fetch the user in verifyToken if we need roles.
    // For now, if role is missing, we reject.
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
}