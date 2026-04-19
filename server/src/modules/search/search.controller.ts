import { Request, Response, NextFunction } from 'express';
import * as SearchService from './search.service';
import { SearchParams } from '@dooars/shared';

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const params: SearchParams = {
      q: req.query.q as string,
      type: req.query.type as any,
      subject: req.query.subject as string,
      class: req.query.class as string,
      board: req.query.board as any,
      lat: req.query.lat ? Number(req.query.lat) : undefined,
      lng: req.query.lng ? Number(req.query.lng) : undefined,
      radius: req.query.radius ? Number(req.query.radius) : 10,
      minFee: req.query.minFee ? Number(req.query.minFee) : undefined,
      maxFee: req.query.maxFee ? Number(req.query.maxFee) : undefined,
      sort: (req.query.sort as any) ?? 'rating',
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    };

    const result = await SearchService.searchProfiles(params);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function nearby(req: Request, res: Response, next: NextFunction) {
  try {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng) {
      res.status(400).json({ success: false, message: 'lat and lng are required' });
      return;
    }
    const profiles = await SearchService.getNearbyProfiles(
      Number(lat),
      Number(lng),
      radius ? Number(radius) : 10
    );
    res.json({ success: true, data: { profiles } });
  } catch (err) {
    next(err);
  }
}