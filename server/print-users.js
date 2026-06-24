const mongoose = require('mongoose');
require('dotenv').config();

async function checkUsers() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await mongoose.connection.collection('users').find({}).toArray();
  
  users.forEach(u => {
    console.log(`Email: ${u.email}, SupabaseId: ${u.supabaseId}, Status: ${u.status}`);
  });
  process.exit(0);
}

checkUsers();
