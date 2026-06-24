import { Router } from 'express';
import { verifyToken, requireRole } from '../../middleware/auth';
import {
  getModerationQueue,
  getProfileForModeration,
  approveProfile,
  rejectProfile,
  mergeProfiles,
  getModerationAnalytics,
  getAdminStats,
  getAllProfiles,
  getAllUsers,
  getAllReviews,
  toggleUserStatus,
  updateUser,
  deleteUser,
  toggleReviewVisibility,
  toggleProfileFeatured
} from './admin.controller';

const router = Router();

// All routes here require admin role
router.use(verifyToken, requireRole('admin'));

// Dashboard Overview
router.get('/stats', getAdminStats);

// Listing Routes
router.get('/profiles', getAllProfiles);
router.get('/users', getAllUsers);
router.get('/reviews', getAllReviews);

// Action Routes
router.patch('/users/:id/status', toggleUserStatus);
router.patch('/users/:id/update', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/reviews/:id/visibility', toggleReviewVisibility);
router.patch('/profiles/:id/feature', toggleProfileFeatured);

// Moderation Specific
router.get('/moderation-queue', getModerationQueue);
router.get('/moderation/:id', getProfileForModeration);
router.post('/profiles/:id/approve', approveProfile);
router.post('/profiles/:id/reject', rejectProfile);
router.post('/profiles/:id/merge', mergeProfiles);
router.get('/analytics', getModerationAnalytics);

export default router;