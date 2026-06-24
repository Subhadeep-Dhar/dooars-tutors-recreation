import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errorHandler';
import { UserRole, AuthTokenPayload } from '@dooars/shared';
import { createClient } from '@supabase/supabase-js';
import { User } from '../models/User';

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
export async function verifyToken(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    // If Supabase URL and Key are provided, we verify via Supabase securely (Supports ECC P-256 keys)
    if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error || !data.user) {
        throw new Error(error?.message || 'Invalid Supabase Token');
      }

      req.user = {
        userId: data.user.id,
        role: (data.user.user_metadata?.role as UserRole) || 'student',
        supabaseId: data.user.id,
        email: data.user.email
      } as any;

      return next();
    }

    // Fallback: Legacy HS256 local verification
    const secret = process.env.SUPABASE_JWT_SECRET || env.JWT_ACCESS_SECRET;
    const payload = jwt.verify(token, secret) as any;
    
    req.user = {
      userId: payload.sub, // Will be mapped to MongoDB _id manually in controllers, or we use supabaseId
      role: payload.user_role || 'student',
      supabaseId: payload.sub,
      email: payload.email
    } as any;
    
    next();
  } catch (err: any) {
    console.error('Token verification error:', err.message);
    next(new AppError('Invalid token or session expired', 401));
  }
}

/**
 * Role-based access control guard.
 * Always used AFTER verifyToken.
 */
export function requireRole(...roles: UserRole[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }
    
    try {
      // Fetch user from DB to get the authoritative role
      const user = await User.findOne({ supabaseId: req.user.supabaseId }).select('role').lean();
      
      if (!user) {
        return next(new AppError('User not found in database', 404));
      }

      req.user.role = user.role as UserRole;

      if (!roles.includes(user.role as UserRole)) {
        return next(new AppError('Insufficient permissions', 403));
      }
      
      next();
    } catch (err) {
      next(err);
    }
  };
}