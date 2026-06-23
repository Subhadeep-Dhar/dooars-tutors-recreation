import { Profile, EnrichmentJob, SearchMetric, IProfileDocument, User, Review } from '../../models';
import { AppError } from '../../middleware/errorHandler';
import mongoose from 'mongoose';

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

export async function getAllProfiles(options: { page: number, limit: number }) {
  try {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 10));
    const skip = (page - 1) * limit;

    const [profiles, total] = await Promise.all([
      Profile.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Profile.countDocuments({})
    ]);
    return { profiles: profiles || [], total: total || 0 };
  } catch (err) {
    console.error('[AdminService] getAllProfiles failed:', err);
    throw err;
  }
}

export async function getAllUsers(options: { page: number, limit: number }) {
  try {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 10));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments({})
    ]);
    return { users: users || [], total: total || 0 };
  } catch (err) {
    console.error('[AdminService] getAllUsers failed:', err);
    throw err;
  }
}

export async function getAllReviews(options: { page: number, limit: number }) {
  try {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 10));
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({})
        .populate('reviewerId', 'name email')
        .populate('profileId', 'displayName slug')
        .sort({ createdAt: -1 })
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

export async function getAdminStats() {
  try {
    const [users, profiles, reviews, pending] = await Promise.all([
      User.countDocuments({}),
      Profile.countDocuments({}),
      Review.countDocuments({}),
      Profile.countDocuments({ verificationStatus: 'pending' })
    ]);

    // Aggregations for charts - with defensive matches
    const [profilesByType, profilesByDistrict] = await Promise.all([
      Profile.aggregate([
        { $match: { type: { $exists: true, $ne: null } } },
        { $group: { _id: '$type', value: { $sum: 1 } } }
      ]),
      Profile.aggregate([
        { $match: { 'address.district': { $exists: true, $ne: null } } },
        { $group: { _id: '$address.district', value: { $sum: 1 } } }
      ])
    ]);

    const profilesBySubject = await Profile.aggregate([
      { $match: { _subjectIndex: { $exists: true, $type: 'array', $ne: [] } } },
      { $unwind: '$_subjectIndex' },
      { $group: { _id: '$_subjectIndex', value: { $sum: 1 } } },
      { $sort: { value: -1 } },
      { $limit: 10 }
    ]);

    return {
      overview: { users, profiles, reviews, pending },
      profilesByType: (profilesByType || []).map(i => ({ name: i._id || 'Unknown', value: i.value })),
      profilesByDistrict: (profilesByDistrict || []).map(i => ({ name: i._id || 'Unknown', value: i.value })),
      profilesBySubject: (profilesBySubject || []).map(i => ({ name: i._id || 'Unknown', value: i.value }))
    };
  } catch (err) {
    console.error('[AdminService] getAdminStats failed:', err);
    throw err;
  }
}

export async function toggleUserStatus(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  user.isActive = !user.isActive;
  await user.save();
  return user;
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