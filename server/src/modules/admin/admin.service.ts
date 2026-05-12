import { Profile, EnrichmentJob, SearchMetric, IProfileDocument } from '../../models';
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
  const [moderationStats, enrichmentStats, topSearches]: [AggregationResult[], AggregationResult[], AggregationResult[]] = await Promise.all([
    // Moderation Stats
    Profile.aggregate([
      {
        $group: {
          _id: '$verificationStatus',
          count: { $sum: 1 }
        }
      }
    ]),
    
    // Enrichment Stats
    EnrichmentJob.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),

    // Top Failed Searches (Zero Results)
    SearchMetric.aggregate([
      { $match: { resultsCount: 0 } },
      { $group: { _id: '$term', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
  ]);

  // Confidence distribution
  const confidenceStats: AggregationResult[] = await Profile.aggregate([
    { $match: { autoExtracted: true } },
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
    moderation: Object.fromEntries(moderationStats.map(s => [s._id, s.count])),
    enrichment: Object.fromEntries(enrichmentStats.map(s => [s._id, s.count])),
    confidence: Object.fromEntries(confidenceStats.map(s => [s._id, s.count])),
    topFailedSearches: topSearches.map(s => ({ term: s._id, count: s.count }))
  };
}