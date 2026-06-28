import { Metadata } from 'next';
import React from 'react';

// Fetch profile data on the server for SEO
async function getProfileData(slug: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const res = await fetch(`${apiUrl}/profiles/slug/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.profile || null;
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const profile = await getProfileData(resolvedParams.slug);

  if (!profile) {
    return {
      title: 'Profile Not Found | Dooars Tutors',
      description: 'The requested tutor profile could not be found.',
    };
  }

  const name = profile.displayName || 'Tutor';
  const location = profile.address?.town ? ` in ${profile.address.town}` : '';
  const type = profile.type ? profile.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Tutor';
  const subjects = profile.teachingSlots && profile.teachingSlots.length > 0 
    ? profile.teachingSlots.map((s: any) => s.subject || s.activity).filter(Boolean).slice(0, 3).join(', ')
    : '';

  const title = `${name} - ${type}${location} | Dooars Tutors`;
  const description = profile.bio 
    ? profile.bio.substring(0, 160)
    : `${name} is a verified ${type.toLowerCase()}${location}${subjects ? ` teaching ${subjects}` : ''}. View their full profile, contact info, and reviews on Dooars Tutors.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `https://dooarstutors.in/profiles/${resolvedParams.slug}`,
      images: profile.avatar ? [{ url: profile.avatar }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: profile.avatar ? [profile.avatar] : [],
    },
  };
}

export default async function ProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const profile = await getProfileData(resolvedParams.slug);

  let jsonLd: Record<string, any> | null = null;

  if (profile) {
    const name = profile.displayName || 'Tutor';
    const location = profile.address?.town ? profile.address.town : 'Dooars Region';
    
    // Generate JSON-LD Structured Data
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': profile.type === 'coaching_center' ? 'EducationalOrganization' : 'Person',
      name: name,
      url: `https://dooarstutors.in/profiles/${resolvedParams.slug}`,
      image: profile.avatar || undefined,
      description: profile.bio || `Verified profile of ${name} on Dooars Tutors.`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: location,
        addressRegion: 'West Bengal',
        addressCountry: 'IN',
      },
    };

    if (profile.rating && profile.rating.count > 0) {
      jsonLd.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: profile.rating.average,
        reviewCount: profile.rating.count,
        bestRating: '5',
        worstRating: '1',
      };
    }
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
