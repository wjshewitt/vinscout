
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


export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth();
  const [vehicle, setVehicle] = useState<VehicleReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicle = async () => {
      setLoading(true);
      const report = await getVehicleReportById(params.id);
      setVehicle(report);
      setLoading(false);
    };
    fetchVehicle();
  }, [params.id]);
  
  const isLoggedIn = !!user;

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex justify-center items-center">
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
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) {
      return 'Invalid Date';
    }
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
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
                <p className="text-sm"><strong>Location:</strong> {vehicle.location}</p>
                <p className="text-sm mt-2"><strong>Details:</strong> {vehicle.features || 'No additional details provided.'}</p>
              </div>
              <Separator />
              <div>
                {authLoading ? null : isLoggedIn ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="lg" className="w-full" disabled={!vehicle.owner}>
                        <MessageSquare className="mr-2 h-4 w-4" /> Message Owner {vehicle.owner ? `(${vehicle.owner.name})` : ''}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Send a message to {vehicle.owner?.name}</DialogTitle>
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
