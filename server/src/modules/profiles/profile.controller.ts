import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import * as ProfileService from './profile.service';
import { AppError } from '../../middleware/errorHandler';

// ── Validation ────────────────────────────────────────────────────────────────

export const createProfileValidation = [
  body('type')
    .isIn(['tutor', 'coaching_center', 'sports_trainer', 'arts_trainer', 'gym_yoga'])
    .withMessage('Invalid profile type'),
  body('displayName').trim().isLength({ min: 2 }).withMessage('Display name required'),
  body('address.line1').trim().notEmpty().withMessage('Address line1 required'),
  body('address.town').trim().notEmpty().withMessage('Town required'),
  body('address.district').trim().notEmpty().withMessage('District required'),
  body('address.state').trim().notEmpty().withMessage('State required'),
  body('address.pincode').trim().notEmpty().withMessage('Pincode required'),
];

export const academicSlotValidation = [
  body('subject').trim().notEmpty().withMessage('Subject required'),
  body('classes').isArray({ min: 1 }).withMessage('At least one class required'),
  body('board').isIn(['CBSE', 'ICSE', 'State', 'Other']).withMessage('Invalid board'),
  body('medium').isIn(['Bengali', 'English', 'Hindi', 'Other']).withMessage('Invalid medium'),
  body('feePerMonth').optional().isNumeric().withMessage('Fee must be a number'),
];

export const nonAcademicSlotValidation = [
  body('activity').trim().notEmpty().withMessage('Activity required'),
  body('feePerMonth').optional().isNumeric().withMessage('Fee must be a number'),
];

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function createProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const fieldErrors = Object.fromEntries(errors.array().map((e) => [(e as any).path, e.msg]));
      throw new AppError('Validation failed', 400, fieldErrors);
    }

    const profile = await ProfileService.createProfile(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: { profile }, message: 'Profile created. Pending admin approval.' });
  } catch (err) { next(err); }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await ProfileService.updateProfile(req.params.id, req.user!.userId, req.body);
    res.json({ success: true, data: { profile } });
  } catch (err) { next(err); }
}

export async function getProfileBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await ProfileService.getProfileBySlug(req.params.slug);
    res.json({ success: true, data: { profile } });
  } catch (err) { next(err); }
}

export async function getMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await ProfileService.getMyProfile(req.user!.userId);
    res.json({ success: true, data: { profile } });
  } catch (err) { next(err); }
}

export async function addSlot(req: Request, res: Response, next: NextFunction) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const fieldErrors = Object.fromEntries(errors.array().map((e) => [(e as any).path, e.msg]));
      throw new AppError('Validation failed', 400, fieldErrors);
    }
    const profile = await ProfileService.addSlot(req.params.id, req.user!.userId, req.body);
    res.status(201).json({ success: true, data: { profile } });
  } catch (err) { next(err); }
}

export async function updateSlot(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await ProfileService.updateSlot(req.params.id, req.user!.userId, req.params.slotId, req.body);
    res.json({ success: true, data: { profile } });
  } catch (err) { next(err); }
}

export async function deleteSlot(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await ProfileService.deleteSlot(req.params.id, req.user!.userId, req.params.slotId);
    res.json({ success: true, message: 'Slot removed' });
  } catch (err) { next(err); }
}