import Link from 'next/link';
import Image from 'next/image';
import VehicleMap from "@/components/vehicle-map";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

export default function Home() {
  // Dummy data for stolen vehicles in the UK
  const stolenVehicles = [
    { id: '1', lat: 51.5074, lng: -0.1278, make: 'Ford', model: 'Fiesta', year: 2019, color: 'Red', licensePlate: 'AB19 CDE', lastSeen: 'Central London', photo: 'https://placehold.co/600x400' },
    { id: '2', lat: 53.4808, lng: -2.2426, make: 'Vauxhall', model: 'Corsa', year: 2021, color: 'Grey', licensePlate: 'GH21 IJK', lastSeen: 'Manchester City Centre', photo: 'https://placehold.co/600x400' },
    { id: '3', lat: 52.4862, lng: -1.8904, make: 'BMW', model: '3 Series', year: 2020, color: 'Blue', licensePlate: 'LM20 NOP', lastSeen: 'Birmingham', photo: 'https://placehold.co/600x400' },
  ];

  return (
    <div className="container mx-auto py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h1 className="text-3xl font-bold">Stolen Vehicle Reports</h1>
          {stolenVehicles.map((vehicle) => (
             <Card key={vehicle.id} className="overflow-hidden">
               <div className="grid grid-cols-1 md:grid-cols-3">
                 <div className="md:col-span-1">
                  <Image 
                    src={vehicle.photo} 
                    alt={`${vehicle.make} ${vehicle.model}`} 
                    width={600} 
                    height={400}
                    className="object-cover h-full w-full"
                    data-ai-hint="car side"
                  />
                 </div>
                 <div className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>{vehicle.make} {vehicle.model} ({vehicle.year})</CardTitle>
                      <CardDescription>
                        <span className="font-mono">{vehicle.licensePlate}</span> | {vehicle.color}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-muted-foreground mb-4">
                        <MapPin className="h-4 w-4 mr-2" />
                        Last seen near {vehicle.lastSeen}
                      </div>
                       <Button asChild>
                         <Link href={`/vehicles/${vehicle.id}`}>View Details</Link>
                       </Button>
                    </CardContent>
                 </div>
               </div>
             </Card>
          ))}
        </div>
        <div className="lg:col-span-1">
            <div className="sticky top-20">
                <Card>
                    <CardHeader>
                        <CardTitle>Vehicle Map</CardTitle>
                        <CardDescription>Last known locations of reported vehicles.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-96 w-full rounded-md overflow-hidden">
                            <VehicleMap vehicles={stolenVehicles} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}
