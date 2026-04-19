import slugify from 'slugify';
import { Profile } from '../../models';
import { AppError } from '../../middleware/errorHandler';
import { ProfileType, BoardType, MediumType } from '@dooars/shared';
import { cacheDel } from '../../config/redis';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function generateUniqueSlug(displayName: string, excludeId?: string): Promise<string> {
  const base = slugify(displayName, { lower: true, strict: true });
  let slug = base;
  let counter = 1;

  while (true) {
    const existing = await Profile.findOne({ slug });
    if (!existing || (excludeId && String(existing._id) === excludeId)) break;
    slug = `${base}-${counter++}`;
  }

  return slug;
}

function rebuildIndexes(teachingSlots: any[]) {
  const subjects = new Set<string>();
  const classes = new Set<string>();

  for (const slot of teachingSlots) {
    if (slot.subject) subjects.add(slot.subject);
    if (slot.activity) subjects.add(slot.activity); // non-academic
    if (slot.classes) slot.classes.forEach((c: string) => classes.add(c));
  }

  return {
    _subjectIndex: Array.from(subjects),
    _classIndex: Array.from(classes),
  };
}

async function geocodeAddress(address: {
  line1: string;
  town: string;
  district: string;
  state: string;
  pincode: string;
}): Promise<[number, number]> {
  // For now return default Jalpaiguri coordinates
  // Will be replaced with real Google Geocoding API call in production
  const defaults: Record<string, [number, number]> = {
    jalpaiguri: [89.1743, 26.7132],
    alipurduar: [89.6640, 26.4911],
    siliguri: [88.4338, 26.7271],
    coochbehar: [89.4354, 26.3452],
  };

  const town = address.town.toLowerCase();
  for (const [key, coords] of Object.entries(defaults)) {
    if (town.includes(key)) return coords;
  }

  return [89.1743, 26.7132]; // fallback: Jalpaiguri
}

// ── Service functions ─────────────────────────────────────────────────────────

export async function createProfile(userId: string, data: {
  type: ProfileType;
  displayName: string;
  tagline?: string;
  bio?: string;
  address: {
    line1: string;
    area?: string;
    town: string;
    district: string;
    state: string;
    pincode: string;
  };
  contact?: {
    phone?: string;
    whatsapp?: string;
    email?: string;
    website?: string;
  };
  experience?: number;
  languages?: string[];
}) {
  const existing = await Profile.findOne({ userId });
  if (existing) throw new AppError('Profile already exists for this account', 409);

  const slug = await generateUniqueSlug(data.displayName);
  const coordinates = await geocodeAddress(data.address);

  const profile = await Profile.create({
    userId,
    ...data,
    slug,
    location: { type: 'Point', coordinates },
    teachingSlots: [],
    _subjectIndex: [],
    _classIndex: [],
    rating: { average: 0, count: 0 },
    isApproved: false,
    isActive: true,
  });

  return profile;
}

export async function updateProfile(profileId: string, userId: string, data: Partial<{
  displayName: string;
  tagline: string;
  bio: string;
  address: any;
  contact: any;
  experience: number;
  languages: string[];
}>) {
  const profile = await Profile.findOne({ _id: profileId, userId });
  if (!profile) throw new AppError('Profile not found', 404);

  // Regenerate slug if displayName changed
  if (data.displayName && data.displayName !== profile.displayName) {
    (data as any).slug = await generateUniqueSlug(data.displayName, profileId);
  }

  // Re-geocode if address changed
  if (data.address) {
    const coordinates = await geocodeAddress(data.address);
    (data as any).location = { type: 'Point', coordinates };
  }

  Object.assign(profile, data);
  await profile.save();

  // Invalidate search cache for this profile
  await cacheDel(`search:*`);

  return profile;
}

export async function getProfileBySlug(slug: string) {
  const profile = await Profile.findOne({ slug, isActive: true }).lean();
  if (!profile) throw new AppError('Profile not found', 404);
  return profile;
}

export async function getMyProfile(userId: string) {
  const profile = await Profile.findOne({ userId }).lean();
  if (!profile) throw new AppError('No profile found for this account', 404);
  return profile;
}

// ── Teaching slot operations ──────────────────────────────────────────────────

export async function addSlot(profileId: string, userId: string, slotData: any) {
  const profile = await Profile.findOne({ _id: profileId, userId });
  if (!profile) throw new AppError('Profile not found', 404);

  profile.teachingSlots.push(slotData);
  const { _subjectIndex, _classIndex } = rebuildIndexes(profile.teachingSlots);
  profile._subjectIndex = _subjectIndex;
  profile._classIndex = _classIndex;

  await profile.save();
  await cacheDel(`search:*`);

  return profile;
}

export async function updateSlot(profileId: string, userId: string, slotId: string, slotData: any) {
  const profile = await Profile.findOne({ _id: profileId, userId });
  if (!profile) throw new AppError('Profile not found', 404);

  const slot = (profile.teachingSlots as any).id(slotId);
  if (!slot) throw new AppError('Slot not found', 404);

  Object.assign(slot, slotData);
  const { _subjectIndex, _classIndex } = rebuildIndexes(profile.teachingSlots);
  profile._subjectIndex = _subjectIndex;
  profile._classIndex = _classIndex;

  await profile.save();
  await cacheDel(`search:*`);

  return profile;
}

export async function deleteSlot(profileId: string, userId: string, slotId: string) {
  const profile = await Profile.findOne({ _id: profileId, userId });
  if (!profile) throw new AppError('Profile not found', 404);

  (profile.teachingSlots as any).pull({ _id: slotId });
  const { _subjectIndex, _classIndex } = rebuildIndexes(profile.teachingSlots);
  profile._subjectIndex = _subjectIndex;
  profile._classIndex = _classIndex;

  await profile.save();
  await cacheDel(`search:*`);

  return profile;
}