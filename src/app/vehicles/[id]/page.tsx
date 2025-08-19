
'use client'

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';

// This would fetch data in a real app
const getVehicleData = (id: string) => {
  // Dummy data for stolen vehicles in the UK
  const stolenVehicles = [
    { id: '1', lat: 51.5074, lng: -0.1278, make: 'Ford', model: 'Fiesta', year: 2019, color: 'Red', licensePlate: 'AB19 CDE', lastSeen: 'Central London', vin: 'VF12...890123', reportedAt: new Date().toISOString(), details: 'Small scratch on the driver side door.', photos: ['https://placehold.co/800x600.png', 'https://placehold.co/400x300.png', 'https://placehold.co/400x300.png'], owner: { name: 'James S.' } },
    { id: '2', lat: 53.4808, lng: -2.2426, make: 'Vauxhall', model: 'Corsa', year: 2021, color: 'Grey', licensePlate: 'GH21 IJK', lastSeen: 'Manchester City Centre', vin: 'VA23...901234', reportedAt: new Date().toISOString(), details: 'Aftermarket alloy wheels.', photos: ['https://placehold.co/800x600.png', 'https://placehold.co/400x300.png', 'https://placehold.co/400x300.png'], owner: { name: 'Sarah J.' } },
    { id: '3', lat: 52.4862, lng: -1.8904, make: 'BMW', model: '3 Series', year: 2020, color: 'Blue', licensePlate: 'LM20 NOP', lastSeen: 'Birmingham', vin: 'WB34...012345', reportedAt: new Date().toISOString(), details: 'Has a roof rack installed.', photos: ['https://placehold.co/800x600.png', 'https://placehold.co/400x300.png', 'https://placehold.co/400x300.png'], owner: { name: 'David B.' } },
    { id: '4', make: 'Ford', model: 'Mustang GT', year: 1968, lastSeen: 'Miami, FL', dateStolen: 'March 2, 2024', vin: 'WB34...012345', reportedAt: new Date().toISOString(), details: 'Has a roof rack installed.', photos: ['https://placehold.co/800x600.png', 'https://placehold.co/400x300.png', 'https://placehold.co/400x300.png'], owner: { name: 'David B.' }, color: 'Black', licensePlate: 'MUSTANG' },
    { id: '5', make: 'Nissan', model: 'Skyline GT-R', year: 1995, lastSeen: 'San Francisco, CA', dateStolen: 'February 28, 2024', vin: 'WB34...012345', reportedAt: new Date().toISOString(), details: 'Has a roof rack installed.', photos: ['https://placehold.co/800x600.png', 'https://placehold.co/400x300.png', 'https://placehold.co/400x300.png'], owner: { name: 'David B.' }, color: 'Silver', licensePlate: 'GTR' },
    { id: '6', make: 'Toyota', model: 'Supra', year: 1998, lastSeen: 'London, UK', dateStolen: 'February 25, 2024', vin: 'WB34...012345', reportedAt: new Date().toISOString(), details: 'Has a roof rack installed.', photos: ['https://placehold.co/800x600.png', 'https://placehold.co/400x300.png', 'https://placehold.co/400x300.png'], owner: { name: 'David B.' }, color: 'White', licensePlate: 'SUPRA' },
    { id: '7', make: 'BMW', model: 'M3', year: 2020, lastSeen: 'Manchester, UK', dateStolen: 'February 20, 2024', vin: 'WB34...012345', reportedAt: new Date().toISOString(), details: 'Has a roof rack installed.', photos: ['https://placehold.co/800x600.png', 'https://placehold.co/400x300.png', 'https://placehold.co/400x300.png'], owner: { name: 'David B.' }, color: 'Blue', licensePlate: 'M3BWM' },
  ];
  return stolenVehicles.find(v => v.id === id);
};

export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  const [vehicle, setVehicle] = useState(getVehicleData(params.id));
  const { user, loading } = useAuth();
  const isLoggedIn = !!user;

  useEffect(() => {
    setVehicle(getVehicleData(params.id));
  }, [params.id]);


  if (!vehicle) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle not found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The vehicle you are looking for does not exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{vehicle.make} {vehicle.model} ({vehicle.year})</CardTitle>
          <CardDescription>Reported Stolen on {new Date(vehicle.reportedAt).toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="aspect-video w-full mb-4">
                 <Image
                    src={vehicle.photos[0]}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    width={800}
                    height={600}
                    className="rounded-lg object-cover w-full h-full"
                    data-ai-hint="car side"
                  />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {vehicle.photos.slice(1, 3).map((photo, index) => (
                  <Image
                    key={index}
                    src={photo}
                    alt={`${vehicle.make} ${vehicle.model} photo ${index + 2}`}
                    width={400}
                    height={300}
                    className="rounded-lg object-cover"
                    data-ai-hint="car detail"
                  />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Vehicle Details</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <span>Make:</span> <span className="text-muted-foreground">{vehicle.make}</span>
                  <span>Model:</span> <span className="text-muted-foreground">{vehicle.model}</span>
                  <span>Year:</span> <span className="text-muted-foreground">{vehicle.year}</span>
                  <span>Color:</span> <span className="text-muted-foreground">{vehicle.color}</span>
                  <span>License Plate:</span> <span className="font-mono text-muted-foreground">{vehicle.licensePlate}</span>
                  <span>VIN:</span> <span className="font-mono text-muted-foreground">{vehicle.vin}</span>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-2">Last Known Information</h3>
                <p className="text-sm"><strong>Location:</strong> {vehicle.lastSeen}</p>
                <p className="text-sm mt-2"><strong>Details:</strong> {vehicle.details}</p>
              </div>
              <Separator />
              <div>
                {loading ? null : isLoggedIn ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="lg" className="w-full">
                        <MessageSquare className="mr-2 h-4 w-4" /> Message Owner ({vehicle.owner.name})
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Send a message to {vehicle.owner.name}</DialogTitle>
                        <DialogDescription>
                          Provide any information that could help locate the vehicle. Your message will be sent securely.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid w-full gap-1.5">
                          <Label htmlFor="message">Your message</Label>
                          <Textarea placeholder="Type your message here." id="message" />
                        </div>
                      </div>
                      <Button type="submit">Send Message</Button>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Have information? <Link href="/login" className="font-bold text-primary underline">Log in</Link> to contact the owner.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
