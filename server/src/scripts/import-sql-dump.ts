import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import slugify from 'slugify';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { User, Profile, Review } from '../models';

// ── Utility to parse SQL VALUES into JS Arrays ────────────────────────────────
function parseSqlValues(sqlText: string, tableName: string) {
    const tableIndex = sqlText.indexOf(`INSERT INTO \`${tableName}\` VALUES`);
    if (tableIndex === -1) return [];

    const startIndex = sqlText.indexOf('(', tableIndex);
    let i = startIndex;
    const rows: string[][] = [];
    
    while (i < sqlText.length) {
        if (sqlText[i] === '(') {
            const row: string[] = [];
            let inString = false;
            let currentVal = '';
            i++; // skip '('
            while (i < sqlText.length) {
                if (!inString && sqlText[i] === "'") {
                    inString = true;
                    i++;
                    continue;
                }
                if (inString) {
                    if (sqlText[i] === "\\") {
                        currentVal += sqlText[i+1];
                        i += 2;
                        continue;
                    }
                    if (sqlText[i] === "'") {
                        if (sqlText[i+1] === "'") {
                            // escaped quote ''
                            currentVal += "'";
                            i += 2;
                            continue;
                        } else {
                            inString = false;
                            i++;
                            continue;
                        }
                    }
                    currentVal += sqlText[i];
                    i++;
                } else {
                    if (sqlText[i] === ',' || sqlText[i] === ')') {
                        if (currentVal.trim() === 'NULL') {
                            row.push(null as any);
                        } else {
                            row.push(currentVal.trim());
                        }
                        currentVal = '';
                        if (sqlText[i] === ')') {
                            rows.push(row);
                            i++;
                            break;
                        }
                        i++;
                    } else {
                        currentVal += sqlText[i];
                        i++;
                    }
                }
            }
            
            // Move to next row
            while (i < sqlText.length && sqlText[i] !== ',' && sqlText[i] !== ';') {
                i++;
            }
            if (sqlText[i] === ';') {
                break;
            }
            if (sqlText[i] === ',') {
                while(i < sqlText.length && sqlText[i] !== '(') i++;
            }
        } else {
            break;
        }
    }
    return rows;
}

// ── Main Migration Function ──────────────────────────────────────────────────
async function runImport() {
    const GENERIC_PASSWORD = process.env.DEFAULT_TUTOR_PASSWORD;
    if (!GENERIC_PASSWORD) {
        throw new Error('DEFAULT_TUTOR_PASSWORD environment variable is not set. Please add it to your .env file.');
    }
    const genericPasswordHash = await bcrypt.hash(GENERIC_PASSWORD, 12);
    
    const sqlFilePath = path.resolve('c:/Users/Subhadeep Dhar/Desktop/Dooars-Tutors/context/u727069115_dooars_tutors.20260407170935.sql/u727069115_dooars_tutors.sql');
    console.info(`Reading SQL file from: ${sqlFilePath}`);
    const sqlText = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.info('Parsing tables...');
    const tutorsRaw = parseSqlValues(sqlText, 'tutors');
    const subjectsRaw = parseSqlValues(sqlText, 'tutor_subjects');
    const reviewsRaw = parseSqlValues(sqlText, 'reviews');
    
    console.info(`Found ${tutorsRaw.length} tutors, ${subjectsRaw.length} subject entries, ${reviewsRaw.length} reviews.`);

    await mongoose.connect(env.MONGODB_URI);
    console.info('✅ Connected to MongoDB');

    // Wiping ONLY tutors and orgs, leaving students and admins intact
    const tutorAndOrgUsers = await User.find({ role: { $in: ['tutor', 'org'] } });
    const userIdsToWipe = tutorAndOrgUsers.map(u => u._id);
    
    await Profile.deleteMany({ userId: { $in: userIdsToWipe } });
    await User.deleteMany({ _id: { $in: userIdsToWipe } });
    console.info(`🗑️  Cleared existing tutor & org profiles and users.`);

    // Wipe old reviews from the old profiles (we'll insert fresh from SQL)
    // Actually, wipe ALL reviews because we want to completely refresh them from the SQL dump
    await Review.deleteMany({});
    console.info(`🗑️  Cleared existing reviews.`);

    const profileMap = new Map<string, mongoose.Types.ObjectId>();

    // Process subjects grouping
    // Format: (id, tutor_id, subject, class)
    const tutorSubjectsMap = new Map<string, any[]>();
    for (const row of subjectsRaw) {
        const tutorId = row[1];
        const subject = row[2];
        const cls = row[3];
        if (!tutorSubjectsMap.has(tutorId)) {
            tutorSubjectsMap.set(tutorId, []);
        }
        tutorSubjectsMap.get(tutorId)?.push({ subject, cls });
    }

    let profilesCreated = 0;

    for (const tRow of tutorsRaw) {
        const id = tRow[0];
        const name = tRow[1];
        const phone = tRow[2];
        const email = tRow[3] || `${id}@dooarstutors.temp`;
        const experience = parseInt(tRow[4]) || 0;
        const city = tRow[9] || 'Alipurduar';
        const address = tRow[10] || city;
        const lat = parseFloat(tRow[11]) || 26.4911;
        const lng = parseFloat(tRow[12]) || 89.5274;
        const typeRaw = tRow[15] === 'Organisation' ? 'org' : 'tutor';
        const profileType = tRow[15] === 'Organisation' ? 'coaching_center' : 'tutor';
        const ratingAvg = parseFloat(tRow[17]) || 0;
        const ratingCount = parseInt(tRow[18]) || 0;
        const profession = tRow[19] || '';
        const profDetailsStr = tRow[20];
        const qualifications = tRow[34];
        const bio = tRow[35] || '';

        // Determine correct profileType based on profession or data
        let finalProfileType = profileType;
        if (profession.toLowerCase().includes('yoga') || bio.toLowerCase().includes('yoga')) finalProfileType = 'gym_yoga';
        if (profession.toLowerCase().includes('dance') || profession.toLowerCase().includes('sing')) finalProfileType = 'arts_trainer';
        if (profession.toLowerCase().includes('sports') || profession.toLowerCase().includes('football')) finalProfileType = 'sports_trainer';

        // Extract primary boards and build slots
        let boards = ['State'];
        if (profDetailsStr) {
            try {
                const parsed = JSON.parse(profDetailsStr);
                const rawBoards = parsed?.tutor?.boards || parsed?.educational_coaching_centre?.boards || '';
                if (rawBoards) {
                    boards = rawBoards.split(',').map((b: string) => {
                        if (b === 'WB') return 'State';
                        if (b === 'CISCE') return 'ICSE';
                        return b;
                    });
                }
            } catch(e) {}
        }
        
        const primaryBoard = boards[0] || 'State';
        
        // Build slots
        const academicSlots: any[] = [];
        const nonAcademicSlots: any[] = [];
        
        const subjRows = tutorSubjectsMap.get(id) || [];
        const groupedSubjects = new Map<string, string[]>();
        for (const sr of subjRows) {
            if (!groupedSubjects.has(sr.subject)) {
                groupedSubjects.set(sr.subject, []);
            }
            groupedSubjects.get(sr.subject)?.push(`Class ${sr.cls}`);
        }
        
        for (const [subj, classes] of groupedSubjects.entries()) {
            if (finalProfileType === 'tutor' || finalProfileType === 'coaching_center') {
                academicSlots.push({
                    subject: subj,
                    classes: classes,
                    board: primaryBoard,
                    medium: 'Bengali',
                    feePerMonth: null
                });
            } else {
                nonAcademicSlots.push({
                    activity: subj,
                    ageGroups: ['All'],
                    level: 'All levels',
                    sessionType: 'Both',
                    gender: 'Both',
                    feePerMonth: null
                });
            }
        }
        
        // If it's a non-academic profile but had no parsed subjects from SQL
        if (academicSlots.length === 0 && nonAcademicSlots.length === 0) {
            if (finalProfileType === 'gym_yoga') nonAcademicSlots.push({ activity: 'Yoga', ageGroups: ['All'] });
            if (finalProfileType === 'arts_trainer') nonAcademicSlots.push({ activity: 'Arts', ageGroups: ['All'] });
            if (finalProfileType === 'sports_trainer') nonAcademicSlots.push({ activity: 'Sports', ageGroups: ['All'] });
        }

        const teachingSlots = [...academicSlots, ...nonAcademicSlots];
        const subjectIndex = [...new Set(teachingSlots.map(s => s.subject || s.activity).filter(Boolean))];
        const classIndex = [...new Set(teachingSlots.flatMap(s => s.classes ?? []))];

        // Slug generation
        const baseSlug = slugify(name, { lower: true, strict: true });
        let slug = baseSlug;
        let slugCounter = 1;
        while (await Profile.findOne({ slug })) {
            slug = `${baseSlug}-${slugCounter++}`;
        }

        try {
            let finalEmail = email;
            let emailCounter = 1;
            while(await User.findOne({email: finalEmail})) {
                finalEmail = `${id}_${emailCounter++}_${email}`;
            }

            const user = await User.create({
                email: finalEmail,
                passwordHash: genericPasswordHash,
                name: name,
                phone: phone,
                role: typeRaw,
                isVerified: true,
                isActive: true,
            });

            let fullBio = bio;
            if (qualifications) {
                fullBio += `\n\nQualifications: ${qualifications}`;
            }

            const profile = await Profile.create({
                userId: user._id,
                type: finalProfileType,
                displayName: name,
                slug,
                bio: fullBio.trim(),
                teachingSlots,
                _subjectIndex: subjectIndex,
                _classIndex: classIndex,
                location: { type: 'Point', coordinates: [lng, lat] },
                address: {
                    line1: address,
                    town: city,
                    district: city,
                    state: 'West Bengal',
                    pincode: '736121',
                },
                contact: { phone, whatsapp: phone, email: email !== `${id}@dooarstutors.temp` ? email : undefined },
                experience,
                languages: ['Bengali'],
                media: [], // Media left blank as requested
                rating: { average: ratingAvg, count: ratingCount },
                isApproved: true,
                isActive: true,
                isFeatured: false,
            });

            profileMap.set(id, profile._id as mongoose.Types.ObjectId);
            profilesCreated++;
        } catch (e: any) {
            console.error(`Failed to create tutor ${name} (${id}): ${e.message}`);
        }
    }

    console.info(`✅ Created ${profilesCreated} profiles.`);

    // Import Reviews
    // (id, teacher_id, student_name, rating, review_text, created_at, teacher_reply, tutor_verified)
    
    const reviewersMap = new Map();
    
    let reviewsCreated = 0;
    for (const rRow of reviewsRaw) {
        const teacherId = rRow[1];
        const studentName = rRow[2];
        const rating = parseInt(rRow[3]) || 5;
        const text = rRow[4];

        const profileId = profileMap.get(teacherId);
        if (!profileId) continue;

        let reviewerDoc = reviewersMap.get(studentName);
        if (!reviewerDoc) {
            reviewerDoc = await User.create({
                email: `legacy-reviewer-${Math.random().toString(36).substring(7)}@dooarstutors.temp`,
                passwordHash: genericPasswordHash,
                name: studentName,
                role: 'student',
                isVerified: true,
                isActive: true,
            });
            reviewersMap.set(studentName, reviewerDoc);
        }

        try {
            await Review.create({
                profileId,
                reviewerId: reviewerDoc._id,
                rating,
                text: `${text}\n\n- Reviewed by ${studentName}`,
                isVisible: true,
            });
            reviewsCreated++;
        } catch(e) {
            // Ignore dupes if they happen
        }
    }
    
    console.info(`✅ Created ${reviewsCreated} reviews.`);

    // Recalculate ratings
    const profilesToUpdate = await Profile.find();
    for (const profile of profilesToUpdate) {
        const profileReviews = await Review.find({ profileId: profile._id, isVisible: true });
        if (profileReviews.length > 0) {
            const avg = profileReviews.reduce((s, r) => s + r.rating, 0) / profileReviews.length;
            await Profile.findByIdAndUpdate(profile._id, {
                'rating.average': Math.round(avg * 10) / 10,
                'rating.count': profileReviews.length,
            });
        }
    }
    
    console.info(`✅ Recalculated profile ratings.`);
    console.info('===================================================');
    console.info('Migration complete!');
    console.info(`All generic passwords set from environment variable.`);
    console.info('===================================================');

    await mongoose.disconnect();
    process.exit(0);
}

runImport().catch(console.error);
