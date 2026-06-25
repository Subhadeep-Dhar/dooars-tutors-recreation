import mongoose from 'mongoose';
import * as xlsx from 'xlsx';
import { config } from 'dotenv';
import { User } from './src/models/User';
import { Profile } from './src/models/Profile';

config();

async function deleteImportedData() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  const workbook = xlsx.readFile('../context/DETAILS(A).xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json<any>(sheet);
  
  let deletedUsers = 0;
  let deletedProfiles = 0;

  for (const row of data) {
    if (!row.Name) continue;
    
    let phone = (row.contact_phone || '').toString().replace(/[^0-9]/g, '');
    
    // In import script, if phone was empty we randomly generated it. 
    // This might make exact email match hard for those specific rows.
    // This might make exact email match hard for those specific rows.
    // However, we can reliably delete the Profile by displayName
    const profiles = await Profile.find({ displayName: row.Name.trim() });
    
    for (const profile of profiles) {
      // Find associated user
      const user = await User.findById(profile.userId);
      if (user && user.email.endsWith('@dooars.temp')) {
        await User.deleteOne({ _id: user._id });
        deletedUsers++;
      }
      await Profile.deleteOne({ _id: profile._id });
      deletedProfiles++;
      console.log(`Deleted profile: ${row.Name}`);
    }
  }
  
  console.log(`Done! Deleted Profiles: ${deletedProfiles}, Deleted Users: ${deletedUsers}`);
  process.exit(0);
}

deleteImportedData().catch(console.error);
