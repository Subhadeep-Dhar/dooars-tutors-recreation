import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../../models';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';
import { AuthTokenPayload, UserRole } from '@dooars/shared';

function generateAccessToken(userId: string, role: UserRole): string {
  return jwt.sign({ userId, role } as AuthTokenPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES as any,
  });
}

function generateRefreshToken(userId: string, role: UserRole): string {
  return jwt.sign({ userId, role } as AuthTokenPayload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES as any,
  });
}

export async function registerUser(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: UserRole;
}) {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) throw new AppError('Email already registered', 409);

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await User.create({
    email: data.email.toLowerCase(),
    passwordHash,
    name: data.name,
    phone: data.phone,
    role: data.role ?? 'student',
  });

  const accessToken = generateAccessToken(String(user._id), user.role);
  const refreshToken = generateRefreshToken(String(user._id), user.role);

  // Store hashed refresh token
  user.refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await user.save();

  return {
    user: {
      _id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
    },
    accessToken,
    refreshToken,
  };
}

export async function loginUser(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true }).select(
    '+refreshTokenHash +passwordHash'
  );
  if (!user) throw new AppError('Invalid email or password', 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError('Invalid email or password', 401);

  const accessToken = generateAccessToken(String(user._id), user.role);
  const refreshToken = generateRefreshToken(String(user._id), user.role);

  user.refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  user.lastLogin = new Date();
  await user.save();

  return {
    user: {
      _id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      ...(user.avatar?.url && { avatar: user.avatar }),
      isVerified: user.isVerified,
    },
    accessToken,
    refreshToken,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  let payload: AuthTokenPayload;

  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as AuthTokenPayload;
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const user = await User.findOne({
    _id: payload.userId,
    isActive: true,
  }).select('+refreshTokenHash');

  if (!user || user.refreshTokenHash !== tokenHash) {
    throw new AppError('Invalid refresh token', 401);
  }

  const newAccessToken = generateAccessToken(String(user._id), user.role);
  return { accessToken: newAccessToken };
}

export async function logoutUser(refreshToken: string) {
  if (!refreshToken) return;

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await User.findOneAndUpdate(
    { refreshTokenHash: tokenHash },
    { $unset: { refreshTokenHash: 1 } }
  );
}