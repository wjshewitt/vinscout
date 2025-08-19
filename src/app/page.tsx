import Link from 'next/link';
import Image from 'next/image';
import VehicleMap from "@/components/vehicle-map";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

export default function Home() {
  // Dummy data for stolen vehicles in the UK
  const stolenVehicles = [
    { id: '1', lat: 51.5074, lng: -0.1278, make: 'Ford', model: 'Fiesta', year: 2019, color: 'Red', licensePlate: 'AB19 CDE', lastSeen: 'Central London', photo: 'https://placehold.co/400x300' },
    { id: '2', lat: 53.4808, lng: -2.2426, make: 'Vauxhall', model: 'Corsa', year: 2021, color: 'Grey', licensePlate: 'GH21 IJK', lastSeen: 'Manchester City Centre', photo: 'https://placehold.co/400x300' },
    { id: '3', lat: 52.4862, lng: -1.8904, make: 'BMW', model: '3 Series', year: 2020, color: 'Blue', licensePlate: 'LM20 NOP', lastSeen: 'Birmingham', photo: 'https://placehold.co/400x300' },
    { id: '4', lat: 51.4545, lng: -2.5879, make: 'Audi', model: 'A3', year: 2018, color: 'Black', licensePlate: 'QR18 STU', lastSeen: 'Bristol', photo: 'https://placehold.co/400x300' },
    { id: '5', lat: 53.4084, lng: -2.9916, make: 'Mercedes-Benz', model: 'A-Class', year: 2022, color: 'White', licensePlate: 'VW22 XYZ', lastSeen: 'Liverpool', photo: 'https://placehold.co/400x300' },
    { id: '6', lat: 53.3811, lng: -1.4701, make: 'Nissan', model: 'Qashqai', year: 2017, color: 'Silver', licensePlate: 'CD17 EFG', lastSeen: 'Sheffield', photo: 'https://placehold.co/400x300' },
    { id: '7', lat: 55.9533, lng: -3.1883, make: 'Volkswagen', model: 'Golf', year: 2019, color: 'Grey', licensePlate: 'HI19 JKL', lastSeen: 'Edinburgh', photo: 'https://placehold.co/400x300' },
    { id: '8', lat: 51.7520, lng: -1.2577, make: 'Toyota', model: 'Yaris', year: 2020, color: 'Red', licensePlate: 'MN20 OPQ', lastSeen: 'Oxford', photo: 'https://placehold.co/400x300' },
  ];

  return (
    <div className="container mx-auto py-12">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3">
          <h1 className="text-3xl font-bold mb-6">Stolen Vehicle Reports</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {stolenVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="overflow-hidden flex flex-col">
                <Link href={`/vehicles/${vehicle.id}`} className="block">
                  <Image
                    src={vehicle.photo}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    width={400}
                    height={300}
                    className="object-cover h-48 w-full"
                    data-ai-hint="car side"
                  />
                </Link>
                <div className="flex flex-col flex-grow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      <Link href={`/vehicles/${vehicle.id}`} className="hover:underline">{vehicle.make} {vehicle.model} ({vehicle.year})</Link>
                    </CardTitle>
                    <CardDescription>
                      <span className="font-mono">{vehicle.licensePlate}</span> | {vehicle.color}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow pt-0">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      Last seen near {vehicle.lastSeen}
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Map</CardTitle>
                <CardDescription>Last known locations</CardDescription>
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
