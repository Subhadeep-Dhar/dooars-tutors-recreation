const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb+srv://subhadeepdhar563_db_user:test123@cluster0.f3bfe3m.mongodb.net/dooars_dev?retryWrites=true&w=majority');
  const db = mongoose.connection.db;
  const profiles = await db.collection('profiles').find({}).toArray();
  const withRating = profiles.filter(p => p.rating && p.rating.count > 0);
  console.log('With >0 rating count:', withRating.length);
  process.exit(0);
}

test().catch(console.error);
