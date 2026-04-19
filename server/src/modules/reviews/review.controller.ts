import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import * as ReviewService from './review.service';
import { AppError } from '../../middleware/errorHandler';

export const createReviewValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('text').trim().isLength({ min: 10, max: 1000 }).withMessage('Review must be 10-1000 characters'),
];

export async function getReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const reviews = await ReviewService.getProfileReviews(req.params.profileId);
    res.json({ success: true, data: { reviews } });
  } catch (err) { next(err); }
}

export async function createReview(req: Request, res: Response, next: NextFunction) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const fieldErrors = Object.fromEntries(errors.array().map((e) => [(e as any).path, e.msg]));
      throw new AppError('Validation failed', 400, fieldErrors);
    }
    const review = await ReviewService.createReview(
      req.params.profileId,
      req.user!.userId,
      req.body
    );
    res.status(201).json({ success: true, data: { review } });
  } catch (err) { next(err); }
}