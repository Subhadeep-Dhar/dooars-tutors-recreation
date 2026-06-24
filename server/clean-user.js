const mongoose = require('mongoose');
require('dotenv').config();

async function clean() {
  await mongoose.connect(process.env.MONGODB_URI);
  await mongoose.connection.collection('users').updateMany(
    { email: { $regex: '_deleted_' } },
    { $unset: { supabaseId: "" } }
  );
  console.log('Cleaned up deleted users');
  process.exit(0);
}
clean();
