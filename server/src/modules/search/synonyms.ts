// Each key is a canonical term, values are all synonyms that map TO it
// When user types any synonym, we expand to search for ALL terms in that group

export const SYNONYM_GROUPS: string[][] = [
    // Mathematics
    // ───────────── LANGUAGES ─────────────
    ['english', 'english language', 'spoken english', 'english grammar', 'english literature'],
    ['bengali', 'bangla', 'bengali language'],
    ['hindi', 'hindi language'],
    ['sanskrit'],
    ['urdu'],
    ['nepali'],
    ['second language', 'third language', 'language'],

    // ───────────── PRIMARY (CLASSES 1–5 ALL BOARDS) ─────────────
    ['evs', 'environmental studies', 'environmental science'],
    ['general knowledge', 'gk'],
    ['activity based learning'],
    ['moral science'],

    // ───────────── MATHEMATICS ─────────────
    ['mathematics', 'math', 'maths', 'arithmetic', 'algebra', 'geometry', 'trigonometry', 'calculus', 'mensuration', 'statistics'],

    // ───────────── SCIENCE (GENERAL + SPLIT) ─────────────
    ['science', 'general science'],
    ['physical science', 'physics chemistry'],
    ['life science', 'biology'],
    ['physics'],
    ['chemistry'],
    ['biology', 'botany', 'zoology'],

    // ───────────── SOCIAL SCIENCE ─────────────
    ['social science', 'social studies', 'sst'],
    ['history'],
    ['geography'],
    ['civics'],
    ['political science'],
    ['economics'],

    // ───────────── ARTS (WBCHSE + CBSE + ISC) ─────────────
    ['sociology'],
    ['philosophy'],
    ['education'],
    ['psychology'],
    ['fine arts', 'arts', 'drawing', 'painting'],

    // ───────────── SCIENCE STREAM (CLASS 11–12 ALL BOARDS) ─────────────
    ['physics'],
    ['chemistry'],
    ['mathematics'],
    ['biology'],
    ['computer science'],
    ['computer application', 'computer applications'],
    ['informatics practices'],
    ['statistics'],

    // ───────────── COMMERCE STREAM ─────────────
    ['accountancy', 'accounts', 'accounting'],
    ['business studies', 'bst'],
    ['commerce'],
    ['economics'],
    ['costing', 'costing and taxation', 'taxation'],
    ['business'],
    ['statistics'],

    // ───────────── COMPUTER / TECH ─────────────
    ['computer', 'computer studies', 'computer science', 'it', 'information technology'],
    ['coding', 'programming', 'software'],
    ['web development'],
    ['python', 'java', 'c++'],

    // ───────────── OPTIONAL SUBJECTS (CBSE/ICSE) ─────────────
    ['artificial intelligence', 'ai'],
    ['environmental science'],
    ['computer applications'],

    // ───────────── TUITION / CATEGORY ─────────────
    ['tutor', 'teacher', 'tuition', 'home tuition', 'private tutor', 'coaching', 'trainer', 'instructor', 'sir', 'madam'],
    ['coaching center', 'academy', 'institute', 'training center', 'classes'],

    // ───────────── SPORTS (EXPANDED) ─────────────

    ['sports', 'sports training', 'coach', 'sports coach'],

    ['cricket'],
    ['football', 'soccer'],
    ['badminton'],
    ['tennis'],
    ['table tennis', 'tt'],
    ['volleyball'],
    ['basketball'],
    ['hockey'],
    ['kabaddi'],
    ['athletics', 'running', 'track and field'],
    ['swimming'],
    ['chess'],
    ['carrom'],
    ['archery'],
    ['boxing'],
    ['wrestling'],
    ['weightlifting'],
    ['gymnastics'],
    ['cycling'],
    ['skating'],
    ['martial arts', 'karate', 'taekwondo', 'kung fu', 'self defense'],
    ['zumba', 'dance fitness'],
    ['aerobics'],
];

// Build a flat lookup: any term → all terms in its group
const synonymMap = new Map<string, string[]>();
for (const group of SYNONYM_GROUPS) {
    for (const term of group) {
        synonymMap.set(term.toLowerCase(), group);
    }
}

export function expandQuery(term: string): string[] {
  const lower = term.toLowerCase().trim();
  if (!lower) return [];

  // Exact match first
  const exact = synonymMap.get(lower);
  if (exact) return exact;

  // Partial match — any group containing a term that starts with input OR input starts with term
  const matches = new Set<string>();
  for (const [key, group] of synonymMap.entries()) {
    if (key.startsWith(lower) || lower.startsWith(key)) {
      group.forEach(t => matches.add(t));
    }
  }
  if (matches.size > 0) return Array.from(matches);

  // Last resort — return the raw term so regex still runs against DB
  return [lower];
}

// Class number normalization
export function normalizeClass(input: string): string | null {
    const match = input.match(/(\d{1,2})(st|nd|rd|th)?/i);
    if (match) return `Class ${match[1]}`;

    const words: Record<string, string> = {
        'one': 'Class 1', 'two': 'Class 2', 'three': 'Class 3', 'four': 'Class 4',
        'five': 'Class 5', 'six': 'Class 6', 'seven': 'Class 7', 'eight': 'Class 8',
        'nine': 'Class 9', 'ten': 'Class 10', 'eleven': 'Class 11', 'twelve': 'Class 12',
    };
    return words[input.toLowerCase()] ?? null;
}

// Known towns/areas in Dooars region
const KNOWN_LOCATIONS = [
    'jalpaiguri', 'alipurduar', 'siliguri', 'coochbehar', 'maynaguri',
    'dhupguri', 'mal', 'malbazar', 'nagrakata', 'chalsa', 'matiali',
    'birpara', 'falakata', 'kumargram', 'madarihat', 'hasimara',
    'rajganj', 'kranti', 'banarhat', 'mainaguri', 'nagrakatta',
];

export interface ParsedQuery {
    subjects: string[];       // expanded synonyms
    classes: string[];        // normalized class strings
    location: string | null;
    type: string | null;      // profile type if detected
    rawTerms: string[];       // remaining unclassified terms
    domainType: string | null;
}

const CLASS_PATTERNS = /\b(class\s*\d{1,2}|\d{1,2}(st|nd|rd|th)\s*(class|grade|std)?|grade\s*\d{1,2})\b/gi;
// const TYPE_MAP: Record<string, string> = {
//   tutor: 'tutor', teacher: 'tutor', tuition: 'tutor',
//   coaching: 'coaching_center', institute: 'coaching_center', academy: 'coaching_center', center: 'coaching_center',
//   sports: 'sports_trainer', trainer: 'sports_trainer',
//   gym: 'gym_yoga', fitness: 'gym_yoga', yoga: 'gym_yoga',
//   dance: 'arts_trainer', music: 'arts_trainer', art: 'arts_trainer', arts: 'arts_trainer',
// };
// Domain intent (strong signal)
const DOMAIN_MAP: Record<string, string> = {
    // Sports
    cricket: 'sports_trainer',
    football: 'sports_trainer',
    badminton: 'sports_trainer',
    tennis: 'sports_trainer',
    swimming: 'sports_trainer',
    sports: 'sports_trainer',

    // Fitness
    gym: 'gym_yoga',
    fitness: 'gym_yoga',
    yoga: 'gym_yoga',

    // Arts
    dance: 'arts_trainer',
    music: 'arts_trainer',
    singing: 'arts_trainer',
    art: 'arts_trainer',
    painting: 'arts_trainer',

    // Academics
    math: 'tutor',
    maths: 'tutor',
    science: 'tutor',
    physics: 'tutor',
    chemistry: 'tutor',
    biology: 'tutor',
    english: 'tutor',
};

// Entity words (weak signal)
const ENTITY_MAP: Record<string, string> = {
    tutor: 'tutor',
    teacher: 'tutor',
    tuition: 'tutor',

    coaching: 'coaching_center',
    institute: 'coaching_center',
    academy: 'coaching_center',
    school: 'coaching_center',
    center: 'coaching_center',
};

export function parseQuery(raw: string): ParsedQuery {
    let q = raw.toLowerCase().trim();

    // Remove filler words
    const fillers = ['near me', 'near', 'cheap', 'best', 'good', 'find', 'want', 'need', 'looking for', 'in', 'at', 'for', 'a', 'an', 'the'];
    for (const f of fillers) q = q.replace(new RegExp(`\\b${f}\\b`, 'g'), ' ');

    // Extract class
    const classMatches = q.match(CLASS_PATTERNS) ?? [];
    const classes = classMatches.map(m => {
        const num = m.match(/\d{1,2}/)?.[0];
        return num ? `Class ${num}` : null;
    }).filter(Boolean) as string[];
    q = q.replace(CLASS_PATTERNS, ' ');

    // Extract location
    let location: string | null = null;
    for (const loc of KNOWN_LOCATIONS) {
        if (q.includes(loc)) {
            location = loc;
            q = q.replace(loc, ' ');
            break;
        }
    }

    // Detect profile type
    //   let type: string | null = null;
    //   for (const [keyword, profileType] of Object.entries(TYPE_MAP)) {
    //     if (q.includes(keyword)) {
    //       type = profileType;
    //       // Don't remove — still useful for subject matching
    //       break;
    //     }
    //   }

    let domainType: string | null = null;
    let entityType: string | null = null;

    for (const word of q.split(/\s+/)) {
        if (DOMAIN_MAP[word]) {
            domainType = DOMAIN_MAP[word];
        }
        if (ENTITY_MAP[word]) {
            entityType = ENTITY_MAP[word];
        }
    }

    // 🎯 PRIORITY: domain > entity
    const type = domainType || entityType || null;

    // Tokenize remaining terms
    const tokens = q.split(/\s+/).filter(t => t.length > 1);

    // Expand each token into synonyms
    const subjects: string[] = [];
    const rawTerms: string[] = [];

    for (const token of tokens) {
        const expanded = expandQuery(token);
        if (expanded.length > 1 || synonymMap.has(token)) {
            subjects.push(...expanded);
        } else {
            rawTerms.push(token);
        }
    }

    // Also try multi-word combinations
    const fullPhrase = tokens.join(' ');
    const phraseExpanded = expandQuery(fullPhrase);
    if (phraseExpanded.length > 1) {
        subjects.push(...phraseExpanded);
    }

    return {
        subjects: [...new Set(subjects)],
        classes: [...new Set(classes)],
        location,
        type,
        rawTerms,
        domainType,
    };
}