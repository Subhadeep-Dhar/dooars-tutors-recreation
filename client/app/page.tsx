'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, BookOpen, Music, Dumbbell, Trophy, Building2, Star, MessageCircle, GraduationCap, Users, Award, TrendingUp, Phone, ArrowRight, Heart, X, CheckCircle2, Shield, Eye, Smartphone, SearchCheck, Mail } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import api from '@/lib/api';
import Link from 'next/link';
import FoundersSection from '@/components/FoundersSection';
import QRCode from 'react-qr-code';

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

const FLOATING_TAGS = [
  // Top Left Quadrant
  { text: 'Guitar', top: '12%', left: '8%', anim: 1, delay: '0s', major: true },
  { text: 'Chemistry', top: '18%', left: '25%', anim: 3, delay: '-2s', major: false },
  { text: 'Computer', top: '8%', left: '40%', anim: 1, delay: '-3s', major: true },
  
  // Top Right Quadrant
  { text: 'Coding', top: '15%', left: '60%', anim: 2, delay: '-4s', major: true },
  { text: 'Yoga', top: '10%', left: '85%', anim: 3, delay: '-5s', major: true },
  { text: 'English', top: '25%', left: '75%', anim: 2, delay: '-1s', major: true },
  
  // Middle Left Quadrant
  { text: 'Skating', top: '45%', left: '5%', anim: 1, delay: '-6s', major: false },
  { text: 'Art', top: '38%', left: '20%', anim: 2, delay: '-3s', major: true },
  { text: 'Abacus', top: '55%', left: '15%', anim: 2, delay: '-7s', major: false },
  { text: 'Spoken English', top: '40%', left: '35%', anim: 1, delay: '-4s', major: false },

  // Middle Right Quadrant
  { text: 'History', top: '35%', left: '85%', anim: 2, delay: '-5s', major: false },
  { text: 'Education', top: '48%', left: '65%', anim: 3, delay: '-2s', major: true },
  { text: 'Maths', top: '55%', left: '90%', anim: 2, delay: '0s', major: true },
  { text: 'Gym', top: '42%', left: '50%', anim: 2, delay: '-6s', major: false },

  // Bottom Left Quadrant
  { text: 'Physics', top: '75%', left: '10%', anim: 2, delay: '-2s', major: true },
  { text: 'Biology', top: '85%', left: '25%', anim: 1, delay: '-5s', major: false },
  { text: 'Geography', top: '68%', left: '30%', anim: 3, delay: '-1s', major: true },
  { text: 'Dance', top: '90%', left: '8%', anim: 3, delay: '-3s', major: true },
  
  // Bottom Right Quadrant
  { text: 'Football', top: '75%', left: '80%', anim: 1, delay: '-1s', major: true },
  { text: 'Cricket', top: '85%', left: '60%', anim: 1, delay: '-1s', major: true },
  { text: 'WBCS', top: '70%', left: '45%', anim: 1, delay: '-7s', major: false },
  { text: 'Music', top: '88%', left: '75%', anim: 3, delay: '-8s', major: true },
  { text: 'Bengali', top: '80%', left: '92%', anim: 3, delay: '-4s', major: true },
  
  // Center-ish but safe
  { text: 'Badminton', top: '60%', left: '55%', anim: 1, delay: '-6s', major: false },
  { text: 'Martial Arts', top: '92%', left: '42%', anim: 3, delay: '-2s', major: false },
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [greetingIdx, setGreetingIdx] = useState(0);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [liveVisits, setLiveVisits] = useState(24358);
  const [uniqueDistricts, setUniqueDistricts] = useState(3);
  const [totalTutors, setTotalTutors] = useState(250);

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
    const interval = setInterval(() => {
      setGreetingIdx(p => (p + 1) % greetings.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);
  const [featured, setFeatured] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);

  useEffect(() => {
    // Increment visit counter exactly once per page load (stored locally)
    const storedVisits = localStorage.getItem('dooars_visits_counter');
    if (!storedVisits) {
      localStorage.setItem('dooars_visits_counter', '24358');
      setLiveVisits(24358);
    } else {
      const newCount = parseInt(storedVisits, 10) + 1;
      localStorage.setItem('dooars_visits_counter', newCount.toString());
      setLiveVisits(newCount);
    }
  }, []);

  useEffect(() => {
    api.get('/search?limit=3&sort=rating').then(r => setFeatured(r.data.data)).catch(() => {});
    api.get('/search?limit=1000').then(r => {
      const p = r.data.data;
      setAllProfiles(p);
      if (p && Array.isArray(p)) {
        setTotalTutors(p.length);
        const districts = new Set(p.map((item: any) => item.address?.district).filter(Boolean));
        // If there are rogue districts in dummy data, limit to 2 for now as requested
        setUniqueDistricts(districts.size === 3 ? 2 : districts.size);
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
  const center = validProfiles.length > 0
    ? { lat: validProfiles.reduce((s, p) => s + p.location.coordinates[1], 0) / validProfiles.length, lng: validProfiles.reduce((s, p) => s + p.location.coordinates[0], 0) / validProfiles.length }
    : { lat: 26.55, lng: 89.5 };

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
          
          {FLOATING_TAGS.map((tag, i) => {
            // Calculate parallax distance based on anim index to give depth (some move more than others)
            const parallaxX = mousePos.x * (tag.anim * -15);
            const parallaxY = mousePos.y * (tag.anim * -15);
            
            return (
              <div 
                key={i} 
                className={`absolute transition-transform duration-300 ease-out ${!tag.major ? 'hidden md:block' : ''}`}
                style={{
                  top: tag.top,
                  left: tag.left,
                  transform: `translate(${parallaxX}px, ${parallaxY}px)`
                }}
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

        <div className="max-w-3xl mx-auto px-4 text-center relative" style={{ zIndex: 10 }}>
          <div className="mb-4 flex items-center justify-center">
            <span style={{
              color: 'var(--text-primary)', fontWeight: 'normal',
              fontSize: 'clamp(1.1rem, 4vw, 1.4rem)',
              letterSpacing: '0.02em',
              transition: 'opacity 0.3s ease'
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
            Find the Best Tutors &amp; Trainers in Dooars
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
      <section style={{ background: 'var(--bg-section)', padding: 'var(--section-gap) 1rem' }}>
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
            { value: totalTutors, label: 'Verified Tutors & Centers', icon: Users },
            { value: `${uniqueDistricts} Districts`, label: 'Operating Area', icon: MapPin },
            { value: `${liveVisits.toLocaleString()}+`, label: 'Total Visits', icon: Eye },
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
      {featured.length > 0 && (
        <section style={{ background: 'var(--bg-section)', padding: 'var(--section-gap) 1rem' }}>
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="eyebrow mb-1">TOP RATED</p>
                <h2 style={{ fontSize: 'var(--text-display)', lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: 700, color: 'var(--text-primary)' }}>Top Rated Tutors</h2>
              </div>
              <Link href="/search">
                <button className="btn-ghost text-sm px-4 py-2 flex items-center gap-1.5">
                  View all <ArrowRight size={14} />
                </button>
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {featured.map(profile => (
                <div key={profile._id} className="card-base p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                      style={{ backgroundColor: 'var(--color-brand)' }}>
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
                  <div className="flex gap-2">
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
                Dooars Tutors is a new technological initiative introduced specifically for Dooars region. We ask for everyone's open-minded support as we build this together—it is purely for the benefit of local students and dedicated educators. Nothing personal, just community growth.
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
                <a href="https://wa.me/9083009315" target="_blank" rel="noreferrer">
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
            <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
              <Map defaultCenter={center} defaultZoom={10} mapId="dooars-community-map"
                style={{ width: '100%', height: '100%' }} gestureHandling="greedy" disableDefaultUI={true}>
                {validProfiles.map(p => (
                  <AdvancedMarker key={p._id}
                    position={{ lat: p.location.coordinates[1], lng: p.location.coordinates[0] }}
                    onClick={() => router.push(`/profiles/${p.slug}`)}>
                    <Pin background={typeColors[p.type] ?? '#1a73e8'} borderColor="#fff" glyphColor="#fff" scale={0.85} />
                  </AdvancedMarker>
                ))}
              </Map>
            </APIProvider>
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
      <section style={{ background: 'var(--bg-section)', padding: 'var(--section-gap) 1rem' }}>
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

      {/* ── Support Us ── */}
      <section style={{ background: 'var(--bg-base)', padding: 'var(--section-gap) 1rem', borderTop: '1px solid var(--border)' }}>
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
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-brand)' }}>
                  <GraduationCap size={28} className="text-white" />
                </div>
                Dooars Tutors
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
                Connecting students with the best tutors and trainers across the Dooars region.
              </p>
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
    </main>
  );
}