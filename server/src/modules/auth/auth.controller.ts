import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import * as AuthService from './auth.service';
import { AppError } from '../../middleware/errorHandler';
import { env } from '../../config/env';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
  path: '/',
};

// ── Validation rules ──────────────────────────────────────────────────────────

export const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase and a number'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
  body('role')
    .optional()
    .isIn(['student', 'tutor', 'org'])
    .withMessage('Role must be student, tutor, or org'),
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const fieldErrors = Object.fromEntries(errors.array().map((e) => [(e as any).path, e.msg]));
      throw new AppError('Validation failed', 400, fieldErrors);
    }

    const { user, accessToken, refreshToken } = await AuthService.registerUser(req.body);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      data: { user, accessToken },
      message: 'Registration successful',
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const fieldErrors = Object.fromEntries(errors.array().map((e) => [(e as any).path, e.msg]));
      throw new AppError('Validation failed', 400, fieldErrors);
    }

    const { user, accessToken, refreshToken } = await AuthService.loginUser(
      req.body.email,
      req.body.password
    );

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({
      success: true,
      data: { user, accessToken },
      message: 'Login successful',
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) throw new AppError('No refresh token', 401);

    const { accessToken, refreshToken: newRefreshToken } = await AuthService.refreshAccessToken(refreshToken);

    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    await AuthService.logoutUser(refreshToken);

    res.clearCookie('refreshToken', { path: '/' });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const { User } = await import('../../models');
    const user = await User.findById(req.user!.userId).select('-passwordHash -refreshTokenHash');
    if (!user) throw new AppError('User not found', 404);

    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}