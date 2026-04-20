import { Request, Response, NextFunction } from 'express';
import * as MediaService from './media.service';
import { AppError } from '../../middleware/errorHandler';

export async function uploadMedia(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError('No file provided', 400);
    const { category, caption } = req.body;
    const profile = await MediaService.uploadMedia(
      req.params.id,
      req.user!.userId,
      req.file,
      category ?? 'gallery',
      caption
    );
    res.status(201).json({ success: true, data: { profile }, message: 'Media uploaded' });
  } catch (err) { next(err); }
}

export async function deleteMedia(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await MediaService.deleteMedia(
      req.params.id,
      req.user!.userId,
      req.params.mediaId
    );
    res.json({ success: true, data: { profile }, message: 'Media deleted' });
  } catch (err) { next(err); }
}

export async function uploadAvatar(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError('No file provided', 400);
    const user = await MediaService.uploadAvatar(req.user!.userId, req.file);
    res.json({ success: true, data: { user }, message: 'Avatar updated' });
  } catch (err) { next(err); }
}