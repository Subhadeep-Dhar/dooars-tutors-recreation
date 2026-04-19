import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import { requireRole } from '../../middleware/auth';
import {
  getPendingProfiles,
  getAllProfiles,
  approveProfile,
  toggleFeatured,
  getAllReviews,
  toggleReview,
  getAllUsers,
  toggleUserStatus,
} from './admin.controller';

const router = Router();

router.use(verifyToken, requireRole('admin'));

router.get('/profiles/pending', getPendingProfiles);
router.get('/profiles', getAllProfiles);
router.patch('/profiles/:id/approve', approveProfile);
router.patch('/profiles/:id/feature', toggleFeatured);

router.get('/reviews', getAllReviews);
router.patch('/reviews/:id/visibility', toggleReview);

router.get('/users', getAllUsers);
router.patch('/users/:id/status', toggleUserStatus);

export default router;