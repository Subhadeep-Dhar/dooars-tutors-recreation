import { Request, Response, NextFunction } from 'express';
import * as AdminService from './admin.service';
import { toggleReviewVisibility } from '../reviews/review.service';

export async function getPendingProfiles(req: Request, res: Response, next: NextFunction) {
  try {
    const profiles = await AdminService.getPendingProfiles();
    res.json({ success: true, data: { profiles } });
  } catch (err) { next(err); }
}

export async function getAdminStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await AdminService.getAdminStats();
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
}

export async function getAllProfiles(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await AdminService.getAllProfiles(
      Number(req.query.page) || 1,
      Number(req.query.limit) || 20
    );
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function approveProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { approved } = req.body;
    const profile = await AdminService.approveProfile(req.params.id, approved !== false);
    res.json({ success: true, data: { profile }, message: `Profile ${approved !== false ? 'approved' : 'rejected'}` });
  } catch (err) { next(err); }
}

export async function toggleFeatured(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await AdminService.toggleFeatured(req.params.id);
    res.json({ success: true, data: { profile } });
  } catch (err) { next(err); }
}

export async function getAllReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await AdminService.getAllReviews(
      Number(req.query.page) || 1,
      Number(req.query.limit) || 20
    );
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function toggleReview(req: Request, res: Response, next: NextFunction) {
  try {
    const review = await toggleReviewVisibility(req.params.id);
    res.json({ success: true, data: { review } });
  } catch (err) { next(err); }
}

export async function getAllUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await AdminService.getAllUsers(
      Number(req.query.page) || 1,
      Number(req.query.limit) || 20
    );
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function toggleUserStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await AdminService.toggleUserStatus(req.params.id);
    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
}