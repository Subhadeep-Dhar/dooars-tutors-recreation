import { Router } from 'express';
import { authLimiter } from '../../middleware/rateLimiter';
import { verifyToken } from '../../middleware/auth';
import {
  registerPending,
  activate,
  logout,
  getMe,
  deleteAccount,
  registerValidation,
} from './auth.controller';

const router = Router();

// Used before OTP verify
router.post('/register-pending', authLimiter, registerValidation, registerPending);

// Used after OTP verify to finalize session and link user
router.post('/activate', verifyToken, activate);

router.post('/logout', logout);
router.get('/me', verifyToken, getMe);
router.delete('/me', verifyToken, deleteAccount);

export default router;