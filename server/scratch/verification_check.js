const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const Profile = mongoose.model('Profile', new mongoose.Schema({}, { strict: false }));

  console.log('\n1. Sample manual profile (source: null):');
  const manualSample = await Profile.findOne({ source: null }, { verificationStatus: 1, isApproved: 1, source: 1 });
  console.log(JSON.stringify(manualSample, null, 2));

  console.log('\n2. Sample imported profile (source: google_maps):');
  const importedSample = await Profile.findOne({ source: "google_maps" }, { verificationStatus: 1, isApproved: 1, source: 1 });
  console.log(JSON.stringify(importedSample, null, 2));

  console.log('\n2. Group by verificationStatus and isApproved:');
  const counts = await Profile.aggregate([
    {
      $group: {
        _id: {
          verificationStatus: "$verificationStatus",
          isApproved: "$isApproved"
        },
        count: { $sum: 1 }
      }
    }
  ]);
  console.log(JSON.stringify(counts, null, 2));

  console.log('\n3. Group by source:');
  const sourceCounts = await Profile.aggregate([
    {
      $group: {
        _id: "$source",
        count: { $sum: 1 }
      }
    }
  ]);
  console.log(JSON.stringify(sourceCounts, null, 2));

  const total = await Profile.countDocuments({});
  console.log('\nTotal Profiles:', total);

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});