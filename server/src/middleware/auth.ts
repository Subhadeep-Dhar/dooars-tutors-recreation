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
      user?: AuthTokenPayload & { supabaseId?: string; email?: string };
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
    let supabaseId = '';
    let email = '';
    let role: UserRole = 'student';

    // If Supabase URL and Key are provided, we verify via Supabase securely (Supports ECC P-256 keys)
    if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error || !data.user) {
        throw new Error(error?.message || 'Invalid Supabase Token');
      }

      supabaseId = data.user.id;
      email = data.user.email || '';
      role = (data.user.user_metadata?.role as UserRole) || 'student';
    } else {
      // Fallback: Legacy HS256 local verification
      const secret = process.env.SUPABASE_JWT_SECRET || env.JWT_ACCESS_SECRET;
      const payload = jwt.verify(token, secret) as any;
      
      supabaseId = payload.sub;
      email = payload.email || '';
      role = payload.user_role || 'student';
    }

    let userId = supabaseId;

    // Fetch authoritative data from DB if user is linked
    const user = await User.findOne({ supabaseId }).select('_id role').lean();
    if (user) {
      userId = user._id.toString();
      role = user.role as UserRole;
    }

    req.user = {
      userId,
      role,
      supabaseId,
      email
    };
    
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
      // RequireRole now just checks the role we fetched in verifyToken!
      if (!roles.includes(req.user.role)) {
        return next(new AppError('Insufficient permissions', 403));
      }
      
      next();
    } catch (err) {
      next(err);
    }
  };
}