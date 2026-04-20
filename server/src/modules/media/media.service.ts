import { cloudinary } from '../../config/cloudinary';
import { Profile } from '../../models';
import { AppError } from '../../middleware/errorHandler';
import { MediaCategory } from '@dooars/shared';

export async function uploadMedia(
  profileId: string,
  userId: string,
  file: Express.Multer.File,
  category: MediaCategory = 'gallery',
  caption?: string
) {
  const profile = await Profile.findOne({ _id: profileId, userId });
  if (!profile) throw new AppError('Profile not found', 404);

  const isVideo = file.mimetype === 'video/mp4';

  // Upload to Cloudinary
  const result = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'dooars-tutors',
        resource_type: isVideo ? 'video' : 'image',
        transformation: isVideo
          ? [{ quality: 'auto' }]
          : [{ width: 1200, crop: 'limit' }, { quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) reject(new AppError('Upload failed', 500));
        else resolve(result);
      }
    );
    stream.end(file.buffer);
  });

  const mediaItem = {
    type: isVideo ? 'video' : 'image',
    url: result.secure_url,
    publicId: result.public_id,
    thumbnailUrl: isVideo
      ? cloudinary.url(result.public_id, { resource_type: 'video', format: 'jpg', transformation: [{ start_offset: '0' }] })
      : undefined,
    caption,
    category,
    order: profile.media.length,
  };

  profile.media.push(mediaItem as any);
  await profile.save();

  return profile;
}

export async function deleteMedia(profileId: string, userId: string, mediaId: string) {
  const profile = await Profile.findOne({ _id: profileId, userId });
  if (!profile) throw new AppError('Profile not found', 404);

  const mediaItem = (profile.media as any).id(mediaId);
  if (!mediaItem) throw new AppError('Media item not found', 404);

  // Delete from Cloudinary first
  await cloudinary.uploader.destroy(mediaItem.publicId, {
    resource_type: mediaItem.type === 'video' ? 'video' : 'image',
  });

  (profile.media as any).pull({ _id: mediaId });
  await profile.save();

  return profile;
}

export async function uploadAvatar(userId: string, file: Express.Multer.File) {
  const { User } = await import('../../models');
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  // Delete old avatar if exists
  if (user.avatar?.publicId) {
    await cloudinary.uploader.destroy(user.avatar.publicId).catch(() => {});
  }

  const result = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'dooars-tutors/avatars',
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }, { quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) reject(new AppError('Upload failed', 500));
        else resolve(result);
      }
    );
    stream.end(file.buffer);
  });

  user.avatar = { url: result.secure_url, publicId: result.public_id };
  await user.save();

  return user;
}