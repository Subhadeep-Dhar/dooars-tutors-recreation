// import crypto from 'crypto';
// import { Profile } from '../../models';
// import { cacheGet, cacheSet } from '../../config/redis';
// import { SearchParams } from '@dooars/shared';

// const CACHE_TTL = 300; // 5 minutes

// function buildCacheKey(params: SearchParams): string {
//   const hash = crypto.createHash('md5').update(JSON.stringify(params)).digest('hex');
//   return `search:${hash}`;
// }

// function matchedSlots(teachingSlots: any[], params: SearchParams) {
//   return teachingSlots.filter((slot) => {
//     if (params.subject) {
//       const name = slot.subject || slot.activity || '';
//       if (name.toLowerCase() !== params.subject.toLowerCase()) return false;
//     }
//     if (params.class && slot.classes) {
//       if (!slot.classes.includes(params.class)) return false;
//     }
//     if (params.board && slot.board) {
//       if (slot.board !== params.board) return false;
//     }
//     if (params.minFee != null && slot.feePerMonth != null) {
//       if (slot.feePerMonth < params.minFee) return false;
//     }
//     if (params.maxFee != null && slot.feePerMonth != null) {
//       if (slot.feePerMonth > params.maxFee) return false;
//     }
//     return true;
//   });
// }

// export async function searchProfiles(params: SearchParams) {
//   const {
//     q,
//     type,
//     subject,
//     class: cls,
//     board,
//     lat,
//     lng,
//     radius = 10,
//     minFee,
//     maxFee,
//     sort = 'rating',
//     page = 1,
//     limit = 20,
//   } = params;

//   const safePage = Math.max(1, page);
//   const safeLimit = Math.min(50, Math.max(1, limit));

//   // Check cache first
//   const cacheKey = buildCacheKey(params);
//   const cached = await cacheGet(cacheKey);
//   if (cached) return JSON.parse(cached);

//   // ── Build filter ────────────────────────────────────────────────────────────
//   const filter: any = {
//     isApproved: true,
//     isActive: true,
//   };

//   if (type) filter.type = type;
//   if (subject) filter._subjectIndex = { $in: [subject] };
//   if (cls) filter._classIndex = { $in: [cls] };

//   // Geo filter
//   if (lat != null && lng != null) {
//     filter.location = {
//       $near: {
//         $geometry: { type: 'Point', coordinates: [+lng, +lat] },
//         $maxDistance: radius * 1000,
//       },
//     };
//   }

//   // Full-text search on displayName + bio
//   if (q) {
//     filter.$or = [
//       { displayName: { $regex: q, $options: 'i' } },
//       { bio: { $regex: q, $options: 'i' } },
//       { tagline: { $regex: q, $options: 'i' } },
//       { _subjectIndex: { $regex: q, $options: 'i' } },
//     ];
//   }

//   // ── Sort ────────────────────────────────────────────────────────────────────
//   const sortMap: Record<string, any> = {
//     rating: { 'rating.average': -1, 'rating.count': -1 },
//     newest: { createdAt: -1 },
//     fee_asc: { createdAt: -1 }, // fee sort done post-query
//     // distance: implicit when $near is used
//   };

//   const sortQuery = lat && lng ? {} : (sortMap[sort] ?? sortMap.rating);

//   // ── Query ───────────────────────────────────────────────────────────────────
//   const profiles = await Profile.find(filter)
//     .sort(sortQuery)
//     .skip((safePage - 1) * safeLimit)
//     .limit(safeLimit)
//     .lean();

//   // $near cannot be used with countDocuments — count separately without geo
//   const countFilter = { ...filter };
//   delete countFilter.location;
//   const total = lat && lng ? profiles.length : await Profile.countDocuments(countFilter);

//   // ── Post-query: attach matched slots ────────────────────────────────────────
//   let results = profiles.map((p) => ({
//     ...p,
//     matchedSlots: matchedSlots(p.teachingSlots, { subject, class: cls, board, minFee, maxFee }),
//   }));

//   // Fee sort — sort by lowest matched slot fee
//   if (sort === 'fee_asc') {
//     results = results.sort((a, b) => {
//       const aFee = a.matchedSlots[0]?.feePerMonth ?? Infinity;
//       const bFee = b.matchedSlots[0]?.feePerMonth ?? Infinity;
//       return aFee - bFee;
//     });
//   }

//   const response = {
//     data: results,
//     total,
//     page: safePage,
//     limit: safeLimit,
//     totalPages: Math.ceil(total / safeLimit),
//   };

//   // Cache result
//   await cacheSet(cacheKey, JSON.stringify(response), CACHE_TTL);

//   return response;
// }

// export async function getNearbyProfiles(lat: number, lng: number, radius = 10) {
//   const profiles = await Profile.find({
//     isApproved: true,
//     isActive: true,
//     location: {
//       $near: {
//         $geometry: { type: 'Point', coordinates: [+lng, +lat] },
//         $maxDistance: radius * 1000,
//       },
//     },
//   })
//     .limit(50)
//     .lean();

//   return profiles;
// }

import crypto from 'crypto';
import { Profile } from '../../models';
import { cacheGet, cacheSet } from '../../config/redis';
import { SearchParams } from '@dooars/shared';
import { parseQuery, expandQuery, normalizeClass } from './synonyms';

const CACHE_TTL = 300;

function buildCacheKey(params: SearchParams): string {
  return `search:${crypto.createHash('md5').update(JSON.stringify(params)).digest('hex')}`;
}

function getMatchedSlots(teachingSlots: any[], subjects: string[], cls?: string, board?: string, minFee?: number, maxFee?: number) {
  if (subjects.length === 0 && !cls && !board && minFee == null && maxFee == null) return teachingSlots;
  return teachingSlots.filter((slot) => {
    const slotName = (slot.subject || slot.activity || '').toLowerCase();
    if (subjects.length > 0) {
      if (!subjects.some(s => slotName.includes(s.toLowerCase()) || s.toLowerCase().includes(slotName))) return false;
    }
    if (cls && slot.classes) {
      const classNum = cls.replace(/class\s*/i, '').trim();
      if (!slot.classes.some((c: string) => c.replace(/class\s*/i, '').trim() === classNum)) return false;
    }
    if (board && slot.board && slot.board !== board) return false;
    if (minFee != null && slot.feePerMonth != null && slot.feePerMonth < minFee) return false;
    if (maxFee != null && slot.feePerMonth != null && slot.feePerMonth > maxFee) return false;
    return true;
  });
}

function scoreProfile(profile: any, subjects: string[], rawTerms: string[], cls?: string): number {
  let score = 0;
  score += (profile.rating?.average ?? 0) * 2;
  if (profile.isFeatured) score += 3;
  const subjectIndex = (profile._subjectIndex ?? []).map((s: string) => s.toLowerCase());
  const bio = (profile.bio ?? '').toLowerCase();
  const tagline = (profile.tagline ?? '').toLowerCase();
  const displayName = (profile.displayName ?? '').toLowerCase();
  for (const subject of subjects) {
    const s = subject.toLowerCase();
    if (subjectIndex.some((si: string) => si === s)) { score += 10; continue; }
    if (subjectIndex.some((si: string) => si.includes(s) || s.includes(si))) { score += 6; continue; }
    if (bio.includes(s) || tagline.includes(s)) { score += 2; }
  }
  if (cls) {
    const classNum = cls.replace(/class\s*/i, '').trim();
    if ((profile._classIndex ?? []).some((c: string) => c.replace(/class\s*/i, '').trim() === classNum)) score += 5;
  }
  for (const term of rawTerms) {
    if (bio.includes(term) || tagline.includes(term) || displayName.includes(term)) score += 1;
  }
  return score;
}

async function runQuery(filter: any, sort: string, limit: number): Promise<any[]> {
  const sortMap: Record<string, any> = {
    rating: { 'rating.average': -1, 'rating.count': -1 },
    newest: { createdAt: -1 },
    fee_asc: { createdAt: -1 },
  };
  const sortQuery = filter.location ? {} : (sortMap[sort] ?? sortMap.rating);
  return Profile.find(filter).sort(sortQuery).limit(limit * 3).lean();
}

export async function searchProfiles(params: SearchParams) {
  const { q, type, subject, class: cls, board, lat, lng, radius = 10, minFee, maxFee, sort = 'rating', page = 1, limit = 20 } = params;
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(50, Math.max(1, limit));

  const cacheKey = buildCacheKey(params);
  const cached = await cacheGet(cacheKey);
  if (cached) return JSON.parse(cached);

  let parsed = { subjects: [] as string[], classes: [] as string[], location: null as string | null, type: null as string | null, rawTerms: [] as string[] };
  if (q) parsed = parseQuery(q) as any;

  const effectiveSubjects = subject ? expandQuery(subject) : parsed.subjects;
  const rawClass = cls || parsed.classes[0];
  const effectiveClass = rawClass ? (normalizeClass(rawClass) ?? rawClass) : undefined;
  const effectiveType = type ?? parsed.type ?? undefined;

  const baseFilter: any = { isApproved: true, isActive: true };
  if (effectiveType) baseFilter.type = effectiveType;
  if (lat != null && lng != null) {
    baseFilter.location = { $near: { $geometry: { type: 'Point', coordinates: [+lng, +lat] }, $maxDistance: radius * 1000 } };
  }
  if (parsed.location) {
    baseFilter.$or = [
      { 'address.town': new RegExp(parsed.location, 'i') },
      { 'address.area': new RegExp(parsed.location, 'i') },
      { 'address.district': new RegExp(parsed.location, 'i') },
    ];
  }
  if (effectiveClass) {
    const classNum = effectiveClass.replace(/class\s*/i, '').trim();
    baseFilter._classIndex = { $in: [new RegExp(classNum, 'i')] };
  }

  let profiles: any[] = [];

  if (effectiveSubjects.length > 0) {
    const subjectRegexes = effectiveSubjects.map(s => new RegExp(s, 'i'));

    // Pass 1: subject index
    profiles = await runQuery({ ...baseFilter, _subjectIndex: { $in: subjectRegexes } }, sort, safeLimit);

    // Pass 2: broad text fallback
    if (profiles.length === 0) {
      const broadFilter: any = {
        ...baseFilter,
        $or: [
          { displayName: { $in: subjectRegexes } },
          { tagline: { $in: subjectRegexes } },
          { bio: { $in: subjectRegexes } },
          { _subjectIndex: { $in: subjectRegexes } },
        ],
      };
      delete broadFilter._classIndex;
      profiles = await runQuery(broadFilter, sort, safeLimit);
    }
  } else if (q && parsed.rawTerms.length > 0) {
    const regexes = parsed.rawTerms.map(t => new RegExp(t, 'i'));
    profiles = await runQuery({
      ...baseFilter,
      $or: [
        { displayName: { $in: regexes } },
        { tagline: { $in: regexes } },
        { bio: { $in: regexes } },
        { _subjectIndex: { $in: regexes } },
      ],
    }, sort, safeLimit);
  } else {
    profiles = await runQuery(baseFilter, sort, safeLimit);
  }

  let results: any[] = profiles.map((p) => ({
    ...p,
    matchedSlots: getMatchedSlots(p.teachingSlots, effectiveSubjects, effectiveClass, board, minFee, maxFee),
    _score: scoreProfile(p, effectiveSubjects, parsed.rawTerms, effectiveClass),
  }));

  if (!(lat && lng) && sort !== 'newest') {
    results = results.sort((a, b) => b._score - a._score);
  }
  if (sort === 'fee_asc') {
    results = results.sort((a, b) => (a.matchedSlots[0]?.feePerMonth ?? Infinity) - (b.matchedSlots[0]?.feePerMonth ?? Infinity));
  }

  const paginated = results.slice((safePage - 1) * safeLimit, safePage * safeLimit).map(({ _score, ...rest }) => rest);
  const response = { data: paginated, total: results.length, page: safePage, limit: safeLimit, totalPages: Math.ceil(results.length / safeLimit) };

  await cacheSet(cacheKey, JSON.stringify(response), CACHE_TTL);
  return response;
}

export async function getNearbyProfiles(lat: number, lng: number, radius = 10) {
  return Profile.find({
    isApproved: true, isActive: true,
    location: { $near: { $geometry: { type: 'Point', coordinates: [+lng, +lat] }, $maxDistance: radius * 1000 } },
  }).limit(50).lean();
}