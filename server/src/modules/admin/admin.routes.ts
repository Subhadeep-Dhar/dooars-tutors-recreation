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
  toggleProfileStatus,
  updateProfile,
  deleteUser,
  toggleReviewVisibility,
  toggleProfileFeatured
} from './admin.controller';
import { getReports, updateReportStatus } from '../reports/report.controller';

const router = Router();

// All routes here require admin role
router.use(verifyToken, requireRole('admin'));

// Dashboard Overview
router.get('/stats', getAdminStats);

// Listing Routes
router.get('/profiles', getAllProfiles);
router.get('/users', getAllUsers);
router.get('/reviews', getAllReviews);
router.get('/reports', getReports);

// Action Routes
router.patch('/users/:id/status', toggleUserStatus);
router.patch('/users/:id/update', updateUser);
router.delete('/users/:id', deleteUser);

router.patch('/profiles/:id/status', toggleProfileStatus);
router.patch('/profiles/:id/update', updateProfile);
router.patch('/profiles/:id/feature', toggleProfileFeatured);
router.patch('/reviews/:id/visibility', toggleReviewVisibility);
router.patch('/reports/:id/status', updateReportStatus);

// Moderation Specific
router.get('/moderation-queue', getModerationQueue);
router.get('/moderation/:id', getProfileForModeration);
router.post('/profiles/:id/approve', approveProfile);
router.post('/profiles/:id/reject', rejectProfile);
router.post('/profiles/:id/merge', mergeProfiles);
router.get('/analytics', getModerationAnalytics);

export default router;