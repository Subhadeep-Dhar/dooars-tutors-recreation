'use client';

import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { useState } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const typeColors: Record<string, string> = {
  tutor: '#1e40af',
  coaching_center: '#7e22ce',
  sports_trainer: '#15803d',
  arts_trainer: '#be185d',
  gym_yoga: '#c2410c',
};

export default function AdminMapAnalytics({ profiles }: { profiles: any[] }) {
  const [selected, setSelected] = useState<any>(null);

  const center = profiles.length > 0
    ? {
        lat: profiles[0].location.coordinates[1],
        lng: profiles[0].location.coordinates[0],
      }
    : { lat: 26.491890, lng: 89.527100 };

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
      <Map
        defaultCenter={center}
        defaultZoom={9}
        mapId="admin-analytics-map"
        style={{ width: '100%', height: '100%' }}
        gestureHandling="greedy"
        disableDefaultUI={false}
      >
        {profiles.map((profile) => (
          <AdvancedMarker
            key={profile._id}
            position={{
              lat: profile.location.coordinates[1],
              lng: profile.location.coordinates[0],
            }}
            onClick={() => setSelected(profile)}
          >
            <Pin
              background={typeColors[profile.type] ?? '#1e293b'}
              borderColor="#fff"
              glyphColor="#fff"
              scale={0.8}
            />
          </AdvancedMarker>
        ))}

        {selected && (
          <InfoWindow
            position={{
              lat: selected.location.coordinates[1],
              lng: selected.location.coordinates[0],
            }}
            onCloseClick={() => setSelected(null)}
          >
            <div className="p-1 min-w-[150px]">
              <p className="font-semibold text-slate-900 text-sm">{selected.displayName}</p>
              <p className="text-xs text-slate-500 mb-1">{selected.type?.replace('_', ' ')}</p>
              
              {selected.rating?.count > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                  <span className="text-xs font-medium">{selected.rating.average}</span>
                  <span className="text-xs text-slate-400">({selected.rating.count})</span>
                </div>
              )}
              <Link href={`/admin/profiles/${selected._id}`}>
                <Button size="sm" className="w-full h-7 text-xs">Edit Admin</Button>
              </Link>
            </div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
}
