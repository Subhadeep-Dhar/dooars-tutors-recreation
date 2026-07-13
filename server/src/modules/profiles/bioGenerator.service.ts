/**
 * BioGeneratorService
 *
 * Generates bio text for profiles that have a missing or empty bio.
 * This is INDEPENDENT of the EnrichmentWorker pipeline:
 *   - EnrichmentWorker: crawls provider websites -> enrichedDescription (internal/admin use)
 *   - BioGeneratorService: generates bio field (public-facing) using profile data
 *
 * CRITICAL DESIGN RULES:
 *   1. generateBioIfMissing() is fire-and-forget -- NEVER awaited during profile save.
 *   2. AI call has a 5-second hard timeout. Any failure -> deterministic fallback.
 *   3. bioSource is server-controlled metadata -- never set from client payloads.
 *   4. Never overwrites a bio that was manually authored (user/admin) or explicitly imported.
 *   5. Deterministic fallback always succeeds (pure function, no I/O).
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { IProfileDocument } from '../../models/Profile';
import { Profile } from '../../models';
import { calculateAge, resolveProfileKind } from '@dooars/shared';
import { env } from '../../config/env';

// -- Constants ---------------------------------------------------------------

const AI_TIMEOUT_MS = 5000;

const PROTECTED_BIO_SOURCES = new Set(['user', 'admin']);

/** Category-aware display terms for AI prompts and deterministic templates */
const TYPE_LABELS: Record<string, { provider: string; activity: string; students: string }> = {
  tutor:           { provider: 'tutor',      activity: 'tutoring',  students: 'students'     },
  coaching_center: { provider: 'institute',  activity: 'coaching',  students: 'students'     },
  sports_trainer:  { provider: 'coach',      activity: 'training',  students: 'athletes'     },
  arts_trainer:    { provider: 'instructor', activity: 'training',  students: 'learners'     },
  gym_yoga:        { provider: 'instructor', activity: 'training',  students: 'participants' },
};

// -- Main entry point: fire and forget ---------------------------------------

/**
 * Checks whether the profile needs a bio generated, and if so,
 * generates one asynchronously. Must always be called WITHOUT await.
 *
 * Skips generation when bio is non-empty (of any source).
 * Extra guard: if bio exists and is user/admin authored, logs and returns.
 */
export async function generateBioIfMissing(profile: IProfileDocument): Promise<void> {
  const existingBio = (profile.bio ?? '').trim();

  if (existingBio) {
    if (PROTECTED_BIO_SOURCES.has(profile.bioSource ?? '')) return;
    if (profile.manuallyEditedFields?.includes('bio')) return;
    return; // non-empty bio of any source -- skip
  }

  const newBio = await generateBio(profile);

  try {
    await Profile.updateOne(
      { _id: profile._id },
      {
        $set: {
          bio: newBio.text,
          bioSource: newBio.source,
          bioGeneratedAt: new Date(),
        },
      }
    );
  } catch (err: any) {
    console.warn(`[BioGen] Failed to save bio for profile ${profile._id}:`, err.message);
  }
}

// -- Bio generation with timeout + fallback ----------------------------------

interface GeneratedBio {
  text: string;
  source: 'ai_generated' | 'deterministic';
}

async function generateBio(profile: IProfileDocument): Promise<GeneratedBio> {
  if (!env.GEMINI_API_KEY) {
    return { text: generateDeterministicBio(profile), source: 'deterministic' };
  }

  try {
    const aiText = await Promise.race<string>([
      callGemini(profile),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('BioGen AI timeout after 5000ms')), AI_TIMEOUT_MS)
      ),
    ]);

    const cleaned = (aiText ?? '').trim();
    if (cleaned.length >= 30) {
      return { text: cleaned, source: 'ai_generated' };
    }
    console.warn('[BioGen] AI response too short, using deterministic fallback');
    return { text: generateDeterministicBio(profile), source: 'deterministic' };
  } catch (err: any) {
    console.warn(`[BioGen] AI failed (${err.message}), using deterministic fallback`);
    return { text: generateDeterministicBio(profile), source: 'deterministic' };
  }
}

// -- Gemini call -------------------------------------------------------------

async function callGemini(profile: IProfileDocument): Promise<string> {
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = buildPrompt(profile);
  const result = await model.generateContent(prompt);
  return result.response.text();
}

function buildPrompt(profile: IProfileDocument): string {
  const kind = resolveProfileKind(profile.type, profile.isOrganisation);
  const labels = TYPE_LABELS[profile.type] ?? TYPE_LABELS.tutor;
  const isOrg = kind === 'organisation';

  const contextParts: string[] = [];
  if (profile.experience) contextParts.push(`${profile.experience} years of experience`);
  if (profile.languages?.length) contextParts.push(`communicates in ${profile.languages.join(', ')}`);
  if (profile.address?.town) contextParts.push(`based in ${profile.address.town}`);

  const slots = (profile.teachingSlots ?? []) as any[];
  const activities = slots.map((s: any) => s.subject || s.activity).filter(Boolean);
  if (activities.length) contextParts.push(`specialises in: ${activities.slice(0, 4).join(', ')}`);

  if (profile.dateOfBirth && !isOrg) {
    const age = calculateAge(profile.dateOfBirth);
    if (age > 5 && age < 100) contextParts.push(`aged ${age}`);
  }

  const context = contextParts.join('; ');

  return `Write a compelling, professional, 2-3 sentence biography for a ${labels.provider} named "${profile.displayName}" on an educational discovery platform called Dooars Tutors.
${context ? `Context: ${context}.` : ''}
${profile.tagline ? `Their tagline: "${profile.tagline}".` : ''}
Write in the third person. Focus on expertise, approachability, and why ${labels.students} should choose them. Do not invent qualifications. Keep it under 120 words. Plain text only, no markdown.`;
}

// -- Deterministic fallback: pure function, always succeeds ------------------

/**
 * Generates a simple deterministic bio from available profile data.
 * Guaranteed fallback -- must never throw.
 */
export function generateDeterministicBio(profile: IProfileDocument): string {
  const labels = TYPE_LABELS[profile.type] ?? TYPE_LABELS.tutor;
  const kind = resolveProfileKind(profile.type, profile.isOrganisation);
  const isOrg = kind === 'organisation';
  const parts: string[] = [];
  const name = (profile.displayName ?? '').trim();

  if (isOrg) {
    parts.push(
      `${name} is a ${labels.activity} centre${profile.address?.town ? ` based in ${profile.address.town}` : ''}.`
    );
  } else {
    const expStr = profile.experience ? ` with ${profile.experience} years of experience` : '';
    parts.push(
      `${name} is a ${labels.provider}${expStr}${profile.address?.town ? ` based in ${profile.address.town}` : ''}.`
    );
  }

  const slots = (profile.teachingSlots ?? []) as any[];
  const activities = slots.map((s: any) => s.subject || s.activity).filter(Boolean).slice(0, 3);
  if (activities.length) {
    parts.push(`${isOrg ? 'They offer' : 'They provide'} ${labels.activity} in ${activities.join(', ')}.`);
  }

  if (profile.languages?.length) {
    const langStr = profile.languages.join(' and ');
    const cap = labels.students.charAt(0).toUpperCase() + labels.students.slice(1);
    parts.push(`${cap} can communicate in ${langStr}.`);
  }

  return parts.join(' ');
}

