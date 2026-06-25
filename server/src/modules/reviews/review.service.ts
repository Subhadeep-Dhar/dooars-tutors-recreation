import { Review, Profile } from '../../models';
import { AppError } from '../../middleware/errorHandler';
import { resolveProfileId } from '../profiles/profile.service';
import { sendReviewNotification } from '../../utils/email';

export async function getProfileReviews(profileIdOrSlug: string) {
  // Resolve slug → ObjectId if needed (prevents CastError)
  const profileId = await resolveProfileId(profileIdOrSlug);

  const reviews = await Review.find({ profileId, isVisible: true })
    .populate('reviewerId', 'name avatar')
    .sort({ createdAt: -1 })
    .lean();
  return reviews;
}

export async function getMyAnonymousReviews(userId: string) {
  // Find all profiles owned by this user
  const profiles = await Profile.find({ userId }).select('_id').lean();
  const profileIds = profiles.map(p => p._id);

  if (profileIds.length === 0) return [];

  // Find all reviews for these profiles
  // Exclude reviewerId and createdAt for anonymity
  const reviews = await Review.find({ profileId: { $in: profileIds }, isVisible: true })
    .select('-reviewerId -createdAt -updatedAt')
    .sort({ rating: -1 }) // Sort by rating since we don't return dates
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

  const profile = await Profile.findOne({ _id: profileId, verificationStatus: 'verified', isActive: true }).populate('userId', 'email');
  if (!profile) throw new AppError('Profile not found', 404);

  // Multiple reviews allowed per student per profile

  const review = await Review.create({ profileId, reviewerId, ...data });

  // Recalculate rating
  const allReviews = await Review.find({ profileId, isVisible: true });
  const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  const count = allReviews.length;
  const score = (count * avg + 5 * 3.5) / (count + 5);

  await Profile.findByIdAndUpdate(profileId, {
    'rating.average': Math.round(avg * 10) / 10,
    'rating.count': count,
    'rating.score': Math.round(score * 100) / 100
  });

  if (profile.userId && (profile.userId as any).email) {
    // Send email asynchronously without blocking the response
    sendReviewNotification((profile.userId as any).email, data.rating, data.text).catch(err => {
      console.error('Failed to send review notification email:', err);
    });
  }

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
  const count = allReviews.length;
  const score = (count * avg + 5 * 3.5) / (count + 5);

  await Profile.findByIdAndUpdate(review.profileId, {
    'rating.average': Math.round(avg * 10) / 10,
    'rating.count': count,
    'rating.score': Math.round(score * 100) / 100
  });

  return review;
}