import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import * as ProfileService from './profile.service';
import { AppError } from '../../middleware/errorHandler';
import { sendProfileCreationAdminNotification } from '../../utils/email';

// ── Validation ────────────────────────────────────────────────────────────────

export const createProfileValidation = [
  body('type')
    .isIn(['tutor', 'coaching_center', 'sports_trainer', 'arts_trainer', 'gym_yoga'])
    .withMessage('Invalid profile type'),
  body('displayName').trim().isLength({ min: 2 }).withMessage('Display name required'),
  body('address.line1').optional({ checkFalsy: true }).trim(),
  body('address.town').optional({ checkFalsy: true }).trim(),
  body('address.district').optional({ checkFalsy: true }).trim(),
  body('address.state').optional({ checkFalsy: true }).trim(),
  body('address.pincode').optional({ checkFalsy: true }).trim(),
  // ── New optional fields ──────────────────────────────────────────────────
  body('gender')
    .optional()
    .isIn(['male', 'female', 'alien'])
    .withMessage('Invalid gender value'),
  body('isOrganisation')
    .optional()
    .isBoolean({ strict: false })
    .withMessage('isOrganisation must be a boolean'),
  body('dateOfBirth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('dateOfBirth must be an ISO 8601 date'),
  body('serviceModes')
    .optional()
    .isArray()
    .withMessage('serviceModes must be an array'),
  body('serviceModes.*')
    .optional()
    .isIn(['online', 'offline', 'student_home', 'provider_home'])
    .withMessage('Invalid service mode'),
  body('serviceRadiusKm')
    .optional()
    .isFloat({ min: 0, max: 200 })
    .withMessage('serviceRadiusKm must be between 0 and 200'),
  body('learnerLevels')
    .optional()
    .isArray()
    .withMessage('learnerLevels must be an array'),
  body('learnerLevels.*')
    .optional()
    .isIn(['foundation', 'intermediate', 'advanced', 'all'])
    .withMessage('Invalid learner level'),
  body('teachingStyles')
    .optional()
    .isArray()
    .withMessage('teachingStyles must be an array'),
  body('teachingStyles.*')
    .optional()
    .isIn(['patient','concept_focused','exam_oriented','interactive','practice_intensive','visual_learning','step_by_step','fast_paced','gentle'])
    .withMessage('Invalid teaching style'),
  // bioSource and bioGeneratedAt are server-controlled -- rejected if sent by client
  body('bioSource').not().exists().withMessage('bioSource is server-controlled and cannot be set by clients'),
  body('bioGeneratedAt').not().exists().withMessage('bioGeneratedAt is server-controlled and cannot be set by clients'),
];

export const slotValidation = [
  body().custom((value, { req }) => {
    if (!req.body.subject && !req.body.activity) {
      throw new Error('Either subject or activity is required');
    }
    return true;
  }),
  body('subject').if(body('subject').exists()).trim().notEmpty().withMessage('Subject required'),
  body('classes').if(body('subject').exists()).isArray({ min: 1 }).withMessage('At least one class required'),
  body('board').if(body('subject').exists()).isIn(['CBSE', 'ICSE', 'State', 'Other']).withMessage('Invalid board'),
  body('medium').if(body('subject').exists()).isIn(['Bengali', 'English', 'Hindi', 'Other']).withMessage('Invalid medium'),
  body('activity').if(body('activity').exists()).trim().notEmpty().withMessage('Activity required'),
  body('feePerMonth').optional({ checkFalsy: true }).isNumeric().withMessage('Fee must be a number'),
];

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function createProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const fieldErrors = Object.fromEntries(errors.array().map((e) => [(e as any).path, e.msg]));
      throw new AppError('Validation failed', 400, fieldErrors);
    }

    // Strip server-controlled provenance fields from client payload
    const { bioSource, bioGeneratedAt, ...safeBody } = req.body;

    const profile = await ProfileService.createProfile(req.user!.userId, safeBody);
    
    if (req.user?.email) {
      sendProfileCreationAdminNotification(req.user.email, profile.displayName, profile.type).catch(console.error);
    }

    res.status(201).json({ success: true, data: { profile }, message: 'Profile created. Pending admin approval.' });
  } catch (err) { next(err); }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    // Strip server-controlled provenance fields from client payload
    const { bioSource, bioGeneratedAt, ...safeBody } = req.body;
    const profile = await ProfileService.updateProfile(req.params.id, req.user!.userId, safeBody);
    res.json({ success: true, data: { profile } });
  } catch (err) { next(err); }
}

export async function getProfileBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await ProfileService.getProfileBySlug(req.params.slug);
    res.json({ success: true, data: { profile } });
  } catch (err) { next(err); }
}

export async function getProfileByIdentifier(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await ProfileService.getProfileByIdentifier(req.params.identifier);
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