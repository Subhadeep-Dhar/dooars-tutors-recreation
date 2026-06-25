import { Request, Response, NextFunction } from 'express';
import { PlatformStat } from '../../models';

export async function incrementVisits(req: Request, res: Response, next: NextFunction) {
  try {
    const stat = await PlatformStat.findOneAndUpdate(
      { type: 'global' },
      { $inc: { totalVisits: 1 } },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: { totalVisits: stat.totalVisits } });
  } catch (err) {
    next(err);
  }
}

export async function getVisits(req: Request, res: Response, next: NextFunction) {
  try {
    let stat = await PlatformStat.findOne({ type: 'global' });
    if (!stat) {
      stat = await PlatformStat.create({ type: 'global', totalVisits: 24358 });
    }
    res.json({ success: true, data: { totalVisits: stat.totalVisits } });
  } catch (err) {
    next(err);
  }
}
