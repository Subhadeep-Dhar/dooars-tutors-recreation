// 'use client';

// import { useEffect, useState, useRef, Suspense } from 'react';
// import { useSearchParams, useRouter } from 'next/navigation';
// import { useSearchStore } from '@/store/searchStore';
// import ProfileCard from '@/components/search/ProfileCard';
// import FilterPanel from '@/components/search/FilterPanel';
// import { Loader2, List, Map } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import dynamic from 'next/dynamic';

// const MapView = dynamic(() => import('@/components/search/MapView'), { ssr: false });

// function SearchContent() {
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const { results, total, isLoading, search, setParams, params } = useSearchStore();
//   const [view, setView] = useState<'list' | 'map'>('list');
//   const [allResults, setAllResults] = useState<any[]>([]);
//   const [page, setPage] = useState(1);
//   const [loadingMore, setLoadingMore] = useState(false);
//   const isFirstLoad = useRef(true);
//   const currentPage = useRef(1);

//   // Initial load from URL params
//   useEffect(() => {
//     const p: any = { page: 1, limit: 10 };
//     if (searchParams.get('q')) p.q = searchParams.get('q');
//     if (searchParams.get('type')) p.type = searchParams.get('type');
//     if (searchParams.get('subject')) p.subject = searchParams.get('subject');
//     if (searchParams.get('class')) p.class = searchParams.get('class');
//     currentPage.current = 1;
//     setPage(1);
//     setAllResults([]);
//     setParams(p);
//     search(p);
//   }, [searchParams]);

//   // Append or replace results based on page
//   useEffect(() => {
//     if (isLoading) return;
//     if (currentPage.current === 1) {
//       setAllResults(results);
//     } else {
//       setAllResults(prev => {
//         const ids = new Set(prev.map((r: any) => r._id));
//         const newOnes = results.filter((r: any) => !ids.has(r._id));
//         return [...prev, ...newOnes];
//       });
//     }
//     setLoadingMore(false);
//   }, [results, isLoading]);

//   function handleFilter() {
//     currentPage.current = 1;
//     setPage(1);
//     setAllResults([]);
//   }

//   async function loadMore() {
//     const next = currentPage.current + 1;
//     currentPage.current = next;
//     setPage(next);
//     setLoadingMore(true);
//     await search({ ...params, page: next, limit: 10 });
//   }

//   const hasMore = allResults.length < total;

//   return (
//     <div className="max-w-6xl mx-auto px-4 py-8">
//       <div className="flex gap-8">
//         <aside className="w-64 shrink-0 hidden md:block">
//           <FilterPanel onFilter={handleFilter} />
//         </aside>
//         <div className="flex-1">
//           <div className="flex items-center justify-between mb-6">
//             <p className="text-slate-600 text-sm">
//               {isLoading && page === 1 ? 'Searching...' : `${total} result${total !== 1 ? 's' : ''} found`}
//             </p>
//             <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1">
//               <Button size="sm" variant={view === 'list' ? 'default' : 'ghost'}
//                 className="h-7 gap-1.5 text-xs" onClick={() => setView('list')}>
//                 <List size={13} /> List
//               </Button>
//               <Button size="sm" variant={view === 'map' ? 'default' : 'ghost'}
//                 className="h-7 gap-1.5 text-xs" onClick={() => setView('map')}>
//                 <Map size={13} /> Map
//               </Button>
//             </div>
//           </div>

//           {isLoading && page === 1 ? (
//             <div className="flex items-center justify-center py-24">
//               <Loader2 className="animate-spin text-slate-400" size={32} />
//             </div>
//           ) : allResults.length === 0 ? (
//             <div className="text-center py-24">
//               <p className="text-slate-500 text-lg">No results found</p>
//               <p className="text-slate-400 text-sm mt-2">Try adjusting your filters</p>
//             </div>
//           ) : view === 'list' ? (
//             <div>
//               <div className="grid gap-4">
//                 {allResults.map((profile: any) => (
//                   <ProfileCard key={profile._id} profile={profile} />
//                 ))}
//               </div>
//               {hasMore && (
//                 <div className="flex flex-col items-center gap-2 mt-8">
//                   <p className="text-sm text-slate-400">Showing {allResults.length} of {total}</p>
//                   <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="gap-2">
//                     {loadingMore
//                       ? <><Loader2 size={14} className="animate-spin" /> Loading...</>
//                       : `Load more (${total - allResults.length} remaining)`}
//                   </Button>
//                 </div>
//               )}
//               {!hasMore && total > 10 && (
//                 <p className="text-center text-sm text-slate-400 mt-8">All {total} results shown</p>
//               )}
//             </div>
//           ) : (
//             <div className="rounded-2xl overflow-hidden border border-slate-200" style={{ height: '600px' }}>
//               <MapView profiles={allResults} />
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function SearchPage() {
//   return (
//     <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="animate-spin" /></div>}>
//       <SearchContent />
//     </Suspense>
//   );
// }


'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search, MapPin, BookOpen, Music, Dumbbell, Trophy, Building2,
  Star, MessageCircle, Phone, List, Map as MapIcon, SlidersHorizontal,
  Clock, Globe, Loader2, X, ChevronRight, LayoutGrid, Check
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import api from '@/lib/api';

/* ─── Constants ──────────────────────────────────────────────────────────── */
const categories = [
  { label: 'All',              value: '',                icon: null },
  { label: 'Private Tutors',   value: 'tutor',           icon: BookOpen },
  { label: 'Coaching Centers', value: 'coaching_center', icon: Building2 },
  { label: 'Sports',  value: 'sports_trainer',  icon: Trophy },
  { label: 'Arts & Culture',   value: 'arts_trainer',    icon: Music },
  { label: 'Gym & Yoga',       value: 'gym_yoga',        icon: Dumbbell },
];

const typeColors: Record<string, string> = {
  tutor: '#1a73e8', coaching_center: '#8b5cf6',
  sports_trainer: '#10b981', arts_trainer: '#ec4899', gym_yoga: '#f59e0b',
};

const typeBadgeStyles: Record<string, { bg: string; color: string }> = {
  tutor:           { bg: 'rgba(26,115,232,0.1)',   color: '#1a73e8' },
  coaching_center: { bg: 'rgba(139,92,246,0.1)',   color: '#8b5cf6' },
  sports_trainer:  { bg: 'rgba(16,185,129,0.1)',   color: '#10b981' },
  arts_trainer:    { bg: 'rgba(236,72,153,0.1)',   color: '#ec4899' },
  gym_yoga:        { bg: 'rgba(245,158,11,0.1)',   color: '#f59e0b' },
};

const typeLabels: Record<string, string> = {
  tutor: 'Private Tutor', coaching_center: 'Coaching Center',
  sports_trainer: 'Sports Trainer', arts_trainer: 'Arts & Culture', gym_yoga: 'Gym & Yoga',
};

const classList = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const boardList = ['CBSE','ICSE','State'];

/* ─── Debounce hook ──────────────────────────────────────────────────────── */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ─── Tiny badge components ──────────────────────────────────────────────── */
function TypeBadge({ type }: { type: string }) {
  const s = typeBadgeStyles[type] ?? { bg: 'rgba(26,115,232,0.1)', color: '#1a73e8' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.6rem',
      borderRadius: '9999px', background: s.bg, color: s.color,
      border: `1px solid ${s.color}33`,
    }}>
      {typeLabels[type] ?? type}
    </span>
  );
}

function RatingBadge({ average, count }: { average: number; count: number }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.28rem 0.6rem', borderRadius: '9999px',
      background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)',
      fontSize: '0.85rem', fontWeight: 600, color: '#f59e0b', flexShrink: 0,
    }}>
      <Star size={12} fill="#f59e0b" />
      <span>{average}</span>
      <span style={{ opacity: 0.65, fontWeight: 400 }}>({count})</span>
    </div>
  );
}

/* ─── Filter Panel ───────────────────────────────────────────────────────── */
interface FPProps {
  type: string; setType: (v: string) => void;
  subjects: string; setSubjects: (v: string) => void;
  selClasses: string[]; toggleClass: (c: string) => void;
  selBoards: string[];  toggleBoard: (b: string) => void;
  sortBy: string; setSortBy: (v: string) => void;
  minRating: string; setMinRating: (v: string) => void;
  maxFee: string; setMaxFee: (v: string) => void;
  place: string; setPlace: (v: string) => void;
  clearAll: () => void;
  onApply?: () => void;
}

function FilterPanel(p: FPProps) {
  const secLabel: React.CSSProperties = {
    fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.07em',
    textTransform: 'uppercase', color: 'var(--text-muted)',
    marginBottom: '0.45rem', paddingBottom: '0.35rem',
    borderBottom: '1px solid var(--border)',
  };
  const catItem = (active: boolean): React.CSSProperties => ({
    width: '100%', textAlign: 'left', padding: '0.42rem 0.7rem',
    borderRadius: 'var(--radius-inputs)', fontSize: '0.84rem',
    cursor: 'pointer', border: '1px solid transparent',
    display: 'flex', alignItems: 'center', gap: '0.45rem',
    background: active ? 'var(--color-brand-light)' : 'transparent',
    color: active ? 'var(--color-brand)' : 'var(--text-secondary)',
    borderColor: active ? 'var(--color-brand-ring)' : 'transparent',
    fontWeight: active ? 500 : 400, transition: 'all 0.17s ease',
  });
  const chip = (active: boolean): React.CSSProperties => ({
    padding: '0.2rem 0.6rem', borderRadius: '9999px',
    fontSize: '0.77rem', fontWeight: 500, cursor: 'pointer',
    background: active ? 'var(--color-brand)' : 'transparent',
    color: active ? '#fff' : 'var(--text-secondary)',
    border: active ? 'none' : '1px solid var(--border)',
    boxShadow: 'none',
    transition: 'all 0.17s ease',
  });
  const inp: React.CSSProperties = {
    width: '100%', padding: '0.48rem 0.7rem',
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
    fontSize: '0.84rem', outline: 'none', transition: 'border-color 0.17s, box-shadow 0.17s',
  };
  const hr = <div style={{ height: '1px', background: 'var(--border)', margin: '0.1rem 0' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <SlidersHorizontal size={13} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Filters</span>
        </div>
        <button onClick={p.clearAll} style={{ fontSize: '0.77rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear all</button>
      </div>

      {/* Category */}
      <div>
        <p style={secLabel}>Category</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {categories.map(({ label, value, icon: Icon }) => (
            <button key={value} style={catItem(p.type === value)} onClick={() => p.setType(value)}>
              {Icon ? <Icon size={12} /> : <span style={{ width: '12px' }} />}
              {label}
            </button>
          ))}
        </div>
      </div>

      {hr}

      {/* Subject */}
      <div>
        <p style={secLabel}>Subject</p>
        <input style={inp} placeholder="e.g. Maths, Physics"
          value={p.subjects} onChange={e => p.setSubjects(e.target.value)}
          onFocus={e => { e.target.style.borderColor = 'var(--color-brand)'; e.target.style.boxShadow = '0 0 0 3px var(--color-brand-ring)'; }}
          onBlur={e  => { e.target.style.borderColor = 'var(--border)';       e.target.style.boxShadow = 'none'; }}
        />
        <p style={{ fontSize: '0.71rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Separate with commas</p>
      </div>

      {hr}

      {/* Class */}
      <div>
        <p style={secLabel}>Class</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {classList.map(c => (
            <button key={c} style={chip(p.selClasses.includes(c))} onClick={() => p.toggleClass(c)}>{c}</button>
          ))}
        </div>
      </div>

      {hr}

      {/* Board */}
      <div>
        <p style={secLabel}>Board</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {boardList.map(b => (
            <button key={b} style={chip(p.selBoards.includes(b))} onClick={() => p.toggleBoard(b)}>{b}</button>
          ))}
        </div>
      </div>

      
      {hr}

      {/* Place */}
      <div>
        <p style={secLabel}>Place</p>
        <input style={inp} placeholder="e.g. Alipurduar, Coochbehar"
          value={p.place} onChange={e => p.setPlace(e.target.value)}
          onFocus={e => { e.target.style.borderColor = 'var(--color-brand)'; e.target.style.boxShadow = '0 0 0 3px var(--color-brand-ring)'; }}
          onBlur={e  => { e.target.style.borderColor = 'var(--border)';       e.target.style.boxShadow = 'none'; }}
        />
        <p style={{ fontSize: '0.71rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Town, area, or district</p>
      </div>

      {hr}

      {/* Sort */}
      <div>
        <p style={secLabel}>Sort by</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {[{ label: 'Highest Rated', value: 'highest rated' }, { label: 'Newest', value: 'newest' }].map(s => (
            <button key={s.value} style={catItem(p.sortBy === s.value)} onClick={() => p.setSortBy(s.value)}>{s.label}</button>
          ))}
        </div>
      </div>

      {hr}

      {/* Max Fee */}
      <div>
        <p style={secLabel}>Max Fee (₹/mo)</p>
        <input style={inp} type="number" placeholder="e.g. 2000"
          value={p.maxFee} onChange={e => p.setMaxFee(e.target.value)}
          onFocus={e => { e.target.style.borderColor = 'var(--color-brand)'; e.target.style.boxShadow = '0 0 0 3px var(--color-brand-ring)'; }}
          onBlur={e  => { e.target.style.borderColor = 'var(--border)';       e.target.style.boxShadow = 'none'; }}
        />
      </div>

      {/* Min Rating */}
      <div>
        <p style={secLabel}>Min Rating</p>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {['3','4','4.5'].map(r => (
            <button key={r} style={chip(p.minRating === r)} onClick={() => p.setMinRating(p.minRating === r ? '' : r)}>{r}★</button>
          ))}
        </div>
      </div>


      {p.onApply && (
        <button onClick={p.onApply} style={{
          marginTop: '0.5rem', padding: '0.7rem', width: '100%',
          background: 'var(--color-brand)',
          color: '#fff', border: 'none', borderRadius: 'var(--radius-buttons)',
          fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
        }}>
          Apply Filters
        </button>
      )}
    </div>
  );
}

/* ─── Tutor Card ─────────────────────────────────────────────────────────── */
function TutorCardGrid({ profile }: { profile: any }) {
  const router = useRouter();
  const dest = `/profiles/${profile.slug || profile._id}`;
  const slots = profile.teachingSlots ?? [];

  return (
    <div
      className="stagger-item"
      style={{
        display: 'flex', flexDirection: 'row', gap: '1rem',
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '1.25rem', padding: '1.2rem',
        transition: 'transform 0.2s', height: '100%', alignItems: 'stretch'
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
    >
      {/* LEFT COLUMN */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '85px', flexShrink: 0 }}>
        {/* Avatar Container */}
        <div style={{ position: 'relative', width: '75px', height: '75px', marginBottom: '0.8rem' }}>
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.displayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.8rem', fontWeight: 'bold' }}>
              {profile.displayName?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
          )}
          {profile.verificationStatus === 'verified' && (
            <div style={{ position: 'absolute', bottom: '0px', right: '0px', background: '#0095f6', borderRadius: '50%', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #151518' }}>
              <Check size={12} color="#fff" strokeWidth={4} />
            </div>
          )}
        </div>

        {/* Type Badge */}
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '0.2rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center', width: '100%', marginBottom: '0.5rem', textTransform: 'capitalize' }}>
           {(profile.type || '').replace('_', ' ')}
        </div>

        {/* Rating */}
        {profile.rating?.count > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem', marginBottom: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', color: '#fbbf24' }}>
              {[1,2,3,4,5].map(s => <Star key={s} size={10} fill={s <= Math.round(profile.rating.average) ? '#fbbf24' : 'transparent'} stroke={s <= Math.round(profile.rating.average) ? '#fbbf24' : 'var(--border)'} style={{ margin: '0 1px' }} />)}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>({profile.rating.count})</span>
          </div>
        )}

        {/* Location */}
        {profile.address?.town && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: 'auto' }}>
            {profile.address.town}{profile.address.district ? `, ${profile.address.district}` : ''}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {/* Name */}
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.4rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {profile.displayName}
        </h3>
        
        {/* Experience */}
        {profile.experience != null && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.8rem 0' }}>
            {profile.experience} years experience
          </p>
        )}

        {/* Subjects Box */}
        {slots.length > 0 && (
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '0.8rem', padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
            {slots.slice(0, 2).map((slot: any, i: number) => (
              <p key={i} style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {slot.subject || slot.activity} : <span style={{ fontWeight: 400 }}>{slot.classes ? slot.classes.join(', ') : (slot.ageGroups?.join(', ') || slot.level || '')}</span>
              </p>
            ))}
            {slots.length > 2 && (
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>+{slots.length - 2} more subjects</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {profile.contact?.whatsapp && (
              <a href={`https://wa.me/91${profile.contact.whatsapp}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageCircle size={16} color="#fff" />
                </div>
              </a>
            )}
            {profile.contact?.phone && (
              <a href={`tel:${profile.contact.phone}`} onClick={e => e.stopPropagation()}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={14} color="var(--text-primary)" fill="var(--text-primary)" />
                </div>
              </a>
            )}
          </div>
          <button
            onClick={e => { e.stopPropagation(); router.push(dest); }}
            style={{ padding: '0.5rem 1.2rem', borderRadius: '9999px', background: 'var(--color-brand)', color: '#fff', fontWeight: 600, fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
}

function TutorCard({ profile, variant = 'list' }: { profile: any, variant?: 'list' | 'grid' }) {
  if (variant === 'grid') return <TutorCardGrid profile={profile} />;

  const router = useRouter();
  // Always use slug; fall back to _id if slug is absent
  const dest = `/profiles/${profile.slug || profile._id}`;
  const slots = profile.teachingSlots ?? [];

  return (
    <div
      className="stagger-item"
      style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-cards)', boxShadow: 'var(--shadow-sm)',
        padding: '1.2rem 1.375rem', transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(-2px)';
        el.style.boxShadow = 'var(--shadow-md)';
        el.style.borderColor = 'var(--color-brand-ring)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = 'var(--shadow-sm)';
        el.style.borderColor = 'var(--border)';
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
        {/* Avatar */}
        <div style={{
          width: '44px', height: '44px', borderRadius: 'var(--radius-inputs)', flexShrink: 0,
          background: 'var(--color-brand)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: '1.05rem',
        }}>
          {profile.displayName?.charAt(0)?.toUpperCase() ?? '?'}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <p style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                {profile.displayName}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                <TypeBadge type={profile.type} />
                {profile.address?.town && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <MapPin size={12} />
                    {profile.address.town}{profile.address?.district ? `, ${profile.address.district}` : ''}
                  </span>
                )}
              </div>
            </div>
            {profile.rating?.count > 0 && <RatingBadge average={profile.rating.average} count={profile.rating.count} />}
          </div>

          {/* Subjects */}
          {slots.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.45rem', marginBottom: '0.55rem' }}>
              {slots.slice(0, 4).map((slot: any, i: number) => (
                <span key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  fontSize: '0.85rem', padding: '0.2rem 0.6rem', borderRadius: '6px',
                  background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)',
                }}>
                  <BookOpen size={9} />
                  {slot.subject || slot.activity}
                  {slot.classes?.length > 0 && <span style={{ opacity: 0.6 }}> · Cl. {slot.classes.slice(0, 2).join(', ')}</span>}
                </span>
              ))}
              {slots.length > 4 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.85rem', padding: '0.2rem 0.6rem', borderRadius: '6px', opacity: 0.6, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  +{slots.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {profile.experience != null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                <Clock size={10} /> {profile.experience} yrs exp
              </span>
            )}
            {profile.languages?.length > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                <Globe size={10} /> {profile.languages.slice(0, 2).join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.45rem',
        marginTop: 'auto', paddingTop: '0.8rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap',
      }}>
        {profile.contact?.whatsapp && (
          <a href={`https://wa.me/91${profile.contact.whatsapp}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ flex: 'unset' }}>
            <button style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', width: '100%',
              padding: '0.38rem 0.85rem', borderRadius: '9999px',
              fontSize: '0.77rem', fontWeight: 600,
              background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', border: 'none', cursor: 'pointer',
              transition: 'all 0.17s ease',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
              <MessageCircle size={14} /> WhatsApp
            </button>
          </a>
        )}

        {profile.contact?.phone && (
          <a href={`tel:${profile.contact.phone}`} onClick={e => e.stopPropagation()} style={{ flex: 'unset' }}>
            <button style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', width: '100%',
              padding: '0.38rem 0.85rem', borderRadius: '9999px',
              fontSize: '0.77rem', fontWeight: 500,
              background: 'var(--bg-elevated)', color: 'var(--text-primary)',
              border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.17s ease',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-brand-ring)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
              <Phone size={14} /> Call
            </button>
          </a>
        )}

        <button
          onClick={e => { e.stopPropagation(); router.push(dest); }}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
            padding: '0.38rem 0.95rem', borderRadius: 'var(--radius-buttons)',
            fontSize: '0.79rem', fontWeight: 600, flex: 'unset',
            background: 'var(--color-brand)',
            color: '#fff', border: 'none', cursor: 'pointer',
            transition: 'all 0.17s ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
          View Profile <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ─── Main inner component (needs Suspense for useSearchParams) ──────────── */
function SearchPageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  /*
   * KEY FIX — URL strategy:
   * 1. We read the URL ONCE on mount to seed initial state (q, type, subject).
   * 2. After that, we NEVER call router.push/replace.
   *    Filters change state only — no URL mutations ever.
   * 3. This eliminates the infinite loop between URL writes and the
   *    useSearchParams() listener that was causing filters to reset and
   *    "re-trigger" after every keypress.
   */
  const [type,       setType]       = useState(() => searchParams.get('type')    ?? '');
  const [query,      setQuery]      = useState(() => searchParams.get('q')       ?? '');
  const [subjects,   setSubjects]   = useState(() => searchParams.get('subject') ?? '');
  const [selClasses, setSelClasses] = useState<string[]>([]);
  const [selBoards,  setSelBoards]  = useState<string[]>([]);
  const [minRating,  setMinRating]  = useState('');
  const [maxFee,     setMaxFee]     = useState('');
  const [place,      setPlace]      = useState('');
  const [sortBy,     setSortBy]     = useState('highest rated');

  // Debounce free-text inputs so API isn't called on every keystroke
  const dQuery    = useDebounce(query,    500);
  const dSubjects = useDebounce(subjects, 600);
  const dPlace    = useDebounce(place,    500);

  const [profiles,    setProfiles]    = useState<any[]>([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewMode,    setViewMode]    = useState<'grid' | 'list' | 'map'>('grid');
  const [mobileOpen,  setMobileOpen]  = useState(false);

  const pageRef = useRef(1);

  // Build query string from current filter state
  const buildQS = useCallback((page: number) => {
    const p = new URLSearchParams();
    if (type)        p.set('type',    type);
    if (dQuery)      p.set('q',       dQuery);
    if (dSubjects)   p.set('subject', dSubjects);
    if (selClasses.length) p.set('class', selClasses.join(','));
    if (selBoards.length)  p.set('board',  selBoards[0]);
    if (minRating)   p.set('minRating', minRating);
    if (maxFee)      p.set('maxFee',    maxFee);
    if (dPlace)      p.set('place',     dPlace);
    p.set('sort',  sortBy === 'highest rated' ? 'rating' : 'newest');
    p.set('page',  String(page));
    p.set('limit', '12');
    return p.toString();
  }, [type, dQuery, dSubjects, selClasses, selBoards, minRating, maxFee, dPlace, sortBy]);

  // Fetch page 1 on every filter change
  useEffect(() => {
    let cancelled = false;
    pageRef.current = 1;
    setLoading(true);

    api.get(`/search?${buildQS(1)}`)
      .then(res => {
        if (cancelled) return;
        const result = res.data;
        setProfiles(result.data ?? []);
        setTotal(result.total ?? 0);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [buildQS]);

  function handleLoadMore() {
    const next = pageRef.current + 1;
    pageRef.current = next;
    setLoadingMore(true);
    api.get(`/search?${buildQS(next)}`)
      .then(res => {
        const result = res.data;
        setProfiles(prev => {
          const items = result.data ?? [];
          const ids = new Set(prev.map((r: any) => r._id));
          return [...prev, ...items.filter((r: any) => !ids.has(r._id))];
        });
        setTotal(result.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }

  function toggleClass(c: string) { setSelClasses(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]); }
  function toggleBoard(b: string) { setSelBoards(p =>  p.includes(b) ? p.filter(x => x !== b) : [...p, b]); }
  function clearAll() {
    setType(''); setQuery(''); setSubjects('');
    setSelClasses([]); setSelBoards([]); setMinRating(''); setMaxFee('');
    setPlace(''); setSortBy('highest rated');
  }

  const hasMore = profiles.length < total;
  const validGeo = profiles.filter(p => p.location?.coordinates?.length === 2);
  const mapCenter = validGeo.length > 0
    ? { lat: validGeo.reduce((s, p) => s + p.location.coordinates[1], 0) / validGeo.length,
        lng: validGeo.reduce((s, p) => s + p.location.coordinates[0], 0) / validGeo.length }
    : { lat: 26.55, lng: 89.5 };

  const activeCount = [type, subjects, minRating, maxFee, place, ...selClasses, ...selBoards].filter(Boolean).length;

  const fp = { type, setType, subjects, setSubjects, selClasses, toggleClass,
    selBoards, toggleBoard, sortBy, setSortBy, minRating, setMinRating,
    maxFee, setMaxFee, place, setPlace, clearAll };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 4rem)', background: 'var(--bg-base)' }}>

      {/* Desktop sidebar */}
      <aside className="search-sidebar" style={{
        width: '228px', flexShrink: 0, flexDirection: 'column',
        position: 'sticky', top: '64px', alignSelf: 'flex-start',
        height: 'calc(100vh - 64px)', overflowY: 'auto',
        padding: '1.2rem',
        background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
      }}>
        <FilterPanel {...fp} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
            onClick={() => setMobileOpen(false)} />
          <div style={{
            position: 'relative', marginLeft: 'auto', width: '276px', height: '100%',
            overflowY: 'auto', padding: '1.2rem',
            background: 'var(--bg-card)', borderLeft: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)', animation: 'slideInRight 0.21s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>Filters</span>
              <button onClick={() => setMobileOpen(false)} style={{
                width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer',
              }}><X size={13} style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <FilterPanel {...fp} onApply={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0, padding: '1.2rem 1.4rem' }}>

        {/* Mobile top bar */}
        <div className="mobile-bar" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.9rem' }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.48rem 0.8rem', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
          }}>
            <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input placeholder="Search tutors, subjects..."
              value={query} onChange={e => setQuery(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.86rem', color: 'var(--text-primary)' }} />
          </div>
          <button onClick={() => setMobileOpen(true)} style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.48rem 0.8rem', borderRadius: 'var(--radius-lg)',
            fontSize: '0.8rem', fontWeight: 500, flexShrink: 0,
            background: activeCount > 0 ? 'var(--color-brand-light)' : 'var(--bg-card)',
            color: activeCount > 0 ? 'var(--color-brand)' : 'var(--text-secondary)',
            border: `1px solid ${activeCount > 0 ? 'var(--color-brand-ring)' : 'var(--border)'}`,
            cursor: 'pointer',
          }}>
            <SlidersHorizontal size={13} />
            Filters
            {activeCount > 0 && (
              <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: 'var(--color-brand)', color: '#fff', fontSize: '0.58rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeCount}</span>
            )}
          </button>
        </div>

        {/* Count + view toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem', flexWrap: 'wrap', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            {loading
              ? <span style={{ color: 'var(--text-muted)' }}>Searching…</span>
              : <><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{total}</span> results found</>}
          </span>
          <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '3px', gap: '2px' }}>
            {(['grid','list','map'] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)} style={{
                display: 'flex', alignItems: 'center', gap: '0.32rem',
                padding: '0.32rem 0.75rem', borderRadius: 'calc(var(--radius-md) - 2px)',
                fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', border: 'none',
                background: viewMode === v ? 'var(--bg-card)' : 'transparent',
                color:      viewMode === v ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow:  viewMode === v ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.17s ease',
              }}>
                {v === 'grid' ? <LayoutGrid size={13} /> : v === 'list' ? <List size={13} /> : <MapIcon size={13} />}
                {v === 'grid' ? 'Grid' : v === 'list' ? 'List' : 'Map'}
              </button>
            ))}
          </div>
        </div>

        {/* Map */}
        {viewMode === 'map' && (
          <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', height: '480px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', marginBottom: '1.2rem' }}>
            <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
              <Map defaultCenter={mapCenter} defaultZoom={11} mapId="dooars-search-map" style={{ width: '100%', height: '100%' }} gestureHandling="greedy">
                {validGeo.map(p => (
                  <AdvancedMarker key={p._id}
                    position={{ lat: p.location.coordinates[1], lng: p.location.coordinates[0] }}
                    onClick={() => router.push(`/profiles/${p.slug || p._id}`)}>
                    <Pin background={typeColors[p.type] ?? '#1a73e8'} borderColor="#fff" glyphColor="#fff" scale={0.9} />
                  </AdvancedMarker>
                ))}
              </Map>
            </APIProvider>
          </div>
        )}

        {/* List / Grid */}
        {(viewMode === 'list' || viewMode === 'grid') && (
          <>
            {/* Skeletons */}
            {loading && profiles.length === 0 && (
              <div className={viewMode === 'grid' ? 'tutor-grid-layout' : ''} style={{ 
                display: viewMode === 'grid' ? 'grid' : 'flex', 
                flexDirection: 'column', gap: '0.7rem' 
              }}>
                {[...Array(4)].map((_,i) => (
                  <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.2rem', opacity: 0.5 }}>
                    <div style={{ display: 'flex', gap: '0.875rem' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: '12px', width: '32%', borderRadius: '5px', background: 'var(--bg-elevated)', marginBottom: '7px' }} />
                        <div style={{ height: '10px', width: '22%', borderRadius: '5px', background: 'var(--bg-elevated)' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && profiles.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4.5rem 1rem', textAlign: 'center' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-xl)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.9rem' }}>
                  <Search size={22} style={{ color: 'var(--text-muted)' }} />
                </div>
                <p style={{ fontWeight: 600, fontSize: '0.97rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>No results found</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Try adjusting your filters</p>
                <button onClick={clearAll} style={{ marginTop: '0.9rem', padding: '0.48rem 1.4rem', fontSize: '0.85rem', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>Clear filters</button>
              </div>
            )}

            {/* Results */}
            {profiles.length > 0 && (
              <div className={viewMode === 'grid' ? 'tutor-grid-layout' : ''} style={{ 
                display: viewMode === 'grid' ? 'grid' : 'flex', 
                flexDirection: 'column', gap: '0.7rem' 
              }}>
                {profiles.map(profile => <TutorCard key={profile._id} profile={profile} variant={viewMode} />)}
              </div>
            )}

            {/* Load more */}
            {!loading && hasMore && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', marginTop: '1.8rem' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Showing {profiles.length} of {total}</p>
                <button onClick={handleLoadMore} disabled={loadingMore} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                  padding: '0.55rem 1.8rem', fontSize: '0.86rem', fontWeight: 500,
                  background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                  cursor: loadingMore ? 'not-allowed' : 'pointer',
                  opacity: loadingMore ? 0.7 : 1, transition: 'all 0.17s ease',
                }}>
                  {loadingMore ? <><Loader2 size={13} className="animate-spin" /> Loading…</> : `Load more (${total - profiles.length} remaining)`}
                </button>
              </div>
            )}

            {!loading && !hasMore && total > 10 && (
              <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1.8rem' }}>All {total} results shown</p>
            )}
          </>
        )}
      </main>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .search-sidebar { display: none; }
        .mobile-bar     { display: flex;  }
        
        /* Grid mode responsive layout */
        .tutor-grid-layout {
          grid-template-columns: minmax(0, 1fr);
        }
        @media (min-width: 640px) {
          .tutor-grid-layout { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (min-width: 1100px) {
          .tutor-grid-layout { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }

        @media (min-width: 768px) {
          .search-sidebar { display: flex !important; }
          .mobile-bar     { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <Loader2 className="animate-spin" style={{ color: 'var(--text-muted)' }} />
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  );
}