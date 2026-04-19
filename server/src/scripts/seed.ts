import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { User, Profile, Review, Category } from '../models';

async function seed() {
  await mongoose.connect(env.MONGODB_URI);
  console.info('✅ Connected to MongoDB');

  await Promise.all([
    User.deleteMany({ email: /@dooarstest\.com$/ }),
    Profile.deleteMany({ slug: /^test-/ }),
    Category.deleteMany({}),
  ]);
  console.info('🗑️  Cleared old seed data');

  const categories = await Category.insertMany([
    { slug: 'private-tutor', name: 'Private Tutor', icon: 'book', order: 1 },
    { slug: 'coaching-center', name: 'Coaching Center', icon: 'building', order: 2 },
    { slug: 'sports-trainer', name: 'Sports Trainer', icon: 'trophy', order: 3 },
    { slug: 'arts-trainer', name: 'Arts & Culture', icon: 'music', order: 4 },
    { slug: 'gym-yoga', name: 'Gym & Yoga', icon: 'dumbbell', order: 5 },
  ]);
  console.info(`✅ ${categories.length} categories created`);

  const passwordHash = await bcrypt.hash('Test@1234', 12);

  const [, student1, tutor1, tutor2, tutor3, org1] = await User.insertMany([
    { email: 'admin@dooarstest.com', passwordHash, name: 'Admin User', role: 'admin', isVerified: true },
    { email: 'student1@dooarstest.com', passwordHash, name: 'Rahul Das', role: 'student', isVerified: true },
    { email: 'tutor1@dooarstest.com', passwordHash, name: 'Priya Sharma', role: 'tutor', isVerified: true },
    { email: 'tutor2@dooarstest.com', passwordHash, name: 'Amit Roy', role: 'tutor', isVerified: true },
    { email: 'tutor3@dooarstest.com', passwordHash, name: 'Sunita Barman', role: 'tutor', isVerified: true },
    { email: 'org1@dooarstest.com', passwordHash, name: 'Dooars Academy', role: 'org', isVerified: true },
  ]);
  console.info('✅ 6 users created (password: Test@1234)');

  const profile1 = await Profile.create({
    userId: tutor1._id,
    type: 'tutor',
    displayName: 'Priya Sharma',
    slug: 'test-priya-sharma',
    tagline: 'Making students love Mathematics',
    bio: 'Experienced tutor with 8 years of teaching in the Dooars region.',
    teachingSlots: [
      { subject: 'Mathematics', classes: ['Class 8', 'Class 9', 'Class 10'], board: 'CBSE', medium: 'Bengali', feePerMonth: 1000 },
      { subject: 'English', classes: ['Class 8', 'Class 9'], board: 'CBSE', medium: 'Bengali', feePerMonth: 800 },
      { subject: 'Science', classes: ['Class 8'], board: 'CBSE', medium: 'Bengali', feePerMonth: 900 },
    ],
    _subjectIndex: ['Mathematics', 'English', 'Science'],
    _classIndex: ['Class 8', 'Class 9', 'Class 10'],
    location: { type: 'Point', coordinates: [89.1743, 26.7132] },
    address: { line1: '12 Netaji Road', area: 'Kotwali', town: 'Jalpaiguri', district: 'Jalpaiguri', state: 'West Bengal', pincode: '735101' },
    contact: { phone: '9800000001', whatsapp: '9800000001' },
    experience: 8,
    languages: ['Bengali', 'Hindi', 'English'],
    rating: { average: 4.7, count: 23 },
    isApproved: true,
    isActive: true,
  });

  const profile2 = await Profile.create({
    userId: tutor2._id,
    type: 'tutor',
    displayName: 'Amit Roy',
    slug: 'test-amit-roy',
    tagline: 'Physics and Chemistry made simple',
    bio: 'Former school teacher with 12 years experience.',
    teachingSlots: [
      { subject: 'Physics', classes: ['Class 11', 'Class 12'], board: 'CBSE', medium: 'English', feePerMonth: 1500 },
      { subject: 'Chemistry', classes: ['Class 11', 'Class 12'], board: 'CBSE', medium: 'English', feePerMonth: 1500 },
      { subject: 'Mathematics', classes: ['Class 12'], board: 'CBSE', medium: 'English', feePerMonth: 1800 },
    ],
    _subjectIndex: ['Physics', 'Chemistry', 'Mathematics'],
    _classIndex: ['Class 11', 'Class 12'],
    location: { type: 'Point', coordinates: [89.2744, 26.8012] },
    address: { line1: '5 Gandhi Colony', area: 'Maynaguri', town: 'Maynaguri', district: 'Jalpaiguri', state: 'West Bengal', pincode: '735224' },
    contact: { phone: '9800000002', whatsapp: '9800000002' },
    experience: 12,
    languages: ['Bengali', 'English'],
    rating: { average: 4.9, count: 41 },
    isApproved: true,
    isActive: true,
  });

  const profile3 = await Profile.create({
    userId: tutor3._id,
    type: 'arts_trainer',
    displayName: 'Sunita Barman',
    slug: 'test-sunita-barman',
    tagline: 'Classical dance and music for all ages',
    bio: 'Trained Rabindra Sangeet vocalist and Bharatanatyam dancer.',
    teachingSlots: [
      { activity: 'Rabindra Sangeet', ageGroups: ['5-12', '13-18', '18+'], level: 'All levels', sessionType: 'Individual', timing: 'Morning', gender: 'All', feePerMonth: 600 },
      { activity: 'Bharatanatyam', ageGroups: ['5-12', '13-18'], level: 'Beginner', sessionType: 'Group', timing: 'Evening', gender: 'Female only', feePerMonth: 500 },
    ],
    _subjectIndex: ['Rabindra Sangeet', 'Bharatanatyam'],
    _classIndex: [],
    location: { type: 'Point', coordinates: [89.1502, 26.6985] },
    address: { line1: '8 Tagore Sarani', area: 'Ward 5', town: 'Jalpaiguri', district: 'Jalpaiguri', state: 'West Bengal', pincode: '735101' },
    contact: { phone: '9800000003', whatsapp: '9800000003' },
    experience: 15,
    languages: ['Bengali'],
    rating: { average: 4.5, count: 18 },
    isApproved: true,
    isActive: true,
  });

  const profile4 = await Profile.create({
    userId: org1._id,
    type: 'coaching_center',
    displayName: 'Dooars Academy',
    slug: 'test-dooars-academy',
    tagline: 'Complete coaching for Class 8-12',
    bio: 'Established in 2010, Dooars Academy has helped 2000+ students.',
    teachingSlots: [
      { subject: 'Mathematics', classes: ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'], board: 'CBSE', medium: 'Bengali', feePerMonth: 1200 },
      { subject: 'Science', classes: ['Class 8', 'Class 9', 'Class 10'], board: 'CBSE', medium: 'Bengali', feePerMonth: 1000 },
      { subject: 'Physics', classes: ['Class 11', 'Class 12'], board: 'CBSE', medium: 'English', feePerMonth: 1800 },
      { subject: 'English', classes: ['Class 8', 'Class 9', 'Class 10'], board: 'CBSE', medium: 'Bengali', feePerMonth: 800 },
    ],
    _subjectIndex: ['Mathematics', 'Science', 'Physics', 'English'],
    _classIndex: ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'],
    location: { type: 'Point', coordinates: [89.1855, 26.7208] },
    address: { line1: '23 DBC Road', area: 'Kadamtala', town: 'Jalpaiguri', district: 'Jalpaiguri', state: 'West Bengal', pincode: '735101' },
    contact: { phone: '9800000004', whatsapp: '9800000004', email: 'info@dooarsacademy.test' },
    experience: 14,
    languages: ['Bengali', 'Hindi', 'English'],
    rating: { average: 4.6, count: 89 },
    isApproved: true,
    isFeatured: true,
    isActive: true,
  });

  console.info('✅ 4 profiles created');

  await Review.insertMany([
    { profileId: profile1._id, reviewerId: student1._id, rating: 5, text: 'Excellent teacher. My son improved significantly in Maths.', isVisible: true },
    { profileId: profile2._id, reviewerId: student1._id, rating: 5, text: 'Best Physics teacher in Jalpaiguri. Very clear explanations.', isVisible: true },
    { profileId: profile4._id, reviewerId: student1._id, rating: 4, text: 'Good coaching center with experienced teachers and regular tests.', isVisible: true },
  ]);
  console.info('✅ 3 reviews created');

  console.info('\n─────────────────────────────────────────');
  console.info('Seed complete. Test credentials:');
  console.info('  Admin:   admin@dooarstest.com / Test@1234');
  console.info('  Student: student1@dooarstest.com / Test@1234');
  console.info('  Tutor:   tutor1@dooarstest.com / Test@1234');
  console.info('  Org:     org1@dooarstest.com / Test@1234');
  console.info('─────────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});