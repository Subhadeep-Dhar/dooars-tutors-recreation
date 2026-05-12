const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  
  const Profile = mongoose.model('Profile', new mongoose.Schema({}, { strict: false }));
  const counts = await Profile.aggregate([
    { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }
  ]);
  
  console.log('Profile Status Counts:');
  console.log(JSON.stringify(counts, null, 2));
  
  const total = await Profile.countDocuments({});
  console.log('Total Profiles:', total);
  
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
