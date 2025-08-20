
'use client';

import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import Link from 'next/link';

type Vehicle = {
  id: string;
  lat: number;
  lng: number;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
};

interface VehicleMapProps {
  vehicles: Vehicle[];
}

const VehicleMap: FC<VehicleMapProps> = ({ vehicles }) => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <p className="text-destructive p-4 text-center">Google Maps API key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.</p>
      </div>
    );
  }

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
      >
        {vehicles.map((vehicle) => (
          <AdvancedMarker
            key={vehicle.id}
            position={{ lat: vehicle.lat, lng: vehicle.lng }}
            onClick={() => setSelectedVehicle(vehicle)}
          >
            <Pin background={'hsl(var(--primary))'} glyphColor={'hsl(var(--primary-foreground))'} borderColor={'hsl(var(--primary))'} />
          </AdvancedMarker>
        ))}

        {selectedVehicle && (
          <InfoWindow
            position={{ lat: selectedVehicle.lat, lng: selectedVehicle.lng }}
            onCloseClick={() => setSelectedVehicle(null)}
            pixelOffset={[0,-40]}
            headerDisabled
          >
            <Card className="w-80 bg-background/80 backdrop-blur-sm border-border text-foreground">
              <CardHeader className="p-4">
                <CardTitle>{selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})</CardTitle>
                <CardDescription>License Plate: {selectedVehicle.licensePlate}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm">Color: {selectedVehicle.color}</p>
                <div className="mt-4 flex gap-2">
                  <Button asChild size="sm">
                    <Link href={`/vehicles/${selectedVehicle.id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
};

export default VehicleMap;
