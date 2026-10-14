'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  BookOpen,
  GraduationCap,
  Building2,
  X,
  Sparkles,
  ChevronRight,
  Flame,
} from 'lucide-react';
import api from '@/lib/api';

export interface SuggestionSubject {
  name: string;
  count: number;
}

export interface SuggestionLocation {
  name: string;
  type: 'town' | 'area' | 'district';
  count: number;
  parent?: string;
}

export interface SuggestionTutor {
  name: string;
  type: string;
  town?: string;
  slug: string;
}

export interface SuggestionsData {
  subjects: SuggestionSubject[];
  locations: SuggestionLocation[];
  tutors: SuggestionTutor[];
}

const DEFAULT_POPULAR_SUBJECTS: SuggestionSubject[] = [
  { name: 'Mathematics', count: 0 },
  { name: 'Physics', count: 0 },
  { name: 'Chemistry', count: 0 },
  { name: 'Biology', count: 0 },
  { name: 'English', count: 0 },
  { name: 'Bengali', count: 0 },
  { name: 'Computer Science', count: 0 },
  { name: 'Guitar', count: 0 },
  { name: 'Drawing & Painting', count: 0 },
  { name: 'Yoga & Fitness', count: 0 },
];

const DEFAULT_POPULAR_TOWNS: SuggestionLocation[] = [
  { name: 'Alipurduar', type: 'town', count: 0 },
  { name: 'Falakata', type: 'town', count: 0 },
  { name: 'Jaigaon', type: 'town', count: 0 },
  { name: 'Birpara', type: 'town', count: 0 },
  { name: 'Madarihat', type: 'town', count: 0 },
  { name: 'Hasimara', type: 'town', count: 0 },
  { name: 'Cooch Behar', type: 'town', count: 0 },
  { name: 'Jalpaiguri', type: 'town', count: 0 },
  { name: 'Malbazar', type: 'town', count: 0 },
  { name: 'Dhupguri', type: 'town', count: 0 },
];

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim()) return <>{text}</>;
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <span key={i} style={{ color: 'var(--color-brand)', fontWeight: 700 }}>
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

interface HeroSearchBarProps {
  initialQuery?: string;
  initialLocation?: string;
}

export default function HeroSearchBar({
  initialQuery = '',
  initialLocation = '',
}: HeroSearchBarProps) {
  const router = useRouter();

  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);

  const [queryFocused, setQueryFocused] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);

  const [activeIndex, setActiveIndex] = useState(-1);

  const [suggestions, setSuggestions] = useState<SuggestionsData>({
    subjects: DEFAULT_POPULAR_SUBJECTS,
    locations: DEFAULT_POPULAR_TOWNS,
    tutors: [],
  });

  const queryContainerRef = useRef<HTMLDivElement>(null);
  const locationContainerRef = useRef<HTMLDivElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch suggestions once and cache in sessionStorage ─────────────────────
  useEffect(() => {
    const cached = sessionStorage.getItem('dooars_search_suggestions_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.subjects?.length || parsed.locations?.length)) {
          setSuggestions(parsed);
        }
      } catch {
        // invalid cache, ignore
      }
    }

    api
      .get('/search/suggestions')
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          const d = res.data.data;
          const merged: SuggestionsData = {
            subjects: d.subjects?.length ? d.subjects : DEFAULT_POPULAR_SUBJECTS,
            locations: d.locations?.length ? d.locations : DEFAULT_POPULAR_TOWNS,
            tutors: d.tutors || [],
          };
          setSuggestions(merged);
          sessionStorage.setItem('dooars_search_suggestions_cache', JSON.stringify(merged));
        }
      })
      .catch(() => {
        // gracefully rely on defaults
      });
  }, []);

  // ── Click outside detection ────────────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        queryContainerRef.current &&
        !queryContainerRef.current.contains(e.target as Node)
      ) {
        setQueryFocused(false);
      }
      if (
        locationContainerRef.current &&
        !locationContainerRef.current.contains(e.target as Node)
      ) {
        setLocationFocused(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Instant in-memory filtering for Query (Field 1) ────────────────────────
  const filteredQueryItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        isDefault: true,
        subjects: suggestions.subjects.slice(0, 8),
        tutors: suggestions.tutors.slice(0, 4),
      };
    }

    const matchedSubjects = suggestions.subjects
      .filter((s) => s.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q);
        const bStarts = b.name.toLowerCase().startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return (b.count || 0) - (a.count || 0);
      })
      .slice(0, 7);

    const matchedTutors = suggestions.tutors
      .filter((t) => t.name.toLowerCase().includes(q))
      .slice(0, 4);

    return {
      isDefault: false,
      subjects: matchedSubjects,
      tutors: matchedTutors,
    };
  }, [query, suggestions]);

  // ── Instant in-memory filtering for Location (Field 2) ─────────────────────
  const filteredLocationItems = useMemo(() => {
    const l = location.trim().toLowerCase();
    if (!l) {
      return {
        isDefault: true,
        towns: suggestions.locations.filter((item) => item.type === 'town').slice(0, 8),
        areas: suggestions.locations.filter((item) => item.type === 'area').slice(0, 4),
      };
    }

    const towns = suggestions.locations
      .filter((loc) => loc.type === 'town' && loc.name.toLowerCase().includes(l))
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(l);
        const bStarts = b.name.toLowerCase().startsWith(l);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return (b.count || 0) - (a.count || 0);
      })
      .slice(0, 7);

    const areas = suggestions.locations
      .filter((loc) => loc.type === 'area' && loc.name.toLowerCase().includes(l))
      .slice(0, 5);

    return {
      isDefault: false,
      towns,
      areas,
    };
  }, [location, suggestions]);

  // ── Flat list of active dropdown items for keyboard navigation ─────────────
  const queryFlatList = useMemo(() => {
    const list: Array<{ type: 'subject' | 'tutor'; data: any }> = [];
    filteredQueryItems.subjects.forEach((s) => list.push({ type: 'subject', data: s }));
    filteredQueryItems.tutors.forEach((t) => list.push({ type: 'tutor', data: t }));
    return list;
  }, [filteredQueryItems]);

  const locationFlatList = useMemo(() => {
    const list: Array<{ type: 'town' | 'area'; data: any }> = [];
    filteredLocationItems.towns.forEach((t) => list.push({ type: 'town', data: t }));
    filteredLocationItems.areas.forEach((a) => list.push({ type: 'area', data: a }));
    return list;
  }, [filteredLocationItems]);

  // Reset active index when suggestions change
  useEffect(() => {
    setActiveIndex(-1);
  }, [query, location, queryFocused, locationFocused]);

  // ── Execute Search ─────────────────────────────────────────────────────────
  const executeSearch = useCallback(
    (customQuery?: string, customLocation?: string) => {
      setQueryFocused(false);
      setLocationFocused(false);

      const qVal = customQuery !== undefined ? customQuery : query;
      const lVal = customLocation !== undefined ? customLocation : location;

      const p = new URLSearchParams();
      if (qVal.trim()) p.set('q', qVal.trim());
      if (lVal.trim()) {
        p.set('location', lVal.trim());
        p.set('place', lVal.trim());
      }

      router.push(`/search?${p.toString()}`);
    },
    [query, location, router]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    executeSearch();
  }

  // ── Keyboard Navigation for Field 1 ────────────────────────────────────────
  function handleQueryKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!queryFocused || queryFlatList.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % queryFlatList.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? queryFlatList.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < queryFlatList.length) {
        e.preventDefault();
        const selected = queryFlatList[activeIndex];
        if (selected.type === 'subject') {
          setQuery(selected.data.name);
          setQueryFocused(false);
          // Auto focus location field next
          locationInputRef.current?.focus();
        } else if (selected.type === 'tutor') {
          setQuery(selected.data.name);
          setQueryFocused(false);
          executeSearch(selected.data.name);
        }
      }
    } else if (e.key === 'Escape') {
      setQueryFocused(false);
    }
  }

  // ── Keyboard Navigation for Field 2 ────────────────────────────────────────
  function handleLocationKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!locationFocused || locationFlatList.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % locationFlatList.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? locationFlatList.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < locationFlatList.length) {
        e.preventDefault();
        const selected = locationFlatList[activeIndex];
        setLocation(selected.data.name);
        setLocationFocused(false);
        executeSearch(undefined, selected.data.name);
      }
    } else if (e.key === 'Escape') {
      setLocationFocused(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto relative w-full" style={{ zIndex: 60 }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-buttons)',
          padding: '0.375rem',
          display: 'flex',
          flexDirection: 'row',
          gap: '0.25rem',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          zIndex: 60,
        }}
      >
        {/* ── Field 1: Subject, Activity, or Name ── */}
        <div
          ref={queryContainerRef}
          className="flex items-center gap-3 flex-1 px-4 py-2 relative"
          style={{ minWidth: 0 }}
        >
          <Search size={16} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
          <input
            placeholder="Subject, activity, or name..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setQueryFocused(true);
            }}
            onFocus={() => {
              setQueryFocused(true);
              setLocationFocused(false);
            }}
            onKeyDown={handleQueryKeyDown}
            className="input-base border-0 p-0 text-sm w-full outline-none"
            style={{ background: 'transparent', boxShadow: 'none' }}
            autoComplete="off"
            spellCheck="false"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setQueryFocused(true);
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0 p-1 rounded-full"
              title="Clear input"
            >
              <X size={14} />
            </button>
          )}

          {/* ── Field 1 Dropdown Popover ── */}
          {queryFocused && (
            <div
              className="absolute left-0 top-[calc(100%+10px)] w-[calc(100%+20px)] sm:w-[360px] md:w-[420px] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                zIndex: 100,
                maxHeight: '360px',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px var(--border)',
              }}
            >
              {/* Header Title */}
              <div
                className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider flex items-center justify-between"
                style={{
                  color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--bg-elevated)',
                }}
              >
                <span className="flex items-center gap-1.5">
                  {filteredQueryItems.isDefault ? (
                    <>
                      <Flame size={13} className="text-amber-500" /> Popular in Dooars
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} style={{ color: 'var(--color-brand)' }} /> Suggestions
                    </>
                  )}
                </span>
                <span className="text-[10px] font-normal lowercase opacity-75">
                  {queryFlatList.length} matches
                </span>
              </div>

              {/* Suggestions List */}
              <div className="py-1">
                {queryFlatList.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    No direct match found for &ldquo;{query}&rdquo;. Press Enter to perform AI &amp; keyword search.
                  </div>
                ) : (
                  <>
                    {/* Section: Subjects */}
                    {filteredQueryItems.subjects.length > 0 && (
                      <div className="px-1.5 py-1">
                        <div
                          className="px-2.5 py-1 text-[11px] font-medium"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Subjects &amp; Activities
                        </div>
                        {filteredQueryItems.subjects.map((item, idx) => {
                          const isHighlighted = activeIndex === idx;
                          return (
                            <button
                              key={`subj-${item.name}-${idx}`}
                              type="button"
                              onClick={() => {
                                setQuery(item.name);
                                setQueryFocused(false);
                                locationInputRef.current?.focus();
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors group cursor-pointer text-sm"
                              style={{
                                background: isHighlighted
                                  ? 'var(--bg-elevated)'
                                  : 'transparent',
                                color: 'var(--text-primary)',
                              }}
                              onMouseEnter={() => setActiveIndex(idx)}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                  style={{
                                    background: 'rgba(26, 115, 232, 0.08)',
                                    color: 'var(--color-brand)',
                                  }}
                                >
                                  <BookOpen size={14} />
                                </div>
                                <span className="truncate font-medium">
                                  <HighlightMatch text={item.name} query={query} />
                                </span>
                              </div>
                              {item.count > 0 ? (
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full shrink-0"
                                  style={{
                                    background: 'var(--bg-elevated)',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.72rem',
                                  }}
                                >
                                  {item.count} {item.count === 1 ? 'tutor' : 'tutors'}
                                </span>
                              ) : (
                                <ChevronRight
                                  size={13}
                                  className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Section: Tutors */}
                    {filteredQueryItems.tutors.length > 0 && (
                      <div
                        className="px-1.5 py-1 mt-1"
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <div
                          className="px-2.5 py-1 text-[11px] font-medium"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Verified Tutors &amp; Institutes
                        </div>
                        {filteredQueryItems.tutors.map((tutor, idx) => {
                          const flatIdx = filteredQueryItems.subjects.length + idx;
                          const isHighlighted = activeIndex === flatIdx;
                          return (
                            <button
                              key={`tutor-${tutor.slug || tutor.name}-${idx}`}
                              type="button"
                              onClick={() => {
                                setQuery(tutor.name);
                                setQueryFocused(false);
                                executeSearch(tutor.name);
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors group cursor-pointer text-sm"
                              style={{
                                background: isHighlighted
                                  ? 'var(--bg-elevated)'
                                  : 'transparent',
                                color: 'var(--text-primary)',
                              }}
                              onMouseEnter={() => setActiveIndex(flatIdx)}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                  style={{
                                    background:
                                      tutor.type === 'coaching_center'
                                        ? 'rgba(139, 92, 246, 0.1)'
                                        : 'rgba(16, 185, 129, 0.1)',
                                    color:
                                      tutor.type === 'coaching_center'
                                        ? '#8b5cf6'
                                        : '#10b981',
                                  }}
                                >
                                  {tutor.type === 'coaching_center' ? (
                                    <Building2 size={14} />
                                  ) : (
                                    <GraduationCap size={14} />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate font-medium leading-snug">
                                    <HighlightMatch text={tutor.name} query={query} />
                                  </div>
                                  <div
                                    className="text-[11px] truncate"
                                    style={{ color: 'var(--text-muted)' }}
                                  >
                                    {tutor.type === 'coaching_center'
                                      ? 'Coaching Center'
                                      : 'Private Tutor'}
                                    {tutor.town ? ` • ${tutor.town}` : ''}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight
                                size={13}
                                className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Field 2: Location / Town ── */}
        <div
          ref={locationContainerRef}
          className="hidden md:flex items-center gap-3 flex-1 px-4 py-2 relative"
          style={{ borderLeft: '1px solid var(--border)', minWidth: 0 }}
        >
          <MapPin size={16} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
          <input
            ref={locationInputRef}
            placeholder="Town or area..."
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setLocationFocused(true);
            }}
            onFocus={() => {
              setLocationFocused(true);
              setQueryFocused(false);
            }}
            onKeyDown={handleLocationKeyDown}
            className="input-base border-0 p-0 text-sm w-full outline-none"
            style={{ background: 'transparent', boxShadow: 'none' }}
            autoComplete="off"
            spellCheck="false"
          />
          {location && (
            <button
              type="button"
              onClick={() => {
                setLocation('');
                setLocationFocused(true);
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0 p-1 rounded-full"
              title="Clear location"
            >
              <X size={14} />
            </button>
          )}

          {/* ── Field 2 Dropdown Popover ── */}
          {locationFocused && (
            <div
              className="absolute right-0 top-[calc(100%+10px)] w-[calc(100%+20px)] sm:w-[320px] md:w-[380px] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                zIndex: 100,
                maxHeight: '360px',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px var(--border)',
              }}
            >
              <div
                className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider flex items-center justify-between"
                style={{
                  color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--bg-elevated)',
                }}
              >
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} style={{ color: 'var(--color-brand)' }} />
                  {filteredLocationItems.isDefault ? 'Dooars Towns & Hubs' : 'Location Matches'}
                </span>
                <span className="text-[10px] font-normal lowercase opacity-75">
                  {locationFlatList.length} options
                </span>
              </div>

              <div className="py-1">
                {locationFlatList.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    No exact town found for &ldquo;{location}&rdquo;. Press Search to find places nearby.
                  </div>
                ) : (
                  <>
                    {/* Towns */}
                    {filteredLocationItems.towns.length > 0 && (
                      <div className="px-1.5 py-1">
                        <div
                          className="px-2.5 py-1 text-[11px] font-medium"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Towns &amp; Cities
                        </div>
                        {filteredLocationItems.towns.map((loc, idx) => {
                          const isHighlighted = activeIndex === idx;
                          return (
                            <button
                              key={`town-${loc.name}-${idx}`}
                              type="button"
                              onClick={() => {
                                setLocation(loc.name);
                                setLocationFocused(false);
                                executeSearch(undefined, loc.name);
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors group cursor-pointer text-sm"
                              style={{
                                background: isHighlighted
                                  ? 'var(--bg-elevated)'
                                  : 'transparent',
                                color: 'var(--text-primary)',
                              }}
                              onMouseEnter={() => setActiveIndex(idx)}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                  style={{
                                    background: 'rgba(236, 72, 153, 0.08)',
                                    color: '#ec4899',
                                  }}
                                >
                                  <MapPin size={14} />
                                </div>
                                <span className="truncate font-medium">
                                  <HighlightMatch text={loc.name} query={location} />
                                </span>
                              </div>
                              {loc.count > 0 ? (
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full shrink-0"
                                  style={{
                                    background: 'var(--bg-elevated)',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.72rem',
                                  }}
                                >
                                  {loc.count} {loc.count === 1 ? 'tutor' : 'tutors'}
                                </span>
                              ) : (
                                <ChevronRight
                                  size={13}
                                  className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Local Areas */}
                    {filteredLocationItems.areas.length > 0 && (
                      <div
                        className="px-1.5 py-1 mt-1"
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <div
                          className="px-2.5 py-1 text-[11px] font-medium"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Neighborhoods &amp; Local Areas
                        </div>
                        {filteredLocationItems.areas.map((area, idx) => {
                          const flatIdx = filteredLocationItems.towns.length + idx;
                          const isHighlighted = activeIndex === flatIdx;
                          return (
                            <button
                              key={`area-${area.name}-${idx}`}
                              type="button"
                              onClick={() => {
                                setLocation(area.name);
                                setLocationFocused(false);
                                executeSearch(undefined, area.name);
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors group cursor-pointer text-sm"
                              style={{
                                background: isHighlighted
                                  ? 'var(--bg-elevated)'
                                  : 'transparent',
                                color: 'var(--text-primary)',
                              }}
                              onMouseEnter={() => setActiveIndex(flatIdx)}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                  style={{
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    color: '#f59e0b',
                                  }}
                                >
                                  <MapPin size={14} />
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate font-medium leading-snug">
                                    <HighlightMatch text={area.name} query={location} />
                                  </div>
                                  {area.parent && (
                                    <div
                                      className="text-[11px] truncate"
                                      style={{ color: 'var(--text-muted)' }}
                                    >
                                      {area.parent}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <ChevronRight
                                size={13}
                                className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Search Submit Button ── */}
        <button
          type="submit"
          className="btn-primary px-6 py-2.5 text-sm shrink-0 flex items-center justify-center gap-2"
        >
          <Search size={14} className="md:hidden" />
          <span>Search</span>
        </button>
      </form>
    </div>
  );
}
