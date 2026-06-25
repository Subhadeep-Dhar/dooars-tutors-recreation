import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MapPin, BookOpen, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Helper to parse the slug into subject, search keyword, and location
// Expected format: [subject]-[keyword]-in-[location]
function parseSlug(slug: string) {
  // Regex to match various search intents
  const regex = /^(.*?)-(teachers?|tutors?|tuition|tution|coaching|classes|class|trainers?|instructors?|academy|institute|centers?|schools?|training|clubs?)-in-(.*)$/i;
  
  const match = slug.match(regex);
  if (!match) {
    return null;
  }
  
  const subjectSlug = match[1];
  const searchKeyword = match[2];
  const locationSlug = match[3];
  
  // Format the extracted strings for display (e.g., "physics" -> "Physics", "alipurduar" -> "Alipurduar")
  const subject = subjectSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
    
  const location = locationSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Title case for the keyword (e.g., "tuition" -> "Tuition")
  const type = searchKeyword.charAt(0).toUpperCase() + searchKeyword.slice(1);

  return { subject, location, type };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const parsed = parseSlug(resolvedParams.slug);
  
  if (!parsed) {
    return {
      title: 'Tutors & Coaching | Dooars Tutors',
      description: 'Find the best tutors and coaching centers in the Dooars region.'
    };
  }

  const { subject, location, type } = parsed;

  return {
    title: `Best ${subject} ${type} in ${location} | Dooars Tutors`,
    description: `Find the top-rated ${subject} ${type.toLowerCase()}, private tutors, and coaching centers in ${location}. View verified profiles, reviews, and contact them directly on Dooars Tutors.`,
    openGraph: {
      title: `${subject} ${type} in ${location} | Verified Profiles & Reviews`,
      description: `Looking for ${subject} ${type.toLowerCase()} in ${location}? Connect with the best local educators to boost your learning.`,
      url: `https://dooarstutors.com/tuition/${resolvedParams.slug}`,
      siteName: 'Dooars Tutors',
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Best ${subject} ${type} in ${location}`,
      description: `Find top-rated ${subject} ${type.toLowerCase()} and coaching in ${location}.`,
    },
    alternates: {
      canonical: `https://dooarstutors.com/tuition/${resolvedParams.slug}`,
    }
  };
}

export default async function TuitionLandingPage({ params }: PageProps) {
  const resolvedParams = await params;
  const parsed = parseSlug(resolvedParams.slug);

  if (!parsed) {
    notFound();
  }

  const { subject, location, type } = parsed;

  // JSON-LD Structured Data for Local SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: `${subject} ${type} in ${location} | Dooars Tutors`,
    description: `A verified network of ${subject} ${type.toLowerCase()} and educators serving students in ${location}.`,
    areaServed: {
      '@type': 'Place',
      name: location,
    },
    provider: {
      '@type': 'Organization',
      name: 'Dooars Tutors',
      url: 'https://dooarstutors.com',
    },
    makesOffer: {
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: `${subject} ${type}`,
        category: 'Educational Service',
      }
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Inject JSON-LD into the head */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 md:px-8 border-b border-zinc-800" style={{ background: 'var(--bg-base)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-zinc-900/50 text-emerald-400 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-zinc-800">
            <MapPin className="w-4 h-4" />
            <span>Local {type} in {location}</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6" style={{ color: 'var(--text-primary)' }}>
            Best <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">{subject} {type}</span> in {location}
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10" style={{ color: 'var(--text-secondary)' }}>
            Browse verified profiles, read reviews from real students, and contact the top {subject.toLowerCase()} {type.toLowerCase()} in {location} directly.
          </p>
        </div>
      </section>

      {/* Simulated Search Results / Tutors Grid */}
      <section className="py-20 px-4 md:px-8" style={{ background: 'var(--bg-section)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Available {subject} {type}</h2>
            <Link href={`/search?q=${subject}&location=${location}`} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View all results <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 
              This is a UI hint for the tutor cards. 
              In production, you would fetch these from MongoDB.
            */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Top {subject} Profile</h3>
                    <div className="flex items-center text-zinc-400 text-sm gap-1 mb-2">
                      <MapPin className="w-3 h-3" /> {location}
                    </div>
                  </div>
                  <div className="flex items-center bg-zinc-800 px-2 py-1 rounded text-sm text-yellow-400 font-medium">
                    <Star className="w-3 h-3 fill-yellow-400 mr-1" /> 5.0
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-zinc-300 gap-2">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <span>Focuses on {subject}</span>
                  </div>
                </div>

                <div className="h-2 w-full bg-zinc-800 rounded-full mb-4 overflow-hidden">
                  <div className="h-full bg-zinc-700 w-2/3 animate-pulse"></div>
                </div>

                <Link href={`/search?q=${subject}&location=${location}`}>
                  <button className="w-full bg-white text-zinc-950 font-medium py-2.5 rounded-lg hover:bg-zinc-200 transition-colors">
                    View Profile
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
