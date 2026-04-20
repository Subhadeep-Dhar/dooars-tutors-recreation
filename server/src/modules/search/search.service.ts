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

const CACHE_TTL = 300; // 5 minutes

function buildCacheKey(params: SearchParams): string {
  const hash = crypto.createHash('md5').update(JSON.stringify(params)).digest('hex');
  return `search:${hash}`;
}

function matchedSlots(teachingSlots: any[], params: SearchParams) {
  return teachingSlots.filter((slot) => {
    if (params.subject) {
      const name = slot.subject || slot.activity || '';
      if (!name.toLowerCase().includes(params.subject.toLowerCase())) return false;
    }
    if (params.class && slot.classes) {
      if (!slot.classes.includes(params.class)) return false;
    }
    if (params.board && slot.board) {
      if (slot.board !== params.board) return false;
    }
    if (params.minFee != null && slot.feePerMonth != null) {
      if (slot.feePerMonth < params.minFee) return false;
    }
    if (params.maxFee != null && slot.feePerMonth != null) {
      if (slot.feePerMonth > params.maxFee) return false;
    }
    return true;
  });
}

export async function searchProfiles(params: SearchParams) {
  const {
    q,
    type,
    subject,
    class: cls,
    board,
    lat,
    lng,
    radius = 10,
    minFee,
    maxFee,
    sort = 'rating',
    page = 1,
    limit = 20,
  } = params;

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(50, Math.max(1, limit));

  // Check cache first
  const cacheKey = buildCacheKey(params);
  const cached = await cacheGet(cacheKey);
  if (cached) return JSON.parse(cached);

  // ── Build filter ────────────────────────────────────────────────────────────
  const filter: any = {
    isApproved: true,
    isActive: true,
  };

  if (type) filter.type = type;
  if (subject) {
    filter._subjectIndex = {
      $elemMatch: {
        $regex: subject,
        $options: 'i',
      },
    };
  }
  if (cls) {
    filter._classIndex = {
      $elemMatch: {
        $regex: cls,
        $options: 'i',
      },
    };
  }

  // Geo filter
  if (lat != null && lng != null) {
    filter.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [+lng, +lat] },
        $maxDistance: radius * 1000,
      },
    };
  }

  // Full-text search on displayName + bio
  if (q) {
    filter.$or = [
      { displayName: { $regex: q, $options: 'i' } },
      { bio: { $regex: q, $options: 'i' } },
      { tagline: { $regex: q, $options: 'i' } },
      { '_subjectIndex': { $elemMatch: { $regex: q, $options: 'i' } } },
    ];
  }

  // ── Sort ────────────────────────────────────────────────────────────────────
  const sortMap: Record<string, any> = {
    rating: { 'rating.average': -1, 'rating.count': -1 },
    newest: { createdAt: -1 },
    fee_asc: { createdAt: -1 }, // fee sort done post-query
    // distance: implicit when $near is used
  };

  const sortQuery = lat && lng ? {} : (sortMap[sort] ?? sortMap.rating);

  // ── Query ───────────────────────────────────────────────────────────────────
  const [profiles, total] = await Promise.all([
    Profile.find(filter)
      .sort(sortQuery)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Profile.countDocuments(filter),
  ]);

  // ── Post-query: attach matched slots ────────────────────────────────────────
  let results = profiles.map((p) => ({
    ...p,
    matchedSlots: matchedSlots(p.teachingSlots, { subject, class: cls, board, minFee, maxFee }),
  }));

  // Fee sort — sort by lowest matched slot fee
  if (sort === 'fee_asc') {
    results = results.sort((a, b) => {
      const aFee = a.matchedSlots[0]?.feePerMonth ?? Infinity;
      const bFee = b.matchedSlots[0]?.feePerMonth ?? Infinity;
      return aFee - bFee;
    });
  }

  const response = {
    data: results,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
  };

  // Cache result
  await cacheSet(cacheKey, JSON.stringify(response), CACHE_TTL);

  return response;
}

export async function getNearbyProfiles(lat: number, lng: number, radius = 10) {
  const profiles = await Profile.find({
    isApproved: true,
    isActive: true,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [+lng, +lat] },
        $maxDistance: radius * 1000,
      },
    },
  })
    .limit(50)
    .lean();

  return profiles;
}