
'use client';

import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import type { FC } from 'react';
import { VehicleReport } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { Car } from 'lucide-react';

interface VehicleMapProps {
  vehicles: VehicleReport[];
  onVehicleSelect: (vehicle: VehicleReport | null) => void;
  selectedVehicleId?: string | null;
}

const VehicleMap: FC<VehicleMapProps> = ({ vehicles, onVehicleSelect, selectedVehicleId }) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <p className="text-destructive p-4 text-center">Google Maps API key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.</p>
      </div>
    );
  }
  
  const handleMarkerClick = (vehicle: VehicleReport) => {
    if (selectedVehicleId === vehicle.id) {
        onVehicleSelect(null); // Deselect if the same marker is clicked again
    } else {
        onVehicleSelect(vehicle);
    }
  };

  const getPinColor = (vehicle: VehicleReport) => {
      if (selectedVehicleId === vehicle.id) {
          return 'hsl(var(--primary))'; // Selected color
      }
      if (vehicle.status === 'Recovered') {
          return 'hsl(var(--secondary-foreground))'; // Recovered color
      }
      return 'hsl(var(--muted-foreground))'; // Active color
  };

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={{ lat: 54.5, lng: -2.5 }}
        defaultZoom={6}
        mapId="autofind_map"
        fullscreenControl={false}
        streetViewControl={false}
        mapTypeControl={false}
        className="w-full h-full"
        gestureHandling={'greedy'}
        onClick={() => onVehicleSelect(null)}
      >
        {vehicles.map((vehicle) => (
          <AdvancedMarker
            key={vehicle.id}
            position={{ lat: vehicle.lat!, lng: vehicle.lng! }}
            onClick={() => handleMarkerClick(vehicle)}
          >
             <Pin 
                background={getPinColor(vehicle)}
                borderColor={getPinColor(vehicle)}
                glyph={<Car className={cn("text-background", selectedVehicleId === vehicle.id && 'text-primary-foreground')}/>}
            />
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
};

export default VehicleMap;
