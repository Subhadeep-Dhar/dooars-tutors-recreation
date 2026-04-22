import { Review, Profile } from '../../models';
import { AppError } from '../../middleware/errorHandler';
import { resolveProfileId } from '../profiles/profile.service';

export async function getProfileReviews(profileIdOrSlug: string) {
  // Resolve slug → ObjectId if needed (prevents CastError)
  const profileId = await resolveProfileId(profileIdOrSlug);

  const reviews = await Review.find({ profileId, isVisible: true })
    .populate('reviewerId', 'name avatar')
    .sort({ createdAt: -1 })
    .lean();
  return reviews;
}

export async function createReview(
  profileIdOrSlug: string,
  reviewerId: string,
  data: { rating: number; text: string }
) {
  // Resolve slug → ObjectId if needed
  const profileId = await resolveProfileId(profileIdOrSlug);

  const profile = await Profile.findOne({ _id: profileId, isApproved: true, isActive: true });
  if (!profile) throw new AppError('Profile not found', 404);

  // One review per student per profile
  const existing = await Review.findOne({ profileId, reviewerId });
  if (existing) throw new AppError('You have already reviewed this profile', 409);

  const review = await Review.create({ profileId, reviewerId, ...data });

  // Recalculate rating
  const allReviews = await Review.find({ profileId, isVisible: true });
  const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  await Profile.findByIdAndUpdate(profileId, {
    'rating.average': Math.round(avg * 10) / 10,
    'rating.count': allReviews.length,
  });

  return review;
}

export async function toggleReviewVisibility(reviewId: string) {
  const review = await Review.findById(reviewId);
  if (!review) throw new AppError('Review not found', 404);

  review.isVisible = !review.isVisible;
  await review.save();

  // Recalculate rating after visibility change
  const allReviews = await Review.find({ profileId: review.profileId, isVisible: true });
  const avg = allReviews.length
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    : 0;
  await Profile.findByIdAndUpdate(review.profileId, {
    'rating.average': Math.round(avg * 10) / 10,
    'rating.count': allReviews.length,
  });

  return review;
}