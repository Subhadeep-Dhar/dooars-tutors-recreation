'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, BookOpen, Music, Dumbbell, Trophy, Building2, Star, MessageCircle, GraduationCap, Users, Award, TrendingUp, Phone, ArrowRight, Heart, X } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import api from '@/lib/api';
import Link from 'next/link';
import FoundersSection from '@/components/FoundersSection';

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

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [greetingIdx, setGreetingIdx] = useState(0);
  const [showDonateModal, setShowDonateModal] = useState(false);

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
    api.get('/search?limit=3&sort=rating').then(r => setFeatured(r.data.data)).catch(() => {});
    api.get('/search?limit=50').then(r => setAllProfiles(r.data.data)).catch(() => {});
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
      <section style={{ background: 'var(--bg-base)', paddingTop: '5rem', paddingBottom: '5rem' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
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

      {/* ── Stats ── */}
      <section style={{ background: 'var(--bg-base)', padding: 'var(--section-gap) 1rem' }}>
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '200+', label: 'Tutors & Trainers', icon: GraduationCap },
            { value: '50+', label: 'Coaching Centers', icon: Building2 },
            { value: '5000+', label: 'Students Helped', icon: Users },
            { value: '4.8★', label: 'Average Rating', icon: Award },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <Icon size={20} style={{ color: 'var(--text-muted)' }} />
              <div style={{
                fontSize: 'var(--text-display)',
                fontWeight: 700,
                lineHeight: 'var(--leading-display)',
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
              }}>{value}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
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
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi%3A%2F%2Fpay%3Fpa%3Dsubhadeepdhar563%40okhdfcbank%26pn%3DSubhadeep%2520Dhar%26cu%3DINR" 
                alt="UPI QR Code" 
                className="w-48 h-48"
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