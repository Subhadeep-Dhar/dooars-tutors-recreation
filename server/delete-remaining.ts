import mongoose from 'mongoose';
import { config } from 'dotenv';
import { User } from './src/models/User';
import { Profile } from './src/models/Profile';

config();

async function deleteRemaining() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  // Find all users whose email is digits followed by @dooars.temp
  const users = await User.find({ email: { $regex: /^\\d+@dooars\\.temp$/ } });
  // Mongoose $regex accepts a string or RegExp. Let's use string.
  const usersStr = await User.find({ email: { $regex: "^\\d+@dooars\\.temp$" } });
  
  const allUsers = [...new Set([...users, ...usersStr])];
  console.log(`Found ${allUsers.length} users matching phone@dooars.temp pattern.`);

  
  let deletedUsers = 0;
  let deletedProfiles = 0;

  for (const user of allUsers) {
    const profileRes = await Profile.deleteMany({ userId: user._id });
    deletedProfiles += profileRes.deletedCount;
    
    await User.deleteOne({ _id: user._id });
    deletedUsers++;
    
    console.log(`Deleted user: ${user.email} and ${profileRes.deletedCount} associated profiles.`);
  }
  
  console.log(`Done! Deleted Profiles: ${deletedProfiles}, Deleted Users: ${deletedUsers}`);
  process.exit(0);
}

deleteRemaining().catch(console.error);
