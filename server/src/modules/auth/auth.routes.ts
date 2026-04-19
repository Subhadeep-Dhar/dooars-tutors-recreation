import { Router } from 'express';
import { authLimiter } from '../../middleware/rateLimiter';
import { verifyToken } from '../../middleware/auth';
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  registerValidation,
  loginValidation,
} from './auth.controller';

const router = Router();

router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', verifyToken, getMe);

export default router;