const mongoose = require('mongoose');
const xlsx = require('xlsx');
require('dotenv').config();

const { User } = require('./src/models/User');
const { Profile } = require('./src/models/Profile');

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

async function generateUniqueSlug(baseSlug) {
  let slug = baseSlug;
  let counter = 1;
  while (await Profile.exists({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

function mapType(typeStr) {
  const t = typeStr.toLowerCase();
  if (t.includes('dance') || t.includes('art') || t.includes('music')) return 'arts_trainer';
  if (t.includes('gym') || t.includes('yoga') || t.includes('fitness')) return 'gym_yoga';
  if (t.includes('sport') || t.includes('cricket') || t.includes('football') || t.includes('martial')) return 'sports_trainer';
  return 'coaching_center'; // fallback for abacus, etc.
}

async function importData() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const workbook = xlsx.readFile('../context/DETAILS(A).xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);
  
  let added = 0;
  let skipped = 0;

  for (const row of data) {
    if (!row.Name) continue;
    
    // Clean up phone numbers
    let phone = (row.contact_phone || '').toString().replace(/[^0-9]/g, '');
    let whatsapp = (row.contact_whatsapp || '').toString().replace(/[^0-9]/g, '');
    
    // If we have no phone, use a random one for uniqueness
    if (!phone) {
        phone = '0000000000' + Math.floor(Math.random() * 10000);
    }
    
    const email = `${phone}@dooars.temp`;
    
    // Check if user exists
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
    
    // Check if profile exists for this user
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
