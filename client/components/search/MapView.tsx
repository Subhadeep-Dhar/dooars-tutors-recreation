'use client';

import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { useState } from 'react';
import Link from 'next/link';
import { Star, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

const typeColors: Record<string, string> = {
  tutor: '#1e40af',
  coaching_center: '#7e22ce',
  sports_trainer: '#15803d',
  arts_trainer: '#be185d',
  gym_yoga: '#c2410c',
};

export default function MapView({ profiles }: { profiles: any[] }) {
  const [selected, setSelected] = useState<any>(null);

  const validProfiles = profiles.filter(
    (p) => p.location?.coordinates?.length === 2
  );

  const center = validProfiles.length > 0
    ? {
        lat: validProfiles[0].location.coordinates[1],
        lng: validProfiles[0].location.coordinates[0],
      }
    : { lat: 26.7132, lng: 89.1743 }; // Jalpaiguri default

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <Map
        defaultCenter={center}
        defaultZoom={11}
        mapId="dooars-tutors-map"
        style={{ width: '100%', height: '100%' }}
        gestureHandling="greedy"
        disableDefaultUI={false}
      >
        {validProfiles.map((profile) => (
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
            <div className="p-1 min-w-[180px]">
              <p className="font-semibold text-slate-900 text-sm">{selected.displayName}</p>
              <p className="text-xs text-slate-500 mb-1">{selected.address?.town}</p>
              {selected.rating?.count > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                  <span className="text-xs font-medium">{selected.rating.average}</span>
                  <span className="text-xs text-slate-400">({selected.rating.count})</span>
                </div>
              )}
              {selected.matchedSlots?.length > 0 && (
                <p className="text-xs text-slate-600 mb-2">
                  {selected.matchedSlots[0].subject || selected.matchedSlots[0].activity}
                  {selected.matchedSlots[0].feePerMonth && ` · ₹${selected.matchedSlots[0].feePerMonth}/mo`}
                </p>
              )}
              <Link href={`/profiles/${selected.slug}`}>
                <Button size="sm" className="w-full h-7 text-xs">View Profile</Button>
              </Link>
            </div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
}