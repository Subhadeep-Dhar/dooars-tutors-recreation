import { Request, Response, NextFunction } from 'express';
import * as AdminService from './admin.service';

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