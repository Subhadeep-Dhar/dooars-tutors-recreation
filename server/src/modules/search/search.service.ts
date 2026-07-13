import crypto from 'crypto';
import { Profile } from '../../models';
import { cacheGet, cacheSet } from '../../config/redis';
import { SearchParams } from '@dooars/shared';
import { expandQuery, normalizeClass, parseQuery } from './synonyms';

const CACHE_TTL = 300;

/** Escapes special regex characters in user-supplied strings */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


function buildCacheKey(params: SearchParams): string {
  return `search:${crypto.createHash('md5').update(JSON.stringify(params)).digest('hex')}`;
}

function getMatchedSlots(slots: any[], subjects: string[], cls?: string, board?: string, minFee?: number, maxFee?: number) {
  if (!subjects.length && !cls && !board && minFee == null && maxFee == null) return slots;
  return slots.filter(slot => {
    const name = (slot.subject || slot.activity || '').toLowerCase();
    if (subjects.length > 0) {
      const hit = subjects.some(s => name.includes(s.toLowerCase()) || s.toLowerCase().includes(name));
      if (!hit) return false;
    }
    if (cls && slot.classes) {
      const n = cls.replace(/class\s*/i, '').trim();
      if (!slot.classes.some((c: string) => c.replace(/class\s*/i, '').trim() === n)) return false;
    }
    if (board && slot.board && slot.board !== board) return false;
    if (minFee != null && slot.feePerMonth != null && slot.feePerMonth < minFee) return false;
    if (maxFee != null && slot.feePerMonth != null && slot.feePerMonth > maxFee) return false;
    return true;
  });
}

function score(profile: any, subjects: string[], cls?: string): number {
  let s = (profile.rating?.score ?? 0) * 2;
  if (profile.isFeatured) s += 3;
  const idx = (profile._subjectIndex ?? []).map((x: string) => x.toLowerCase());
  const bio = (profile.bio ?? '').toLowerCase();
  const tag = (profile.tagline ?? '').toLowerCase();
  for (const sub of subjects) {
    const sl = sub.toLowerCase();
    if (idx.some((i: string) => i === sl)) { s += 10; continue; }
    if (idx.some((i: string) => i.includes(sl) || sl.includes(i))) { s += 6; continue; }
    if (bio.includes(sl) || tag.includes(sl)) s += 2;
  }
  if (cls) {
    const n = cls.replace(/class\s*/i, '').trim();
    if ((profile._classIndex ?? []).some((c: string) => c.replace(/class\s*/i, '').trim() === n)) s += 5;
  }
  return s;
}

export async function searchProfiles(params: SearchParams) {
  const { q, type, subject, class: cls, board, lat, lng, radius = 10, minFee, maxFee, minRating, place, sort = 'rating', page = 1, limit = 10 } = params;
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));

  const cacheKey = buildCacheKey(params);
  const cached = await cacheGet(cacheKey);
  if (cached) return JSON.parse(cached);

  // Parse free-text query
  let parsed = { subjects: [] as string[], classes: [] as string[], location: null as string | null, type: null as string | null, rawTerms: [] as string[] };
  if (q) parsed = parseQuery(q) as any;

  // Expand subjects — handle comma-separated input
  const subjectList = subject ? subject.split(',').map(s => s.trim()).filter(Boolean) : [];
  const expandedSubjects = subjectList.length > 0
    ? [...new Set(subjectList.flatMap(s => expandQuery(s)))]
    : parsed.subjects;

  const rawClass = cls || parsed.classes[0];
  const effectiveClass = rawClass ? (normalizeClass(rawClass) ?? rawClass) : undefined;
  const effectiveType = type ?? parsed.type ?? undefined;

  // Base filter
  const base: any = { verificationStatus: 'verified', isActive: true };
  if (effectiveType) base.type = effectiveType;
  if (lat != null && lng != null) {
    base.location = { $near: { $geometry: { type: 'Point', coordinates: [+lng, +lat] }, $maxDistance: radius * 1000 } };
  }
  if (parsed.location) {
    base['address.town'] = new RegExp(parsed.location, 'i');
  }
  if (effectiveClass) {
    const n = effectiveClass.replace(/class\s*/i, '').trim();
    base._classIndex = { $in: [new RegExp(n, 'i')] };
  }

  // ── NEW: minRating filter ──────────────────────────────────────────────
  if (minRating != null && minRating > 0) {
    base['rating.average'] = { $gte: minRating };
  }

  // ── NEW: place filter (town / area / district) ────────────────────────
  if (place && place.trim()) {
    const placeRe = new RegExp(place.trim(), 'i');
    base.$or = [
      ...(base.$or ?? []),
      { 'address.town': placeRe },
      { 'address.area': placeRe },
      { 'address.district': placeRe },
    ];
  }

  // ── NEW: gender filter (exact match) ──────────────────────────────────
  const genderParam = (params as any).gender;
  if (genderParam) {
    base.gender = genderParam;
  }

  // ── NEW: languages filter (match ANY provided value, case-insensitive) ─
  const langsParam: string | undefined = (params as any).languages;
  if (langsParam) {
    const langs = langsParam.split(',').map((l: string) => l.trim()).filter(Boolean);
    if (langs.length > 0) {
      base.languages = { $in: langs.map((l: string) => new RegExp(`^${escapeRegex(l)}$`, 'i')) };
    }
  }

  // ── NEW: serviceModes filter (match ANY provided value) ───────────────
  const serviceModesParam: string | undefined = (params as any).serviceModes;
  if (serviceModesParam) {
    const modes = serviceModesParam.split(',').map((m: string) => m.trim()).filter(Boolean);
    if (modes.length > 0) {
      base.serviceModes = { $in: modes };
    }
  }

  // Fetch profiles
  let profiles: any[] = [];

  const sortMap: Record<string, any> = {
    rating: { 'rating.score': -1, 'rating.count': -1 },
    newest: { createdAt: -1 },
    fee_asc: { createdAt: -1 },
  };
  const sortQuery = (lat && lng) ? {} : (sortMap[sort] ?? sortMap.rating);

  if (expandedSubjects.length > 0) {
    // Regex search on _subjectIndex — partial + case-insensitive
    const regs = expandedSubjects.map(s => new RegExp(s, 'i'));
    profiles = await Profile.find({ ...base, _subjectIndex: { $in: regs } }).sort(sortQuery).limit(500).lean();

    // Fallback: search bio/tagline/name if nothing found
    if (profiles.length === 0) {
      const fallbackBase = { ...base };
      delete fallbackBase._classIndex;
      profiles = await Profile.find({
        ...fallbackBase,
        $or: [
          ...(fallbackBase.$or ?? []),
          { displayName: { $in: regs } },
          { tagline: { $in: regs } },
          { bio: { $in: regs } },
          { _subjectIndex: { $in: regs } },
        ]
      }).sort(sortQuery).limit(500).lean();
    }
  } else if (q && parsed.rawTerms.length > 0) {
    const regs = parsed.rawTerms.map(t => new RegExp(t, 'i'));
    profiles = await Profile.find({
      ...base,
      $or: [
        ...(base.$or ?? []),
        { displayName: { $in: regs } },
        { tagline: { $in: regs } },
        { bio: { $in: regs } },
        { _subjectIndex: { $in: regs } },
      ]
    }).sort(sortQuery).limit(500).lean();
  } else {
    profiles = await Profile.find(base).sort(sortQuery).limit(500).lean();
  }

  // Enrich with matched slots + score
  let results: any[] = profiles.map(p => ({
    ...p,
    matchedSlots: getMatchedSlots(p.teachingSlots, expandedSubjects, effectiveClass, board, minFee, maxFee),
    _score: score(p, expandedSubjects, effectiveClass),
  }));

  // Remove profiles with no matched slots when strict filters active
  if (effectiveClass || board || minFee != null || maxFee != null) {
    results = results.filter(r => r.matchedSlots.length > 0);
  }

  // Re-rank
  if (!(lat && lng) && sort !== 'newest') {
    results.sort((a, b) => b._score - a._score);
  }
  if (sort === 'fee_asc') {
    results.sort((a, b) => (a.matchedSlots[0]?.feePerMonth ?? Infinity) - (b.matchedSlots[0]?.feePerMonth ?? Infinity));
  }

  const total = results.length;
  const paginated = results.slice((safePage - 1) * safeLimit, safePage * safeLimit).map(({ _score, ...r }: any) => r);

  const response = { data: paginated, total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
  
  // Track search metrics asynchronously
  trackSearch(params, total).catch(err => console.error('Metric tracking failed', err));

  await cacheSet(cacheKey, JSON.stringify(response), CACHE_TTL);
  return response;
}

async function trackSearch(params: SearchParams, resultsCount: number) {
  try {
    const { SearchMetric } = await import('../../models/SearchMetric');
    await SearchMetric.create({
      term: params.q || params.subject || params.class,
      category: params.type,
      resultsCount,
      location: params.place
    });
  } catch (err) {
    // Silent fail for metrics
  }
}

export async function getNearbyProfiles(lat: number, lng: number, radius = 10) {
  return Profile.find({
    verificationStatus: 'verified', isActive: true,
    location: { $near: { $geometry: { type: 'Point', coordinates: [+lng, +lat] }, $maxDistance: radius * 1000 } },
  }).limit(50).lean();
}