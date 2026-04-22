import { Profile, Review, User } from '../../models';
import { AppError } from '../../middleware/errorHandler';

export async function getPendingProfiles() {
  return Profile.find({ isApproved: false, isActive: true })
    .sort({ createdAt: -1 })
    .lean();
}

export async function getAllProfiles(page = 1, limit = 20) {
  const [profiles, total] = await Promise.all([
    Profile.find({}).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Profile.countDocuments({}),
  ]);
  return { profiles, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function approveProfile(profileId: string, approved: boolean) {
  const profile = await Profile.findByIdAndUpdate(
    profileId,
    { isApproved: approved },
    { new: true }
  );
  if (!profile) throw new AppError('Profile not found', 404);
  return profile;
}

export async function toggleFeatured(profileId: string) {
  const profile = await Profile.findById(profileId);
  if (!profile) throw new AppError('Profile not found', 404);
  profile.isFeatured = !profile.isFeatured;
  await profile.save();
  return profile;
}

export async function getAllReviews(page = 1, limit = 20) {
  const [reviews, total] = await Promise.all([
    Review.find({})
      .populate('reviewerId', 'name email')
      .populate('profileId', 'displayName slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Review.countDocuments({}),
  ]);
  return { reviews, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getAllUsers(page = 1, limit = 20) {
  const [users, total] = await Promise.all([
    User.find({}).select('-passwordHash -refreshTokenHash')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments({}),
  ]);
  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function toggleUserStatus(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  user.isActive = !user.isActive;
  await user.save();
  return user;
}

export async function getAdminStats() {
  const [
    totalUsers,
    totalProfiles,
    pendingProfiles,
    totalReviews,
    rolesData,
    profileTypesData,
    districtData,
    subjectData
  ] = await Promise.all([
    User.countDocuments({}),
    Profile.countDocuments({}),
    Profile.countDocuments({ isApproved: false }),
    Review.countDocuments({}),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Profile.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
    Profile.aggregate([
      { $match: { 'address.district': { $exists: true, $ne: '' } } },
      { $group: { _id: '$address.district', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    Profile.aggregate([
      { $unwind: '$teachingSlots' },
      { $project: { topic: { $cond: [ { $ifNull: ['$teachingSlots.subject', false] }, '$teachingSlots.subject', '$teachingSlots.activity' ] } } },
      { $match: { topic: { $exists: true, $ne: '' } } },
      { $group: { _id: '$topic', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
  ]);

  return {
    overview: {
      users: totalUsers,
      profiles: totalProfiles,
      pending: pendingProfiles,
      reviews: totalReviews,
    },
    usersByRole: rolesData.map(d => ({ name: d._id || 'Unknown', value: d.count })),
    profilesByType: profileTypesData.map(d => ({ name: d._id || 'Unknown', value: d.count })),
    profilesByDistrict: districtData.map(d => ({ name: d._id, value: d.count })),
    profilesBySubject: subjectData.map(d => ({ name: d._id, value: d.count }))
  };
}