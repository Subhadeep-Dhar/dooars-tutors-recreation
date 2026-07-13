import { Profile, EnrichmentJob, SearchMetric, IProfileDocument, User, Review } from '../../models';
import { AppError } from '../../middleware/errorHandler';
import mongoose from 'mongoose';
import { generateBioIfMissing } from '../profiles/bioGenerator.service';

export interface ModerationQueueResult {
  profiles: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export async function getModerationQueue(filters: any, options: { page: number, limit: number }): Promise<ModerationQueueResult> {
  const query: any = {
    verificationStatus: filters.status || 'pending'
  };

  if (filters.source) query.source = filters.source;
  if (filters.batchId) query.importBatchId = filters.batchId;
  
  if (filters.lowConfidence) {
    query['extractionConfidence.subjects'] = { $lt: 0.65 };
  }
  
  if (filters.missingPhone) {
    query['contact.phone'] = { $exists: false };
  }

  if (filters.enrichmentFailed) {
    const failedJobs = await EnrichmentJob.find({ status: 'failed' }).select('profileId').lean();
    const failedProfileIds = failedJobs.map(j => j.profileId);
    query._id = { $in: failedProfileIds };
  }

  const skip = (options.page - 1) * options.limit;
  
  const [profiles, total] = await Promise.all([
    Profile.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(options.limit)
      .lean(),
    Profile.countDocuments(query)
  ]);

  const profileIds = profiles.map(p => p._id);
  const jobs = await EnrichmentJob.find({ profileId: { $in: profileIds } }).lean();
  const jobMap = Object.fromEntries(jobs.map(j => [j.profileId.toString(), j]));

  const enrichedProfiles = profiles.map(p => ({
    ...p,
    enrichmentJob: jobMap[p._id.toString()] || null
  }));

  return {
    profiles: enrichedProfiles,
    pagination: {
      total,
      page: options.page,
      limit: options.limit,
      pages: Math.ceil(total / options.limit)
    }
  };
}

// ── NEW: General Admin Lists (Restoring Visibility) ──────────────────────────

export async function getAllProfiles(options: { page: number, limit: number, search?: string, type?: string, filter?: string }) {
  try {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 10));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (options.search || options.filter) {
      query.$and = [];
      if (options.search) {
        const regex = new RegExp(options.search, 'i');
        query.$and.push({ $or: [{ displayName: regex }, { slug: regex }, { 'contact.email': regex }, { 'contact.phone': regex }] });
      }
      if (options.filter) {
        if (options.filter === 'missingPhone') query.$and.push({ $or: [{ 'contact.phone': { $exists: false } }, { 'contact.phone': '' }] });
        else if (options.filter === 'missingImage') query.$and.push({ $or: [{ images: { $exists: false } }, { images: { $size: 0 } }] });
        else if (options.filter === 'missingBio') query.$and.push({ $or: [{ bio: { $exists: false } }, { bio: '' }] });
        else if (options.filter === 'missingLocation') query.$and.push({ $or: [{ 'location.coordinates': { $exists: false } }, { 'location.coordinates': { $size: 0 } }] });
        else if (options.filter === 'missingEmail') query.$and.push({ $or: [{ 'contact.email': { $exists: false } }, { 'contact.email': '' }] });
        else if (options.filter === 'missingSlots') query.$and.push({ $or: [{ teachingSlots: { $exists: false } }, { teachingSlots: { $size: 0 } }] });
      }
    }
    
    if (options.type && options.type !== 'all') {
      query.type = options.type;
    }

    const [profiles, total] = await Promise.all([
      Profile.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Profile.countDocuments(query)
    ]);
    return { profiles: profiles || [], total: total || 0 };
  } catch (err) {
    console.error('[AdminService] getAllProfiles failed:', err);
    throw err;
  }
}

export async function getAllUsers(options: { page: number, limit: number, search?: string, role?: string }) {
  try {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 10));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (options.search) {
      const regex = new RegExp(options.search, 'i');
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }
    if (options.role && options.role !== 'all') {
      query.role = options.role;
    }

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query)
    ]);
    return { users: users || [], total: total || 0 };
  } catch (err) {
    console.error('[AdminService] getAllUsers failed:', err);
    throw err;
  }
}

export async function getAllReviews(options: { page: number, limit: number, sort?: string }) {
  try {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 10));
    const skip = (page - 1) * limit;

    let sortObj: any = { createdAt: -1 };
    if (options.sort === 'oldest') sortObj = { createdAt: 1 };
    else if (options.sort === 'best') sortObj = { rating: -1, createdAt: -1 };
    else if (options.sort === 'worst') sortObj = { rating: 1, createdAt: -1 };

    const [reviews, total] = await Promise.all([
      Review.find({})
        .populate('reviewerId', 'name email')
        .populate('profileId', 'displayName slug')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({})
    ]);
    return { reviews: reviews || [], total: total || 0 };
  } catch (err) {
    console.error('[AdminService] getAllReviews failed:', err);
    throw err;
  }
}

export async function getAdminStats(timeframe: string = '30d') {
  try {
    const startDate = new Date();
    let dateFormat = "%Y-%m-%d"; // Daily

    if (timeframe === '6m') {
      startDate.setMonth(startDate.getMonth() - 6);
      dateFormat = "%Y-%m"; // Monthly
    } else if (timeframe === '1y') {
      startDate.setFullYear(startDate.getFullYear() - 1);
      dateFormat = "%Y-%m"; // Monthly
    } else {
      // Default 30d
      startDate.setDate(startDate.getDate() - 30);
    }

    const [
      users, profiles, reviews, pending,
      recentUsers, recentProfiles, recentReviews,
      profilesWithoutPhone, profilesWithoutImage,
      profilesWithoutBio, profilesWithoutLocation,
      profilesWithoutEmail, profilesWithoutSlots
    ] = await Promise.all([
      User.countDocuments({}),
      Profile.countDocuments({}),
      Review.countDocuments({}),
      Profile.countDocuments({ verificationStatus: 'pending' }),
      User.find({}).sort({ createdAt: -1 }).limit(5).select('name email role createdAt').lean(),
      Profile.find({}).sort({ createdAt: -1 }).limit(5).select('displayName type verificationStatus createdAt').lean(),
      Review.find({}).sort({ createdAt: -1 }).limit(5).select('rating comment createdAt').lean(),
      Profile.countDocuments({ $or: [{ 'contact.phone': { $exists: false } }, { 'contact.phone': '' }] }),
      Profile.countDocuments({ $or: [{ images: { $exists: false } }, { images: { $size: 0 } }] }),
      Profile.countDocuments({ $or: [{ bio: { $exists: false } }, { bio: '' }] }),
      Profile.countDocuments({ $or: [{ 'location.coordinates': { $exists: false } }, { 'location.coordinates': { $size: 0 } }] }),
      Profile.countDocuments({ $or: [{ 'contact.email': { $exists: false } }, { 'contact.email': '' }] }),
      Profile.countDocuments({ $or: [{ teachingSlots: { $exists: false } }, { teachingSlots: { $size: 0 } }] })
    ]);

    // Aggregations for charts - with defensive matches
    const [profilesByType, profilesByDistrict, profilesBySubject, ratingDistribution, usersOverTime, profilesOverTime, visitsOverTime, profilesForMap] = await Promise.all([
      Profile.aggregate([
        { $match: { type: { $exists: true, $ne: null } } },
        { $group: { _id: '$type', value: { $sum: 1 } } }
      ]),
      Profile.aggregate([
        { $match: { 'address.district': { $exists: true, $ne: null } } },
        { $group: { _id: '$address.district', value: { $sum: 1 } } }
      ]),
      Profile.aggregate([
        { $match: { _subjectIndex: { $exists: true, $type: 'array', $ne: [] } } },
        { $unwind: '$_subjectIndex' },
        { $group: { _id: '$_subjectIndex', value: { $sum: 1 } } },
        { $sort: { value: -1 } }
      ]),
      Review.aggregate([
        { $group: { _id: '$rating', value: { $sum: 1 } } },
        { $sort: { _id: -1 } }
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: dateFormat, date: "$createdAt" } }, value: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Profile.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: dateFormat, date: "$createdAt" } }, value: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      // We will use SearchMetric to approximate "visits/activity" over time
      mongoose.models.SearchMetric?.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: dateFormat, date: "$createdAt" } }, value: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]) || Promise.resolve([]),
      // Map data & scatter plot data (extended for performers score)
      Profile.find({})
        .select('location type rating displayName slug address.town contact media bio verificationStatus')
        .lean()
    ]);

    return {
      overview: { users, profiles, reviews, pending },
      recentActivity: {
        users: recentUsers,
        profiles: recentProfiles,
        reviews: recentReviews
      },
      health: {
        missingPhone: profilesWithoutPhone,
        missingImage: profilesWithoutImage,
        missingBio: profilesWithoutBio,
        missingLocation: profilesWithoutLocation,
        missingEmail: profilesWithoutEmail,
        missingSlots: profilesWithoutSlots
      },
      profilesByType: (profilesByType || []).map(i => ({ name: i._id || 'Unknown', value: i.value })),
      profilesByDistrict: (profilesByDistrict || []).map(i => ({ name: i._id || 'Unknown', value: i.value })),
      profilesBySubject: (profilesBySubject || []).map(i => ({ name: i._id || 'Unknown', value: i.value })),
      ratingDistribution: (ratingDistribution || []).map(i => ({ name: `${i._id} Stars`, value: i.value })),
      growth: {
        users: usersOverTime.map(i => ({ date: i._id, count: i.value })),
        profiles: profilesOverTime.map(i => ({ date: i._id, count: i.value })),
        visits: visitsOverTime.map(i => ({ date: i._id, count: i.value }))
      },
      mapData: profilesForMap,
      performers: (() => {
        const scoredProfiles = profilesForMap.map((p: any) => {
          let score = p.rating?.score || p.rating?.average || 0;
          return {
            _id: p._id,
            displayName: p.displayName,
            slug: p.slug,
            type: p.type,
            town: p.address?.town,
            rating: p.rating || { average: 0, count: 0 },
            adminScore: Math.round(score * 100) / 100
          };
        });

        // Calculate Bayesian Average for True Rating Ranking
        const ratedProfiles = scoredProfiles.filter((p: any) => p.rating?.count > 0);
        const globalAverageRating = ratedProfiles.length > 0 
          ? ratedProfiles.reduce((sum: number, p: any) => sum + p.rating.average, 0) / ratedProfiles.length 
          : 0;
        const m = 10; // Minimum reviews threshold for Bayesian confidence

        return {
          leaderboard: [...scoredProfiles].sort((a, b) => (b.rating.score || b.rating.average || 0) - (a.rating.score || a.rating.average || 0)).slice(0, 5),
          mostReviewed: [...scoredProfiles].sort((a, b) => (b.rating?.count || 0) - (a.rating?.count || 0)).slice(0, 5),
          topRated: [...scoredProfiles].sort((a, b) => {
            const vA = a.rating?.count || 0;
            const rA = a.rating?.average || 0;
            const bayesianA = (vA / (vA + m)) * rA + (m / (vA + m)) * globalAverageRating;

            const vB = b.rating?.count || 0;
            const rB = b.rating?.average || 0;
            const bayesianB = (vB / (vB + m)) * rB + (m / (vB + m)) * globalAverageRating;
            
            return bayesianB - bayesianA;
          }).slice(0, 5)
        };
      })()
    };
  } catch (err) {
    console.error('[AdminService] getAdminStats failed:', err);
    throw err;
  }
}

import bcrypt from 'bcryptjs';

export async function toggleUserStatus(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  user.isActive = !user.isActive;
  await user.save();
  return user;
}

export async function createUser(data: any) {
  if (!data.email) throw new AppError('Email is required', 400);
  const email = data.email.toLowerCase().trim();
  
  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already in use', 409);
  
  const user = await User.create({
    name: data.name,
    email,
    phone: data.phone,
    role: data.role || 'student',
    status: 'active',
    isVerified: true,
  });
  return user;
}

import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export async function impersonateUser(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  if (!user.isActive) throw new AppError('User is inactive or deleted', 403);
  
  const secret = process.env.SUPABASE_JWT_SECRET || env.JWT_ACCESS_SECRET;
  
  const payload = {
    sub: user.supabaseId || user._id.toString(), // Use supabaseId if available
    email: user.email,
    user_role: user.role,
    aud: 'authenticated',
    role: 'authenticated'
  };
  
  const token = jwt.sign(payload, secret, { expiresIn: '1h' });
  
  return {
    user: {
      userId: user._id.toString(),
      supabaseId: user.supabaseId,
      name: user.name,
      email: user.email,
      role: user.role
    },
    token
  };
}

export async function updateUser(userId: string, data: any) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  
  if (data.name) user.name = data.name;
  if (data.email) user.email = data.email;
  if (data.phone) user.phone = data.phone;
  if (data.role) user.role = data.role;
  if (data.password) {
    user.passwordHash = await bcrypt.hash(data.password, 12);
  }
  
  await user.save();
  return user;
}

export async function toggleProfileStatus(profileId: string) {
  const profile = await Profile.findById(profileId);
  if (!profile) throw new AppError('Profile not found', 404);
  profile.isActive = !profile.isActive;
  await profile.save();
  return profile;
}

export async function updateProfile(profileId: string, data: any) {
  const profile = await Profile.findById(profileId);
  if (!profile) throw new AppError('Profile not found', 404);

  // Strip server-controlled provenance fields -- never accept from any caller
  const { bioSource: _bs, bioGeneratedAt: _bga, ...safeData } = data;

  if (safeData.displayName !== undefined) profile.displayName = safeData.displayName;
  if (safeData.slug !== undefined) profile.slug = safeData.slug;
  if (safeData.type !== undefined) profile.type = safeData.type;

  // bio: set bioSource='admin' and add 'bio' to manuallyEditedFields
  if (safeData.bio !== undefined) {
    profile.bio = safeData.bio;
    if (safeData.bio.trim()) {
      (profile as any).bioSource = 'admin';
      if (!profile.manuallyEditedFields) (profile as any).manuallyEditedFields = [];
      if (!profile.manuallyEditedFields.includes('bio')) {
        profile.manuallyEditedFields.push('bio');
      }
    }
  }

  // Contact
  if (safeData.phone !== undefined || safeData.email !== undefined || safeData.whatsapp !== undefined) {
    if (!profile.contact) profile.contact = {};
    if (safeData.phone !== undefined) profile.contact.phone = safeData.phone;
    if (safeData.email !== undefined) profile.contact.email = safeData.email;
    if (safeData.whatsapp !== undefined) profile.contact.whatsapp = safeData.whatsapp;
  }

  // Address
  if (safeData.address !== undefined) {
    profile.address = { ...profile.address, ...safeData.address };
  }

  // Location Coordinates
  if (safeData.location?.coordinates !== undefined) {
    if (!profile.location) profile.location = { type: 'Point', coordinates: [0,0] };
    profile.location.coordinates = safeData.location.coordinates;
  }

  // Teaching Slots
  if (safeData.teachingSlots !== undefined) {
    profile.teachingSlots = safeData.teachingSlots;
  }

  // Media
  if (safeData.media !== undefined) {
    profile.media = safeData.media;
  }

  await profile.save();
  return profile;
}

/**
 * Triggers bio generation for a specific profile.
 * Used by admin route POST /profiles/:id/generate-bio.
 * Fire-and-forget -- does not wait for Gemini to respond.
 */
export async function triggerBioGeneration(profileId: string): Promise<{ queued: boolean; message: string }> {
  const profile = await Profile.findById(profileId);
  if (!profile) throw new AppError('Profile not found', 404);

  // Force bio to empty so generateBioIfMissing runs (admin explicitly requested it)
  const tempProfile = { ...profile.toObject(), bio: '' } as any;

  // Fire-and-forget
  generateBioIfMissing(tempProfile as any).catch(err =>
    console.warn(`[AdminBioGen] Failed for profile ${profileId}:`, err.message)
  );

  return { queued: true, message: 'Bio generation queued. Result will be saved asynchronously.' };
}

export async function deleteUser(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  
  // Soft delete user
  user.isActive = false;
  user.email = `${user.email}_deleted_${Date.now()}`;
  await user.save();
  
  // Hard delete profile if exists
  await Profile.deleteOne({ userId });
  
  return user;
}

export async function toggleReviewVisibility(reviewId: string) {
  const review = await Review.findById(reviewId);
  if (!review) throw new AppError('Review not found', 404);
  review.isVisible = !review.isVisible;
  await review.save();
  return review;
}

export async function toggleProfileFeatured(profileId: string) {
  const profile = await Profile.findById(profileId);
  if (!profile) throw new AppError('Profile not found', 404);
  profile.isFeatured = !profile.isFeatured;
  await profile.save();
  return profile;
}

// ── Moderation specific ──────────────────────────────────────────────────────

export async function approveProfile(profileId: string): Promise<IProfileDocument> {
  const profile = await Profile.findByIdAndUpdate(
    profileId,
    { verificationStatus: 'verified', isActive: true },
    { new: true }
  );
  if (!profile) throw new AppError('Profile not found', 404);
  return profile;
}

export async function rejectProfile(profileId: string, _reason?: string): Promise<IProfileDocument> {
  const profile = await Profile.findByIdAndUpdate(
    profileId,
    { verificationStatus: 'rejected', isActive: false },
    { new: true }
  );
  if (!profile) throw new AppError('Profile not found', 404);
  return profile;
}

export interface ModerationProfileDetails {
  profile: any;
  enrichmentData: any;
  duplicates: any[];
}

export async function getProfileForModeration(profileId: string): Promise<ModerationProfileDetails> {
  const profile = await Profile.findById(profileId).lean();
  if (!profile) throw new AppError('Profile not found', 404);

  const { EnrichmentData } = await import('../../models/EnrichmentData');
  const enrichmentData = await EnrichmentData.findOne({ profileId }).lean();
  
  // Detect potential duplicates
  const duplicates = await detectDuplicates(profile);

  return {
    profile,
    enrichmentData,
    duplicates
  };
}

async function detectDuplicates(profile: any): Promise<any[]> {
  const similarProfiles = await Profile.find({
    _id: { $ne: profile._id },
    'address.town': profile.address?.town,
    displayName: { $regex: new RegExp(profile.displayName.substring(0, 3), 'i') }
  }).select('displayName address contact verificationStatus').lean();

  return similarProfiles.map(p => ({
    ...p,
    similarity: calculateSimilarity(profile.displayName, p.displayName)
  })).filter(p => p.similarity > 0.6);
}

function calculateSimilarity(s1: string, s2: string): number {
  const n1 = s1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const n2 = s2.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (n1 === n2) return 1.0;
  if (n1.includes(n2) || n2.includes(n1)) return 0.8;
  
  const set1 = new Set(n1.split(''));
  const set2 = new Set(n2.split(''));
  const intersection = Array.from(set1).filter(x => set2.has(x));
  return intersection.length / Math.max(set1.size, set2.size);
}

export async function mergeProfiles(targetId: string, sourceId: string, fieldsToKeep: string[]): Promise<IProfileDocument> {
  const [target, source] = await Promise.all([
    Profile.findById(targetId),
    Profile.findById(sourceId)
  ]);

  if (!target || !source) throw new AppError('One or more profiles not found', 404);

  // Merge logic: Copy fields from source to target if specified AND not manually protected
  fieldsToKeep.forEach(field => {
    if ((source as any)[field] !== undefined) {
      // Check if target has this field manually protected
      if (!target.manuallyEditedFields.includes(field)) {
        (target as any)[field] = (source as any)[field];
      }
    }
  });

  // Consolidate enrichment metadata if applicable
  if (source.autoExtracted && !target.autoExtracted) {
    target.autoExtracted = true;
    target.extractionSource = source.extractionSource;
    target.extractionConfidence = source.extractionConfidence;
  }

  // Mark source as rejected/duplicate
  source.verificationStatus = 'rejected';
  source.isActive = false;
  
  await Promise.all([target.save(), source.save()]);
  return target;
}

export interface AggregationResult {
  _id: string;
  count: number;
}

export interface ModerationAnalytics {
  moderation: Record<string, number>;
  enrichment: Record<string, number>;
  confidence: Record<string, number>;
  topFailedSearches: { term: string; count: number }[];
}

export async function getModerationAnalytics(): Promise<ModerationAnalytics> {
  try {
    const [moderationStats, enrichmentStats, topSearches]: [AggregationResult[], AggregationResult[], AggregationResult[]] = await Promise.all([
      // Moderation Stats
      Profile.aggregate([
        { $match: { verificationStatus: { $exists: true } } },
        {
          $group: {
            _id: '$verificationStatus',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Enrichment Stats
      EnrichmentJob.aggregate([
        { $match: { status: { $exists: true } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Top Failed Searches (Zero Results)
      SearchMetric.aggregate([
        { $match: { resultsCount: 0, term: { $exists: true, $ne: null } } },
        { $group: { _id: '$term', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    // Confidence distribution
    const confidenceStats: AggregationResult[] = await Profile.aggregate([
      { $match: { autoExtracted: true, 'extractionConfidence.subjects': { $exists: true, $ne: null } } },
      {
        $project: {
          confidenceLevel: {
            $cond: [
              { $gte: ['$extractionConfidence.subjects', 0.8] }, 'High',
              { $cond: [{ $gte: ['$extractionConfidence.subjects', 0.65] }, 'Medium', 'Low'] }
            ]
          }
        }
      },
      { $group: { _id: '$confidenceLevel', count: { $sum: 1 } } }
    ]);

    return {
      moderation: Object.fromEntries((moderationStats || []).map(s => [s._id || 'Unknown', s.count || 0])),
      enrichment: Object.fromEntries((enrichmentStats || []).map(s => [s._id || 'Unknown', s.count || 0])),
      confidence: Object.fromEntries((confidenceStats || []).map(s => [s._id || 'Unknown', s.count || 0])),
      topFailedSearches: (topSearches || []).map(s => ({ term: s._id || 'Unknown', count: s.count || 0 }))
    };
  } catch (err) {
    console.error('[AdminService] getModerationAnalytics failed:', err);
    throw err;
  }
}