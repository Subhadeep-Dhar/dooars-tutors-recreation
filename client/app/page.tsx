'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, BookOpen, Music, Dumbbell, Trophy, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const categories = [
  { label: 'Private Tutors', value: 'tutor', icon: BookOpen },
  { label: 'Coaching Centers', value: 'coaching_center', icon: Building2 },
  { label: 'Sports Trainers', value: 'sports_trainer', icon: Trophy },
  { label: 'Arts & Culture', value: 'arts_trainer', icon: Music },
  { label: 'Gym & Yoga', value: 'gym_yoga', icon: Dumbbell },
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');

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

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-700 text-white py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Find the Best Tutors in Dooars
          </h1>
          <p className="text-slate-300 text-lg mb-10">
            Connect with private tutors, coaching centers, sports trainers, and more near you.
          </p>

          <form onSubmit={handleSearch} className="bg-white rounded-2xl p-3 flex flex-col md:flex-row gap-3 shadow-xl">
            <div className="flex items-center gap-2 flex-1 px-3">
              <Search className="text-slate-400 shrink-0" size={18} />
              <Input
                placeholder="Subject, activity, or name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border-0 shadow-none text-slate-800 placeholder:text-slate-400 focus-visible:ring-0 p-0"
              />
            </div>
            <div className="flex items-center gap-2 flex-1 px-3 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0">
              <MapPin className="text-slate-400 shrink-0" size={18} />
              <Input
                placeholder="Town or area..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="border-0 shadow-none text-slate-800 placeholder:text-slate-400 focus-visible:ring-0 p-0"
              />
            </div>
            <Button type="submit" className="rounded-xl px-8">
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-slate-800 mb-8 text-center">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map(({ label, value, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleCategory(value)}
                className="flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-slate-900 flex items-center justify-center transition-colors">
                  <Icon size={22} className="text-slate-600 group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm font-medium text-slate-700 text-center">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: '200+', label: 'Tutors & Trainers' },
            { value: '50+', label: 'Coaching Centers' },
            { value: '5000+', label: 'Students Helped' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl font-bold text-slate-900">{value}</div>
              <div className="text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}