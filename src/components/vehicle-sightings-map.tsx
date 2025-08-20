
'use client'

import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { VehicleReport, Sighting } from '@/lib/firebase';
import { Car, Flag } from 'lucide-react';
import { useState, useEffect } from 'react';

interface VehicleSightingsMapProps {
  originalReport: VehicleReport;
  sightings: Sighting[];
}

export default function VehicleSightingsMap({ originalReport, sightings }: VehicleSightingsMapProps) {
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | undefined>(undefined);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && (originalReport || sightings.length > 0)) {
        const newBounds = new google.maps.LatLngBounds();
        if(originalReport.lat && originalReport.lng) {
            newBounds.extend({ lat: originalReport.lat, lng: originalReport.lng });
        }
        sightings.forEach(sighting => {
            if (sighting.lat && sighting.lng) {
                newBounds.extend({ lat: sighting.lat, lng: sighting.lng });
            }
        });
        setBounds(newBounds);
    }
  }, [originalReport, sightings]);
  

  return (
    <Map
        mapId="vehicle_sightings_map"
        fullscreenControl={false}
        streetViewControl={false}
        mapTypeControl={false}
        gestureHandling={'greedy'}
        bounds={bounds}
    >
      {originalReport.lat && originalReport.lng && (
        <AdvancedMarker position={{ lat: originalReport.lat, lng: originalReport.lng }}>
           <Pin background={'hsl(var(--destructive))'} borderColor={'hsl(var(--destructive))'} glyphColor={'hsl(var(--destructive-foreground))'}>
              <Flag />
            </Pin>
        </AdvancedMarker>
      )}
      
      {sightings.map((sighting, index) => (
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

    