import { MetadataRoute } from 'next';

const BASE_URL = 'https://dooarstutors.com';

// Comprehensive list of cities/towns in the Dooars & North Bengal region
const LOCATIONS = [
  'alipurduar',
  'siliguri',
  'jalpaiguri',
  'cooch-behar',
  'malbazar',
  'binnaguri',
  'falakata',
  'hasimara',
  'madarihat',
  'birpara',
  'jaigaon',
  'maynaguri',
  'dhupguri',
  'banarhat'
];

// Comprehensive Niches divided by category to pair with relevant local search keywords
const NICHES = {
  academics: {
    subjects: [
      'mathematics', 'maths', 'higher-maths', 'pure-mathematics', 'applied-mathematics',
      'physics', 'chemistry', 'biology', 'life-science', 'physical-science', 'science', 
      'english', 'english-literature', 'functional-english',
      'bengali', 'hindi', 'sanskrit', 'nepali', 'urdu', 'bangla',
      'history', 'geography', 'political-science', 'civics', 'sociology', 'philosophy', 'psychology',
      'computer-science', 'computer-application', 'it', 'information-technology', 
      'economics', 'accountancy', 'business-studies', 'commerce', 'costing-and-taxation',
      'environmental-studies', 'evs', 'nutrition', 'home-science', 'statistics'
    ],
    slugs: [
      'mathematics', 'maths', 'higher-maths', 'pure-math', 'applied-math',
      'physics', 'chemistry', 'biology', 'life-science', 'physical-science', 'science',
      'english', 'english-literature', 'functional-english',
      'bengali', 'hindi', 'sanskrit', 'nepali', 'urdu',
      'history', 'geography', 'political-science', 'civics', 'sociology', 'philosophy', 'psychology',
      'computer-science', 'computer-application', 'it', 'information-technology',
      'economics', 'accountancy', 'business-studies', 'commerce', 'costing',
      'evs', 'nutrition', 'home-science', 'statistics'
    ],
    keywords: [
      'tutors', 'teachers', 'tuition', 'coaching', 'center', 'private-tutor', 
      'home-tuition', 'home-tutor', 'private-tuitions', 'coaching-centre', 'classes'
    ]
  },
  arts_and_culture: {
    subjects: [
      'dance', 'classical-dance', 'kathak', 'bharatanatyam', 'odissi', 'rabindra-nritya',
      'western-dance', 'hip-hop', 'contemporary-dance', 'salsa', 'folk-dance',
      'music', 'classical-music', 'hindustani-classical', 'rabindra-sangeet', 'najrul-geeti', 'modern-bengali-songs',
      'guitar', 'acoustic-guitar', 'electric-guitar', 'keyboard', 'piano', 'harmonium', 'tabla', 'flute', 'violin', 'drums',
      'vocal-music', 'singing', 'western-vocals', 'pop-singing',
      'painting', 'drawing', 'sketching', 'oil-painting', 'water-color', 'acrylic-painting',
      'art', 'fine-arts', 'crafts', 'origami', 'calligraphy', 'sculpture'
    ],
    slugs: [
      'dance', 'classical-dance', 'kathak', 'bharatanatyam', 'odissi', 'rabindra-nritya',
      'western-dance', 'hip-hop', 'contemporary', 'salsa', 'folk-dance',
      'music', 'classical-music', 'hindustani-classical', 'rabindra-sangeet', 'najrul-geeti', 'bengali-songs',
      'guitar', 'acoustic-guitar', 'electric-guitar', 'keyboard', 'piano', 'harmonium', 'tabla', 'flute', 'violin', 'drums',
      'vocal-music', 'singing', 'western-vocals', 'singing-lessons',
      'painting', 'drawing', 'sketching', 'oil-painting', 'water-color', 'acrylic-painting',
      'art', 'fine-arts', 'craft-work', 'origami', 'calligraphy', 'sculpture'
    ],
    keywords: ['classes', 'teachers', 'academy', 'institute', 'school', 'instructors', 'lessons', 'studio']
  },
  fitness_and_sports: {
    subjects: [
      'gym', 'weight-training', 'bodybuilding', 'powerlifting', 'personal-training',
      'yoga', 'hatha-yoga', 'vinyasa-yoga', 'power-yoga', 'meditation', 'pranayama',
      'calisthenics', 'bodyweight-training', 'crossfit', 'aerobics', 'zumba', 'pilates',
      'martial-arts', 'karate', 'taekwondo', 'kickboxing', 'kung-fu', 'judo', 'boxing', 'self-defense',
      'swimming', 'cricket', 'football', 'basketball', 'badminton', 'table-tennis', 'tennis', 'volleyball', 'chess'
    ],
    slugs: [
      'gym', 'weight-training', 'bodybuilding', 'powerlifting', 'personal-trainer',
      'yoga', 'hatha-yoga', 'vinyasa-yoga', 'power-yoga', 'meditation', 'pranayama',
      'calisthenics', 'bodyweight-fitness', 'crossfit', 'aerobics', 'zumba', 'pilates',
      'martial-arts', 'karate', 'taekwondo', 'kickboxing', 'kung-fu', 'judo', 'boxing', 'self-defense',
      'swimming', 'cricket-coaching', 'football-training', 'basketball', 'badminton', 'table-tennis', 'tennis', 'volleyball', 'chess'
    ],
    keywords: ['trainers', 'center', 'club', 'academy', 'classes', 'coaching', 'instructors', 'personal-trainer', 'fitness-center']
  },
  specialized: {
    subjects: [
      'abacus', 'mental-maths', 'vedic-maths', 
      'coding', 'programming', 'python-programming', 'java-programming', 'web-development', 'scratch-coding',
      'spoken-english', 'communication-skills', 'english-speaking', 'personality-development', 'ielts', 'toefl',
      'competitive-exams', 'jee', 'iit-jee', 'neet', 'wbjee', 'olympiad', 'ntse', 'kvpy',
      'wbcs', 'upsc', 'ssc', 'railway-exams', 'bank-po', 'clat', 'primary-tet', 'net', 'set'
    ],
    slugs: [
      'abacus', 'mental-maths', 'vedic-maths',
      'coding', 'programming', 'python', 'java', 'web-development', 'kids-coding',
      'spoken-english', 'communication-skills', 'english-speaking', 'personality-development', 'ielts', 'toefl',
      'competitive-exams', 'jee', 'iit-jee', 'neet', 'wbjee', 'olympiad', 'ntse', 'kvpy',
      'wbcs', 'upsc', 'ssc', 'railway-jobs', 'bank-po', 'clat', 'primary-tet', 'net', 'set'
    ],
    keywords: ['coaching', 'the-institute', 'teacher', 'teachers', 'class', 'classes', 'tutor', 'tutors', 'center', 'centers', 'centre', 'centres', 'institute', 'institutes', 'training-center', 'preparation-classes', 'academy']
  }
};

export default function sitemap(): MetadataRoute.Sitemap {
  const sitemapEntries: MetadataRoute.Sitemap = [
    // Core pages
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    }
  ];

  // Generate all dynamic SEO URLs
  const date = new Date();

  // Iterate over every category
  Object.values(NICHES).forEach((category) => {
    category.subjects.forEach((subject) => {
      category.keywords.forEach((keyword) => {
        LOCATIONS.forEach((location) => {
          // Construct the slug: e.g., physics-tutors-in-alipurduar
          const slug = `${subject}-${keyword}-in-${location}`;
          
          sitemapEntries.push({
            url: `${BASE_URL}/tuition/${slug}`,
            lastModified: date,
            changeFrequency: 'weekly',
            // Assign a slightly lower priority to deep pages so the homepage remains the highest authority
            priority: 0.7, 
          });
        });
      });
    });
  });

  return sitemapEntries;
}
