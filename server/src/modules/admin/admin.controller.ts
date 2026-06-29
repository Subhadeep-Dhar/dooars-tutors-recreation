import { Request, Response, NextFunction } from 'express';
import * as AdminService from './admin.service';

export async function getAdminStats(req: Request, res: Response, next: NextFunction) {
  try {
    const { timeframe } = req.query;
    const data = await AdminService.getAdminStats(timeframe as string);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function getAllProfiles(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '10', search, type } = req.query;
    const result = await AdminService.getAllProfiles({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string,
      type: type as string
    });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[AdminController] getAllProfiles failed:', err);
    next(err);
  }
}

export async function getAllUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '10', search, role } = req.query;
    const result = await AdminService.getAllUsers({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string,
      role: role as string
    });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[AdminController] getAllUsers failed:', err);
    next(err);
  }
}

export async function getAllReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '10' } = req.query;
    const result = await AdminService.getAllReviews({
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[AdminController] getAllReviews failed:', err);
    next(err);
  }
}

export async function toggleUserStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await AdminService.toggleUserStatus(req.params.id);
    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await AdminService.createUser(req.body);
    res.status(201).json({ success: true, data: { user }, message: 'User created successfully' });
  } catch (err) { next(err); }
}

export async function impersonateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await AdminService.impersonateUser(req.params.id);
    res.json({ success: true, data, message: 'Impersonating user' });
  } catch (err) { next(err); }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await AdminService.updateUser(req.params.id, req.body);
    res.json({ success: true, data: { user }, message: 'User updated successfully' });
  } catch (err) { next(err); }
}

export async function toggleProfileStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await AdminService.toggleProfileStatus(req.params.id);
    res.json({ success: true, data: { profile } });
  } catch (err) { next(err); }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await AdminService.updateProfile(req.params.id, req.body);
    res.json({ success: true, data: { profile }, message: 'Profile updated successfully' });
  } catch (err) { next(err); }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    await AdminService.deleteUser(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) { next(err); }
}

export async function toggleReviewVisibility(req: Request, res: Response, next: NextFunction) {
  try {
    const review = await AdminService.toggleReviewVisibility(req.params.id);
    res.json({ success: true, data: { review } });
  } catch (err) { next(err); }
}

export async function toggleProfileFeatured(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await AdminService.toggleProfileFeatured(req.params.id);
    res.json({ success: true, data: { profile } });
  } catch (err) { next(err); }
}

export async function getModerationQueue(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '10', status, source, batchId, lowConfidence, missingPhone, enrichmentFailed } = req.query;
    
    const filters = {
      status,
      source,
      batchId,
      lowConfidence: lowConfidence === 'true',
      missingPhone: missingPhone === 'true',
      enrichmentFailed: enrichmentFailed === 'true'
    };

    const result = await AdminService.getModerationQueue(filters, {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getProfileForModeration(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await AdminService.getProfileForModeration(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function approveProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await AdminService.approveProfile(req.params.id);
    res.json({ success: true, data: { profile }, message: 'Profile verified' });
  } catch (err) { next(err); }
}

export async function rejectProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await AdminService.rejectProfile(req.params.id);
    res.json({ success: true, data: { profile }, message: 'Profile rejected' });
  } catch (err) { next(err); }
}

export async function mergeProfiles(req: Request, res: Response, next: NextFunction) {
  try {
    const { sourceId, fieldsToKeep } = req.body;
    const profile = await AdminService.mergeProfiles(req.params.id, sourceId, fieldsToKeep);
    res.json({ success: true, data: { profile }, message: 'Profiles merged' });
  } catch (err) { next(err); }
}

export async function getModerationAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await AdminService.getModerationAnalytics();
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}