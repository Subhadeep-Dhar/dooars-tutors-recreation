const mongoose = require('mongoose');
require('dotenv').config();

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const Profile = mongoose.model('Profile', new mongoose.Schema({}, { strict: false }));

  // Count before migration
  const beforeCounts = await Profile.aggregate([
    {
      $group: {
        _id: {
          verificationStatus: "$verificationStatus",
          isApproved: "$isApproved",
          source: "$source"
        },
        count: { $sum: 1 }
      }
    }
  ]);
  console.log('Before migration:');
  console.log(JSON.stringify(beforeCounts, null, 2));

  // Migrate: set verificationStatus to "verified" for manual profiles with isApproved: true
  const result = await Profile.updateMany(
    { source: null, isApproved: true, verificationStatus: "pending" },
    { $set: { verificationStatus: "verified" } }
  );

  console.log(`\nMigration result: ${result.modifiedCount} documents updated`);

  // Count after migration
  const afterCounts = await Profile.aggregate([
    {
      $group: {
        _id: {
          verificationStatus: "$verificationStatus",
          isApproved: "$isApproved",
          source: "$source"
        },
        count: { $sum: 1 }
      }
    }
  ]);
  console.log('\nAfter migration:');
  console.log(JSON.stringify(afterCounts, null, 2));

  const total = await Profile.countDocuments({});
  console.log('\nTotal Profiles:', total);

  await mongoose.disconnect();
  console.log('Migration completed successfully');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});