import { Router } from 'express';
import { verifyToken, requireRole } from '../../middleware/auth';
import {
  getModerationQueue,
  getProfileForModeration,
  approveProfile,
  rejectProfile,
  mergeProfiles,
  getModerationAnalytics
} from './admin.controller';

const router = Router();

// All routes here require admin role
router.use(verifyToken, requireRole('admin'));

router.get('/moderation-queue', getModerationQueue);
router.get('/moderation/:id', getProfileForModeration);
router.post('/profiles/:id/approve', approveProfile);
router.post('/profiles/:id/reject', rejectProfile);
router.post('/profiles/:id/merge', mergeProfiles);
router.get('/analytics', getModerationAnalytics);

export default router;