const mongoose = require('mongoose');
require('dotenv').config();

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  
  const Profile = mongoose.model('Profile', new mongoose.Schema({}, { strict: false }));
  
  // 1. Set verificationStatus to 'pending' for all profiles missing it
  const result = await Profile.updateMany(
    { verificationStatus: { $exists: false } },
    { $set: { verificationStatus: 'pending' } }
  );
  console.log(`Updated ${result.modifiedCount} profiles to verificationStatus: 'pending'`);

  // 2. Set isActive: true for all profiles missing it
  const resultActive = await Profile.updateMany(
    { isActive: { $exists: false } },
    { $set: { isActive: true } }
  );
  console.log(`Updated ${resultActive.modifiedCount} profiles to isActive: true`);

  // 3. Verify counts
  const counts = await Profile.aggregate([
    { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }
  ]);
  console.log('New Profile Status Counts:');
  console.log(JSON.stringify(counts, null, 2));
  
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
