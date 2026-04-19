import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import { requireRole } from '../../middleware/auth';
import reviewRoutes from '../reviews/review.routes';
import {
  createProfile,
  updateProfile,
  getProfileBySlug,
  getMyProfile,
  addSlot,
  updateSlot,
  deleteSlot,
  createProfileValidation,
  academicSlotValidation,
  nonAcademicSlotValidation,
} from './profile.controller';

const router = Router();

// Public
router.get('/slug/:slug', getProfileBySlug);

router.use('/:profileId/reviews', reviewRoutes);

// Protected — tutor/org/admin only
router.get('/me', verifyToken, getMyProfile);
router.post('/', verifyToken, requireRole('tutor', 'org', 'admin'), createProfileValidation, createProfile);
router.put('/:id', verifyToken, requireRole('tutor', 'org', 'admin'), updateProfile);

// Slot management
router.post('/:id/slots', verifyToken, requireRole('tutor', 'org', 'admin'), academicSlotValidation, addSlot);
router.put('/:id/slots/:slotId', verifyToken, requireRole('tutor', 'org', 'admin'), updateSlot);
router.delete('/:id/slots/:slotId', verifyToken, requireRole('tutor', 'org', 'admin'), deleteSlot);

export default router;