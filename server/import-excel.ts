import mongoose from 'mongoose';
import * as xlsx from 'xlsx';
import { config } from 'dotenv';
import { User } from './src/models/User';
import { Profile } from './src/models/Profile';
import { ProfileType } from '@dooars/shared';

config();

function slugify(text: string) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function generateUniqueSlug(baseSlug: string) {
  let slug = baseSlug;
  let counter = 1;
  while (await Profile.exists({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

function mapType(typeStr: string): ProfileType {
  const t = typeStr.toLowerCase();
  if (t.includes('dance') || t.includes('art') || t.includes('music')) return 'arts_trainer';
  if (t.includes('gym') || t.includes('yoga') || t.includes('fitness')) return 'gym_yoga';
  if (t.includes('sport') || t.includes('cricket') || t.includes('football') || t.includes('martial')) return 'sports_trainer';
  return 'coaching_center';
}

async function importData() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  
  const workbook = xlsx.readFile('../context/DETAILS(A).xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json<any>(sheet);
  
  let added = 0;
  let skipped = 0;

  for (const row of data) {
    if (!row.Name) continue;
    
    let phone = (row.contact_phone || '').toString().replace(/[^0-9]/g, '');
    let whatsapp = (row.contact_whatsapp || '').toString().replace(/[^0-9]/g, '');
    
    if (!phone) {
        phone = '0000000000' + Math.floor(Math.random() * 10000);
    }
    
    const email = `${phone}@dooars.temp`;
    
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        email,
        name: row.Name,
        phone,
        role: 'org',
        status: 'active',
        isVerified: true
      });
      await user.save();
    }
    
    let profile = await Profile.findOne({ userId: user._id });
    if (profile) {
      console.log(`Skipping ${row.Name} - already exists`);
      skipped++;
      continue;
    }
    
    const pType = mapType(row.type || '');
    const baseSlug = slugify(row.Name);
    const slug = await generateUniqueSlug(baseSlug);
    
    profile = new Profile({
      userId: user._id,
      type: pType,
      displayName: row.Name,
      slug,
      bio: row.url ? `Google Maps: ${row.url}` : undefined,
      location: {
        type: 'Point',
        coordinates: [parseFloat(row.longitude) || 89.52, parseFloat(row.latitude) || 26.50]
      },
      address: {
        town: row.address_town,
        district: row.address_district,
        state: row.address_state
      },
      contact: {
        phone,
        whatsapp
      },
      teachingSlots: [],
      media: [],
      isPublished: true,
      isVerified: true,
      stats: { rating: 0, reviewCount: 0 }
    });
    
    await profile.save();
    console.log(`Added ${row.Name}`);
    added++;
  }
  
  console.log(`Done! Added: ${added}, Skipped: ${skipped}`);
  process.exit(0);
}

importData().catch(console.error);
