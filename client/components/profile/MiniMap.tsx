'use client';

import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

export default function MiniMap({ location }: { location: any }) {
  if (!location?.coordinates) return null;

  const center = {
    lat: location.coordinates[1],
    lng: location.coordinates[0],
  };

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <Map
        defaultCenter={center}
        defaultZoom={14}
        mapId="dooars-tutors-map"
        style={{ width: '100%', height: '200px', borderRadius: '12px' }}
        gestureHandling="greedy"
        disableDefaultUI={true}
      >
        <AdvancedMarker position={center}>
          <Pin background="#1e40af" />
        </AdvancedMarker>
      </Map>
    </APIProvider>
  );
}