'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSearchStore } from '@/store/searchStore';
import ProfileCard from '@/components/search/ProfileCard';
import FilterPanel from '@/components/search/FilterPanel';
import { Loader2, List, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/search/MapView'), { ssr: false });

function SearchContent() {
  const searchParams = useSearchParams();
  const { results, total, isLoading, search, setParams } = useSearchStore();
  const [view, setView] = useState<'list' | 'map'>('list');

  useEffect(() => {
    const params: any = {};
    if (searchParams.get('q')) params.q = searchParams.get('q');
    if (searchParams.get('type')) params.type = searchParams.get('type');
    if (searchParams.get('subject')) params.subject = searchParams.get('subject');
    if (searchParams.get('class')) params.class = searchParams.get('class');
    setParams(params);
    search(params);
  }, [searchParams]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex gap-8">
        <aside className="w-64 shrink-0 hidden md:block">
          <FilterPanel />
        </aside>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <p className="text-slate-600 text-sm">
              {isLoading ? 'Searching...' : `${total} result${total !== 1 ? 's' : ''} found`}
            </p>
            <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1">
              <Button
                size="sm" variant={view === 'list' ? 'default' : 'ghost'}
                className="h-7 gap-1.5 text-xs"
                onClick={() => setView('list')}
              >
                <List size={13} /> List
              </Button>
              <Button
                size="sm" variant={view === 'map' ? 'default' : 'ghost'}
                className="h-7 gap-1.5 text-xs"
                onClick={() => setView('map')}
              >
                <Map size={13} /> Map
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-slate-500 text-lg">No results found</p>
              <p className="text-slate-400 text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : view === 'list' ? (
            <div className="grid gap-4">
              {results.map((profile) => (
                <ProfileCard key={profile._id} profile={profile} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-slate-200" style={{ height: '600px' }}>
              <MapView profiles={results} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="animate-spin" /></div>}>
      <SearchContent />
    </Suspense>
  );
}