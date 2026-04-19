import { Router } from 'express';
import { verifyToken } from '../../middleware/auth';
import { requireRole } from '../../middleware/auth';
import { getReviews, createReview, createReviewValidation } from './review.controller';

const router = Router({ mergeParams: true });

router.get('/', getReviews);
router.post('/', verifyToken, requireRole('student'), createReviewValidation, createReview);

export default router;