
'use client'

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { getVehicleReportById, VehicleReport } from '@/lib/firebase';
import React from 'react';


export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  const resolvedParams = React.use(Promise.resolve(params));
  const { user, loading: authLoading } = useAuth();
  const [vehicle, setVehicle] = useState<VehicleReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicle = async () => {
      setLoading(true);
      const report = await getVehicleReportById(resolvedParams.id);
      setVehicle(report);
      setLoading(false);
    };
    fetchVehicle();
  }, [resolvedParams.id]);
  
  const isLoggedIn = !!user;

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex justify-center items-center h-[calc(100vh-4rem)]">
         <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle not found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The vehicle you are looking for does not exist.</p>
             <Button asChild variant="link">
                <Link href="/">Go back to homepage</Link>
             </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const formatDate = (date: Date | string) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    // Check if the date is valid after creation.
    if (isNaN(d.getTime())) {
      // If it's a string that couldn't be parsed, try to return it as is.
      if (typeof date === 'string') return date;
      return 'Invalid Date';
    }
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };


  return (
    <div className="container mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{vehicle.make} {vehicle.model} ({vehicle.year})</CardTitle>
          <CardDescription>Reported Stolen on {formatDate(vehicle.reportedAt)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="aspect-video w-full mb-4">
                 <Image
                    src={vehicle.photos?.[0] || 'https://placehold.co/800x600.png'}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    width={800}
                    height={600}
                    className="rounded-lg object-cover w-full h-full"
                    data-ai-hint="car side"
                  />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {(vehicle.photos || []).slice(1, 3).map((photo, index) => (
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
                  {vehicle.vin && <><span>VIN:</span> <span className="font-mono text-muted-foreground">{vehicle.vin}</span></>}
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-2">Last Known Information</h3>
                <p className="text-sm"><strong>Date of Theft:</strong> {formatDate(vehicle.date)}</p>
                <p className="text-sm"><strong>Location:</strong> {vehicle.location}</p>
                <p className="text-sm mt-2"><strong>Details:</strong> {vehicle.features || 'No additional details provided.'}</p>
              </div>
              <Separator />
              <div>
                {authLoading ? (
                   <Loader2 className="animate-spin text-primary" />
                ) : isLoggedIn && vehicle.reporterId !== user.uid ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="lg" className="w-full">
                        <MessageSquare className="mr-2 h-4 w-4" /> Message Owner
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Send a message to the owner</DialogTitle>
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
                ) : isLoggedIn && vehicle.reporterId === user.uid ? (
                    <Card className="bg-muted/50">
                        <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">This is your report.</p>
                        </CardContent>
                    </Card>
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
