const mongoose = require('mongoose');
require('dotenv').config();

async function checkDups() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await mongoose.connection.collection('users').find({ supabaseId: { $exists: true, $ne: null } }).toArray();
  const counts = {};
  users.forEach(u => counts[u.supabaseId] = (counts[u.supabaseId] || 0) + 1);
  const dups = Object.keys(counts).filter(k => counts[k] > 1);
  console.log('Duplicates:', dups);
  
  if (dups.length > 0) {
    console.log('Users with duplicate ids:', users.filter(u => dups.includes(u.supabaseId)));
  } else {
    console.log('No duplicate supabaseIds found.');
  }

  // Also check for empty strings
  const empty = await mongoose.connection.collection('users').find({ supabaseId: "" }).toArray();
  console.log('Users with empty string supabaseId:', empty.length);
  
  process.exit(0);
}

checkDups();
