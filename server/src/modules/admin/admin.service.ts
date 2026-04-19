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