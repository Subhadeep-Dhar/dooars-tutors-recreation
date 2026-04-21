'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, BookOpen, Music, Dumbbell, Trophy, Building2, Star, Phone, MessageCircle, GraduationCap, Users, Award, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import api from '@/lib/api';
import Link from 'next/link';

const categories = [
  { label: 'Private Tutors', value: 'tutor', icon: BookOpen },
  { label: 'Coaching Centers', value: 'coaching_center', icon: Building2 },
  { label: 'Sports Trainers', value: 'sports_trainer', icon: Trophy },
  { label: 'Arts & Culture', value: 'arts_trainer', icon: Music },
  { label: 'Gym & Yoga', value: 'gym_yoga', icon: Dumbbell },
];

const typeColors: Record<string, string> = {
  tutor: '#1e40af',
  coaching_center: '#7e22ce',
  sports_trainer: '#15803d',
  arts_trainer: '#be185d',
  gym_yoga: '#c2410c',
};

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [featured, setFeatured] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);

  useEffect(() => {
    api.get('/search?limit=3&sort=rating').then((res) => setFeatured(res.data.data)).catch(() => { });
    api.get('/search?limit=50').then((res) => setAllProfiles(res.data.data)).catch(() => { });
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (location) params.set('location', location);
    router.push(`/search?${params.toString()}`);
  }

  function handleCategory(value: string) {
    router.push(`/search?type=${value}`);
  }

  const validProfiles = allProfiles.filter(p => p.location?.coordinates?.length === 2);

  return (
    <main className="min-h-screen">

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-700 text-white py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Find the Best Tutors in Dooars</h1>
          <p className="text-slate-300 text-lg mb-10">Connect with private tutors, coaching centers, sports trainers, and more near you.</p>
          <form onSubmit={handleSearch} className="bg-white rounded-2xl p-3 flex flex-col md:flex-row gap-3 shadow-xl">
            <div className="flex items-center gap-2 flex-1 px-3">
              <Search className="text-slate-400 shrink-0" size={18} />
              <Input placeholder="Subject, activity, or name..." value={query} onChange={(e) => setQuery(e.target.value)}
                className="border-0 shadow-none text-slate-800 placeholder:text-slate-400 focus-visible:ring-0 p-0" />
            </div>
            <div className="flex items-center gap-2 flex-1 px-3 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0">
              <MapPin className="text-slate-400 shrink-0" size={18} />
              <Input placeholder="Town or area..." value={location} onChange={(e) => setLocation(e.target.value)}
                className="border-0 shadow-none text-slate-800 placeholder:text-slate-400 focus-visible:ring-0 p-0" />
            </div>
            <Button type="submit" className="rounded-xl px-8">Search</Button>
          </form>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '200+', label: 'Tutors & Trainers', icon: GraduationCap },
            { value: '50+', label: 'Coaching Centers', icon: Building2 },
            { value: '5000+', label: 'Students Helped', icon: Users },
            { value: '4.8★', label: 'Average Rating', icon: Award },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <Icon size={20} className="text-slate-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{value}</div>
              <div className="text-slate-500 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-slate-800 mb-8 text-center">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map(({ label, value, icon: Icon }) => (
              <button key={value} onClick={() => handleCategory(value)}
                className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-slate-900 flex items-center justify-center transition-colors">
                  <Icon size={22} className="text-slate-600 group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm font-medium text-slate-700 text-center">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tutors */}
      {featured.length > 0 && (
        <section className="py-16 px-4 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-slate-800">Top Rated Tutors</h2>
              <Link href="/search"><Button variant="outline" size="sm">View all</Button></Link>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {featured.map((profile) => (
                <div key={profile._id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
                      {profile.displayName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{profile.displayName}</p>
                      <p className="text-xs text-slate-500">{profile.address?.town}</p>
                    </div>
                    {profile.rating?.count > 0 && (
                      <div className="ml-auto flex items-center gap-1">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        <span className="text-sm font-semibold">{profile.rating.average}</span>
                      </div>
                    )}
                  </div>
                  {profile.tagline && <p className="text-sm text-slate-500 mb-3">{profile.tagline}</p>}
                  {profile.teachingSlots?.slice(0, 2).map((slot: any, i: number) => (
                    <div key={i} className="text-xs text-slate-600 bg-slate-50 rounded-lg px-2.5 py-1 inline-block mr-1 mb-1">
                      {slot.subject || slot.activity}{slot.feePerMonth ? ` · ₹${slot.feePerMonth}/mo` : ''}
                    </div>
                  ))}
                  <div className="flex gap-2 mt-4">
                    {profile.contact?.whatsapp && (
                      <a href={`https://wa.me/91${profile.contact.whatsapp}`} target="_blank" rel="noreferrer" className="flex-1">
                        <Button size="sm" variant="outline" className="w-full gap-1 text-xs h-8"><MessageCircle size={12} /> WhatsApp</Button>
                      </a>
                    )}
                    <Link href={`/profiles/${profile.slug}`} className="flex-1">
                      <Button size="sm" className="w-full text-xs h-8">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Community Map */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">Our Community Across Dooars</h2>
            <p className="text-slate-500">Tutors and trainers spread across the region — find one near you</p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: '420px' }}>
            {validProfiles.length > 0 ? (
              <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
                <Map
                  defaultCenter={{
                    lat: validProfiles.reduce((s, p) => s + p.location.coordinates[1], 0) / validProfiles.length,
                    lng: validProfiles.reduce((s, p) => s + p.location.coordinates[0], 0) / validProfiles.length,
                  }}
                  defaultZoom={10.5}
                  mapId="dooars-community-map"
                  style={{ width: '100%', height: '100%' }}
                  gestureHandling="greedy"
                  disableDefaultUI={true}
                >
                  {validProfiles.map((profile) => (
                    <AdvancedMarker
                      key={profile._id}
                      position={{ lat: profile.location.coordinates[1], lng: profile.location.coordinates[0] }}
                      onClick={() => router.push(`/profiles/${profile.slug}`)}
                    >
                      <Pin background={typeColors[profile.type] ?? '#1e293b'} borderColor="#fff" glyphColor="#fff" scale={0.8} />
                    </AdvancedMarker>
                  ))}
                </Map>
              </APIProvider>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-4 justify-center mt-4">
            {Object.entries(typeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                {type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Why Choose Dooars Tutors</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Dooars Tutors is a local initiative connecting students with the best tutors, coaches, and trainers across the Dooars and Terai region of West Bengal.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              Whether you need help with academics, want to learn a sport, explore arts and culture, or stay fit — we have verified professionals ready to guide you.
            </p>
            <div className="flex gap-3">
              <Link href="/search"><Button>Find a Tutor</Button></Link>
              <Link href="/register"><Button variant="outline">Join as Tutor</Button></Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: TrendingUp, title: 'Verified Profiles', desc: 'All tutors go through admin verification before appearing in search.' },
              { icon: MapPin, title: 'Hyper Local', desc: 'Focused exclusively on the Dooars and Terai region.' },
              { icon: Star, title: 'Rated & Reviewed', desc: 'Real reviews from real students help you choose confidently.' },
              { icon: Phone, title: 'Direct Contact', desc: 'Connect directly via WhatsApp or phone — no middlemen.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-4 border border-slate-200">
                <Icon size={20} className="text-slate-600 mb-2" />
                <p className="font-medium text-slate-800 text-sm mb-1">{title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
                <GraduationCap size={22} />
                Dooars Tutors
              </div>
              <p className="text-sm leading-relaxed">Connecting students with the best tutors and trainers across the Dooars region.</p>
            </div>
            <div>
              <p className="text-white font-medium mb-3">Quick Links</p>
              <div className="space-y-2 text-sm">
                <Link href="/search" className="block hover:text-white transition-colors">Browse Tutors</Link>
                <Link href="/search?type=coaching_center" className="block hover:text-white transition-colors">Coaching Centers</Link>
                <Link href="/search?type=sports_trainer" className="block hover:text-white transition-colors">Sports Trainers</Link>
                <Link href="/register" className="block hover:text-white transition-colors">Register as Tutor</Link>
              </div>
            </div>
            <div>
              <p className="text-white font-medium mb-3">Categories</p>
              <div className="space-y-2 text-sm">
                {categories.map(({ label, value }) => (
                  <Link key={value} href={`/search?type=${value}`} className="block hover:text-white transition-colors">{label}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 text-center text-xs">
            © {new Date().getFullYear()} Dooars Tutors. Built for the Dooars community.
          </div>
        </div>
      </footer>

    </main>
  );
}