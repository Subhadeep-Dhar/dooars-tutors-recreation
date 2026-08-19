import express from 'express';
import { getPublicSettings, updateSettings } from './settings.controller';
import { verifyToken, requireRole } from '../../middleware/auth';

const router = express.Router();

// Public route for fetching settings needed by the frontend (like limits)
router.get('/public', getPublicSettings);

// Protected routes (Admin only)
router.use(verifyToken);
router.use(requireRole('admin'));

router.put('/admin', updateSettings);
router.get('/admin', getPublicSettings); // Admin can use the same getter for now

export default router;
