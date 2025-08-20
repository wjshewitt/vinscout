
'use client'

import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { VehicleReport, Sighting } from '@/lib/firebase';
import { Car, Flag } from 'lucide-react';

interface VehicleSightingsMapProps {
  originalReport: VehicleReport;
  sightings: Sighting[];
}

export default function VehicleSightingsMap({ originalReport, sightings }: VehicleSightingsMapProps) {
  
  const handleTilesLoaded = (map: google.maps.Map) => {
    if (typeof window !== 'undefined' && (originalReport?.lat || sightings.length > 0)) {
        const newBounds = new google.maps.LatLngBounds();
        if(originalReport.lat && originalReport.lng) {
            newBounds.extend({ lat: originalReport.lat, lng: originalReport.lng });
        }
        sightings.forEach(sighting => {
            if (sighting.lat && sighting.lng) {
                newBounds.extend({ lat: sighting.lat, lng: sighting.lng });
            }
        });
        if (newBounds.isEmpty()) {
            // If for some reason bounds are empty, do nothing to prevent errors.
        } else if (newBounds.getNorthEast().equals(newBounds.getSouthWest())) {
            // If there's only one point, zoom in on it.
            map.setCenter(newBounds.getCenter());
            map.setZoom(14);
        } else {
            // Otherwise, fit the map to the bounds.
            map.fitBounds(newBounds, 100); // 100 is padding
        }
    }
  };

  return (
    <Map
        mapId="vehicle_sightings_map"
        fullscreenControl={false}
        streetViewControl={false}
        mapTypeControl={false}
        gestureHandling={'greedy'}
        defaultCenter={originalReport.lat ? { lat: originalReport.lat, lng: originalReport.lng } : { lat: 51.5072, lng: -0.1276 }}
        defaultZoom={originalReport.lat ? 12 : 6}
        onTilesLoaded={({map}) => handleTilesLoaded(map)}
    >
      {originalReport.lat && originalReport.lng && (
        <AdvancedMarker position={{ lat: originalReport.lat, lng: originalReport.lng }}>
           <Pin background={'hsl(var(--destructive))'} borderColor={'hsl(var(--destructive))'} glyphColor={'hsl(var(--destructive-foreground))'}>
              <Flag />
            </Pin>
        </AdvancedMarker>
      )}
      
      {sightings.map((sighting, index) => (
        sighting.lat && sighting.lng &&
        <AdvancedMarker key={sighting.id} position={{ lat: sighting.lat, lng: sighting.lng }}>
          <Pin 
            background={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
            borderColor={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
            glyphColor={index === 0 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--background))'}
          >
            <Car />
          </Pin>
        </AdvancedMarker>
      ))}
    </Map>
  );
}
