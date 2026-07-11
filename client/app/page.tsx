'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, BookOpen, Music, Dumbbell, Trophy, Building2, Star, MessageCircle, GraduationCap, Users, Award, TrendingUp, Phone, ArrowRight, Heart, X, CheckCircle2, Shield, Eye, Smartphone, SearchCheck, Mail, AlertTriangle } from 'lucide-react';
import { Map, MapMarker, MarkerContent, MapControls } from '@/components/ui/mapcn-layer-markers';
import api from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import FoundersSection from '@/components/FoundersSection';
import QRCode from 'react-qr-code';
import { LaurelBadge } from '@/components/LaurelWreath';
import { WordRotator } from '@/components/ui/word-rotator';
import { FAQ } from '@/components/ui/faq-tabs';

const categories = [
  { label: 'Private Tutors', value: 'tutor', icon: BookOpen },
  { label: 'Coaching Centers', value: 'coaching_center', icon: Building2 },
  { label: 'Sports', value: 'sports_trainer', icon: Trophy },
  { label: 'Arts & Culture', value: 'arts_trainer', icon: Music },
  { label: 'Gym & Yoga', value: 'gym_yoga', icon: Dumbbell },
];

const typeColors: Record<string, string> = {
  tutor: '#1a73e8',
  coaching_center: '#8b5cf6',
  sports_trainer: '#10b981',
  arts_trainer: '#ec4899',
  gym_yoga: '#f59e0b',
};

// Social Icons as simple SVGs since Lucide removed brand icons
const LinkedinIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const YoutubeIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2.5 7.1C2.5 7.1 2.3 5.4 3.1 4.6 4.1 3.5 5.2 3.5 5.8 3.4 8.5 3.2 12 3.2 12 3.2s3.5 0 6.2.2c.5.1 1.7.1 2.7 1.2.8.8 1 2.5 1 2.5s.2 2 .2 4v2c0 2-.2 4-.2 4s-.2 1.7-1 2.5c-1 1.1-2.4 1-3 1.1-3 .3-6.2.3-6.2.3s-3.5 0-6.2-.2c-.6-.1-1.7-.1-2.7-1.2-.8-.8-1-2.5-1-2.5s-.2-2-.2-4v-2c0-2 .2-4 .2-4z" />
    <polygon points="9.5,15.5 9.5,8.5 16.5,12" />
  </svg>
);

const XIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
  </svg>
);

const FLOATING_TAGS = [
  // Top Left Quadrant
  { text: 'Guitar', top: '12%', left: '8%', anim: 1, delay: '0s', major: true },
  { text: 'Chemistry', top: '18%', left: '25%', anim: 3, delay: '-2s', major: false },
  { text: 'Computer', top: '8%', left: '40%', anim: 1, delay: '-3s', major: true },
  
  // Top Right Quadrant
  { text: 'Coding', top: '15%', left: '60%', mobileLeft: '55%', anim: 2, delay: '-4s', major: true },
  { text: 'Yoga', top: '10%', left: '85%', mobileLeft: '75%', anim: 3, delay: '-5s', major: true },
  { text: 'English', top: '25%', left: '75%', mobileLeft: '65%', anim: 2, delay: '-1s', major: true },
  
  // Middle Left Quadrant
  { text: 'Skating', top: '45%', left: '5%', anim: 1, delay: '-6s', major: false },
  { text: 'Art', top: '38%', left: '20%', anim: 2, delay: '-3s', major: true },
  { text: 'Abacus', top: '55%', left: '15%', anim: 2, delay: '-7s', major: false },
  { text: 'Spoken English', top: '40%', left: '35%', anim: 1, delay: '-4s', major: false },

  // Middle Right Quadrant
  { text: 'History', top: '35%', left: '85%', anim: 2, delay: '-5s', major: false },
  { text: 'Education', top: '48%', left: '65%', mobileLeft: '55%', anim: 3, delay: '-2s', major: true },
  { text: 'Maths', top: '55%', left: '90%', mobileLeft: '15%', anim: 2, delay: '0s', major: true },
  { text: 'Gym', top: '42%', left: '50%', anim: 2, delay: '-6s', major: false },

  // Bottom Left Quadrant
  { text: 'Physics', top: '75%', left: '10%', mobileLeft: '15%', anim: 2, delay: '-2s', major: true },
  { text: 'Biology', top: '85%', left: '25%', anim: 1, delay: '-5s', major: false },
  { text: 'Geography', top: '68%', left: '30%', anim: 3, delay: '-1s', major: true },
  { text: 'Dance', top: '90%', left: '8%', mobileLeft: '20%', anim: 3, delay: '-3s', major: true },
  
  // Bottom Right Quadrant
  { text: 'Football', top: '75%', left: '80%', mobileLeft: '60%', anim: 1, delay: '-1s', major: true },
  { text: 'Cricket', top: '85%', left: '55%', anim: 1, delay: '-1s', major: false },
  { text: 'WBCS', top: '70%', left: '45%', anim: 1, delay: '-7s', major: false },
  { text: 'Music', top: '88%', left: '70%', anim: 3, delay: '-8s', major: false },
  { text: 'Bengali', top: '82%', left: '92%', mobileLeft: '70%', anim: 3, delay: '-4s', major: true },
  
  // Center-ish but safe
  { text: 'Badminton', top: '60%', left: '55%', anim: 1, delay: '-6s', major: false },
  { text: 'Martial Arts', top: '92%', left: '42%', anim: 3, delay: '-2s', major: false },
];

const FUN_FACTS = [
  <>Fun fact: Hover over <strong>Welcome</strong> to see other languages!</>,
  <>Tip: You can change the language from the top right menu!</>,
  <>Did you know? You can search for specific subjects like "Physics" or "Guitar"!</>,
  <>Tip: Read reviews from past students to make a safe choice.</>,
  <>Fun fact: We charge <strong>zero commission</strong>. All contact is completely direct!</>,
  <>Tip: Found a great tutor? Don't forget to leave them a shining review.</>,
  <>Did you know? This is not just an ordinary platform, it is introducing world class technologies into Dooars!</>,
  <>Tip: You can contact tutors instantly via WhatsApp using the buttons on their profile.</>,
  <>Fun fact: The floating tags in the background represent subjects taught by our community!</>,
  <>Tip: Are you an educator? Click <strong>Join as Tutor</strong> to create your free profile.</>,
  <>Fun fact: Dooars Tutors is built by locals, for locals!</>,
  <>Tip: You can switch between Light and Dark mode from the top right menu.</>,
  <>Did you know? Our platform is completely free for students to use.</>,
  <>Tip: You can use the map view to find tutors nearest to your home!</>,
  <>Fun fact: We verify all tutor profiles manually to ensure a safe learning environment.</>,
  <>Tip: You can filter search results by location to find educators in your specific town.</>,
  <>Fun fact: Dooars refers to the floodplains and foothills of the eastern Himalayas—a region rich in culture and education!</>,
  <>Did you know? We support multiple categories including Academics, Sports, Arts, and Fitness!</>,
  <>Tip: Check a tutor's profile to see if they offer home tuition or strictly center-based coaching.</>,
  <>Fun fact: We don't hide phone numbers behind a paywall. Transparency is our core value.</>,
  <>Tip: Found a bug or have a suggestion? Use the feedback links at the bottom to contact the founders directly.</>,
  <>Did you know? The platform is optimized to work beautifully on both mobile phones and desktop computers.</>,
  <>Tip: Look for the <strong>Tutor of the Year</strong> and <strong>Top Rated</strong> badges to find exceptional educators.</>,
  <>Fun fact: The name "Dooars" comes from the word "doors", as the region is the historical gateway to Bhutan.</>,
  <>Tip: Tutors can list their exact teaching slots, making it easy to see if their schedule matches yours.</>,
  <>Did you know? You can easily share a tutor's profile with friends using the URL in your browser.</>,
  <>Tip: Look for detailed bios on tutor profiles to understand their teaching philosophy.</>,
  <>Fun fact: Our team is continuously adding new features based on community feedback.</>,
  <>Tip: Looking for dance or music classes? Browse the <strong>Arts & Culture</strong> category!</>,
  <>Did you know? By using this platform, you are supporting a 100% locally built tech initiative.</>,
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [isGreetingHovered, setIsGreetingHovered] = useState(false);
  const [greetingIdx, setGreetingIdx] = useState(0);
  const [activeFact, setActiveFact] = useState<React.ReactNode | null>(null);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [liveVisits, setLiveVisits] = useState(0);
  const [uniqueDistricts, setUniqueDistricts] = useState(0);
  const [totalTutors, setTotalTutors] = useState(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    // Calculate mouse position relative to center of screen, normalized between -1 and 1
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    setMousePos({ x, y });
  };

  const greetings = [
    'Welcome',       // English
    'नमस्ते',        // Hindi / Nepali (Widely spoken across Dooars)
    'স্বাগতম',       // Bengali (Major language of North Bengal)
    'নমস্কাৰ',       // Assamese (Spoken in the Eastern Dooars belt)
    'ᱡᱚᱦᱟᱨ',        // Santhali (Adivasi/Tea-tribe community)
    'जोहार',        // Sadri / Nagpuri (The primary lingua franca of Dooars tea gardens)
    // 'ᱡᱚᱦᱟᱨ ᱜᱮ',      // Kurukh / Oraon (Major Adivasi language in the region)
    // 'खोंलुमबाय',     // Bodo (Spoken heavily in Assam-Dooars border areas)
    // 'फय्‍लाफि',      // Toto (An ultra-rare, indigenous language unique to Totopara, Dooars)
    // 'गोजोनजों बरायबाय' // Mech / Rava greetings (Indigenous groups of the plains)
  ];

  useEffect(() => {
    let interval: any;
    if (isGreetingHovered) {
      // Fast shuffle on hover
      interval = setInterval(() => {
        setGreetingIdx(p => (p + 1) % greetings.length);
      }, 500); 
    } else {
      // Reset to "Welcome" when not hovered
      setGreetingIdx(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGreetingHovered]);

  useEffect(() => {
    const hasSeenLoader = typeof window !== 'undefined' && sessionStorage.getItem('hasSeenLoader');
    let timeoutId: NodeJS.Timeout;

    const showRandomFact = () => {
      const randomFact = FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)];
      setActiveFact(randomFact);

      timeoutId = setTimeout(() => {
        setActiveFact(null);
        scheduleNextFact();
      }, 7000);
    };

    const scheduleNextFact = (initialDelay = false) => {
      // Show first fact faster (either 3s or 9.3s depending on loader)
      // Subsequent facts appear randomly between 15s to 35s
      const delay = initialDelay 
        ? (hasSeenLoader ? 3000 : 9300) 
        : Math.floor(Math.random() * 20000) + 15000;
      
      timeoutId = setTimeout(() => {
        showRandomFact();
      }, delay);
    };

    scheduleNextFact(true);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const [allProfiles, setAllProfiles] = useState<any[]>([]);

  const highlightedTutors = useMemo(() => {
    if (!allProfiles || allProfiles.length === 0) return [];
    
    // Sort by Bayesian score (Top Rated / Tutor of the Year)
    const topRatedList = [...allProfiles].sort((a, b) => (b.rating?.score || b.rating?.average || 0) - (a.rating?.score || a.rating?.average || 0));
    // Sort by review count (Most Reviewed)
    const mostReviewedList = [...allProfiles].sort((a, b) => (b.rating?.count || 0) - (a.rating?.count || 0));

    let tutorOfYear = topRatedList[0];
    let mostRev = mostReviewedList.find(p => p._id !== tutorOfYear?._id) || mostReviewedList[1];
    let topRat = topRatedList.find(p => p._id !== tutorOfYear?._id && p._id !== mostRev?._id) || topRatedList[2];

    const result = [];
    if (tutorOfYear) result.push({ 
      profile: tutorOfYear, badge: 'Tutor of the Year', color: '#d97706', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)',
      laurelTitle: 'TUTOR OF THE YEAR', laurelDesc: 'For outstanding teaching and dedication to student success.' 
    });
    if (mostRev) result.push({ 
      profile: mostRev, badge: 'Most Reviewed', color: '#2563eb', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)',
      laurelTitle: 'MOST REVIEWED TUTOR', laurelDesc: 'For receiving the most reviews and building trust in the community.' 
    });
    if (topRat) result.push({ 
      profile: topRat, badge: 'Top Rated', color: '#059669', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)',
      laurelTitle: 'TOP RATED TUTOR', laurelDesc: 'For achieving the highest ratings from students.' 
    });

    return result.filter(r => r.profile);
  }, [allProfiles]);

  useEffect(() => {
    // Fetch and optionally increment universal visit counter
    const fetchVisits = async () => {
      try {
        const hasVisited = sessionStorage.getItem('dooars_global_visit_counted');
        let res;
        if (hasVisited) {
          res = await api.get('/stats/visits');
        } else {
          res = await api.post('/stats/visits/increment');
        }
        
        if (res.data?.data?.totalVisits) {
          setLiveVisits(res.data.data.totalVisits);
          if (!hasVisited) {
            sessionStorage.setItem('dooars_global_visit_counted', 'true');
          }
        }
      } catch (err) {
        console.error('Failed to fetch platform stats', err);
      }
    };
    fetchVisits();
  }, []);

  useEffect(() => {
    api.get('/search?limit=1000').then(r => {
      const p = r.data.data;
      setAllProfiles(p);
      if (p && Array.isArray(p)) {
        setTotalTutors(p.length);
        const districts = new Set(p.map((item: any) => item.address?.district).filter(Boolean));
        setUniqueDistricts(districts.size);
        
        // Re-trigger scroll if there's a hash since dynamic content might have shifted the layout
        setTimeout(() => {
          if (window.location.hash) {
            const el = document.getElementById(window.location.hash.slice(1));
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    }).catch(() => {});
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (query) p.set('q', query);
    if (location) p.set('location', location);
    router.push(`/search?${p.toString()}`);
  }

  const validProfiles = allProfiles.filter(p => p.location?.coordinates?.length === 2);
  // Using a fixed center to properly frame Alipurduar (top) and Cooch Behar (bottom)
  const center = { lat: 26.43, lng: 89.49 };

  return (
    <main style={{ background: 'var(--bg-base)' }}>

      {/* ── Hero ── */}
      <section 
        onMouseMove={handleMouseMove}
        style={{ background: 'var(--bg-base)', paddingTop: '5rem', paddingBottom: '5rem', position: 'relative', overflow: 'hidden' }}
      >
        
        {/* Floating Background Tags with Fade-out Mask */}
        <div className="absolute inset-0 pointer-events-none select-none" style={{ 
          zIndex: 0,
          maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 95%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 95%)'
        }}>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes float-roam-1 { 0% { transform: translate(0, 0) rotate(0deg); } 33% { transform: translate(20px, -30px) rotate(5deg); } 66% { transform: translate(-15px, 20px) rotate(-3deg); } 100% { transform: translate(0, 0) rotate(0deg); } }
            @keyframes float-roam-2 { 0% { transform: translate(0, 0) rotate(0deg); } 33% { transform: translate(-25px, 25px) rotate(-5deg); } 66% { transform: translate(20px, -15px) rotate(3deg); } 100% { transform: translate(0, 0) rotate(0deg); } }
            @keyframes float-roam-3 { 0% { transform: translate(0, 0) rotate(0deg); } 33% { transform: translate(30px, 15px) rotate(8deg); } 66% { transform: translate(-20px, -25px) rotate(-4deg); } 100% { transform: translate(0, 0) rotate(0deg); } }
            .floating-tag-wrapper {
              position: absolute;
              left: var(--mobile-left);
            }
            @media (min-width: 768px) {
              .floating-tag-wrapper {
                left: var(--desktop-left);
              }
            }
            .floating-tag {
              padding: 0.5rem 1rem;
              background: var(--bg-card);
              border: 1px solid var(--border);
              border-radius: 9999px;
              color: var(--text-secondary);
              font-size: 0.875rem;
              font-weight: 500;
              opacity: 0.6;
              box-shadow: 0 4px 15px rgba(0,0,0,0.05);
              white-space: nowrap;
            }
          `}} />
          
          {FLOATING_TAGS.map((tag: any, i) => {
            // Calculate parallax distance based on anim index to give depth (some move more than others)
            const parallaxX = mousePos.x * (tag.anim * -15);
            const parallaxY = mousePos.y * (tag.anim * -15);
            
            return (
              <div 
                key={i} 
                className={`floating-tag-wrapper transition-transform duration-300 ease-out ${!tag.major ? 'hidden md:block' : ''}`}
                style={{
                  top: tag.top,
                  '--desktop-left': tag.left,
                  '--mobile-left': tag.mobileLeft || tag.left,
                  transform: `translate(${parallaxX}px, ${parallaxY}px)`
                } as any}
              >
                <div 
                  className="floating-tag" 
                  style={{ 
                    animation: `float-roam-${tag.anim} ${10 + tag.anim * 2}s ease-in-out infinite`,
                    animationDelay: tag.delay 
                  }}
                >
                  {tag.text}
                </div>
              </div>
            );
          })}
        </div>

        <div className="max-w-5xl mx-auto px-4 text-center relative" style={{ zIndex: 10 }}>
          <div 
            className="mb-4 flex items-center justify-center"
            onMouseEnter={() => setIsGreetingHovered(true)}
            onMouseLeave={() => setIsGreetingHovered(false)}
            style={{ cursor: 'default' }}
          >
            <span style={{
              color: 'var(--text-primary)', fontWeight: 'normal',
              fontSize: 'clamp(1.1rem, 4vw, 1.4rem)',
              letterSpacing: '0.02em',
              transition: 'opacity 0.1s ease',
              minWidth: '150px', // Prevents layout shifting during fast shuffle
              display: 'inline-block'
            }}>
              {greetings[greetingIdx]}
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 6vw, 4.5rem)',
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            marginBottom: '1.25rem',
          }}>
            <span style={{ whiteSpace: 'nowrap' }}>
              Find the Best <WordRotator words={['Tutors', 'Trainers', 'Coaches', 'Mentors', 'Centers']} className="text-[var(--color-brand)]" />
            </span>
            <br />
            in Dooars
          </h1>
          <p style={{
            fontSize: '18px',
            lineHeight: 1.5,
            color: 'var(--text-secondary)',
            maxWidth: '560px',
            margin: '0 auto 2.5rem',
          }}>
            Connect with verified tutors, coaching centers, sports trainers, and more — right in your area.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch}
            className="max-w-2xl mx-auto"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-buttons)',
              padding: '0.375rem',
              display: 'flex',
              flexDirection: 'row',
              gap: '0.25rem',
              boxShadow: 'var(--shadow-md)',
            }}>
            <div className="flex items-center gap-3 flex-1 px-4 py-2">
              <Search size={16} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
              <input
                placeholder="Subject, activity, or name..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="input-base border-0 p-0 text-sm"
                style={{ background: 'transparent', boxShadow: 'none' }}
              />
            </div>
            <div className="hidden md:flex items-center gap-3 flex-1 px-4 py-2" style={{ borderLeft: '1px solid var(--border)' }}>
              <MapPin size={16} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
              <input
                placeholder="Town or area..."
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="input-base border-0 p-0 text-sm"
                style={{ background: 'transparent', boxShadow: 'none' }}
              />
            </div>
            <button type="submit" className="btn-primary px-6 py-2.5 text-sm shrink-0">
              Search
            </button>
          </form>
        </div>

        {/* Seamless transition gradient to next section */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none" 
          style={{ 
            background: 'linear-gradient(to bottom, transparent, var(--bg-section))',
            zIndex: 5 
          }} 
        />
      </section>

      {/* ── Categories ── */}
      <section id="categories" style={{ background: 'var(--bg-section)', padding: 'var(--section-gap) 1rem' }}>
        <div className="max-w-[1200px] mx-auto">
          <p className="eyebrow text-center mb-2">CATEGORIES</p>
          <h2 style={{
            fontSize: 'var(--text-display)',
            fontWeight: 700,
            lineHeight: 'var(--leading-display)',
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            textAlign: 'center',
            marginBottom: '0.5rem',
          }}>Browse by Category</h2>
          <p className="text-center text-sm mb-10" style={{ color: 'var(--text-secondary)' }}>Find the right expert for your needs</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map(({ label, value, icon: Icon }) => (
              <button key={value} onClick={() => router.push(`/search?type=${value}`)}
                className="group flex flex-col items-center gap-3 p-6 transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-cards)',
                }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200"
                  style={{ background: 'var(--color-brand-light)' }}>
                  <Icon size={22} style={{ color: 'var(--color-brand)' }} />
                </div>
                <span className="text-sm font-medium text-center leading-tight" style={{ color: 'var(--text-primary)' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dynamic Stats ── */}
      <section style={{ background: 'var(--bg-base)', padding: 'var(--section-gap) 1rem' }}>
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: totalTutors > 0 ? totalTutors : '-', label: 'Verified Tutors & Centers', icon: Users },
            { value: uniqueDistricts > 0 ? `${uniqueDistricts} Districts` : '-', label: 'Operating Area', icon: MapPin },
            { value: liveVisits > 0 ? `${liveVisits.toLocaleString()}+` : '-', label: 'Total Visits', icon: Eye },
            { value: '100% Safe', label: 'Admin Verified', icon: Shield },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <Icon size={24} style={{ color: 'var(--color-brand)' }} />
              <div style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
              }}>{value}</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How We Work / Workflow ── */}
      <section style={{ background: 'var(--bg-section)', padding: 'var(--section-gap) 1rem' }}>
        <div className="max-w-[1200px] mx-auto text-center">
          <p className="eyebrow mb-2">HOW IT WORKS</p>
          <h2 style={{ fontSize: 'var(--text-display)', lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: 700, color: 'var(--text-primary)' }} className="mb-12">
            3 Simple Steps to Start Learning
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting lines for desktop */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px]" style={{ background: 'linear-gradient(to right, transparent, var(--border), transparent)' }} />
            
            <div className="flex flex-col items-center relative z-10">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <SearchCheck size={32} style={{ color: 'var(--color-brand)' }} />
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>1. Search Local</h3>
              <p className="text-sm px-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Find tutors, coaching centers, and trainers operating directly in your specific area or district.</p>
            </div>

            <div className="flex flex-col items-center relative z-10">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <Star size={32} style={{ color: 'var(--color-brand)' }} />
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>2. Review Profiles</h3>
              <p className="text-sm px-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Check their qualifications, subjects, and read verified reviews from actual past students to make a safe choice.</p>
            </div>

            <div className="flex flex-col items-center relative z-10">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <Smartphone size={32} style={{ color: 'var(--color-brand)' }} />
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>3. Contact Directly</h3>
              <p className="text-sm px-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Call or WhatsApp them instantly. No paywalls, no hidden fees, and zero middleman commissions.</p>
            </div>
          </div>
        </div>
      </section>

      

      {/* ── Featured ── */}
      {/* ── Community Highlights ── */}
      <div id="highlights" className="scroll-mt-24" />
      {highlightedTutors.length > 0 && (
        <section style={{ background: 'var(--bg-section)', padding: 'var(--section-gap) 1rem' }}>
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="eyebrow mb-1">PLATFORM HIGHLIGHTS</p>
                <h2 style={{ fontSize: 'var(--text-display)', lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: 700, color: 'var(--text-primary)' }}>Community Favorites</h2>
              </div>
              <Link href="/search">
                <button className="btn-ghost text-sm px-4 py-2 flex items-center gap-1.5">
                  View all <ArrowRight size={14} />
                </button>
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {highlightedTutors.map(({ profile, badge, color, bg, border, laurelTitle, laurelDesc }) => (
                <div key={profile._id} className="flex flex-col h-full">
                  <div className="card-base p-6 relative overflow-hidden flex flex-col flex-1" style={{ border: `1px solid ${border}` }}>
                    <div className="absolute top-0 right-0 left-0 h-1" style={{ backgroundColor: color }} />
                    
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full text-xs font-bold" style={{ backgroundColor: bg, color: color }}>
                      {badge === 'Tutor of the Year' ? <Trophy size={14}/> : badge === 'Most Reviewed' ? <MessageCircle size={14}/> : <Star size={14}/>}
                      {badge}
                    </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                      style={{ backgroundColor: color }}>
                      {profile.displayName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[1.1rem] truncate" style={{ color: 'var(--text-primary)' }}>{profile.displayName}</p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{profile.address?.town}</p>
                    </div>
                    {profile.rating?.count > 0 && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{profile.rating.average}</span>
                      </div>
                    )}
                  </div>
                  {profile.tagline && <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{profile.tagline}</p>}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {profile.teachingSlots?.slice(0, 2).map((slot: any, i: number) => (
                      <span key={i} className="text-sm px-3 py-1" style={{
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-tags)',
                      }}>
                        {slot.subject || slot.activity}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    {profile.contact?.whatsapp && (
                      <a href={`https://wa.me/91${profile.contact.whatsapp}`} target="_blank" rel="noreferrer" className="flex-1">
                        <button className="btn-secondary w-full text-xs py-2 gap-1 flex items-center justify-center">
                          <MessageCircle size={12} /> WhatsApp
                        </button>
                      </a>
                    )}
                    <Link href={`/profiles/${profile.slug}`} className="flex-1">
                      <button className="btn-primary w-full text-xs py-2">View</button>
                    </Link>
                  </div>
                </div>
                
                <div className="hidden md:block">
                  <LaurelBadge title={laurelTitle} description={laurelDesc} color={color} />
                </div>
              </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Transparency Manifesto ── */}
      <section style={{ background: 'var(--bg-base)', padding: 'var(--section-gap) 1rem' }}>
        <div className="max-w-[1000px] mx-auto">
          <div className="card-base p-8 md:p-12" style={{ border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
            <div className="absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none" style={{ background: 'radial-gradient(circle, var(--color-brand) 0%, transparent 70%)' }} />
            
            <div className="text-center mb-10">
              <Shield size={40} className="mx-auto mb-4" style={{ color: 'var(--color-brand)' }} />
              <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Our Promise of Transparency</h2>
              <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Dooars Tutors is a new initiative built specifically for the Dooars region to support local students and dedicated educators.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-6 rounded-2xl" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-500">
                  <CheckCircle2 size={24} /> What We Do
                </h3>
                <ul className="space-y-3" style={{ color: 'var(--text-secondary)' }}>
                  <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">•</span> Verify local tutors and coaching centers.</li>
                  <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">•</span> Provide a free, open search directory for students.</li>
                  <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">•</span> Allow students to leave authentic ratings and reviews.</li>
                  <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">•</span> Promote quality education in the Dooars region.</li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-500">
                  <X size={24} /> What We Don't Do
                </h3>
                <ul className="space-y-3" style={{ color: 'var(--text-secondary)' }}>
                  <li className="flex items-start gap-2"><span className="text-red-500 mt-1">•</span> We DO NOT take any commission from tutors or students.</li>
                  <li className="flex items-start gap-2"><span className="text-red-500 mt-1">•</span> We DO NOT act as middlemen or brokers.</li>
                  <li className="flex items-start gap-2"><span className="text-red-500 mt-1">•</span> We DO NOT hide contact information behind paywalls.</li>
                  <li className="flex items-start gap-2"><span className="text-red-500 mt-1">•</span> We DO NOT allow fake or unverified profiles.</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-12 text-center pt-8" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-sm font-semibold mb-4 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Help Us Improve</p>
              <h4 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Share your feedback directly with the founder</h4>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="https://wa.me/919083009315" target="_blank" rel="noreferrer">
                  <button className="btn-primary flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#1DA851] text-white border-none">
                    <MessageCircle size={18} /> Review on WhatsApp
                  </button>
                </a>
                <a href="mailto:subhadeepdhar563@gmail.com">
                  <button className="btn-secondary flex items-center gap-2 px-6 py-3">
                    <Mail size={18} /> Email Feedback
                  </button>
                </a>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* ── Community Map ── */}
      <section style={{ background: 'var(--bg-base)', padding: 'var(--section-gap) 1rem' }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-8">
            <p className="eyebrow mb-2">COMMUNITY</p>
            <h2 style={{ fontSize: 'var(--text-display)', lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Our Community Across Dooars</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Tutors and trainers spread across the region</p>
          </div>
          <div style={{ height: '420px', border: '1px solid var(--border)', borderRadius: 'var(--radius-cards)', overflow: 'hidden' }}>
            <Map viewport={{ center: [center.lng, center.lat], zoom: 10 }}>
              {validProfiles.map(p => (
                <MapMarker
                  key={p._id}
                  longitude={p.location.coordinates[0]}
                  latitude={p.location.coordinates[1]}
                  onClick={() => router.push(`/profiles/${p.slug}`)}
                >
                  <MarkerContent>
                    <div 
                      className="relative w-4 h-4 rounded-full border-2 border-white shadow-md transition-transform hover:scale-125"
                      style={{ backgroundColor: typeColors[p.type] ?? '#1a73e8' }} 
                    />
                  </MarkerContent>
                </MapMarker>
              ))}
              <MapControls position="bottom-right" showZoom />
            </Map>
          </div>
          <div className="flex flex-wrap gap-4 justify-center mt-4">
            {Object.entries(typeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                {type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" style={{ background: 'var(--bg-section)', padding: 'var(--section-gap) 1rem' }}>
        <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="eyebrow mb-2">WHY US</p>
            <h2 style={{ fontSize: 'clamp(2.4rem, 7vw, 3.5rem)', letterSpacing: '-0.02em', fontWeight: 700, lineHeight: '1.05', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Why Choose Dooars Tutors
            </h2>
            <p style={{ lineHeight: 1.7, marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>
              A local initiative connecting students with the best tutors, coaches, and trainers across the Dooars region of West Bengal.
            </p>
            <p style={{ lineHeight: 1.7, marginBottom: '2rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>
              Whether you need help with academics, want to learn a sport, explore arts and culture, or stay fit — we have verified professionals ready to guide you.
            </p>
            <div className="flex gap-3">
              <Link href="/search"><button className="btn-primary text-sm px-6 py-2.5">Find a Tutor</button></Link>
              <Link href="/register"><button className="btn-ghost text-sm px-6 py-2.5">Join as Tutor</button></Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: TrendingUp, title: 'Verified Profiles', desc: 'All tutors go through admin verification before appearing in search.' },
              { icon: MapPin, title: 'Hyper Local', desc: 'Focused exclusively on the Dooars region.' },
              { icon: Star, title: 'Rated & Reviewed', desc: 'Real reviews from real students help you choose confidently.' },
              { icon: Phone, title: 'Direct Contact', desc: 'Connect via WhatsApp or phone — no middlemen.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-cards)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
              }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: 'var(--color-brand-light)' }}>
                  <Icon size={18} style={{ color: 'var(--color-brand)' }} />
                </div>
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Founders ── */}
      <FoundersSection />

      {/* ── Public Directory Disclaimer ── */}
      <section style={{ background: 'var(--bg-section)', padding: 'var(--section-gap) 1rem' }}>
        <div className="max-w-[1000px] mx-auto">
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Subtle background accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            
            <div className="flex flex-col md:flex-row gap-6 relative z-10">
              <div className="shrink-0 flex justify-center md:justify-start">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <AlertTriangle size={32} />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Platform Disclaimer & Safety Notice
                </h2>
                <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
                  Dooars Tutors serves exclusively as a free public directory. We function as a digital platform connecting the Dooars tutors' and trainers' community.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <h3 className="font-bold flex items-center gap-2 mb-2" style={{ color: 'var(--text-primary)' }}>
                      <MessageCircle size={16} className="text-amber-500" /> Independent Engagements
                    </h3>
                    <p style={{ color: 'var(--text-secondary)' }} className="leading-relaxed">
                      We do not employ, evaluate, or manage the educators listed on this platform. All engagements are established independently between parents, students and tutors.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold flex items-center gap-2 mb-2" style={{ color: 'var(--text-primary)' }}>
                      <Eye size={16} className="text-amber-500" /> Profile Verification
                    </h3>
                    <p style={{ color: 'var(--text-secondary)' }} className="leading-relaxed">
                      While our team verifies basic profile information to ensure platform safety, we do not independently authenticate physical addresses, academic degrees, or professional credentials.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold flex items-center gap-2 mb-2" style={{ color: 'var(--text-primary)' }}>
                      <Shield size={16} className="text-amber-500" /> User Diligence
                    </h3>
                    <p style={{ color: 'var(--text-secondary)' }} className="leading-relaxed">
                      We strongly encourage all users to exercise due diligence. Please independently verify identities, qualifications, and references before finalizing any arrangements.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold flex items-center gap-2 mb-2" style={{ color: 'var(--text-primary)' }}>
                      <CheckCircle2 size={16} className="text-amber-500" /> Zero Financial Involvement
                    </h3>
                    <p style={{ color: 'var(--text-secondary)' }} className="leading-relaxed">
                      Our platform is completely free to use. We do not process payments, charge commissions, or act as an intermediary for any financial transactions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Frequently Asked Questions ── */}
      <FAQ 
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about how Dooars Tutors works."
        categories={{
          "general": "General",
          "students": "For Students & Parents",
          "tutors": "For Tutors",
          "safety": "Trust & Safety"
        }}
        faqData={{
          "general": [
            {
              question: "Are you a tuition agency?",
              answer: "No. We serve strictly as a free digital directory for the Dooars region. We do not employ tutors, arrange classes, or act as middlemen."
            },
            {
              question: "Are there any hidden fees or commissions?",
              answer: "Our platform is 100% free. Parents can browse and contact educators at no cost, and we take zero commission from tutors. All financial arrangements are made directly between you and the educator."
            },
            {
              question: "Which regions do you currently serve?",
              answer: "Our directory is focused exclusively on the Dooars region and its surrounding foothills, including major hubs like Jalpaiguri, Alipurduar, Malbazar, and Siliguri."
            },
            {
              question: "Is this platform available as a mobile app?",
              answer: "Currently, Dooars Tutors is a progressive web app. You do not need to download anything from an app store. It is fully optimized to work seamlessly directly from your mobile browser."
            },
            {
              question: "How does the platform make money if it is free?",
              answer: "Dooars Tutors operates as a community-first initiative. We cover server costs through voluntary donations from users who wish to support local tech development. We do not place paywalls on educational access."
            }
          ],
          "students": [
            {
              question: "Do I need an account to find a tutor?",
              answer: "No registration is required for students or parents. You can freely browse profiles, search your area, and contact educators directly using the provided phone numbers."
            },
            {
              question: "How do I contact an educator?",
              answer: "Simply navigate to a tutor's profile and click the Phone or WhatsApp button to reach out to them directly. There are no chat portals or delayed messaging systems in the middle."
            },
            {
              question: "Can I filter tutors by location and subject?",
              answer: "Yes! Use the search bar or the advanced filters on the 'Browse' page to narrow down results by specific towns, subjects, or teaching modes."
            },
            {
              question: "Do the tutors teach at home or at a coaching center?",
              answer: "It depends on the educator. Check the tags on a tutor's profile to see if they offer Home Tuition (traveling to your house), Center Coaching, or Online Classes."
            },
            {
              question: "How can I review a tutor I studied with?",
              answer: "Visit their profile and click on 'Write a Review'. Leaving honest feedback helps other parents and students make informed, safe choices."
            }
          ],
          "tutors": [
            {
              question: "How do I list my teaching services?",
              answer: "Simply click \"Register\" at the top of the page. You can create a profile by providing your contact details, subjects taught, and location. Your listing will be visible to the community instantly."
            },
            {
              question: "Do I need to pay to create a profile?",
              answer: "Absolutely not. Creating a profile, listing your subjects, and receiving calls from students is completely free."
            },
            {
              question: "How can I improve my ranking in the search results?",
              answer: "Our search algorithm favors complete profiles with clear profile pictures, detailed bios, and positive reviews. Encourage your students to leave a 5-star review on your page to boost your visibility."
            },
            {
              question: "Will my phone number be public?",
              answer: "Yes. To facilitate direct, middleman-free communication, the phone number you provide during registration will be visible to anyone browsing your profile."
            },
            {
              question: "Can I list multiple subjects and locations?",
              answer: "Yes, you can tag multiple subjects (like Physics, Math, English) and write exactly which local areas you are willing to travel to in your bio description."
            }
          ],
          "safety": [
            {
              question: "How are the listed profiles verified?",
              answer: "While our team verifies basic identity to ensure platform integrity, we do not independently authenticate physical addresses, academic degrees, or professional credentials. We encourage parents to verify qualifications directly."
            },
            {
              question: "What if a profile seems fake or unresponsive?",
              answer: "We rely on community feedback to maintain a safe directory. If you encounter incorrect information or dead numbers, please use the \"Report\" button on the tutor's profile. Flagged profiles are reviewed and removed by our moderation system."
            },
            {
              question: "Can a tutor delete negative reviews?",
              answer: "No. To maintain complete transparency, tutors cannot delete reviews from their profiles. However, admins monitor reviews for spam and abusive language."
            },
            {
              question: "How do you handle personal data?",
              answer: "We only store the information you voluntarily provide for your public profile. We enforce strict security measures and do not sell your data to third parties."
            },
            {
              question: "What should I do before hiring a tutor?",
              answer: "We strongly advise parents to conduct their own due diligence. Always verify the tutor's government ID, ask to see their academic certificates, and request a trial class before finalizing any long-term payment."
            }
          ]
        }}
      />

      {/* ── Support Us ── */}
      <section style={{ background: 'var(--bg-section)', padding: 'var(--section-gap) 1rem', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-[800px] mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{ background: 'rgba(236, 72, 153, 0.1)' }}>
            <Heart size={28} className="text-pink-500 fill-pink-500 animate-pulse" />
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-0.02em', fontWeight: 700, lineHeight: '1.1', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Support Our Mission
          </h2>
          <p className="max-w-2xl mx-auto mb-10 text-lg" style={{ color: 'var(--text-secondary)' }}>
            Dooars Tutors is providing its services totally free of cost, but it is not free to operate. If you like our work, please consider donating for more development or rating us on Google to help us reach more students!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="https://g.page/r/CbdYh-pFhGNPEBM/review" target="_blank" rel="noreferrer" className="w-full sm:w-auto">
              <button className="btn-primary w-full sm:w-auto px-8 py-3.5 flex items-center justify-center gap-2 text-base shadow-lg shadow-blue-500/20">
                <Star size={18} className="fill-current" /> Rate us on Google
              </button>
            </a>
            <button onClick={() => setShowDonateModal(true)} className="w-full sm:w-auto px-8 py-3.5 flex items-center justify-center gap-2 text-base rounded-full font-medium transition-all duration-200" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              <Heart size={18} className="text-pink-500" /> Donate for Development
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: 'var(--color-inkstone)', padding: 'var(--section-gap) 1rem' }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-3 font-bold text-2xl md:text-3xl mb-4" style={{ color: '#ffffff' }}>
                <Image src="/images/logo.jpg" alt="Logo" width={56} height={56} className="w-12 h-12 md:w-14 md:h-14 rounded-xl object-cover shrink-0" priority />
                Dooars Tutors
              </div>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--color-ash)' }}>
                Connecting students with the best tutors and trainers across the Dooars region.
              </p>
              <div className="flex items-center gap-4">
                <a href="https://www.linkedin.com/company/dooars-tutors/" target="_blank" rel="noreferrer" className="transition-colors hover:scale-110 duration-200" style={{ color: 'var(--color-smoke)' }} onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-smoke)')}>
                  <LinkedinIcon size={20} />
                </a>
                <a href="https://www.instagram.com/dooars_tutors_in/" target="_blank" rel="noreferrer" className="transition-colors hover:scale-110 duration-200" style={{ color: 'var(--color-smoke)' }} onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-smoke)')}>
                  <InstagramIcon size={20} />
                </a>
                <a href="https://www.youtube.com/@DooarsTutors" target="_blank" rel="noreferrer" className="transition-colors hover:scale-110 duration-200" style={{ color: 'var(--color-smoke)' }} onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-smoke)')}>
                  <YoutubeIcon size={22} />
                </a>
                <a href="https://x.com/dooars_tutors?t=NYo5oIQN_1XerNFxQXG0qA&s=09" target="_blank" rel="noreferrer" className="transition-colors hover:scale-110 duration-200" style={{ color: 'var(--color-smoke)' }} onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-smoke)')}>
                  <XIcon size={20} />
                </a>
              </div>
            </div>
            <div>
              <p className="font-medium text-sm mb-4" style={{ color: '#ffffff' }}>Quick Links</p>
              <div className="space-y-2.5 text-sm">
                {[['Browse Tutors', '/search'], ['Coaching Centers', '/search?type=coaching_center'], ['Sports Trainers', '/search?type=sports_trainer'], ['Register as Tutor', '/register']].map(([label, href]) => (
                  <Link key={href} href={href} className="block transition-colors duration-150" style={{ color: 'var(--color-smoke)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-smoke)')}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="font-medium text-sm mb-4" style={{ color: '#ffffff' }}>Categories</p>
              <div className="space-y-2.5 text-sm">
                {categories.map(({ label, value }) => (
                  <Link key={value} href={`/search?type=${value}`} className="block transition-colors duration-150" style={{ color: 'var(--color-smoke)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-smoke)')}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }} className="text-center text-xs">
            <span style={{ color: 'var(--color-smoke)' }}>© {new Date().getFullYear()} Dooars Tutors. Built for the Dooars community.</span>
          </div>
        </div>
      </footer>
      {/* ── Donate Modal ── */}
      {showDonateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all" onClick={() => setShowDonateModal(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm text-center relative shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowDonateModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
            
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 bg-pink-500/10">
              <Heart size={24} className="text-pink-500 fill-pink-500" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">Support Dooars Tutors</h3>
            <p className="text-sm text-zinc-400 mb-6">Scan the QR code with any UPI app (GPay, PhonePe, Paytm) to donate.</p>
            
            <div className="bg-white p-3 rounded-xl inline-block mb-6 mx-auto shadow-inner">
              <QRCode 
                value="upi://pay?pa=subhadeepdhar563@okhdfcbank&pn=Subhadeep%20Dhar&cu=INR"
                size={180}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 180 180`}
              />
            </div>
            
            <p className="text-xs font-mono text-zinc-400 bg-zinc-950 p-2 rounded-lg border border-zinc-800 mb-2">
              subhadeepdhar563@okhdfcbank
            </p>
            
            {/* The mobile intent link only shows on mobile devices effectively if they click it */}
            <a href="upi://pay?pa=subhadeepdhar563@okhdfcbank&pn=Subhadeep%20Dhar&cu=INR" className="block sm:hidden mt-4">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20">
                Pay directly via UPI App
              </button>
            </a>
          </div>
        </div>
      )}

      {/* ── Hover Hint / Fun Facts Popup ── */}
      {activeFact && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-6 sm:right-6 sm:max-w-sm bg-zinc-900 border border-zinc-800 text-white px-4 py-3 rounded-xl shadow-2xl flex items-start sm:items-center justify-between gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <span className="text-sm leading-snug">{activeFact}</span>
          <button onClick={() => setActiveFact(null)} className="text-zinc-400 hover:text-white transition-colors p-1 shrink-0 mt-0.5 sm:mt-0">
            <X size={16} />
          </button>
        </div>
      )}
    </main>
  );
}