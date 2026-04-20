import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import { requireRole } from '../../middleware/auth';
import { uploadLimiter } from '../../middleware/rateLimiter';
import { upload } from '../../middleware/upload';
import { uploadMedia, deleteMedia, uploadAvatar } from './media.controller';

const router = Router();

router.post(
  '/profiles/:id/media',
  verifyToken,
  requireRole('tutor', 'org', 'admin'),
  uploadLimiter,
  upload.single('file'),
  uploadMedia
);

router.delete(
  '/profiles/:id/media/:mediaId',
  verifyToken,
  requireRole('tutor', 'org', 'admin'),
  deleteMedia
);

router.post(
  '/users/avatar',
  verifyToken,
  uploadLimiter,
  upload.single('file'),
  uploadAvatar
);

export default router;