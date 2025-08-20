
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { VehicleReport } from '@/lib/firebase';
import { X, Calendar, MapPin as MapPinIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VehicleInfoPanelProps {
  vehicle: VehicleReport | null;
  onClose: () => void;
}

export function VehicleInfoPanel({ vehicle, onClose }: VehicleInfoPanelProps) {
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    };

  return (
    <div className={cn(
        "absolute top-0 right-0 h-full w-full max-w-sm transform transition-transform duration-300 ease-in-out bg-background/80 backdrop-blur-sm shadow-2xl z-10 border-l border-border",
        vehicle ? 'translate-x-0' : 'translate-x-full'
    )}>
        <Card className="flex flex-col h-full w-full rounded-none border-none bg-transparent shadow-none">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-20 text-muted-foreground hover:text-foreground"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
            {vehicle && (
                <>
                <CardHeader className="p-6">
                    <CardTitle className="text-2xl pr-8">{vehicle.make} {vehicle.model}</CardTitle>
                    <CardDescription>{vehicle.year} &middot; {vehicle.color}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4 p-6 pt-0 overflow-y-auto">
                   <div className="aspect-video w-full relative overflow-hidden rounded-lg">
                        <Image 
                            src={vehicle.photos?.[0] || "https://placehold.co/600x400.png"}
                            alt={`${vehicle.make} ${vehicle.model}`}
                            fill
                            className="object-cover"
                            data-ai-hint="car side"
                        />
                   </div>
                   <div className="space-y-2 text-sm">
                     <div className="flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Last seen: {vehicle.location.fullAddress}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                         <span className="text-muted-foreground">Stolen on: {formatDate(vehicle.date)}</span>
                     </div>
                   </div>

                    <div className="rounded-lg bg-card p-4 text-center">
                        <p className="font-semibold text-sm text-muted-foreground">License Plate</p>
                        <p className="license-plate mt-1">{vehicle.licensePlate}</p>
                    </div>

                    {vehicle.features && (
                        <div>
                            <h4 className="font-semibold mb-2">Distinctive Features</h4>
                            <p className="text-sm text-muted-foreground">{vehicle.features}</p>
                        </div>
                    )}
                   
                   <Button asChild size="lg" className="w-full">
                        <Link href={`/vehicles/${vehicle.id}`}>View Full Report</Link>
                    </Button>
                </CardContent>
                </>
            )}
        </Card>
    </div>
  );
}
